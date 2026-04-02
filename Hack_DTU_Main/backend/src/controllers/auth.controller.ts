import { Request, Response } from 'express';
import { firebaseAuth } from '../config/firebase';
import User, { UserRole } from '../models/User';
import { z } from 'zod';
import { sendCreated, sendError, sendSuccess } from '../utils/response';

const registerSchema = z.object({
    idToken: z.string(),
    role: z.nativeEnum(UserRole),
    authProvider: z.enum(['email', 'google']).default('email'),
});

export const register = async (req: Request, res: Response) => {
    try {
        const { idToken, role, authProvider } = registerSchema.parse(req.body);

        // Verify token with Firebase
        const decodedToken = await firebaseAuth.verifyIdToken(idToken);
        const { uid, email } = decodedToken;

        if (!email) {
            return sendError(res, 400, 'Email is required in Firebase account', 'MISSING_EMAIL');
        }

        // Check if user already exists (by UID or Email)
        let user = await User.findOne({
            $or: [
                { firebaseUid: uid },
                { email: email }
            ]
        });

        if (user) {
            return sendError(res, 400, `This email is already registered as ${user.role}. Please log in.`, 'USER_ALREADY_REGISTERED');
        }

        // Create new user in MongoDB
        user = new User({
            firebaseUid: uid,
            email,
            role,
            authProvider: authProvider || 'email',
            isOnboardingComplete: false
        });

        await user.save();

        return sendCreated(res, {
            id: user._id,
            email: user.email,
            role: user.role,
            authProvider: user.authProvider,
            isOnboardingComplete: user.isOnboardingComplete
        }, 'User registered successfully');

    } catch (error) {
        if (error instanceof z.ZodError) {
            return sendError(res, 400, 'Validation Error', 'VALIDATION_ERROR');
        }
        console.error('Register Error:', error);
        return sendError(res, 500, 'Server Error', 'SERVER_ERROR');
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { idToken } = req.body; // Minimal schema, just token needed
        if (!idToken) return sendError(res, 400, 'ID Token required', 'MISSING_TOKEN');

        const decodedToken = await firebaseAuth.verifyIdToken(idToken);
        const user = await User.findOne({ firebaseUid: decodedToken.uid });

        if (!user) {
            return sendError(res, 404, 'User not registered. Please sign up first.', 'USER_NOT_FOUND');
        }

        return sendSuccess(res, {
            id: user._id,
            email: user.email,
            role: user.role,
            isOnboardingComplete: user.isOnboardingComplete
        }, 'Login successful');

    } catch (error) {
        console.error('Login Error:', error);
        return sendError(res, 401, 'Invalid Token', 'AUTH_ERROR');
    }
};

export const getMe = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return sendError(res, 401, 'Not authenticated', 'AUTH_REQUIRED');
        }

        let profileData = {};

        if (req.user.role === 'JOB_SEEKER') {
            const { default: JobSeekerProfile } = await import('../models/JobSeekerProfile');
            const profile = await JobSeekerProfile.findOne({ userId: req.user._id }).lean();
            if (profile) {
                profileData = {
                    personalInfo: profile.personalInfo,
                    skills: profile.skills
                };
            }
        } else if (req.user.role === 'EMPLOYER') {
            const { default: CompanyProfile } = await import('../models/CompanyProfile');
            const profile = await CompanyProfile.findOne({ userId: req.user._id }).lean();
            if (profile) {
                profileData = {
                    companyProfile: profile
                };
            }
        }

        return sendSuccess(res, {
            id: req.user._id,
            email: req.user.email,
            role: req.user.role,
            name: req.user.name,
            ...profileData, // Merges personalInfo or companyProfile
            firebaseUid: req.user.firebaseUid,
            isOnboardingComplete: req.user.isOnboardingComplete
        }, 'User profile retrieved');
    } catch (error) {
        console.error('GetMe Error:', error);
        return sendError(res, 500, 'Server Error', 'SERVER_ERROR');
    }
};

export const completeOnboarding = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return sendError(res, 401, 'Not authenticated', 'AUTH_REQUIRED');
        }

        req.user.isOnboardingComplete = true;
        await req.user.save();

        return sendSuccess(res, {
            isOnboardingComplete: true
        }, 'Onboarding marked as complete');
    } catch (error) {
        console.error('Onboarding Error:', error);
        return sendError(res, 500, 'Server Error', 'SERVER_ERROR');
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return sendError(res, 401, 'Not authenticated', 'AUTH_REQUIRED');
        }

        const updates = req.body;

        // Allowed updates generic logic
        if (updates.name) req.user.name = updates.name;
        if (updates.companyProfile) {
            req.user.companyProfile = { ...req.user.companyProfile, ...updates.companyProfile };
        }

        // If updating profile, we can also mark onboarding as complete
        if (req.user.isOnboardingComplete === false) {
            req.user.isOnboardingComplete = true;
        }

        await req.user.save();

        return sendSuccess(res, {
            user: {
                id: req.user._id,
                email: req.user.email,
                role: req.user.role,
                name: req.user.name,
                companyProfile: req.user.companyProfile,
                isOnboardingComplete: req.user.isOnboardingComplete
            }
        }, 'Profile updated successfully');

    } catch (error) {
        console.error('Update Profile Error:', error);
        return sendError(res, 500, 'Server Error', 'SERVER_ERROR');
    }
};

export const checkForgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) return sendError(res, 400, 'Email is required', 'MISSING_EMAIL');

        const user = await User.findOne({ email });

        if (!user) {
            return sendError(res, 404, 'No account found with this email.', 'USER_NOT_FOUND');
        }

        // Robust check: Verify provider with Firebase directly (handles legacy users too)
        try {
            const firebaseUser = await firebaseAuth.getUser(user.firebaseUid);
            const isGoogleUser = firebaseUser.providerData.some(
                (provider) => provider.providerId === 'google.com'
            );

            if (isGoogleUser) {
                return sendError(res, 400, 'This account uses Google Sign-In. Please sign in with Google.', 'GOOGLE_ACCOUNT');
            }
        } catch (firebaseError) {
            console.error('Firebase User Fetch Error:', firebaseError);
            // Fallback to DB field if Firebase check fails (unlikely)
            if (user.authProvider === 'google') {
                return sendError(res, 400, 'This account uses Google Sign-In. Please sign in with Google.', 'GOOGLE_ACCOUNT');
            }
        }

        return sendSuccess(res, { allowReset: true }, 'User eligible for password reset');

    } catch (error) {
        console.error('Check Forgot Password Error:', error);
        return sendError(res, 500, 'Server Error', 'SERVER_ERROR');
    }
};

export const deleteAccount = async (req: Request, res: Response) => {
    try {
        if (!req.user) return sendError(res, 401, 'Not authenticated', 'AUTH_REQUIRED');

        // 1. Delete from Firebase
        try {
            await firebaseAuth.deleteUser(req.user.firebaseUid);
        } catch (fbError) {
            console.warn('Firebase user delete failed (might be already deleted):', fbError);
        }

        // 2. Delete Profile (if exists)
        if (req.user.role === 'JOB_SEEKER') {
            const { default: JobSeekerProfile } = await import('../models/JobSeekerProfile');
            await JobSeekerProfile.deleteOne({ userId: req.user._id });
        }

        // 3. Delete from User DB
        await User.deleteOne({ _id: req.user._id });

        return sendSuccess(res, {}, 'Account deleted successfully');

    } catch (error) {
        console.error('Delete Account Error:', error);
        return sendError(res, 500, 'Server Error', 'SERVER_ERROR');
    }
};

import Job, { JobStatus } from '../models/Job';

// ... existing code ...

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) {
            return sendError(res, 401, 'Auth required', 'AUTH_REQUIRED');
        }

        // Find all jobs where the user is a candidate
        const jobs = await Job.find({ 'candidates.userId': user._id });

        const stats = {
            applied: 0,
            shortlisted: 0,
            interviews: 0,
            rejected: 0,
            offers: 0
        };

        jobs.forEach(job => {
            const candidate = job.candidates.find(c => c.userId.toString() === user._id.toString());
            if (candidate) {
                stats.applied++; // Total applied
                if (['SCREENING', 'SHORTLISTED'].includes(candidate.status)) stats.shortlisted++;
                if (['INTERVIEW'].includes(candidate.status)) stats.interviews++;
                if (['REJECTED'].includes(candidate.status)) stats.rejected++;
                if (['OFFER'].includes(candidate.status)) stats.offers++;
            }
        });

        return sendSuccess(res, stats, 'Dashboard stats retrieved');
    } catch (error) {
        console.error('Stats Error:', error);
        return sendError(res, 500, 'Server Error', 'SERVER_ERROR');
    }
};
import JobSeekerProfile from '../models/JobSeekerProfile';
import { sendSuccess, sendError } from '../utils/response';

import { generateEmbedding } from '../services/gemini.service';

export const createOrUpdateProfile = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || user.role !== 'JOB_SEEKER') {
            return sendError(res, 403, 'Access denied. Only job seekers can create profiles.', 'ACCESS_DENIED');
        }

        const rawData = req.body;

        // Parse Logic to enforce types
        const profileData = {
            ...rawData,
            personalInfo: {
                ...rawData.personalInfo,
                age: rawData.personalInfo.age ? parseInt(rawData.personalInfo.age) : undefined,
            },
            education: rawData.education?.map((edu: any) => ({
                ...edu,
                year: parseInt(edu.year),
            })),
            certifications: rawData.certifications?.map((cert: any) => ({
                ...cert,
                year: cert.year ? parseInt(cert.year) : undefined,
            })),
        };

        // --- Generate Multi-Vector Embeddings ---
        try {
            const skillsText = `Key Skills: ${profileData.skills?.join(', ') || ''}`;

            const bioText = `Candidate Bio: ${profileData.personalInfo?.bio || ''}`;

            const experienceText = `
                Experience: ${profileData.experience?.map((exp: any) =>
                `${exp.role} at ${exp.company} (${exp.duration}): ${exp.description}`
            ).join('. ') || ''}
                Projects: ${profileData.projects?.map((proj: any) =>
                `${proj.title}: ${proj.description}. Tech: ${proj.technologies}`
            ).join('. ') || ''}
                Education: ${profileData.education?.map((edu: any) =>
                `${edu.degree} from ${edu.institution}`
            ).join('. ') || ''}
            `.trim();

            console.log("Generating Multi-Vectors for profile...");

            // Parallel Generation for Accuracy
            const [sVec, eVec, bVec] = await Promise.all([
                generateEmbedding(skillsText),
                generateEmbedding(experienceText),
                generateEmbedding(bioText)
            ]);

            if (sVec) profileData.skillsEmbedding = sVec;
            if (eVec) profileData.experienceEmbedding = eVec;
            if (bVec) profileData.bioEmbedding = bVec;

        } catch (embedError) {
            console.error("Failed to generate embedding (non-fatal):", embedError);
        }


        // Ensure userId checks out
        const profile = await JobSeekerProfile.findOneAndUpdate(
            { userId: user._id },
            {
                userId: user._id,
                ...profileData
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        return sendSuccess(res, profile, 'Profile saved successfully');

    } catch (error) {
        console.error('Create/Update Profile Error:', error);
        return sendError(res, 500, 'Server Error', 'SERVER_ERROR');
    }
};

export const getProfile = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) {
            return sendError(res, 401, 'Not authenticated', 'AUTH_REQUIRED');
        }

        const profile = await JobSeekerProfile.findOne({ userId: user._id });

        if (!profile) {
            return sendError(res, 404, 'Profile not found', 'PROFILE_NOT_FOUND');
        }

        return sendSuccess(res, profile, 'Profile retrieved successfully');

    } catch (error) {
        console.error('Get Profile Error:', error);
        return sendError(res, 500, 'Server Error', 'SERVER_ERROR');
    }
};

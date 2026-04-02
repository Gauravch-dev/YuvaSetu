import mongoose, { Document, Schema } from 'mongoose';

export enum UserRole {
    JOB_SEEKER = 'JOB_SEEKER',
    EMPLOYER = 'EMPLOYER',
}

export interface IUser extends Document {
    firebaseUid: string;
    email: string;
    role: UserRole;
    authProvider: 'email' | 'google';
    isOnboardingComplete: boolean;
    name?: string;
    companyProfile?: {
        companyName?: string;
        website?: string;
        description?: string;
        location?: string;
        industry?: string;
        size?: string;
        logoUrl?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        firebaseUid: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        role: {
            type: String,
            enum: Object.values(UserRole),
            required: true,
        },
        authProvider: {
            type: String,
            enum: ['email', 'google'],
            required: true,
            default: 'email',
        },
        isOnboardingComplete: {
            type: Boolean,
            default: false,
        },
        // Common Profile Fields
        name: { type: String },
        isCompanyProfileComplete: { type: Boolean, default: false },

        // Employer Specific
        companyProfile: {
            companyName: String,
            website: String,
            description: String,
            location: String,
            industry: String,
            size: String,
            logoUrl: String,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IUser>('User', UserSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface IJobSeekerProfile extends Document {
    userId: mongoose.Types.ObjectId;
    personalInfo: {
        fullName: string;
        email: string;
        phone: string;
        github?: string;
        linkedin?: string;
        portfolio?: string;
        age?: number;
        languages?: string;
        profilePicture?: string;
        coverImage?: string;
        bio?: string; // Short bio/summary
    };
    education: Array<{
        institution: string;
        degree: string;
        year: number;
        score?: string;
    }>;
    experience: Array<{
        role: string;
        company: string;
        duration: string;
        description: string;
    }>;
    projects: Array<{
        title: string;
        description: string;
        technologies: string;
        link?: string;
    }>;
    certifications: Array<{
        title: string;
        issuer: string;
        year?: number;
    }>;
    skills: string[];
    skillsEmbedding?: number[];
    experienceEmbedding?: number[];
    bioEmbedding?: number[];
    resumeEmbedding?: number[];
    preferences?: {
        notifications: {
            jobAlerts: boolean;
            applicationUpdates: boolean;
            marketing: boolean;
        };
        privacy: {
            publicProfile: boolean;
            showEmail: boolean;
        };
    };
    createdAt: Date;
    updatedAt: Date;
}

const JobSeekerProfileSchema: Schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        personalInfo: {
            fullName: { type: String, required: true },
            email: { type: String, required: true },
            phone: { type: String, required: true },
            github: String,
            linkedin: String,
            portfolio: String,
            bio: String,
            age: Number,
            languages: String,
            profilePicture: String,
            coverImage: String,
        },
        // ... (education, experience, projects, certifications, skills omitted for brevity but preserved by startLine) ...
        education: [
            {
                institution: { type: String, required: true },
                degree: { type: String, required: true },
                year: { type: Number, required: true },
                score: String,
            },
        ],
        experience: [
            {
                role: { type: String, required: true },
                company: { type: String, required: true },
                duration: { type: String, required: true },
                description: String,
            },
        ],
        projects: [
            {
                title: { type: String, required: true },
                description: String,
                technologies: String,
                link: String,
            },
        ],
        certifications: [
            {
                title: { type: String, required: true },
                issuer: { type: String, required: true },
                year: Number,
            },
        ],
        skills: [String],
        // Multi-Vector Embeddings
        skillsEmbedding: { type: [Number], select: false },
        experienceEmbedding: { type: [Number], select: false },
        bioEmbedding: { type: [Number], select: false },

        // Deprecated single embedding
        resumeEmbedding: {
            type: [Number],
            default: [],
            select: false
        },

        preferences: {
            notifications: {
                jobAlerts: { type: Boolean, default: true },
                applicationUpdates: { type: Boolean, default: true },
                marketing: { type: Boolean, default: false },
            },
            privacy: {
                publicProfile: { type: Boolean, default: true },
                showEmail: { type: Boolean, default: false },
            }
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IJobSeekerProfile>('JobSeekerProfile', JobSeekerProfileSchema);

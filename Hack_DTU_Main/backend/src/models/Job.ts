import mongoose, { Document, Schema } from 'mongoose';

export enum JobStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    CLOSED = 'CLOSED',
}

export interface IJob extends Document {
    employerId: mongoose.Types.ObjectId;
    companyProfileId: mongoose.Types.ObjectId; // Denormalized for easier generic display
    title: string;
    type: string;
    location: string;
    salary: string;
    description: string;
    requirements: string[];
    skills: string[];
    status: JobStatus;
    embedding?: number[]; // Vector Embedding
    skillsEmbedding?: number[];
    experienceEmbedding?: number[];
    descriptionEmbedding?: number[];
    candidates: {
        userId: mongoose.Types.ObjectId;
        status: string;
        appliedAt: Date;
        resumeUrl?: string;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const JobSchema: Schema = new Schema(
    {
        employerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        companyProfileId: {
            type: Schema.Types.ObjectId,
            ref: 'CompanyProfile',
            required: true
        },
        title: { type: String, required: true },
        type: { type: String, default: 'Full-time' },
        location: { type: String },
        salary: { type: String },
        description: { type: String },
        requirements: [{ type: String }],
        skills: [{ type: String }],
        benefits: [{ type: String }],
        status: {
            type: String,
            enum: Object.values(JobStatus),
            default: JobStatus.DRAFT,
            index: true
        },
        // Multi-Vector Embeddings
        skillsEmbedding: { type: [Number], select: false },
        experienceEmbedding: { type: [Number], select: false },
        descriptionEmbedding: { type: [Number], select: false },

        embedding: {
            type: [Number], // Vector for Semantic Search (Deprecated)
            select: false,
            index: false
        },
        candidates: [{
            userId: { type: Schema.Types.ObjectId, ref: 'User' },
            status: { type: String, default: 'APPLIED' }, // APPLIED, SCREENING, INTERVIEW, OFFER, REJECTED
            appliedAt: { type: Date, default: Date.now },
            resumeUrl: { type: String } // Optional: Custom resume URL
        }]
    },
    {
        timestamps: true,
    }
);

// Compound index for filtering
JobSchema.index({ status: 1, "skillsEmbedding.0": 1 }); // "skillsEmbedding.0" exists check is efficient
JobSchema.index({ employerId: 1, status: 1 });

export default mongoose.model<IJob>('Job', JobSchema);

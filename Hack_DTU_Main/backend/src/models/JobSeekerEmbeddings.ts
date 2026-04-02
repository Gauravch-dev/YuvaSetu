import mongoose, { Document, Schema } from 'mongoose';

export interface IJobSeekerEmbeddings extends Document {
    userId: mongoose.Types.ObjectId;
    educationEmbedding: number[];
    skillsEmbedding: number[];
    combinedEmbedding?: number[]; // Optional: for overall profile vector
    createdAt: Date;
    updatedAt: Date;
}

const JobSeekerEmbeddingsSchema: Schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        educationEmbedding: {
            type: [Number],
            default: [],
        },
        skillsEmbedding: {
            type: [Number],
            default: [],
        },
        combinedEmbedding: {
            type: [Number],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IJobSeekerEmbeddings>('JobSeekerEmbeddings', JobSeekerEmbeddingsSchema);

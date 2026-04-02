import mongoose, { Document, Schema } from 'mongoose';

export interface ICompanyProfile extends Document {
    userId: mongoose.Types.ObjectId;
    companyName: string;
    website?: string;
    description?: string;
    location?: string;
    industry?: string;
    size?: string;
    logoUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CompanyProfileSchema: Schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true, // One profile per user for now
        },
        companyName: {
            type: String,
            required: true,
            trim: true
        },
        website: {
            type: String,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        location: {
            type: String,
            trim: true
        },
        industry: {
            type: String,
            trim: true
        },
        size: {
            type: String,
            trim: true
        },
        logoUrl: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<ICompanyProfile>('CompanyProfile', CompanyProfileSchema);

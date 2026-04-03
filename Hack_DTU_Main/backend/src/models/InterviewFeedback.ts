import mongoose, { Document, Schema } from 'mongoose';

export interface ICategoryScore {
    name: string;
    score: number | string;
    comment: string;
}

export interface IConversationEntry {
    role: string;
    content: string;
}

export interface IInterviewFeedback extends Document {
    interviewId: string;
    userId: string;
    totalScore: number | string;
    categoryScores: ICategoryScore[];
    strengths: string[];
    areasForImprovement: string[];
    finalAssessment: string;
    conversationHistory: IConversationEntry[];
    createdAt: Date;
}

const InterviewFeedbackSchema: Schema = new Schema(
    {
        interviewId: { type: String, required: true, index: true },
        userId: { type: String, required: true, index: true },
        totalScore: { type: Schema.Types.Mixed, required: true },
        categoryScores: [
            {
                name: { type: String, required: true },
                score: { type: Schema.Types.Mixed, required: true },
                comment: { type: String, required: true },
            },
        ],
        strengths: [{ type: String }],
        areasForImprovement: [{ type: String }],
        finalAssessment: { type: String, required: true },
        conversationHistory: [
            {
                role: { type: String, required: true },
                content: { type: String, required: true },
            },
        ],
    },
    {
        timestamps: true,
    }
);

InterviewFeedbackSchema.index({ interviewId: 1, userId: 1 });

export default mongoose.model<IInterviewFeedback>('InterviewFeedback', InterviewFeedbackSchema);

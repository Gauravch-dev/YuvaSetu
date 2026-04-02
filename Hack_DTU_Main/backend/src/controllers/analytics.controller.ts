import { Request, Response } from 'express';
import Job from '../models/Job';
import JobSeekerProfile from '../models/JobSeekerProfile';
import { sendSuccess, sendError } from '../utils/response';
import mongoose from 'mongoose';
import { VectorService } from '../services/vector.service';

const cosineSimilarity = (a: number[] | undefined, b: number[] | undefined) => {
    if (!a || !b || a.length !== b.length) return 0;
    return VectorService.cosineSimilarity(a, b);
};

export const getJobAnalytics = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // Job ID
        const userId = req.user?._id;

        const job = await Job.findOne({ _id: id, employerId: userId }).select('+skillsEmbedding +experienceEmbedding +descriptionEmbedding');
        if (!job) return sendError(res, 404, 'Job not found or access denied');

        // 1. Calculate Match Score Distribution
        const candidateUserIds = job.candidates.map(c => c.userId);
        const profiles = await JobSeekerProfile.find({ userId: { $in: candidateUserIds } })
            .select('userId skillsEmbedding experienceEmbedding bioEmbedding');

        const matchScores: number[] = [];

        profiles.forEach(profile => {
            // Calculate score if embeddings exist
            if (profile.skillsEmbedding && job.skillsEmbedding) {
                const exactSkillScore = cosineSimilarity(profile.skillsEmbedding, job.skillsEmbedding);
                const expScore = cosineSimilarity(profile.experienceEmbedding, job.experienceEmbedding);
                const roleScore = cosineSimilarity(profile.bioEmbedding, job.descriptionEmbedding);

                const finalScore = (exactSkillScore * 0.5) + (expScore * 0.3) + (roleScore * 0.2);
                matchScores.push(finalScore * 100);
            } else {
                matchScores.push(0);
            }
        });

        const matchDistribution = [
            { range: '90-100%', count: matchScores.filter(s => s >= 90).length },
            { range: '80-89%', count: matchScores.filter(s => s >= 80 && s < 90).length },
            { range: '70-79%', count: matchScores.filter(s => s >= 70 && s < 80).length },
            { range: '60-69%', count: matchScores.filter(s => s >= 60 && s < 70).length },
            { range: '<60%', count: matchScores.filter(s => s < 60).length },
        ];

        // 2. Calculate Applicant Trends (Last 7 Days)
        const trends = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' });

            // Count applicants for this day
            const count = job.candidates.filter(c => {
                const appliedDate = new Date(c.appliedAt);
                return appliedDate.getDate() === date.getDate() &&
                    appliedDate.getMonth() === date.getMonth() &&
                    appliedDate.getFullYear() === date.getFullYear();
            }).length;

            trends.push({ day: dayStr, applicants: count });
        }

        // 3. Pipeline Stats
        const pipeline = {
            applied: job.candidates.filter(c => c.status === 'APPLIED').length,
            shortlisted: job.candidates.filter(c => c.status === 'SHORTLISTED').length,
            interview: job.candidates.filter(c => c.status === 'INTERVIEW').length,
            offer: job.candidates.filter(c => c.status === 'OFFER').length,
            rejected: job.candidates.filter(c => c.status === 'REJECTED').length,
            total: job.candidates.length
        };

        // Avg Match Score
        const avgMatch = matchScores.length > 0 ? Math.round(matchScores.reduce((a, b) => a + b, 0) / matchScores.length) : 0;

        return sendSuccess(res, {
            matchDistribution,
            applicantTrends: trends,
            pipeline,
            avgMatch,
            totalApplicants: job.candidates.length
        }, 'Analytics fetched successfully');

    } catch (error) {
        console.error('Analytics Error:', error);
        return sendError(res, 500, 'Failed to fetch analytics');
    }
};

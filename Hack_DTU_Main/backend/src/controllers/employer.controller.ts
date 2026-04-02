import { Request, Response } from 'express';
import mongoose from 'mongoose';
import CompanyProfile from '../models/CompanyProfile';
import User from '../models/User';
import { sendSuccess, sendError } from '../utils/response';
import Job from '../models/Job';
import JobSeekerProfile from '../models/JobSeekerProfile';

import { VectorService } from '../services/vector.service';

export const getEmployerDashboardStats = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) return sendError(res, 401, 'Unauthorized');

        // 1. Stats Counters (Database Side - Fast)
        const activeJobsCount = await Job.countDocuments({ employerId: userId, status: 'PUBLISHED' });

        const statsAggregation = await Job.aggregate([
            { $match: { employerId: new mongoose.Types.ObjectId(userId.toString()) } },
            {
                $project: {
                    applicationCount: { $size: { $ifNull: ["$candidates", []] } },
                    interviewCount: {
                        $size: {
                            $filter: {
                                input: { $ifNull: ["$candidates", []] },
                                as: "candidate",
                                cond: { $eq: ["$$candidate.status", "INTERVIEW"] }
                            }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalApplications: { $sum: "$applicationCount" },
                    interviewsScheduled: { $sum: "$interviewCount" }
                }
            }
        ]);

        const totalApplications = statsAggregation[0]?.totalApplications || 0;
        const interviewsScheduled = statsAggregation[0]?.interviewsScheduled || 0;

        // 2. Fetch Top 5 Recent Candidates (Aggregation)
        const recentApplications = await Job.aggregate([
            { $match: { employerId: new mongoose.Types.ObjectId(userId.toString()) } },
            { $unwind: "$candidates" },
            { $sort: { "candidates.appliedAt": -1 } },
            { $limit: 5 },
            {
                $project: {
                    jobId: "$_id",
                    jobTitle: "$title",
                    userId: "$candidates.userId",
                    status: "$candidates.status",
                    appliedAt: "$candidates.appliedAt"
                }
            }
        ]);

        // 3. Lazy Load Data for JUST the Top 5
        let recentCandidates: any[] = [];

        if (recentApplications.length > 0) {
            const candidateUserIds = recentApplications.map(app => app.userId);
            // Ensure unique jobIds to prevent duplicate fetching
            const pertinentJobIds = [...new Set(recentApplications.map(app => app.jobId))];

            // Fetch only necessary Profiles
            const profiles = await JobSeekerProfile.find({ userId: { $in: candidateUserIds } })
                .select('userId personalInfo experience +skillsEmbedding +experienceEmbedding +bioEmbedding');

            // Fetch only necessary Jobs (with embeddings)
            const pertinentJobs = await Job.find({ _id: { $in: pertinentJobIds } })
                .select('title skillsEmbedding experienceEmbedding descriptionEmbedding');

            recentCandidates = recentApplications.map(app => {
                const profile = profiles.find((p: any) => p.userId.toString() === app.userId.toString());
                const job = pertinentJobs.find((j: any) => j._id.toString() === app.jobId.toString());

                let matchScore = 0;

                // Calculate Score only for these 5
                if (job && profile && job.skillsEmbedding && profile.skillsEmbedding) {
                    try {
                        const skillScore = VectorService.cosineSimilarity(profile.skillsEmbedding, job.skillsEmbedding);
                        const expScore = (profile.experienceEmbedding && job.experienceEmbedding)
                            ? VectorService.cosineSimilarity(profile.experienceEmbedding, job.experienceEmbedding) : 0;
                        const bioScore = (profile.bioEmbedding && job.descriptionEmbedding)
                            ? VectorService.cosineSimilarity(profile.bioEmbedding, job.descriptionEmbedding) : 0;

                        const weightedScore = (skillScore * 0.5) + (expScore * 0.3) + (bioScore * 0.2);
                        matchScore = Math.max(0, Math.round(weightedScore * 100));
                    } catch (e) {
                        console.warn(`Dashboard Score Error for ${app.userId}:`, e);
                    }
                }

                return {
                    id: app.userId,
                    name: profile?.personalInfo?.fullName || 'Unknown Candidate',
                    role: profile?.experience?.[0]?.role || 'Applicant',
                    match: matchScore,
                    job: app.jobTitle,
                    status: app.status,
                    appliedAt: app.appliedAt,
                    avatar: profile?.personalInfo?.profilePicture
                };
            });
        }

        return sendSuccess(res, {
            stats: {
                activeJobs: activeJobsCount,
                totalApplications,
                interviews: interviewsScheduled
            },
            recentCandidates
        }, 'Dashboard stats fetched successfully');

    } catch (error) {
        console.error('Employer Dashboard Stats Error:', error);
        return sendError(res, 500, 'Failed to fetch dashboard stats');
    }
};

export const getCompanyProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) return sendError(res, 401, 'Unauthorized');

        const profile = await CompanyProfile.findOne({ userId });

        return sendSuccess(res, profile || {}, 'Company profile fetched successfully');
    } catch (error) {
        console.error('Get Company Profile Error:', error);
        return sendError(res, 500, 'Failed to fetch company profile');
    }
};

export const updateCompanyProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) return sendError(res, 401, 'Unauthorized');

        const { companyName, website, description, location, industry, size, logoUrl } = req.body;

        if (!companyName) {
            return sendError(res, 400, 'Company Name is required');
        }

        // Upsert Company Profile
        const profile = await CompanyProfile.findOneAndUpdate(
            { userId },
            {
                userId,
                companyName,
                website,
                description,
                location,
                industry,
                size,
                logoUrl
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        // Update User Model (Unlock Menu & Update Header Name)
        await User.findByIdAndUpdate(userId, {
            name: companyName, // Map Company Name to User Name for Header
            isCompanyProfileComplete: true,
            isOnboardingComplete: true // CRITICAL: This unlocks the Frontend Menu
        });

        return sendSuccess(res, profile, 'Company profile updated successfully');
    } catch (error) {
        console.error('Update Company Profile Error:', error);
        return sendError(res, 500, 'Failed to update company profile');
    }
};

export const getEmployerCandidateProfile = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const profile = await JobSeekerProfile.findOne({ userId });

        if (!profile) {
            return sendError(res, 404, 'Candidate profile not found');
        }

        return sendSuccess(res, profile, 'Candidate profile fetched successfully');
    } catch (error) {
        console.error('Get Candidate Profile Error:', error);
        return sendError(res, 500, 'Failed to fetch candidate profile');
    }
};

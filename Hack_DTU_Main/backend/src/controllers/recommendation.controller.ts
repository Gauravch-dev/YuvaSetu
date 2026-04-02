import { Request, Response } from 'express';
import Job, { JobStatus } from '../models/Job';
import JobSeekerProfile from '../models/JobSeekerProfile';
import { VectorService } from '../services/vector.service';
import { generateEmbedding } from '../services/gemini.service';
import { sendSuccess, sendError } from '../utils/response';
import mongoose from 'mongoose';

const cosineSimilarity = (a: number[] | undefined, b: number[] | undefined) => {
    if (!a || !b || a.length !== b.length) return 0;
    return VectorService.cosineSimilarity(a, b);
};

export const getRecommendedJobs = async (req: Request, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'JOB_SEEKER') {
            return sendError(res, 403, 'Access denied', 'ACCESS_DENIED');
        }

        const user = req.user;
        const profile = await JobSeekerProfile.findOne({ userId: user._id }).select('+skillsEmbedding +experienceEmbedding +bioEmbedding');

        if (!profile) {
            return sendError(res, 404, 'Profile not found. Please complete your profile first.');
        }

        // 1. Auto-Heal Profile Embeddings (If missing)
        if (!profile.skillsEmbedding || profile.skillsEmbedding.length === 0) {
            console.log("Lazy Generating Multi-Vectors for User:", user._id);
            try {
                const skillsText = `Key Skills: ${profile.skills?.join(', ') || ''}`;
                const bioText = `Candidate Bio: ${profile.personalInfo?.bio || ''}`;
                const experienceText = `Experience: ${profile.experience?.map((e: any) => e.role + ' ' + e.company).join(' ') || ''}`;

                const [sVec, eVec, bVec] = await Promise.all([
                    generateEmbedding(skillsText),
                    generateEmbedding(experienceText),
                    generateEmbedding(bioText)
                ]);

                if (sVec && eVec && bVec) {
                    profile.skillsEmbedding = sVec;
                    profile.experienceEmbedding = eVec;
                    profile.bioEmbedding = bVec;
                    await profile.save();
                } else {
                    return sendError(res, 400, 'Profile analysis incomplete. Please update your profile.');
                }
            } catch (err) {
                return sendError(res, 500, 'Error generating profile embeddings');
            }
        }

        // 2. Atlas Vector Search (Retrieval - O(log N))
        // We search primarily on SKILLS to find relevant matches.
        const candidates = await Job.aggregate([
            {
                $vectorSearch: {
                    index: "job_vector_index",
                    path: "skillsEmbedding",
                    queryVector: profile.skillsEmbedding,
                    numCandidates: 100, // Search 100 nearest neighbors
                    limit: 50,          // Return top 50 for reranking
                    filter: { status: "PUBLISHED" }
                }
            },
            {
                $lookup: {
                    from: "companyprofiles",
                    localField: "companyProfileId",
                    foreignField: "_id",
                    as: "companyDetails"
                }
            },
            {
                $unwind: { path: "$companyDetails", preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    title: 1,
                    description: 1,
                    skills: 1,
                    companyDetails: 1,
                    type: 1,
                    location: 1,
                    salary: 1,
                    candidates: 1,
                    skillsEmbedding: 1,     // Need these for Reranking
                    experienceEmbedding: 1,
                    descriptionEmbedding: 1,
                    requirements: 1,        // explicitly included for display
                    benefits: 1,            // explicitly included for display
                    vectorScore: { $meta: "vectorSearchScore" } // Initial Score
                }
            }
        ]);

        // Filter out jobs the user has already applied to
        const unappliedCandidates = candidates.filter((job: any) => {
            const hasApplied = job.candidates?.some((c: any) => c.userId?.toString() === user._id.toString());
            return !hasApplied;
        });

        // 3. In-Memory Reranking (Hybrid Scoring)
        // Now we refine the Top 50 using our full weighted formula.
        const scoredJobs = unappliedCandidates.map((job: any) => {
            // Re-compute exact skill score to be safe and consistent with other vectors
            const exactSkillScore = cosineSimilarity(profile.skillsEmbedding, job.skillsEmbedding);

            const expScore = cosineSimilarity(profile.experienceEmbedding, job.experienceEmbedding);
            const roleScore = cosineSimilarity(profile.bioEmbedding, job.descriptionEmbedding);

            // Weighted Ensemble Score
            // Weights: Skills (50%), Experience (30%), Role (20%)
            const finalScore = (exactSkillScore * 0.5) + (expScore * 0.3) + (roleScore * 0.2);

            return {
                item: { ...job, companyProfileId: job.companyDetails }, // format for frontend
                score: finalScore,
                details: {
                    skills: Math.round(Math.max(0, exactSkillScore * 100)),
                    experience: Math.round(Math.max(0, expScore * 100)),
                    location: Math.round(Math.max(0, roleScore * 100)),
                    salary: Math.round(Math.max(0, finalScore * 100))
                }
            };
        });

        // 4. Sort and Top K
        scoredJobs.sort((a, b) => b.score - a.score);
        const topMatches = scoredJobs.slice(0, 10);

        // 5. Format Response
        const responseData = topMatches.map(match => {
            const score = Math.round(match.score * 100);
            const jobObj = match.item;

            // Format Company
            if (jobObj.companyDetails) {
                jobObj.company = jobObj.companyDetails.companyName;
                jobObj.logo = jobObj.companyDetails.logoUrl;
            }

            // Check if user has applied
            const hasApplied = jobObj.candidates?.some((c: any) => c.userId?.toString() === user._id.toString()) || false;

            return {
                ...jobObj,
                matchScore: score,
                matchDetails: match.details,
                hasApplied,
                // Clean up heavy fields
                skillsEmbedding: undefined,
                experienceEmbedding: undefined,
                descriptionEmbedding: undefined,
                candidates: undefined,
                companyDetails: undefined
            };
        });

        return sendSuccess(res, responseData, 'Recommended jobs fetched successfully (Atlas Vector Search)');

    } catch (error) {
        console.error('Recommendation Error:', error);
        return sendError(res, 500, 'Failed to fetch recommendations');
    }
};

export const getRecommendedCandidates = async (req: Request, res: Response) => {
    try {
        const { jobId } = req.params;
        const job = await Job.findById(jobId).select('+skillsEmbedding +experienceEmbedding +descriptionEmbedding candidates employerId title description requirements skills');

        if (!job) return sendError(res, 404, 'Job not found', 'JOB_NOT_FOUND');

        // Security Check
        const userId = req.user?._id?.toString();
        const jobOwnerId = job.employerId?.toString();
        if (!userId || !jobOwnerId || jobOwnerId !== userId) {
            return sendError(res, 403, 'Unauthorized', 'ACCESS_DENIED');
        }

        // Auto-Heal Job logic
        if (!job.skillsEmbedding || job.skillsEmbedding.length === 0) {
            console.log(`[RecController] Lazy Generating Multi-Vectors for Job: ${jobId}`);
            try {
                const skillsText = `Skills: ${(job.skills || []).join(', ')}`;
                const expText = `Requirements: ${(job.requirements || []).join('. ')}`;
                const descText = `Job Title: ${job.title}. Description: ${job.description}`;
                const [sVec, eVec, dVec] = await Promise.all([generateEmbedding(skillsText), generateEmbedding(expText), generateEmbedding(descText)]);
                if (sVec && eVec && dVec) {
                    job.skillsEmbedding = sVec;
                    job.experienceEmbedding = eVec;
                    job.descriptionEmbedding = dVec;
                    await job.save();
                } else {
                    return sendSuccess(res, [], 'Job analysis pending.');
                }
            } catch (e) { console.error(e); return sendSuccess(res, [], 'Analysis failed'); }
        }

        // 2. Atlas Vector Search for Candidates
        // Query `jobseekerprofiles` collection
        const candidates = await JobSeekerProfile.aggregate([
            {
                $vectorSearch: {
                    index: "candidate_vector_index",
                    path: "skillsEmbedding",
                    queryVector: job.skillsEmbedding,
                    numCandidates: 100,
                    limit: 50
                }
            },
            {
                $project: {
                    userId: 1,
                    personalInfo: 1,
                    skills: 1,
                    experience: 1,
                    education: 1,
                    skillsEmbedding: 1,
                    experienceEmbedding: 1,
                    bioEmbedding: 1,
                    vectorScore: { $meta: "vectorSearchScore" }
                }
            }
        ]);

        // 3. In-Memory Reranking
        const scoredCandidates: any[] = [];

        for (const candidate of candidates) {
            if (candidate.skillsEmbedding) {
                const exactSkillScore = cosineSimilarity(candidate.skillsEmbedding, job.skillsEmbedding);
                const expScore = cosineSimilarity(candidate.experienceEmbedding, job.experienceEmbedding);
                const roleScore = cosineSimilarity(candidate.bioEmbedding, job.descriptionEmbedding);

                const finalScore = (exactSkillScore * 0.5) + (expScore * 0.3) + (roleScore * 0.2);

                scoredCandidates.push({
                    item: candidate,
                    score: finalScore,
                    details: {
                        skills: Math.round(Math.max(0, exactSkillScore * 100)),
                        experience: Math.round(Math.max(0, expScore * 100)),
                        culture: Math.round(Math.max(0, roleScore * 100))
                    }
                });
            }
        }

        // 4. Sort
        scoredCandidates.sort((a, b) => b.score - a.score);

        // 5. Response
        const responseData = scoredCandidates.map(match => ({
            id: match.item._id,
            userId: match.item.userId,
            personalInfo: match.item.personalInfo,
            skills: match.item.skills,
            matchScore: Math.round(Math.max(0, match.score * 100)),
            matchDetails: match.details
        }));

        return sendSuccess(res, responseData, 'Top candidates fetched successfully (Atlas Vector Search)');

    } catch (error) {
        console.error('Candidate Recommendation Error:', error);
        return sendError(res, 500, 'Server Error', 'SERVER_ERROR');
    }
};

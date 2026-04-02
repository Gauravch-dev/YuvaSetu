import { Request, Response } from 'express';
import Job, { JobStatus } from '../models/Job';
import CompanyProfile from '../models/CompanyProfile';
import { generateEmbedding } from '../services/gemini.service';
import { sendSuccess, sendError, sendCreated } from '../utils/response';

// Helper to construct embedding text
const getEmbeddingText = (title: string, desc: string, reqs: string, skills: string[]) => {
    return `${title} \n\n ${desc} \n\n ${reqs} \n\n Skills: ${skills.join(', ')}`;
};

export const createJob = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) return sendError(res, 401, 'Unauthorized');

        const { title, type, location, salary, description, requirements, skills, status } = req.body;

        // 1. Get Company Profile ID (Required for Job)
        const companyProfile = await CompanyProfile.findOne({ userId });
        if (!companyProfile) {
            return sendError(res, 400, 'Please complete your Company Profile before posting a job.');
        }

        // 2. Generate Multi-Vector Embeddings if Publishing
        let skillsVector: number[] = [];
        let expVector: number[] = [];
        let descVector: number[] = [];

        const jobStatus = status === 'PUBLISHED' ? JobStatus.PUBLISHED : JobStatus.DRAFT;

        if (jobStatus === JobStatus.PUBLISHED) {
            const skillsText = `Skills: ${skills ? (Array.isArray(skills) ? skills.join(', ') : skills) : ''}`;
            const experienceText = `Requirements: ${requirements ? (Array.isArray(requirements) ? requirements.join('. ') : requirements) : ''}`;
            const descText = `Job Title: ${title}. Description: ${description}`;

            // Parallel Generation
            const [sVec, eVec, dVec] = await Promise.all([
                generateEmbedding(skillsText),
                generateEmbedding(experienceText),
                generateEmbedding(descText)
            ]);

            if (sVec) skillsVector = sVec;
            if (eVec) expVector = eVec;
            if (dVec) descVector = dVec;
        }

        // 3. Create Job
        const newJob = await Job.create({
            employerId: userId,
            companyProfileId: companyProfile._id,
            title,
            type,
            location,
            salary,
            description,
            requirements,
            skills: skills ? (Array.isArray(skills) ? skills : skills.split(',').map((s: string) => s.trim())) : [],
            status: jobStatus,
            skillsEmbedding: skillsVector,
            experienceEmbedding: expVector,
            descriptionEmbedding: descVector
        });

        return sendCreated(res, newJob, 'Job created successfully');

    } catch (error) {
        console.error('Create Job Error:', error);
        return sendError(res, 500, 'Failed to create job');
    }
};

export const getEmployerJobs = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        const { status } = req.query;

        const query: any = { employerId: userId };
        if (status) query.status = status;

        const jobs = await Job.find(query).sort({ updatedAt: -1 });

        return sendSuccess(res, jobs, 'Jobs fetched successfully');

    } catch (error) {
        console.error('Get Employer Jobs Error:', error);
        return sendError(res, 500, 'Failed to fetch jobs');
    }
};

export const getJobById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const job = await Job.findById(id).populate('companyProfileId'); // Populate company details if needed for public view

        if (!job) return sendError(res, 404, 'Job not found');

        // Check if applied (if user is logged in)
        // @ts-ignore
        const userId = req.user?._id;
        let hasApplied = false;

        if (userId && job.candidates) {
            hasApplied = job.candidates.some(c => c.userId.toString() === userId.toString());
        }

        return sendSuccess(res, { ...job.toObject(), hasApplied }, 'Job fetched successfully');
    } catch (error) {
        return sendError(res, 500, 'Failed to fetch job');
    }
};

export const updateJob = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;
        const { title, type, location, salary, description, requirements, skills, status } = req.body;

        const job = await Job.findOne({ _id: id, employerId: userId });
        if (!job) return sendError(res, 404, 'Job not found');

        // Logic: Should we generate valid embedding?
        // 1. If currently DRAFT and moving to PUBLISHED -> YES
        // 2. If currently PUBLISHED and text fields changed -> YES
        // 3. If currently PUBLISHED and moving to DRAFT -> NO (Optional, but keeping it is fine, maybe remove?) -> Let's keep it or ignore.

        const isPublishing = status === JobStatus.PUBLISHED;
        const wasPublished = job.status === JobStatus.PUBLISHED;
        // Check if meaningful content changed
        const contentChanged =
            job.title !== title ||
            job.description !== description ||
            job.requirements !== requirements ||
            JSON.stringify(job.skills) !== JSON.stringify(skills);

        let embedding = job.embedding;

        if ((isPublishing && !wasPublished) || (isPublishing && contentChanged)) {
            const textToEmbed = getEmbeddingText(title, description, requirements, skills || []);
            const newEmbedding = await generateEmbedding(textToEmbed);
            if (newEmbedding) embedding = newEmbedding;
        }

        job.title = title;
        job.type = type;
        job.location = location;
        job.salary = salary;
        job.description = description;
        job.requirements = requirements;
        job.skills = skills ? (Array.isArray(skills) ? skills : skills.split(',').map((s: string) => s.trim())) : [];
        job.status = status;
        job.embedding = embedding;

        await job.save();

        return sendSuccess(res, job, 'Job updated successfully');
    } catch (error) {
        console.error("Update Job Error", error);
        return sendError(res, 500, 'Failed to update job');
    }
};

export const deleteJob = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;

        const job = await Job.findOneAndDelete({ _id: id, employerId: userId });
        if (!job) return sendError(res, 404, 'Job not found');

        return sendSuccess(res, null, 'Job deleted successfully');
    } catch (error) {
        return sendError(res, 500, 'Failed to delete job');
    }
};

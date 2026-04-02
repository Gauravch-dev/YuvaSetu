import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import axios from 'axios';
import Job from '../models/Job';
import JobSeekerProfile from '../models/JobSeekerProfile';
import { VectorService } from '../services/vector.service';

export const parseResumeWithAI = async (req: Request, res: Response) => {
    try {
        const { text } = req.body;
        if (!text || text.length < 50) {
            return sendError(res, 400, 'Insufficient resume text provided', 'INVALID_INPUT');
        }

        const apiKey = process.env.ONDEMAND_API_KEY;
        if (!apiKey) {
            console.error('OnDemand API Key missing from process.env');
            return sendError(res, 500, 'Server configuration error', 'CONFIG_ERROR');
        }

        const prompt = `
        You are a highly accurate Resume Parsing Agent.
        Your goal is to extract structured data from the resume text provided.

        CRITICAL RULES:
        1. Return ONLY valid JSON.
        2. "skills": Array of strings (Max 20).
        3. "experience" & "projects": 
           - Preserve exact bullet points from the text. 
           - Do NOT summarize or shorten descriptions. 
           - Keep the original formatting (newlines/bullets).
        4. "education": Extract the End Year as "year" (e.g. "2024").
        5. If a field is missing, use empty string "" or empty array [].

        SCHEMA:
        {
          "personalInfo": { "fullName": "", "email": "", "phone": "", "linkedin": "", "github": "", "bio": "" },
          "education": [{ "institution": "", "degree": "", "year": "2024", "score": "" }],
          "experience": [{ "role": "", "company": "", "duration": "", "description": "• Built X using Y..." }],
          "projects": [{ "title": "", "technologies": "", "link": "", "description": "• Implemented Z..." }],
          "skills": ["React", "TypeScript"]
        }

        RESUME TEXT:
        ${text.substring(0, 15000)}
        `;

        // Step 1: Create Chat Session
        const sessionResponse = await axios.post(
            'https://api.on-demand.io/chat/v1/sessions',
            {
                pluginIds: [],
                externalUserId: req.user?._id || 'guest'
            },
            {
                headers: { 'apikey': apiKey }
            }
        );

        const sessionId = sessionResponse.data?.data?.id;
        if (!sessionId) throw new Error("Failed to create chat session");

        // Step 2: Submit Query
        const queryResponse = await axios.post(
            `https://api.on-demand.io/chat/v1/sessions/${sessionId}/query`,
            {
                endpointId: 'predefined-openai-gpt4o',
                query: prompt,
                pluginIds: [],
                responseMode: 'sync'
            },
            {
                headers: {
                    'apikey': apiKey,
                    'Content-Type': 'application/json'
                }
            }
        );

        const aiResponse = queryResponse.data?.data?.answer || JSON.stringify(queryResponse.data);
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("AI did not return JSON");
        }

        const parsedData = JSON.parse(jsonMatch[0]);

        return sendSuccess(res, parsedData, 'Resume parsed with OnDemand AI');

    } catch (error: any) {
        console.error('OnDemand Parsing Error:', error.response?.data || error.message);
        return sendError(res, 500, 'Failed to process resume with AI', 'AI_ERROR');
    }
};

export const analyzeSkillGap = async (req: Request, res: Response) => {
    try {
        const { jobId } = req.body;
        const userId = req.user?._id;

        if (!jobId) return sendError(res, 400, 'Job ID is required');

        // 1. Fetch Job and Profile Data WITH Embeddings for Consistent Scoring
        const job = await Job.findById(jobId).select('+skillsEmbedding +experienceEmbedding +descriptionEmbedding title description requirements skills');
        const profile = await JobSeekerProfile.findOne({ userId }).select('+skillsEmbedding +experienceEmbedding +bioEmbedding skills experience projects personalInfo');

        if (!job) return sendError(res, 404, 'Job not found');
        if (!profile) return sendError(res, 404, 'Job Seeker Profile not found. Please complete your profile.');

        const apiKey = process.env.ONDEMAND_API_KEY;
        if (!apiKey) return sendError(res, 500, 'Server Config Error: API Key Missing');

        // 2. CALCULATE "TRUTH" SCORE (Anchor)
        // This logic mirrors recommendation.controller.ts exactly
        let calculatedScore = 0;
        let scoreBreakdown = { skills: 0, experience: 0, role: 0 };
        let debugMsg = "Embeddings Missing";

        if (job.skillsEmbedding && profile.skillsEmbedding) {
            const exactSkillScore = VectorService.cosineSimilarity(profile.skillsEmbedding, job.skillsEmbedding);
            const expScore = (profile.experienceEmbedding && job.experienceEmbedding)
                ? VectorService.cosineSimilarity(profile.experienceEmbedding, job.experienceEmbedding) : 0;
            const roleScore = (profile.bioEmbedding && job.descriptionEmbedding)
                ? VectorService.cosineSimilarity(profile.bioEmbedding, job.descriptionEmbedding) : 0;

            // Weights: Skills (50%), Experience (30%), Role (20%)
            // Ensure non-negative
            const wSkill = Math.max(0, exactSkillScore);
            const wExp = Math.max(0, expScore);
            const wRole = Math.max(0, roleScore);

            calculatedScore = (wSkill * 0.5) + (wExp * 0.3) + (wRole * 0.2);

            scoreBreakdown = {
                skills: Math.round(wSkill * 100),
                experience: Math.round(wExp * 100),
                role: Math.round(wRole * 100)
            };
            debugMsg = "Calculated via Vectors";
        }

        const finalPercentage = Math.round(Math.max(0, calculatedScore * 100));


        // 3. Prepare Context for AI
        const jobContext = `
        JOB TITLE: ${job.title}
        DESCRIPTION: ${job.description}
        REQUIREMENTS: ${job.requirements ? job.requirements.join('; ') : ''}
        DESIRED SKILLS: ${job.skills ? job.skills.join(', ') : ''}
        `;

        const profileContext = `
        CANDIDATE SKILLS: ${profile.skills ? profile.skills.join(', ') : ''}
        EXPERIENCE: ${profile.experience ? profile.experience.map((e: any) => `${e.role} at ${e.company} (${e.duration}): ${e.description}`).join('\n') : ''}
        PROJECTS: ${profile.projects ? profile.projects.map((p: any) => `${p.title}: ${p.description} [${p.technologies}]`).join('\n') : ''}
        BIO: ${profile.personalInfo?.bio || ''}
        `;

        // 4. Construct Prompt (ANCHORED MODE)
        const prompt = `
        You are a Technical Recruiter analyzing a candidate.
        
        SYSTEM DATA (TRUTH):
        The internal algorithm has calculated a verified Match Score of: **${finalPercentage}%**.
        Breakdown: Skills Match: ${scoreBreakdown.skills}%, Experience Match: ${scoreBreakdown.experience}%, Role/Bio Match: ${scoreBreakdown.role}%.

        YOUR TASK:
        1. **Accept the ${finalPercentage}% score as the absolute truth.** Do not calculate your own score.
        2. Explain WHY the score is ${finalPercentage}% (and not 100%).
        3. Identify the specific gaps (Missing Skills, Experience Mismatch, etc.) that account for the missing ${100 - finalPercentage}%.

        JOB DETAILS:
        ${jobContext.substring(0, 3000)}

        CANDIDATE PROFILE:
        ${profileContext.substring(0, 3000)}

        OUTPUT SCHEMA (JSON ONLY):
        {
          "score": ${finalPercentage},
          "analysis": "Two sentence summary explaining the ${finalPercentage}% fit.",
          "gapReasoning": "Explain the missing ${100 - finalPercentage}% (e.g. 'The system deducted points for lack of specific React experience...').",
          "missingSkills": [
             { "name": "Skill Name", "category": "Framework/Tool", "importance": "High/Medium" }
          ],
          "learningPath": [
             { "title": "Action Title", "description": "Specific resource.", "link": "https://www.google.com/search?q=Learn+Skill" }
          ]
        }
        `;

        // 5. Call OnDemand AI
        const sessionRes = await axios.post('https://api.on-demand.io/chat/v1/sessions',
            { externalUserId: userId, pluginIds: [] },
            { headers: { apikey: apiKey } }
        );
        const sessionId = sessionRes.data?.data?.id;

        const queryRes = await axios.post(`https://api.on-demand.io/chat/v1/sessions/${sessionId}/query`,
            {
                endpointId: 'predefined-openai-gpt4o',
                query: prompt,
                responseMode: 'sync'
            },
            { headers: { apikey: apiKey } }
        );

        const aiText = queryRes.data?.data?.answer;
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            console.error("AI Response:", aiText); // Debug
            return sendError(res, 500, 'AI failed to generate structural analysis');
        }

        const data = JSON.parse(jsonMatch[0]);
        // Force override score just in case AI disobeyed
        data.score = finalPercentage;

        return sendSuccess(res, data, 'Skill gap analysis complete');

    } catch (error: any) {
        console.error('Skill Gap Analysis Error:', error.response?.data || error.message);
        return sendError(res, 500, 'Failed to analyze skill gap');
    }
};

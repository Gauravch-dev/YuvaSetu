/**
 * Deterministic Resume Parser
 * - NO AI, NO paid APIs
 * - Regex-based section detection
 * - Confidence scoring
 * - Text normalization
 */

import * as pdfjs from 'pdfjs-dist';
import type { TextItem as PdfjsTextItem } from 'pdfjs-dist/types/src/display/api';
import type { OnboardingData, ParsingResult } from '@/contexts/OnboardingContext';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

// Expanded regex patterns for real-world synonyms
const SECTION_PATTERNS = {
    education: /^(education|academic background|academics|academic|qualifications|educational background)/im,
    experience: /^(experience|work history|professional experience|employment|work experience|professional background|employment history)/im,
    projects: /^(projects?|personal projects?|academic projects?|side projects?|portfolio)/im,
    skills: /^(skills?|technical skills?|technologies|tooling|tech stack|core competencies|expertise)/im,
    certifications: /^(certifications?|achievements?|awards?|licenses?|honors|accomplishments|credentials)/im,
};

// Contact info patterns
const EMAIL_PATTERN = /[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/;
const PHONE_PATTERN = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/;
const LINKEDIN_PATTERN = /linkedin\.com\/in\/[\w-]+/i;
const GITHUB_PATTERN = /github\.com\/[\w-]+/i;


import { API_BASE_URL } from './auth-api';

/**
 * Main parsing function
 */
export async function parseResumeFile(file: File): Promise<ParsingResult> {
    const warnings: string[] = [];
    let confidence = 0;
    const sectionsFound: string[] = [];

    try {
        // Extract text from PDF
        const text = await extractTextFromPdf(file);

        if (!text || text.length < 50) {
            return {
                data: {},
                confidence: 0,
                sectionsFound: [],
                warnings: ['Could not extract text from PDF. It may be image-based or encrypted.']
            };
        }

        // Normalize text
        const normalizedText = normalizeText(text);

        // Calculate base confidence from text quality
        confidence += calculateTextQualityScore(normalizedText);

        // Detect sections (for Regex fallback)
        const sections = detectSections(normalizedText);
        Object.entries(sections).forEach(([name, content]) => {
            if (content) sectionsFound.push(name);
        });

        // Run Deterministic Regex Parser (Baseline)
        const regexData = parseData(normalizedText, sections);

        let finalData = regexData;
        let usedAI = false;

        // --- ON-DEMAND AI OPTIMIZATION (HYBRID MERGE) ---
        try {
            const token = localStorage.getItem('authToken');
            if (token) {
                const aiResponse = await fetch(`${API_BASE_URL}/api/ondemand/parse-resume`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ text: normalizedText })
                });

                if (aiResponse.ok) {
                    const aiResData = await aiResponse.json();
                    if (aiResData.success && aiResData.data) {
                        const aiData = aiResData.data;
                        usedAI = true;


                        // HYBRID MERGE STRATEGY
                        // Helper to sanitize education years
                        const sanitizeEducation = (eduList: any[]) => {
                            return eduList.map(edu => {
                                let year = parseInt(edu.year);
                                if (isNaN(year)) {
                                    // Try to extract last 4 digit number (e.g. from "2020-2024")
                                    const matches = edu.year.toString().match(/(\d{4})/g);
                                    if (matches && matches.length > 0) {
                                        year = parseInt(matches[matches.length - 1]);
                                    } else {
                                        year = new Date().getFullYear(); // Default to current if completely unknown
                                    }
                                }
                                return { ...edu, year };
                            });
                        };

                        finalData = {
                            ...regexData,

                            // Prefer AI content for complex structures
                            experience: (aiData.experience && aiData.experience.length > 0) ? aiData.experience : regexData.experience,
                            projects: (aiData.projects && aiData.projects.length > 0) ? aiData.projects : regexData.projects,
                            education: (aiData.education && aiData.education.length > 0) ? sanitizeEducation(aiData.education) : regexData.education,
                            skills: (aiData.skills && aiData.skills.length > 0) ? aiData.skills : regexData.skills,

                            // Smart Personal Info Merge
                            personalInfo: {
                                ...regexData.personalInfo,
                                fullName: aiData.personalInfo?.fullName || regexData.personalInfo?.fullName || '',
                                bio: aiData.personalInfo?.bio || ''
                            }
                        };
                    }
                }
            }
        } catch (aiError) {
            console.warn("OnDemand AI Parsing failed, falling back to regex:", aiError);
            warnings.push("AI Parsing failed. Using standard parser.");
        }
        // ---------------------------------

        // Bonus for sections found
        confidence += Math.min(sectionsFound.length * 10, 40);
        if (usedAI) {
            confidence = 95;
            sectionsFound.push('AI Analyzed');
        }

        // Generate warnings
        if (sectionsFound.length < 3 && !usedAI) {
            warnings.push('Some sections could not be detected. Please review all fields.');
        }
        if (!finalData.personalInfo?.email) {
            warnings.push('Email not detected. Please enter manually.');
        }

        return {
            data: finalData,
            confidence: Math.min(confidence, 100),
            sectionsFound,
            warnings
        };

    } catch (error) {
        console.error('Resume parsing error:', error);
        return {
            data: {},
            confidence: 0,
            sectionsFound: [],
            warnings: ['Failed to parse resume. Please fill the form manually.']
        };
    }
}

/**
 * Extract raw text from PDF
 */
async function extractTextFromPdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    const allText: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        // Group text by Y position to preserve lines
        const lineMap = new Map<number, { x: number; text: string }[]>();

        for (const item of content.items) {
            const textItem = item as PdfjsTextItem;
            if (!textItem.str.trim()) continue;

            const y = Math.round(textItem.transform[5]);
            const x = textItem.transform[4];

            if (!lineMap.has(y)) {
                lineMap.set(y, []);
            }
            lineMap.get(y)!.push({ x, text: textItem.str });
        }

        // Sort by Y descending, X ascending
        const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);

        for (const y of sortedYs) {
            const lineItems = lineMap.get(y)!.sort((a, b) => a.x - b.x);
            const lineText = lineItems.map(item => item.text).join(' ').trim();
            if (lineText) {
                allText.push(lineText);
            }
        }
    }

    return allText.join('\n');
}

/**
 * Normalize text for consistent parsing
 */
function normalizeText(text: string): string {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\t/g, ' ')
        .replace(/ +/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/**
 * Calculate quality score from text characteristics
 */
function calculateTextQualityScore(text: string): number {
    let score = 0;

    // Text length
    if (text.length > 200) score += 10;
    if (text.length > 500) score += 10;
    if (text.length > 1000) score += 5;

    // Email found
    if (EMAIL_PATTERN.test(text)) score += 15;

    // Phone found
    if (PHONE_PATTERN.test(text)) score += 10;

    // LinkedIn/GitHub
    if (LINKEDIN_PATTERN.test(text)) score += 5;
    if (GITHUB_PATTERN.test(text)) score += 5;

    return score;
}

/**
 * Detect section boundaries
 */
function detectSections(text: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const lines = text.split('\n');

    const sectionPositions: { name: string; startIdx: number }[] = [];

    // Find section headers
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        for (const [sectionName, pattern] of Object.entries(SECTION_PATTERNS)) {
            if (pattern.test(line)) {
                sectionPositions.push({ name: sectionName, startIdx: i });
                break;
            }
        }
    }

    // Sort by position
    sectionPositions.sort((a, b) => a.startIdx - b.startIdx);

    // Extract content for each section
    for (let i = 0; i < sectionPositions.length; i++) {
        const start = sectionPositions[i].startIdx + 1;
        const end = sectionPositions[i + 1]?.startIdx ?? lines.length;
        sections[sectionPositions[i].name] = lines.slice(start, end).join('\n').trim();
    }

    return sections;
}

/**
 * Parse extracted text into form data
 */
function parseData(text: string, sections: Record<string, string>): Partial<OnboardingData> {
    const data: Partial<OnboardingData> = {};

    // Parse personal info from full text
    data.personalInfo = parsePersonalInfo(text);

    // Parse sections
    if (sections.education) {
        data.education = parseEducation(sections.education);
    }

    if (sections.experience) {
        data.experience = parseExperience(sections.experience);
    }

    if (sections.projects) {
        data.projects = parseProjects(sections.projects);
    }

    if (sections.certifications) {
        data.certifications = parseCertifications(sections.certifications);
    }

    if (sections.skills) {
        data.skills = parseSkills(sections.skills);
    }

    return data;
}

function parsePersonalInfo(text: string): OnboardingData['personalInfo'] {
    const lines = text.split('\n');

    // Name is typically the first substantial line
    let fullName = '';
    for (const line of lines.slice(0, 5)) {
        const trimmed = line.trim();
        if (trimmed.length > 2 && trimmed.length < 50 && /^[A-Z][a-zA-Z\s]+$/.test(trimmed)) {
            fullName = trimmed;
            break;
        }
    }

    const emailMatch = text.match(EMAIL_PATTERN);
    const phoneMatch = text.match(PHONE_PATTERN);
    const linkedinMatch = text.match(LINKEDIN_PATTERN);
    const githubMatch = text.match(GITHUB_PATTERN);

    return {
        fullName,
        email: emailMatch?.[0] || '',
        phone: phoneMatch?.[0]?.replace(/\s+/g, '') || '',
        linkedin: linkedinMatch ? 'https://' + linkedinMatch[0] : '',
        github: githubMatch ? 'https://' + githubMatch[0] : '',
    };
}

function parseEducation(text: string): OnboardingData['education'] {
    const education: OnboardingData['education'] = [];
    const lines = text.split('\n').filter(l => l.trim());

    let current: OnboardingData['education'][0] | null = null;

    for (const line of lines) {
        // Institution line
        if (/university|institute|college|school|academy/i.test(line)) {
            if (current) education.push(current);
            current = { id: crypto.randomUUID(), institution: line.trim(), degree: '', year: '', score: '' };
        }
        // Degree line  
        else if (current && /bachelor|master|b\.?tech|m\.?tech|b\.?e|ph\.?d|mba|bca|mca/i.test(line)) {
            const yearMatch = line.match(/20\d{2}/);
            const scoreMatch = line.match(/(?:cgpa|gpa|sgpi)[\s:]*(\d+\.?\d*)/i);

            current.degree = line.replace(/20\d{2}.*/, '').trim();
            if (yearMatch) current.year = yearMatch[0];
            if (scoreMatch) current.score = scoreMatch[0];
        }
    }

    if (current) education.push(current);
    return education.slice(0, 2);
}

function parseExperience(text: string): OnboardingData['experience'] {
    const experience: OnboardingData['experience'] = [];
    const lines = text.split('\n').filter(l => l.trim());

    let current: OnboardingData['experience'][0] | null = null;
    let descriptions: string[] = [];
    let lineAfterRole = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const hasRole = /intern|developer|engineer|lead|manager|analyst|designer|consultant|head|associate|trainee/i.test(line);
        const hasDate = /20\d{2}|present|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(line);
        const isBullet = /^[•\-▪◦]/.test(line.trim());

        if (hasRole && hasDate && !isBullet) {
            // Save previous entry
            if (current) {
                current.description = descriptions.filter(d => d).join(' • ');
                experience.push(current);
            }

            const dateMatch = line.match(/((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}\s*[-–]\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|present)[a-z]*\.?\s*\d{0,4})/i);

            current = {
                id: crypto.randomUUID(),
                role: dateMatch ? line.replace(dateMatch[0], '').replace(/[|]/g, ' ').trim() : line.replace(/[|]/g, ' ').trim(),
                company: '',
                duration: dateMatch?.[1] || '',
                description: ''
            };
            descriptions = [];
            lineAfterRole = true;
        }
        // The line immediately after a role line is usually the company
        else if (current && lineAfterRole && !isBullet && line.trim().length > 2) {
            current.company = line.replace(/[|]/g, ' ').trim();
            lineAfterRole = false;
        }
        else if (current && isBullet) {
            const cleanBullet = line.replace(/^[•\-▪◦]\s*/, '').trim();
            if (cleanBullet.length > 5) {
                descriptions.push(cleanBullet);
            }
            lineAfterRole = false;
        }
        // Action verb lines (Developed, Implemented, etc.)
        else if (current && /^[A-Z][a-z]+ed\s/i.test(line.trim())) {
            descriptions.push(line.trim());
            lineAfterRole = false;
        }
    }

    if (current) {
        current.description = descriptions.filter(d => d).join(' • ');
        experience.push(current);
    }

    return experience.slice(0, 3);
}

function parseProjects(text: string): OnboardingData['projects'] {
    const projects: OnboardingData['projects'] = [];
    const lines = text.split('\n').filter(l => l.trim());

    let current: OnboardingData['projects'][0] | null = null;
    let descriptions: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Project Header Detection based on the screenshot format:
        // "Cloud-Native AI Recommendation Engine | AWS, K8s... | GitHub Dec 2025"
        // Features: Contains pipe "|", contains date, contains technical keywords
        const hasPipe = line.includes('|');
        const hasDate = /20\d{2}|dec|jul|jan|feb|mar|apr|may|jun|aug|sep|oct|nov|dec/i.test(line);
        const isBullet = /^[•\-▪◦]/.test(line);

        if (!isBullet && (hasPipe || (hasDate && line.length > 20))) {
            // Save previous
            if (current) {
                current.description = descriptions.filter(d => d).join('\n');
                projects.push(current);
            }

            const parts = line.split('|').map(p => p.trim());

            let title = parts[0];
            let techStack = '';
            let link = '';

            // Try to find parts by content logic
            for (let j = 1; j < parts.length; j++) {
                const part = parts[j];

                // Link part
                if (/github\.com|github/i.test(part)) {
                    const urlMatch = part.match(/github\.com\/[\w-]+\/[\w-]+/i);
                    if (urlMatch) {
                        link = 'https://' + urlMatch[0];
                    }

                    // If we found a date in this part, assume tech was the middle one
                    if (!techStack && parts.length === 3) {
                        techStack = parts[1];
                    }
                }
                // Tech part
                else if (/,/.test(part) || /aws|react|node|python|java|docker/i.test(part)) {
                    techStack = part;
                }
            }

            // Default fallback if logic didn't find specific parts
            if (parts.length >= 2 && !techStack) {
                techStack = parts[1];
            }

            // Cleanup
            title = title.replace(/\s+\|.*$/, '').trim();
            techStack = techStack.replace(/20\d{2}|dec|jul|jan|feb|mar|apr|may|jun|aug|sep|oct|nov|dec/gi, '').trim();

            // Fallback extraction
            if (!link) {
                const simpleLinkMatch = line.match(/github\.com\/[\w-]+\/[\w-]+/i);
                if (simpleLinkMatch) link = 'https://' + simpleLinkMatch[0];
            }

            current = {
                id: crypto.randomUUID(),
                title: title,
                description: '',
                technologies: techStack.replace(/^\|/, '').replace(/\|$/, '').trim(),
                link: link
            };

            descriptions = [];
        } else if (current && (isBullet || /^[A-Z][a-z]+:/.test(line))) {
            const cleanDesc = line.replace(/^[•\-▪◦]\s*/, '').trim();
            if (cleanDesc.length > 5) {
                descriptions.push(cleanDesc);
            }
        }
    }

    if (current) {
        current.description = descriptions.filter(d => d).join('\n');
        projects.push(current);
    }

    return projects.slice(0, 3);
}

function parseCertifications(text: string): OnboardingData['certifications'] {
    const certs: OnboardingData['certifications'] = [];
    const lines = text.split('\n').filter(l => l.trim());

    for (const line of lines) {
        const clean = line.replace(/^[•●◦▪○]\s*/, '').trim();
        if (clean.length < 5) continue;

        const yearMatch = clean.match(/20\d{2}/);

        // Try to extract issuer from common patterns
        let issuer = '';
        let title = clean;

        // Pattern: "Cert Name - Issuer" or "Cert Name | Issuer"
        const separatorMatch = clean.match(/(.+?)\s*[-–|]\s*(.+?)(?:\s*\(?20\d{2}\)?)?$/);
        if (separatorMatch) {
            title = separatorMatch[1].trim();
            issuer = separatorMatch[2].replace(/20\d{2}/g, '').replace(/[()]/g, '').trim();
        }
        // Known issuers
        else if (/oracle/i.test(clean)) issuer = 'Oracle';
        else if (/aws|amazon/i.test(clean)) issuer = 'AWS';
        else if (/google/i.test(clean)) issuer = 'Google';
        else if (/microsoft|azure/i.test(clean)) issuer = 'Microsoft';
        else if (/smart india hackathon|sih/i.test(clean)) issuer = 'Smart India Hackathon';
        else if (/coursera/i.test(clean)) issuer = 'Coursera';
        else if (/udemy/i.test(clean)) issuer = 'Udemy';
        else if (/linkedin/i.test(clean)) issuer = 'LinkedIn Learning';

        // Clean title
        title = title.replace(/20\d{2}/g, '').replace(/[()]/g, '').trim();

        certs.push({
            id: crypto.randomUUID(),
            title,
            issuer,
            year: yearMatch?.[0] || ''
        });
    }

    return certs.slice(0, 5);
}

function parseSkills(text: string): string[] {
    const skills: string[] = [];
    const lines = text.split('\n').filter(l => l.trim());

    // Common noise words to ignore in skills
    const ignoreList = ['skills', 'technologies', 'technical', 'competencies', 'languages', 'frameworks', 'tools', 'databases', 'proficient'];

    for (const line of lines) {
        // Skip lines that are just headers
        if (ignoreList.some(w => line.toLowerCase() === w)) continue;

        // Split by common delimiters
        const colonIdx = line.indexOf(':');
        const content = colonIdx > -1 ? line.substring(colonIdx + 1) : line;

        // Split by comma, pipe, or bullet
        const items = content.split(/[,|•●◦▪]/).map(s => s.trim()).filter(s => s);

        for (const item of items) {
            // Clean up item
            const clean = item.replace(/[\(\[\{].*?[\)\]\}]/g, '') // Remove (Details)
                .replace(/^[•\-]\s*/, '')            // Remove leading bullets
                .trim();

            // Validate skill length and content
            if (clean.length > 2 && clean.length < 30 && !ignoreList.includes(clean.toLowerCase())) {
                skills.push(clean);
            }
        }
    }

    // Return unique skills, limited to 20
    return [...new Set(skills)].slice(0, 20);
}

export default parseResumeFile;

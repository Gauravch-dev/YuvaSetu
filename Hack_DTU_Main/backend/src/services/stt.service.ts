import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Ensure env vars are loaded
dotenv.config({ path: path.join(__dirname, '../../.env') });

const geminiKey = process.env.GEMINI_API_KEY;

if (!geminiKey) {
    console.error("❌ GEMINI_API_KEY is missing in .env");
}

const genAI = new GoogleGenerativeAI(geminiKey || "");

/**
 * Transcribes audio using Google Gemini 1.5 Flash
 */
// Helper for OpenRouter Fallback
async function transcribeWithOpenRouter(audioBase64: string, mimeType: string, language: string): Promise<string> {
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
        throw new Error("Missing OpenRouter Key for fallback");
    }

    console.log("⚠️ Switching to OpenRouter (Gemini Flash) for transcription...");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://yuvasetu.com",
            "X-Title": "YuvaSetu Voice Genie"
        },
        body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: `Transcribe this audio exactly as spoken. The language is likely ${language}. Return ONLY the transcript text, no other commentary.` },
                        {
                            type: "image_url", // OpenRouter standard for multimodal input
                            image_url: {
                                url: `data:${mimeType};base64,${audioBase64}`
                            }
                        }
                    ]
                }
            ]
        })
    });
    
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenRouter API Error: ${response.status} ${errText}`);
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || "";
}

/**
 * Transcribes audio using Google Gemini 1.5 Flash (with OpenRouter Fallback)
 */
export async function transcribeAudio(filePath: string, language: string = 'en-US'): Promise<string> {
    let audioBase64 = '';
    let mimeType = ''; // Needed for OpenRouter
    
    try {
        const audioFile = fs.readFileSync(filePath);
        audioBase64 = audioFile.toString('base64');
        mimeType = filePath.endsWith('.wav') ? 'audio/wav' : 'audio/webm';

        if (!geminiKey) throw new Error("Missing Gemini API Key");

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: mimeType,
                    data: audioBase64
                }
            },
            { text: `Transcribe this audio exactly as spoken. The language is likely ${language}. Return ONLY the transcript text, no other commentary.` }
        ]);

        const response = await result.response;
        return response.text().trim();

    } catch (error) {
        console.error("Gemini Transcription Failed, attempting OpenRouter Fallback:", error);
        
        // Fallback to OpenRouter
        try {
            return await transcribeWithOpenRouter(audioBase64, mimeType, language);
        } catch (fallbackError) {
            console.error("OpenRouter Fallback Failed:", fallbackError);
            throw error;
        }
    }
}

/**
 * Uses Gemini to parse unstructured voice context into structured Profile Data
 */
export async function structureProfileData(voiceContext: any): Promise<any> {
    if (!geminiKey) {
        throw new Error("Missing Gemini API Key");
    }

    try {
        // Use a model optimized for JSON structure if available, or Flash with strict prompt
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });

        const prompt = `
        You are a smart data extraction assistant.
        I have collected the following unstructured data from a voice interview:
        ${JSON.stringify(voiceContext, null, 2)}

        Please extract and structure this into a JSON object that matches the following TypeScript interface:

        interface OnboardingData {
          personalInfo: {
            fullName: string;
            email: string;
            phone: string;
            age?: string;
            languages?: string; // Comma separated
          };
          education: Array<{
            institution: string;
            degree: string;
            year: string; // approximate if not mentioned, default to current year
          }>;
          skills: string[];
        }

        Rules:
        0. If ANY input data is in Hindi or another language, TRANSLATE it to English first. The final output must be in English.
        1. Fix any typos in names, degrees, or skills if obvious context exists (e.g. "btech" -> "B.Tech").
        2. Split "languages" string into a clean comma-separated string if multiple.
        3. For education:
           - Try to extract "institution" and "degree" separately.
           - If user said "I am doing BTech in IT from IIT Bombay", institution="IIT Bombay", degree="B.Tech IT".
           - Use "2024" (or current year) for year if not specified.
        4. Return ONLY the JSON object.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const jsonString = response.text();
        
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Gemini Structuring Error:", error);
        // Fallback to raw data if parsing fails
        return {
            personalInfo: {
                fullName: voiceContext.name,
                email: voiceContext.email,
                phone: voiceContext.phone,
                age: voiceContext.age,
                languages: voiceContext.languages
            },
            skills: voiceContext.skills || [],
            education: [{
                degree: voiceContext.education,
                institution: '',
                year: new Date().getFullYear().toString()
            }]
        };
    }
}



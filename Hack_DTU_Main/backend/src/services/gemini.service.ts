import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';

// Load env (safeguard)
dotenv.config({ path: path.join(__dirname, '../../.env') });

const apiKey = process.env.GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: "text-embedding-004" });
} else {
    console.warn("WARNING: GEMINI_API_KEY is missing. Embeddings will not be generated.");
}

export const generateEmbedding = async (text: string): Promise<number[] | null> => {
    if (!model) return null;
    if (!text || text.trim().length === 0) return null;

    try {
        const result = await model.embedContent(text);
        const embedding = result.embedding;
        return embedding.values;
    } catch (error) {
        console.error("Gemini Embedding Error:", error);
        return null;
    }
};

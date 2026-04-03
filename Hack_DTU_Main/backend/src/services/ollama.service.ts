import axios from 'axios';

export class OllamaService {
    private static OLLAMA_URL = 'http://localhost:11434/api/generate';

    static async summarizeProject(description: string, readme: string): Promise<string> {
        if (!readme || readme.trim().length === 0) {
            return description || "No detailed description available.";
        }

        const prompt = `You are a technical recruiter. Analyze the following GitHub README and project description.
Write a 2-sentence professional executive summary explaining what this project does and the primary technology stack used.
Keep it strictly technical, concise, and focused on the value the project provides. Do not use conversational filler like "This project is...". Start directly.

Description: ${description}
README snippet: ${readme.substring(0, 3000)}

Summary:`;

        try {
            const response = await axios.post(this.OLLAMA_URL, {
                model: 'llama3', // or mistral
                prompt: prompt,
                stream: false
            });

            return response.data?.response?.trim() || description;
        } catch (error) {
            console.error("Local Ollama Summarization failed. Make sure Ollama is running.", error);
            return description || "Summary unavailable.";
        }
    }
}

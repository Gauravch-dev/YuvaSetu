
interface IVectorDocument {
    id: string;
    vector: number[];
}

export class VectorService {
    /**
     * Calculates the Cosine Similarity between two vectors.
     * Formula: (A . B) / (||A|| * ||B||)
     * Range: -1 to 1 (1 means identical direction)
     */
    public static cosineSimilarity(vecA: number[], vecB: number[]): number {
        if (vecA.length !== vecB.length) {
            throw new Error("Vector dimensions must match");
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        if (normA === 0 || normB === 0) return 0;

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Finds the nearest neighbors for a target vector from a pool of candidates.
     * Uses In-Memory Linear Scan (O(N)).
     * @param targetVector The query vector (e.g., resume embedding)
     * @param candidates items to search against (e.g., job postings)
     * @param k Number of results to return
     * @returns Top K items sorted by similarity score (descending)
     */
    public static findNearestNeighbors<T extends { _id: any, [key: string]: any }>(
        targetVector: number[],
        candidates: (T & { embedding?: number[] | null })[], // Generic T that might have embedding
        k: number = 5,
        targetField: string = 'embedding' // dynamic field name (resumeEmbedding vs embedding)
    ): { item: T; score: number }[] {

        if (!targetVector || targetVector.length === 0) {
            console.error("VectorService: Target vector is empty");
            return [];
        }

        const scores = candidates.map(item => {
            // Safe Access for dynamic field
            const vector = (item as any)[targetField];

            if (!vector || !Array.isArray(vector) || vector.length === 0) {
                return { item, score: -1 };
            }

            try {
                const score = this.cosineSimilarity(targetVector, vector);
                return { item, score };
            } catch (e) {
                console.warn(`VectorService Error for item ${item._id}:`, e);
                return { item, score: -1 };
            }
        });

        // Filter valid scores and Sort Descending
        return scores
            .filter(result => result.score > -1)
            .sort((a, b) => b.score - a.score)
            .slice(0, k);
    }
}

// services/SimilaritySearchService.ts
import { DocumentEmbedding, SearchOptions, SearchResult } from '../types/DocumentTypes';

export class SimilaritySearchService {
  async searchSimilarChunks(
    query: string, 
    documentEmbeddings: DocumentEmbedding[], 
    apiClient: any,
    embeddingService: any,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const { topK = 5, threshold = 0.7, includeMetadata = true } = options;
    
    console.log(`🔍 Searching for: "${query}"`);
    
    const queryEmbedding = await embeddingService.getEmbedding(query, apiClient);
    const similarities: Omit<SearchResult, 'rank'>[] = [];
    
    for (const docEmbedding of documentEmbeddings) {
      for (const chunk of docEmbedding.chunks) {
        if (chunk.embedding) {
          const similarity = this.cosineSimilarity(queryEmbedding, chunk.embedding);
          
          if (similarity >= threshold) {
            similarities.push({
              chunk,
              score: similarity,
              documentId: docEmbedding.documentId,
              fileName: includeMetadata ? docEmbedding.metadata.fileName : undefined,
            });
          }
        }
      }
    }
    
    const results = similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));
    
    console.log(`📋 Found ${results.length} relevant chunks (threshold: ${threshold})`);
    return results;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vector dimensions must match');
    }
    
    const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }
    
    return Math.max(-1, Math.min(1, dotProduct / (magnitudeA * magnitudeB)));
  }
}
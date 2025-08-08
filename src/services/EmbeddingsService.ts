// services/EmbeddingService.ts
import { EmbeddingConfig } from '../types/DocumentTypes';

export class EmbeddingService {
  private config: EmbeddingConfig = {
    apiKey: '',
    model: 'text-embedding-3-small',
    maxTokens: 8000,
    batchSize: 10,
  };

  setConfig(config: Partial<EmbeddingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  async getEmbedding(text: string, apiClient: any): Promise<number[]> {
    console.log(`📤 Sending text to backend: ${text.length} chars`);
    
    const response = await apiClient.post('/api/embeddings/generate', {
      texts: [text]
    });

    console.log(`📥 Received embedding: ${response.embeddings[0].length} dimensions`);
    return response.embeddings[0];
  }

  async generateBatchEmbeddings(
    chunks: string[], 
    apiClient: any,
    onProgress?: (completed: number, total: number) => void
  ): Promise<number[][]> {
    const batchSize = this.config.batchSize;
    const allEmbeddings: number[][] = [];

    console.log(`🚀 Starting batch embedding: ${chunks.length} chunks in batches of ${batchSize}`);

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(chunks.length/batchSize)}`);
      
      const response = await apiClient.post('/api/embeddings/generate', {
        texts: batch
      });

      console.log(`✅ Batch ${Math.floor(i/batchSize) + 1} completed: ${response.embeddings.length} embeddings`);
      
      allEmbeddings.push(...response.embeddings);
      onProgress?.(Math.min(i + batchSize, chunks.length), chunks.length);
    }

    console.log(`🎉 All batches completed: ${allEmbeddings.length} total embeddings`);
    return allEmbeddings;
  }

  getStats(): { model: string; dimensions: number; maxTokens: number } {
    const dimensions = this.config.model === 'text-embedding-3-large' ? 3072 : 1536;
    return {
      model: this.config.model,
      dimensions,
      maxTokens: this.config.maxTokens,
    };
  }
}
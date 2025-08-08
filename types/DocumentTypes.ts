// types/DocumentTypes.ts
export interface EmbeddingChunk {
    content: string;
    index: number;
    embedding?: number[];
    wordCount: number;
    charCount: number;
  }
  
  export interface DocumentEmbedding {
    documentId: string;
    chunks: EmbeddingChunk[];
    metadata: DocumentMetadata;
  }
  
  export interface DocumentMetadata {
    fileName: string;
    fileType: string;
    totalChunks: number;
    chunkSize: number;
    processedAt: string;
    totalCharacters: number;
    avgChunkSize: number;
    embeddingModel: string;
  }
  
  export interface EmbeddingConfig {
    apiKey: string;
    model: 'text-embedding-3-small' | 'text-embedding-3-large';
    maxTokens: number;
    batchSize: number;
  }
  
  export interface SearchOptions {
    topK?: number;
    threshold?: number;
    includeMetadata?: boolean;
  }
  
  export interface SearchResult {
    chunk: EmbeddingChunk;
    score: number;
    documentId: string;
    fileName?: string;
    rank: number;
  }
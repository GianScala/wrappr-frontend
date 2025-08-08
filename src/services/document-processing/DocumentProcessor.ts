// services/DocumentProcessor.ts (Main orchestrator)
import { DocumentEmbedding, DocumentMetadata } from '../../../types/DocumentTypes';
import { ContentExtractor } from './extractors/ContentExtractor';
import { ContentCleaner } from './processors/ContentCleaner';
import { TextChunker } from './processors/TextChunker';
import { EmbeddingService } from '../EmbeddingsService';
import { SimilaritySearchService } from '../SimilaritySearchService';
import * as DocumentPicker from 'expo-document-picker';

export class DocumentProcessor {
  private contentExtractor = new ContentExtractor('http://192.168.0.19:8000');
  private contentCleaner = new ContentCleaner();
  private textChunker = new TextChunker();
  private embeddingService = new EmbeddingService();
  private searchService = new SimilaritySearchService();

  // Backward compatibility methods
  async extractContent(file: DocumentPicker.DocumentPickerAsset): Promise<string> {
    return this.contentExtractor.extractContent(file);
  }

  async cleanContent(rawContent: string): Promise<string> {
    return this.contentCleaner.cleanContent(rawContent);
  }

  async generateEmbeddings(content: string, documentId: string, fileName: string, apiClient: any, onProgress?: any) {
    const cleanedContent = await this.contentCleaner.cleanContent(content);
    const chunks = this.textChunker.createSemanticChunks(cleanedContent);
    const embeddings = await this.embeddingService.generateBatchEmbeddings(chunks, apiClient, onProgress);
    const embeddingChunks = this.textChunker.createEmbeddingChunks(chunks, embeddings);
    
    const metadata = {
      fileName,
      fileType: this.contentExtractor.getFileTypeFromName(fileName),
      totalChunks: chunks.length,
      chunkSize: 300,
      processedAt: new Date().toISOString(),
      totalCharacters: content.length,
      avgChunkSize: Math.round(embeddingChunks.reduce((sum, chunk) => sum + chunk.charCount, 0) / embeddingChunks.length),
      embeddingModel: this.embeddingService.getStats().model,
    };

    return { documentId, chunks: embeddingChunks, metadata };
  }

  async processDocument(
    file: DocumentPicker.DocumentPickerAsset,
    documentId: string,
    apiClient: any,
    onProgress?: (completed: number, total: number) => void
  ): Promise<DocumentEmbedding> {
    console.log(`🧠 Processing document: ${file.name}`);
    
    // Extract and clean content
    const rawContent = await this.contentExtractor.extractContent(file);
    const cleanedContent = await this.contentCleaner.cleanContent(rawContent);
    
    // Create chunks and generate embeddings
    const chunks = this.textChunker.createSemanticChunks(cleanedContent);
    console.log(`📊 Created ${chunks.length} semantic chunks`);
    
    if (chunks.length === 0) {
      throw new Error('No valid chunks created from document content');
    }
    
    const embeddings = await this.embeddingService.generateBatchEmbeddings(
      chunks, 
      apiClient, 
      onProgress
    );
    
    const embeddingChunks = this.textChunker.createEmbeddingChunks(chunks, embeddings);
    
    // Create metadata
    const metadata: DocumentMetadata = {
      fileName: file.name,
      fileType: this.contentExtractor.getFileTypeFromName(file.name),
      totalChunks: chunks.length,
      chunkSize: 300, // Move to config
      processedAt: new Date().toISOString(),
      totalCharacters: cleanedContent.length,
      avgChunkSize: Math.round(embeddingChunks.reduce((sum, chunk) => sum + chunk.charCount, 0) / embeddingChunks.length),
      embeddingModel: this.embeddingService.getStats().model,
    };

    const documentEmbedding: DocumentEmbedding = {
      documentId,
      chunks: embeddingChunks,
      metadata,
    };

    console.log(`✅ Document processed successfully`);
    return documentEmbedding;
  }

  // Delegate search to search service
  async searchDocuments(query: string, documents: DocumentEmbedding[], apiClient: any, options = {}) {
    return this.searchService.searchSimilarChunks(
      query, 
      documents, 
      apiClient, 
      this.embeddingService, 
      options
    );
  }

  // Configuration methods
  setEmbeddingConfig(config: any): void {
    this.embeddingService.setConfig(config);
  }

  getEmbeddingStats() {
    return this.embeddingService.getStats();
  }
}
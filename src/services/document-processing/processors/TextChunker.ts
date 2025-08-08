// processors/TextChunker.ts
import { EmbeddingChunk } from '../../../types/DocumentTypes';

export class TextChunker {
  private readonly CHUNK_SIZE = 300;
  private readonly CHUNK_OVERLAP = 100;
  private readonly MIN_CHUNK_SIZE = 100;
  private readonly MAX_CHUNK_SIZE = 1200;

  createSemanticChunks(content: string): string[] {
    const chunks: string[] = [];
    const paragraphs = content.split(/\n\s*\n/);
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      const sentences = paragraph
        .split(/(?<=[.!?])\s+/)
        .filter(s => s.trim().length > 0);
      
      for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (!trimmed) continue;
        
        const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + trimmed;
        
        if (potentialChunk.length > this.CHUNK_SIZE && currentChunk.length >= this.MIN_CHUNK_SIZE) {
          chunks.push(currentChunk.trim());
          
          const words = currentChunk.split(/\s+/);
          const overlapWordCount = Math.floor(this.CHUNK_OVERLAP / 5);
          const overlap = words.slice(-Math.min(overlapWordCount, words.length)).join(' ');
          
          currentChunk = overlap + (overlap ? ' ' : '') + trimmed;
        } else if (potentialChunk.length <= this.MAX_CHUNK_SIZE) {
          currentChunk = potentialChunk;
        } else {
          if (currentChunk.length >= this.MIN_CHUNK_SIZE) {
            chunks.push(currentChunk.trim());
            currentChunk = trimmed;
          } else {
            currentChunk = potentialChunk;
          }
        }
      }
      
      if (currentChunk && paragraph !== paragraphs[paragraphs.length - 1]) {
        currentChunk += '\n';
      }
    }
    
    if (currentChunk.trim() && currentChunk.length >= this.MIN_CHUNK_SIZE) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.filter(chunk => chunk.length >= this.MIN_CHUNK_SIZE);
  }

  createEmbeddingChunks(chunks: string[], embeddings: number[][]): EmbeddingChunk[] {
    return chunks.map((chunk, index) => ({
      content: chunk,
      index,
      embedding: embeddings[index],
      wordCount: chunk.split(/\s+/).length,
      charCount: chunk.length,
    }));
  }
}
// hooks/useDocumentManager.ts
import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FirebaseStorage } from '../../src/services/FirebaseStorage';

export interface Document {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  type: string;
  url: string;
  status: 'processing' | 'ready' | 'error';
  hasEmbeddings: boolean;
  content?: string;
}

interface UseDocumentManagerProps {
  onDocumentsLoaded?: (documents: Document[]) => void;
  onDocumentDeleted?: (docId: string) => void;
}

export const useDocumentManager = ({
  onDocumentsLoaded,
  onDocumentDeleted
}: UseDocumentManagerProps = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Memoize storage instance
  const firebaseStorage = useMemo(() => new FirebaseStorage(), []);
  
  const loadDocuments = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    
        try {
        console.log(`📚 Loading documents for user: ${user.uid}`);
        const folders = await firebaseStorage.listFolders(`database/${user.uid}`);
    
        const docs = await Promise.all(
            folders.map(async folder => {
            try {
                const files = await firebaseStorage.listFiles(`database/${user.uid}/${folder.name}`);
                
                // Try to get original name from metadata first
                let originalName = '';
                let documentMeta = null;
                
                // 1. Try metadata file first
                const metadataFile = files.find(f => f.name.includes('_metadata.json'));
                if (metadataFile) {
                try {
                    const metaContent = await firebaseStorage.getTextContent(metadataFile.path);
                    documentMeta = JSON.parse(metaContent);
                    originalName = documentMeta.originalFileName;
                    console.log(`📋 Found metadata for ${folder.name}: ${originalName}`);
                } catch (e) {
                    console.log(`⚠️ Failed to read metadata for ${folder.name}`);
                }
                }
                
                // 2. Try embeddings file if no metadata
                if (!originalName) {
                const embeddingsFile = files.find(f => f.name.includes('_embeddings.json'));
                if (embeddingsFile) {
                    try {
                    const embContent = await firebaseStorage.getTextContent(embeddingsFile.path);
                    const embData = JSON.parse(embContent);
                    originalName = embData.metadata?.originalFileName || embData.metadata?.displayName || embData.metadata?.fileName;
                    console.log(`🧠 Found name in embeddings for ${folder.name}: ${originalName}`);
                    } catch (e) {
                    console.log(`⚠️ Failed to read embeddings metadata for ${folder.name}`);
                    }
                }
                }
                
                // 3. Fallback to file name cleaning
                const original = files.find(f => !f.name.includes('_embeddings') && !f.name.includes('_content') && !f.name.includes('_metadata'));
                if (!original) return null;
    
                if (!originalName) {
                // Clean the stored filename as fallback
                originalName = original.name;
                const cleanMatch = originalName.match(/^\d+_[a-z0-9]+_(.+)$/);
                if (cleanMatch) {
                    originalName = cleanMatch[1];
                }
                console.log(`🧹 Cleaned filename for ${folder.name}: ${originalName}`);
                }
    
                const meta = await firebaseStorage.getFileMetadata(original.path);
                const url = await firebaseStorage.getDownloadUrl(original.path);
    
                return {
                id: folder.name,
                name: originalName, // Use original name
                size: documentMeta?.fileSize || meta.size,
                uploadedAt: documentMeta?.uploadedAt || meta.timeCreated,
                type: documentMeta?.mimeType || meta.contentType || 'text/plain',
                url,
                status: (documentMeta?.status || 'ready') as const,
                hasEmbeddings: files.some(f => f.name.includes('_embeddings')),
                };
            } catch (e) {
                console.error(`Failed to load folder ${folder.name}:`, e);
                return null;
            }
            })
        );
    
        const valid = docs
            .filter((d): d is Document => d !== null)
            .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    
        console.log(`✅ Loaded ${valid.length} documents with original names`);
        onDocumentsLoaded?.(valid);
        } catch (e) {
        console.error('❌ Load documents error:', e);
        onDocumentsLoaded?.([]);
        } finally {
        setIsLoading(false);
        }
    }, [user?.uid, onDocumentsLoaded, firebaseStorage]);

  const deleteDocument = useCallback(async (docId: string) => {
    if (!user?.uid) return;
    try {
      console.log(`🗑️ Deleting document: ${docId}`);
      await firebaseStorage.deleteFolder(`database/${user.uid}/${docId}`);
      console.log(`✅ Document deleted: ${docId}`);
      onDocumentDeleted?.(docId);
    } catch (e) {
      console.error('❌ Delete document error:', e);
      throw e;
    }
  }, [user?.uid, onDocumentDeleted, firebaseStorage]);

  const getDocumentEmbeddings = useCallback(async (docId: string) => {
    if (!user?.uid) return null;
    try {
      console.log(`🧠 [getDocumentEmbeddings] Loading embeddings for document: ${docId}`);
      const embeddingPath = `database/${user.uid}/${docId}/${docId}_embeddings.json`;
      console.log(`🧠 [getDocumentEmbeddings] Fetching from path: ${embeddingPath}`);
      
      const raw = await firebaseStorage.getTextContent(embeddingPath);
      console.log(`🧠 [getDocumentEmbeddings] Raw embeddings data length: ${raw.length} characters`);
      console.log(`🧠 [getDocumentEmbeddings] Raw data preview (first 200 chars): ${raw.substring(0, 200)}`);
      
      const parsed = JSON.parse(raw);
      console.log(`🧠 [getDocumentEmbeddings] Parsed embeddings structure:`, {
        type: typeof parsed,
        isArray: Array.isArray(parsed),
        keys: Object.keys(parsed),
        chunksCount: parsed.chunks?.length || 'N/A',
        metadata: parsed.metadata || 'No metadata',
        hasEmbeddings: !!parsed.embeddings,
        embeddingsType: typeof parsed.embeddings,
        embeddingsLength: parsed.embeddings?.length || 'N/A'
      });
      
      // Log first chunk details if available
      if (parsed.chunks && parsed.chunks.length > 0) {
        console.log(`🧠 [getDocumentEmbeddings] First chunk preview:`, {
          content: parsed.chunks[0].content?.substring(0, 100) + '...',
          embedding: parsed.chunks[0].embedding ? `[${parsed.chunks[0].embedding.length} dimensions]` : 'No embedding',
          metadata: parsed.chunks[0].metadata || 'No metadata'
        });
      }
      
      return parsed;
    } catch (e) {
      console.error(`❌ [getDocumentEmbeddings] Failed to load embeddings for ${docId}:`, e);
      return null;
    }
  }, [user?.uid, firebaseStorage]);



  const getDocumentContent = useCallback(async (docId: string) => {
    if (!user?.uid) throw new Error('Not authenticated');
    try {
      console.log(`📄 [getDocumentContent] Loading content for document: ${docId}`);
      const folder = `database/${user.uid}/${docId}`;
      const files = await firebaseStorage.listFiles(folder);
      
      // Find original file (not _embeddings, _content, or _metadata)
      const original = files.find(f => 
        !f.name.includes('_embeddings') && 
        !f.name.includes('_content') && 
        !f.name.includes('_metadata')
      );
      
      if (!original) throw new Error('Original file not found');
  
      const meta = await firebaseStorage.getFileMetadata(original.path);
      const mime = meta.contentType || '';
      
      console.log(`📄 [getDocumentContent] File metadata:`, {
        name: original.name,
        contentType: mime,
        size: meta.size
      });
  
      // For PDFs → return download URL for native viewer
      if (mime === 'application/pdf' || original.name.toLowerCase().endsWith('.pdf')) {
        const url = await firebaseStorage.getDownloadUrl(original.path);
        console.log(`📄 [getDocumentContent] PDF URL generated for native viewer`);
        return url;
      }
  
      // For text files → return extracted content for better readability
      if (mime.startsWith('text/') || mime === 'application/json' || mime.includes('csv') || mime.includes('markdown')) {
        // Try to get cleaned content first
        const contentFile = files.find(f => f.name.includes('_content.txt'));
        if (contentFile) {
          const content = await firebaseStorage.getTextContent(contentFile.path);
          console.log(`📄 [getDocumentContent] Cleaned text content loaded: ${content.length} characters`);
          return content;
        }
        // Fallback to original
        const content = await firebaseStorage.getTextContent(original.path);
        console.log(`📄 [getDocumentContent] Original text content loaded: ${content.length} characters`);
        return content;
      }
  
      // For other files → return download URL
      const url = await firebaseStorage.getDownloadUrl(original.path);
      console.log(`📄 [getDocumentContent] Download URL generated for binary file`);
      return url;
    } catch (e) {
      console.error(`❌ [getDocumentContent] Failed to load content for ${docId}:`, e);
      throw e;
    }
  }, [user?.uid, firebaseStorage]);



  return {
    loadDocuments,
    deleteDocument,
    getDocumentEmbeddings,
    getDocumentContent,
    isLoading,
  };
};
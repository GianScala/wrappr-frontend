// hooks/useDocumentUpload.ts
import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../contexts/AuthContext';
import { useApiClient } from './orchestrator/useApiClient';
import { DocumentProcessor } from '../../src/services/document-processing/DocumentProcessor';
import { FirebaseStorage } from '../../src/services/FirebaseStorage';

interface UseDocumentUploadProps {
  onSuccess?: (document: Document) => void;
  onError?: (error: Error) => void;
}

interface Document {
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

const SUPPORTED_TYPES = [
  'text/plain',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/markdown',
  'text/csv',
  'application/json'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const useDocumentUpload = ({ onSuccess, onError }: UseDocumentUploadProps = {}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useAuth();
  const apiClient = useApiClient();
  const documentProcessor = new DocumentProcessor();
  const firebaseStorage = new FirebaseStorage();

  const uploadDocument = async (): Promise<void> => {
    if (!user?.uid) {
      onError?.(new Error('User not authenticated'));
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: SUPPORTED_TYPES,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const file = result.assets[0];

      // Validate file
      if (file.size && file.size > MAX_FILE_SIZE) {
        onError?.(new Error('File too large. Maximum size is 10MB'));
        return;
      }

      if (!SUPPORTED_TYPES.includes(file.mimeType || '')) {
        onError?.(new Error('Unsupported file type'));
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      // Generate unique ID
      const docId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create initial document
      const document: Document = {
        id: docId,
        name: file.name,
        size: file.size || 0,
        uploadedAt: new Date().toISOString(),
        type: file.mimeType || 'text/plain',
        url: '',
        status: 'processing',
        hasEmbeddings: false,
      };

      await processDocument(file, document, user.uid);

    } catch (error) {
      console.error('Upload error:', error);
      onError?.(error instanceof Error ? error : new Error('Upload failed'));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
    
    // hooks/useDocumentUpload.ts (Updated processDocument function)
    const processDocument = async (
        file: DocumentPicker.DocumentPickerAsset,
        document: Document,
        userId: string
    ) => {
        try {
            console.log(`🚀 Processing document: ${file.name}`);
            
            // 1. Upload original file with original name preserved (10% progress)
            setUploadProgress(10);
            const originalUrl = await firebaseStorage.uploadFile(
                file.uri,
                `database/${userId}/${document.id}/${file.name}`, // Keep original filename
                file.mimeType || 'text/plain'
            );
            console.log(`📁 Original file uploaded to: ${originalUrl}`);

            // 2. Extract content (30% progress)
            setUploadProgress(30);
            const content = await documentProcessor.extractContent(file);
            console.log(`📄 Content extracted: ${content.length} characters`);
            
            if (!content || content.trim().length === 0) {
                throw new Error('No content extracted from document');
            }

            // 3. Clean content (40% progress)
            setUploadProgress(40);
            const cleanedContent = await documentProcessor.cleanContent(content);
            console.log(`🧹 Content cleaned: ${cleanedContent.length} characters`);

            // 4. Generate embeddings with enhanced metadata
            const onEmbeddingProgress = (completed: number, total: number) => {
                const embeddingProgress = (completed / total) * 50;
                setUploadProgress(40 + embeddingProgress);
            };

            console.log(`🧠 Starting embedding generation...`);
            const documentEmbedding = await documentProcessor.generateEmbeddings(
                cleanedContent,
                document.id,
                file.name, // Pass original filename
                apiClient,
                onEmbeddingProgress
            );
            
            // 5. Enhanced metadata storage with original filename
            const enhancedEmbedding = {
                ...documentEmbedding,
                metadata: {
                    ...documentEmbedding.metadata,
                    originalFileName: file.name, // Store original name
                    displayName: file.name,      // For easy access
                    documentId: document.id,
                    uploadedAt: document.uploadedAt,
                    fileSize: file.size,
                    mimeType: file.mimeType
                }
            };
            
            // 6. Store enhanced embeddings (95% progress)
            setUploadProgress(95);
            const embeddingPath = `database/${userId}/${document.id}/${document.id}_embeddings.json`;
            const embeddingJson = JSON.stringify(enhancedEmbedding, null, 2);
            
            await firebaseStorage.uploadTextContent(embeddingJson, embeddingPath);
            console.log(`✅ Enhanced embeddings with metadata stored`);

            // 7. Store content and document metadata
            const contentPath = `database/${userId}/${document.id}/${document.id}_content.txt`;
            await firebaseStorage.uploadTextContent(cleanedContent, contentPath);
            
            // Store document metadata separately for quick access
            const metadataPath = `database/${userId}/${document.id}/${document.id}_metadata.json`;
            const metadata = {
                originalFileName: file.name,
                documentId: document.id,
                fileSize: file.size,
                mimeType: file.mimeType,
                uploadedAt: document.uploadedAt,
                status: 'ready',
                hasEmbeddings: true
            };
            await firebaseStorage.uploadTextContent(JSON.stringify(metadata), metadataPath);
            
            setUploadProgress(100);

            const updatedDocument: Document = {
                ...document,
                name: file.name, // Keep original name
                url: originalUrl,
                status: 'ready',
                hasEmbeddings: true,
                content: cleanedContent.substring(0, 1000),
            };

            console.log(`🎉 Document processing complete with original name preserved`);
            onSuccess?.(updatedDocument);

        } catch (error) {
            console.error('❌ Processing error:', error);
            const errorDocument: Document = { ...document, status: 'error' };
            onError?.(error instanceof Error ? error : new Error('Processing failed'));
            onSuccess?.(errorDocument);
        }
    };

  return {
    uploadDocument,
    isUploading,
    uploadProgress,
  };
};
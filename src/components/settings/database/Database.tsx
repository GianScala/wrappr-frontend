// components/Database.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import { useAuth } from '../../../../src/contexts/AuthContext';
import { useDocumentUpload } from '../../../../src/hooks/useDocumentUpload';
import { useDocumentManager } from '../../../../src/hooks/useDocumentManager';
import DocumentCard from '../../DocumentCard';

interface DatabaseProps {
  onClose: () => void;
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

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const EmptyState: React.FC<{ theme: ReturnType<typeof useTheme> }> = ({ theme }) => (
  <View style={[styles.emptyState, { paddingTop: 40 }]}>
    <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primary + '10' }]}>
      <Ionicons name="document-text" size={32} color={theme.colors.primary} />
    </View>
    <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
      No Documents Yet
    </Text>
    <Text style={[styles.emptySubtitle, { color: theme.colors.secondary }]}>
      Upload documents to create embeddings for RAG-powered AI responses.
      {'\n\n'}Supported: TXT, PDF, DOCX, CSV, JSON (max 10MB)
    </Text>
  </View>
);

const LoadingState: React.FC<{ theme: ReturnType<typeof useTheme> }> = ({ theme }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={theme.colors.primary} />
    <Text style={[styles.emptySubtitle, { marginTop: 16, color: theme.colors.secondary }]}>
      Loading documents...
    </Text>
  </View>
);

const StatsSection: React.FC<{ 
  documents: Document[]; 
  theme: ReturnType<typeof useTheme>;
}> = ({ documents, theme }) => {
  const readyDocuments = documents.filter(doc => doc.status === 'ready');
  const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0);

  if (documents.length === 0) return null;

  return (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: theme.colors.text }]}>
          {documents.length}
        </Text>
        <Text style={[styles.statLabel, { color: theme.colors.secondary }]}>
          Documents
        </Text>
      </View>
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: theme.colors.text }]}>
          {readyDocuments.length}
        </Text>
        <Text style={[styles.statLabel, { color: theme.colors.secondary }]}>
          Ready
        </Text>
      </View>
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: theme.colors.text }]}>
          {formatFileSize(totalSize)}
        </Text>
        <Text style={[styles.statLabel, { color: theme.colors.secondary }]}>
          Total Size
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '500',
    fontFamily: 'SpaceGrotesk-Regular',
    paddingTop: 12,
    paddingBottom: 12,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-Regular',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Regular',
    marginTop: 2,
  },
  uploadSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'SpaceGrotesk-Regular',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'SpaceGrotesk-Regular',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function Database({ onClose }: DatabaseProps) {
  console.log('🔵 Database component rendered with onClose:', typeof onClose, !!onClose);
  
  const theme = useTheme();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);

  const { uploadDocument, isUploading } = useDocumentUpload({
    onSuccess: (newDoc) => {
      setDocuments(prev => [newDoc, ...prev]);
    },
    onError: (error) => {
      Alert.alert('Upload Failed', error.message);
    }
  });

  const { 
    loadDocuments, 
    deleteDocument, 
    isLoading 
  } = useDocumentManager({
    onDocumentsLoaded: setDocuments,
    onDocumentDeleted: (docId) => {
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
    }
  });

  useEffect(() => {
    if (user?.uid) {
      loadDocuments();
    }
  }, [user?.uid]);

  const handleUpload = useCallback(async () => {
    if (!user?.uid) return;
    await uploadDocument();
  }, [user?.uid, uploadDocument]);

  const handleDeleteDocument = useCallback(async (docId: string) => {
    Alert.alert(
      'Delete Document',
      'This will permanently delete the document and its RAG data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteDocument(docId)
        }
      ]
    );
  }, [deleteDocument]);

  const handleClose = useCallback(() => {
    console.log('🔴 Database handleClose called');
    console.log('🔴 onClose type:', typeof onClose);
    console.log('🔴 onClose exists:', !!onClose);
    
    if (onClose && typeof onClose === 'function') {
      console.log('🟢 Calling onClose function');
      try {
        onClose();
        console.log('🟢 onClose function executed successfully');
      } catch (error) {
        console.error('🔴 Error calling onClose:', error);
      }
    } else {
      console.error('🔴 onClose is not a function or is undefined');
    }
  }, [onClose]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.dragHandle, { backgroundColor: theme.colors.border }]} />
        <LoadingState theme={theme} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.dragHandle, { backgroundColor: theme.colors.border }]} />
      
      {/* Header - matching Image Models design */}
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          RAG Knowledge Base
        </Text>
        <TouchableOpacity
          onPress={() => {
            handleClose();
          }}
          style={[
            styles.closeButton,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            }
          ]}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <StatsSection documents={documents} theme={theme} />

      {/* Upload Button */}
      <View style={styles.uploadSection}>
        <TouchableOpacity
          onPress={handleUpload}
          style={[
            styles.uploadButton,
            { backgroundColor: theme.colors.primary },
            (isUploading || isLoading) && styles.uploadButtonDisabled
          ]}
          activeOpacity={0.8}
          disabled={isUploading || isLoading}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="cloud-upload" size={20} color="white" />
          )}
          <Text style={styles.uploadButtonText}>
            {isUploading ? 'Processing...' : 'Upload Document'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Documents List */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {documents.length === 0 ? (
          <EmptyState theme={theme} />
        ) : (
          documents.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              onDelete={handleDeleteDocument}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
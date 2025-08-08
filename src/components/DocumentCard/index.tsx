// components/DocumentCard/index.tsx
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useDocumentManager } from '../../../src/hooks/useDocumentManager';
import { useCardLogic, Document } from './useCardLogic';
import CardHeader from './CardHeader';
import EmbeddingsSection from './EmbeddingsSection';
import DocumentPreviewModal from '../DocumentPreviewModal';

interface Props {
  document: Document;
  onDelete: (docId: string) => void;
}

export default function DocumentCard({ document, onDelete }: Props) {
  const theme = useTheme();
  const {
    displayName,
    formattedSize,
    formattedDate,
    IconName,
    statusIcon,
    statusColor,
    statusText,
  } = useCardLogic(document, theme);
  const { getDocumentContent } = useDocumentManager();
  const [expanded, setExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [documentContent, setDocumentContent] = useState<string | null>(
    document.content || null
  );
  const [loadingContent, setLoadingContent] = useState(false);

  const isPDF = document.type === 'application/pdf' || displayName.toLowerCase().endsWith('.pdf');
  const isTextFile = document.type.startsWith('text/') || 
                     document.type === 'application/json' ||
                     document.type.includes('csv') ||
                     document.type.includes('markdown');

  const handleOpenPreview = useCallback(async () => {
    setLoadingContent(true);
    
    try {
      const content = await getDocumentContent(document.id);
      
      if (!content || content.trim() === '') {
        Alert.alert('Error', 'Document content is empty or could not be retrieved.');
        return;
      }

      if (isPDF) {
        // For PDFs, show in modal with base64 content
        setDocumentContent(content);
        setShowPreview(true);
      } else if (isTextFile) {
        // For text files, show in modal
        setDocumentContent(content);
        setShowPreview(true);
      } else {
        // For other files, try to open with system apps
        if (content.startsWith('http')) {
          Alert.alert(
            'Open Document',
            'This document will open in your default app.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Open', 
                onPress: () => Linking.openURL(content)
              },
              {
                text: 'Share',
                onPress: async () => {
                  if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(content);
                  }
                }
              }
            ]
          );
        }
      }
    } catch (err) {
      console.error('Failed to load document content:', err);
      Alert.alert('Error', `Failed to load document: ${err.message || 'Unknown error'}`);
    } finally {
      setLoadingContent(false);
    }
  }, [document.id, isPDF, isTextFile, getDocumentContent]);

  const handleClosePreview = useCallback(() => setShowPreview(false), []);
  const handleToggleExpand = useCallback(() => setExpanded(x => !x), []);
  const handleDelete = useCallback(() => onDelete(document.id), [onDelete, document.id]);

  return (
    <View style={[styles.card, {
      backgroundColor: theme.colors.background,
      borderColor: theme.colors.border,
      shadowColor: theme.colors.text,
    }]}>
      <CardHeader
        displayName={displayName}
        formattedSize={formattedSize}
        formattedDate={formattedDate}
        IconName={IconName}
        statusIcon={statusIcon}
        statusColor={statusColor}
        statusText={statusText}
        onPreview={handleOpenPreview}
        loadingContent={loadingContent}
        hasEmbeddings={document.hasEmbeddings}
        onDelete={handleDelete}
      />

      {/* Embeddings section when expanded (if has embeddings) */}
      {expanded && document.hasEmbeddings && (
        <EmbeddingsSection
          documentId={document.id}
          hasEmbeddings={document.hasEmbeddings}
        />
      )}

      {/* Show expand/collapse button only if has embeddings */}
      {document.hasEmbeddings && (
        <View style={[styles.bottomAction, { borderTopColor: theme.colors.border }]}>
          <TouchableOpacity onPress={handleToggleExpand} style={styles.expandButton} activeOpacity={0.7}>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={theme.colors.secondary}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Show modal for both text files and PDFs */}
      {(isTextFile || isPDF) && (
        <DocumentPreviewModal
          visible={showPreview}
          onClose={handleClosePreview}
          title={displayName}
          originalName={document.name}
          content={documentContent}
          documentType={document.type}
          isLoading={loadingContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bottomAction: {
    borderTopWidth: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  expandButton: {
    padding: 8,
  },
});
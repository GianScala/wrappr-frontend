// components/DocumentCard/EmbeddingsSection.tsx
import React, { FC, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useDocumentManager } from '../../../src/hooks/useDocumentManager';

interface EmbeddingsSectionProps {
  documentId: string;
  hasEmbeddings: boolean;
}

interface EmbeddingData {
  documentId?: string;
  chunks?: Array<{
    content: string;
    embedding: number[];
    metadata?: any;
  }>;
  metadata?: {
    avgChunkSize?: number;
    totalCharacters?: number;
    embeddingModel?: string;
    chunkSize?: number;
    fileName?: string;
    fileType?: string;
    processedAt?: string;
    totalChunks?: number;
  };
  embeddings?: number[][];
  [key: string]: any;
}

const EmbeddingsSection: FC<EmbeddingsSectionProps> = ({ documentId, hasEmbeddings }) => {
  const theme = useTheme();
  const { getDocumentEmbeddings } = useDocumentManager();
  const [loading, setLoading] = useState(false);
  const [embeddings, setEmbeddings] = useState<EmbeddingData | null>(null);
  const [showRawData, setShowRawData] = useState(false);

  useEffect(() => {
    if (!hasEmbeddings) return;
    
    console.log(`🧠 [EmbeddingsSection] Loading embeddings for document: ${documentId}`);
    setLoading(true);
    
    getDocumentEmbeddings(documentId)
      .then(data => {
        console.log(`🧠 [EmbeddingsSection] Embeddings loaded successfully for ${documentId}`);
        setEmbeddings(data);
      })
      .catch(err => {
        console.error(`❌ [EmbeddingsSection] Failed to load embeddings for ${documentId}:`, err);
        setEmbeddings(null);
      })
      .finally(() => setLoading(false));
  }, [documentId, hasEmbeddings, getDocumentEmbeddings]);

  const embeddingStats = useMemo(() => {
    if (!embeddings) return null;
    
    console.log(`📊 [EmbeddingsSection] Computing stats for embeddings:`, {
      hasChunks: !!embeddings.chunks,
      chunksLength: embeddings.chunks?.length,
      hasMetadata: !!embeddings.metadata,
      hasEmbeddings: !!embeddings.embeddings,
      embeddingsLength: embeddings.embeddings?.length,
      allKeys: Object.keys(embeddings)
    });

    const chunks = embeddings.chunks || [];
    const metadata = embeddings.metadata || {};
    
    return {
      totalChunks: chunks.length,
      avgChunkSize: metadata.avgChunkSize || 0,
      totalCharacters: metadata.totalCharacters || 0,
      embeddingModel: metadata.embeddingModel || 'Unknown',
      embeddingDimensions: chunks[0]?.embedding?.length || 0,
      firstChunkPreview: chunks[0]?.content?.substring(0, 100) || 'No content',
    };
  }, [embeddings]);

  const renderEmbeddingStats = () => {
    if (!embeddingStats) return null;
    
    console.log(`📊 [EmbeddingsSection] Rendering stats:`, embeddingStats);

    return (
      <View style={[styles.statsContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.statsTitle, { color: theme.colors.text }]}>
          Embedding Statistics
        </Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.secondary }]}>Chunks</Text>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {embeddingStats.totalChunks}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.secondary }]}>Avg Size</Text>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {embeddingStats.avgChunkSize} chars
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.secondary }]}>Dimensions</Text>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {embeddingStats.embeddingDimensions}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.secondary }]}>Model</Text>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {embeddingStats.embeddingModel}
            </Text>
          </View>
        </View>
        
        <View style={[styles.previewContainer, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.previewLabel, { color: theme.colors.secondary }]}>
            First Chunk Preview:
          </Text>
          <Text style={[styles.previewText, { color: theme.colors.text }]}>
            {embeddingStats.firstChunkPreview}
            {embeddingStats.firstChunkPreview.length >= 100 && '...'}
          </Text>
        </View>
      </View>
    );
  };

  const renderChunksList = () => {
    if (!embeddings?.chunks) return null;
    
    console.log(`📝 [EmbeddingsSection] Rendering ${embeddings.chunks.length} chunks`);

    return (
      <View style={styles.chunksContainer}>
        <Text style={[styles.sectionSubheader, { color: theme.colors.text }]}>
          Text Chunks ({embeddings.chunks.length})
        </Text>
        
        <ScrollView
          style={styles.chunksScroll}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {embeddings.chunks.map((chunk, index) => (
            <View
              key={index}
              style={[
                styles.chunkItem,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                }
              ]}
            >
              <View style={styles.chunkHeader}>
                <Text style={[styles.chunkTitle, { color: theme.colors.primary }]}>
                  Chunk {index + 1}
                </Text>
                <Text style={[styles.chunkMeta, { color: theme.colors.secondary }]}>
                  {chunk.content?.length || 0} chars • {chunk.embedding?.length || 0} dims
                </Text>
              </View>
              
              <Text style={[styles.chunkText, { color: theme.colors.text }]}>
                {chunk.content || 'No content available'}
              </Text>
              
              {chunk.metadata && (
                <View style={[styles.chunkMetadata, { backgroundColor: theme.colors.surface }]}>
                  <Text style={[styles.metadataLabel, { color: theme.colors.secondary }]}>
                    Metadata:
                  </Text>
                  <Text style={[styles.metadataText, { color: theme.colors.secondary }]}>
                    {JSON.stringify(chunk.metadata, null, 2)}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderRawData = () => {
    if (!showRawData || !embeddings) return null;
    
    console.log(`🔍 [EmbeddingsSection] Rendering raw data view`);

    return (
      <View style={styles.rawDataContainer}>
        <Text style={[styles.sectionSubheader, { color: theme.colors.text }]}>
          Raw Embedding Data
        </Text>
        
        <ScrollView
          style={styles.rawDataScroll}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          <View style={[
            styles.rawDataBlock,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            }
          ]}>
            <Text style={[styles.rawDataText, { color: theme.colors.secondary }]}>
              {JSON.stringify(embeddings, null, 2)}
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  };

  if (!hasEmbeddings) {
    return (
      <View style={[styles.section, { borderTopColor: theme.colors.border }]}>
        <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>
          RAG Embeddings Data
        </Text>
        <Text style={[styles.noEmbeddingsText, { color: theme.colors.secondary }]}>
          No embeddings available for this document
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.section, { borderTopColor: theme.colors.border }]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>
          RAG Embeddings Data
        </Text>
        
        {embeddings && (
          <TouchableOpacity
            onPress={() => setShowRawData(!showRawData)}
            style={[styles.toggleButton, { backgroundColor: theme.colors.surface }]}
          >
            <Ionicons
              name={showRawData ? 'eye-off' : 'eye'}
              size={16}
              color={theme.colors.primary}
            />
            <Text style={[styles.toggleText, { color: theme.colors.primary }]}>
              {showRawData ? 'Hide Raw' : 'Show Raw'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.secondary }]}>
            Loading embeddings data...
          </Text>
        </View>
      ) : embeddings ? (
        <>
          {renderEmbeddingStats()}
          {!showRawData && renderChunksList()}
          {renderRawData()}
        </>
      ) : (
        <View style={[
          styles.errorContainer,
          {
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border,
          }
        ]}>
          <Ionicons name="warning" size={20} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Failed to load embeddings data
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionSubheader: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
  },
  statsContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  statsTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  previewContainer: {
    marginTop: 12,
    padding: 8,
    borderRadius: 6,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 11,
    lineHeight: 16,
  },
  chunksContainer: {
    marginBottom: 12,
  },
  chunksScroll: {
    maxHeight: 300,
  },
  chunkItem: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  chunkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chunkTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  chunkMeta: {
    fontSize: 10,
    fontWeight: '500',
  },
  chunkText: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 8,
  },
  chunkMetadata: {
    padding: 8,
    borderRadius: 4,
  },
  metadataLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 4,
  },
  metadataText: {
    fontSize: 10,
    fontFamily: 'monospace',
    lineHeight: 14,
  },
  rawDataContainer: {
    marginBottom: 12,
  },
  rawDataScroll: {
    maxHeight: 200,
  },
  rawDataBlock: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  rawDataText: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: 'monospace',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
  },
  noEmbeddingsText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
});

export default EmbeddingsSection;
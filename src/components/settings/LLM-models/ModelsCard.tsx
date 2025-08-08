// components/ModelsCard.tsx - UPDATED FOR TEXT MODELS ONLY
import React, { useState, useCallback, useRef, memo, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, SectionList, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import { useAuth } from '../../../../src/contexts/AuthContext';
import { useAppContext } from '../../../../src/contexts/AppContext';
import { useOrchestrator } from '../../../../src/hooks/useOrchestrator';
import { modelModalStyles } from './ModelModalStyles';
import { getProviderIcon, getProviderColor, getTierBadge } from '../../../../src/utils/modelUtils';

// UPDATED: Simplified props interface - removed image model support
interface ModelsCardProps {
  textModels?: LLMModel[]; // Made optional with default
  webSearchModels?: LLMModel[]; // Made optional with default
  selectedTextModel: string;
  // REMOVED: imageModels and selectedImageModel props
}

interface LLMModel {
  name: string;
  displayName?: string;
  tier: 'free' | 'pro' | 'premium';
  provider?: 'openai' | 'anthropic' | 'groq' | 'google' | 'meta' | 'mistral';
  description?: string;
  contextLength?: number;
  isNew?: boolean;
  isRecommended?: boolean;
  capabilities?: {
    webSearchCapable?: boolean;
    codeExecution?: boolean;
    multimodal?: boolean;
  };
}

interface ModelSection {
  title: string;
  data: LLMModel[];
  provider: string;
}

// UPDATED: Simplified component props with safe defaults
export default function ModelsCard({ 
  textModels = [], 
  webSearchModels = [], 
  selectedTextModel 
}: ModelsCardProps) {
  const theme = useTheme();
  const { profile, updateUserProfile } = useAuth();
  const { setSelectedTextModel, canUseWebSearch } = useAppContext();
  const { recordModelSelection } = useOrchestrator();

  // Early return if no models are available yet
  if (!textModels.length && !webSearchModels.length) {
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <Text style={{ color: theme.colors.secondary }}>Loading models...</Text>
      </View>
    );
  }

  const [modalVisible, setModalVisible] = useState(false);
  const [currentType, setCurrentType] = useState<'text' | 'web-search' | null>(null); // UPDATED: removed 'image'

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 10,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 50) setModalVisible(false);
      },
    })
  ).current;

  // Organize models by provider with safe array handling
  const organizedTextModels = useMemo(() => {
    const modelsToOrganize = currentType === 'web-search' ? webSearchModels : textModels;
    
    // Safety check for undefined arrays
    if (!modelsToOrganize || !Array.isArray(modelsToOrganize) || modelsToOrganize.length === 0) {
      return [];
    }
    
    const grouped = modelsToOrganize.reduce((acc, model) => {
      const provider = model.provider || 'other';
      if (!acc[provider]) acc[provider] = [];
      acc[provider].push(model);
      return acc;
    }, {} as Record<string, LLMModel[]>);

    // Sort providers by priority and models within each provider
    const providerOrder = ['openai', 'anthropic', 'google', 'meta', 'groq', 'mistral', 'other'];
    
    return providerOrder
      .filter(provider => grouped[provider])
      .map(provider => ({
        title: provider.charAt(0).toUpperCase() + provider.slice(1),
        data: grouped[provider].sort((a, b) => {
          // Sort by tier first (premium > pro > free), then by name
          const tierOrder = { premium: 3, pro: 2, free: 1 };
          if (tierOrder[a.tier] !== tierOrder[b.tier]) {
            return tierOrder[b.tier] - tierOrder[a.tier];
          }
          return a.displayName?.localeCompare(b.displayName || '') || 0;
        }),
        provider
      }));
  }, [textModels, webSearchModels, currentType]);

  // UPDATED: Simplified modal opening - removed 'image' type
  const openModal = useCallback((type: 'text' | 'web-search') => {
    setCurrentType(type);
    setModalVisible(true);
  }, []);

  // UPDATED: Simplified selection handler - removed image model handling
  const handleSelect = useCallback(async (modelName: string) => {
    if (!currentType) return;
    
    try {
      // Only handle text model selection now
      await setSelectedTextModel(modelName);
      if (profile?.uid) {
        // UPDATED: Only update text model preference
        await updateUserProfile(profile.uid, { preferredTextModel: modelName });
      }
      
      // Record selection analytics with safe array access
      const selectedModel = (textModels || []).find(m => m.name === modelName) || 
                           (webSearchModels || []).find(m => m.name === modelName);
      if (selectedModel) {
        recordModelSelection(selectedModel.provider || 'unknown', modelName, 'text');
      }
    } catch (err) {
      console.error(`❌ ModelsCard: Error updating text model:`, err);
    } finally {
      setModalVisible(false);
      setCurrentType(null);
    }
  }, [currentType, profile, setSelectedTextModel, updateUserProfile, textModels, webSearchModels, recordModelSelection]);

  const getDisplayName = useCallback((model: LLMModel | { name: string }): string => {
    return 'displayName' in model ? model.displayName || model.name : model.name;
  }, []);

  const findModelByName = useCallback((models: LLMModel[], name: string): LLMModel | undefined => {
    return models?.find(m => m.name === name);
  }, []);

  const styles = StyleSheet.create({
    container: {
      marginVertical: 2,
      paddingVertical: 2,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 4,
      paddingVertical: 4,
    },
    iconContainer: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.primary + '10',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: '500',
      fontFamily: 'SpaceGrotesk-Regular',
      color: theme.colors.text,
    },
    contentSection: {
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    activeModelsContainer: {
      backgroundColor: theme.colors.background,
      borderRadius: 18,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      paddingVertical: 4,
      paddingHorizontal: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    availableModelsContainer: {
      backgroundColor: theme.colors.background,
      borderRadius: 18,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      paddingVertical: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
    },
    label: {
      fontSize: 11,
      fontWeight: '500',
      fontFamily: 'SpaceGrotesk-Regular',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: theme.colors.secondary,
    },
    value: {
      fontSize: 13,
      fontWeight: '500',
      fontFamily: 'SpaceGrotesk-Regular',
      color: theme.colors.text,
    },
    webSearchIndicator: {
      fontSize: 11,
      fontFamily: 'SpaceGrotesk-Regular',
      color: canUseWebSearch ? theme.colors.success || '#22C55E' : theme.colors.secondary,
      marginTop: 2,
    },
    modelButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    buttonContent: {
      flex: 1,
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '500',
      fontFamily: 'SpaceGrotesk-Regular',
      color: theme.colors.text,
      marginBottom: 2,
    },
    buttonSub: {
      fontSize: 12,
      fontFamily: 'SpaceGrotesk-Regular',
      color: theme.colors.secondary,
    },
    separator: {
      height: 0.5,
      backgroundColor: theme.colors.border,
      marginHorizontal: 16,
    },
  });

  // Enhanced ModelOption component with web search indicator
  const ModelOption = memo(({ model, selected, onSelect }: { 
    model: LLMModel; 
    selected: boolean; 
    onSelect: (modelName: string) => void; 
  }) => {
    const modalStyles = modelModalStyles(theme);
    const providerColor = getProviderColor(model.provider);
    const hasWebSearch = model.capabilities?.webSearchCapable || false;
    
    return (
      <TouchableOpacity
        onPress={() => onSelect(model.name)}
        disabled={selected}
        style={[
          modalStyles.modelOption,
          {
            backgroundColor: selected ? theme.colors.primary + '15' : theme.colors.background,
            borderColor: selected ? theme.colors.primary : theme.colors.border,
            borderLeftWidth: 3,
            borderLeftColor: providerColor,
          },
        ]}
        activeOpacity={0.7}
      >
        <View style={modalStyles.modelOptionHeader}>
          <View style={modalStyles.modelInfo}>
            <View style={modalStyles.modelNameRow}>
              <Text style={[modalStyles.modelName, { 
                color: selected ? theme.colors.primary : theme.colors.text 
              }]}>
                {getDisplayName(model)}
              </Text>
              {(() => {
                const badge = getTierBadge(model.tier, theme);
                return badge ? (
                  <View style={badge.style}>
                    <Text style={badge.textStyle}>{badge.text}</Text>
                  </View>
                ) : null;
              })()}
              {hasWebSearch && (
                <View style={modalStyles.webSearchBadge}>
                  <Ionicons name="search" size={10} color={theme.colors.success || '#22C55E'} />
                  <Text style={modalStyles.webSearchBadgeText}>WEB</Text>
                </View>
              )}
              {model.isNew && (
                <View style={modalStyles.newBadge}>
                  <Text style={modalStyles.newBadgeText}>NEW</Text>
                </View>
              )}
              {model.isRecommended && (
                <View style={modalStyles.recommendedBadge}>
                  <Text style={modalStyles.recommendedBadgeText}>★</Text>
                </View>
              )}
            </View>
            
            {model.description && (
              <Text style={modalStyles.modelDescription}>
                {model.description}
              </Text>
            )}
            
            <View style={modalStyles.modelMeta}>
              <Text style={modalStyles.providerText}>
                {model.provider?.toUpperCase() || 'UNKNOWN'}
              </Text>
              {model.contextLength && (
                <Text style={modalStyles.contextText}>
                  {model.contextLength.toLocaleString()} tokens
                </Text>
              )}
            </View>
          </View>
          
          <View style={modalStyles.selectionIndicator}>
            {selected && (
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  });

  // Section header component
  const SectionHeader = memo(({ section }: { section: ModelSection }) => {
    const modalStyles = modelModalStyles(theme);
    const providerIcon = getProviderIcon(section.provider);
    const providerColor = getProviderColor(section.provider);
    
    return (
      <View style={modalStyles.sectionHeader}>
        <View style={modalStyles.providerHeader}>
          <View style={[modalStyles.providerIcon, { backgroundColor: providerColor + '20' }]}>
            <Ionicons name={providerIcon} size={16} color={providerColor} />
          </View>
          <Text style={modalStyles.sectionTitle}>{section.title}</Text>
          <Text style={modalStyles.modelCount}>{section.data.length} models</Text>
        </View>
      </View>
    );
  });

  return (
    <>
      {/* UPDATED: Active Models Section - Only Text Model */}
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="hardware-chip" size={16} color={theme.colors.primary} />
          </View>
          <Text style={styles.title}>Active Model</Text>
        </View>
        
        <View style={styles.contentSection}>
          <View style={styles.activeModelsContainer}>
            <View style={styles.row}>
              <Text style={styles.label}>CURRENT MODEL</Text>
              <View>
                <Text style={styles.value}>
                  {getDisplayName(findModelByName(textModels || [], selectedTextModel) || { name: selectedTextModel })}
                </Text>
                <Text style={styles.webSearchIndicator}>
                  {canUseWebSearch ? '🔍 Web Search Enabled' : 'Text Only'}
                </Text>
              </View>
            </View>
            {/* REMOVED: Image model row */}
          </View>
        </View>
      </View>

      {/* UPDATED: Available Models Section - Text Models Only */}
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="library" size={16} color={theme.colors.primary} />
          </View>
          <Text style={styles.title}>Available Models</Text>
        </View>
        
        <View style={styles.contentSection}>
          <View style={styles.availableModelsContainer}>
            <TouchableOpacity 
              style={styles.modelButton} 
              onPress={() => openModal('text')}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>All Text Models</Text>
                <Text style={styles.buttonSub}>{(textModels || []).length} available</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.secondary} />
            </TouchableOpacity>
            
            <View style={styles.separator} />
            
            {/* NEW: Web Search Models Section */}
            <TouchableOpacity 
              style={styles.modelButton} 
              onPress={() => openModal('web-search')}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Web Search Models</Text>
                <Text style={styles.buttonSub}>{(webSearchModels || []).length} with web search</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.secondary} />
            </TouchableOpacity>
            {/* REMOVED: Image Models Section */}
          </View>
        </View>
      </View>

      {/* UPDATED: Modal - Only Text Models */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={modelModalStyles(theme).modalWrapper} {...panResponder.panHandlers}>
          <View style={modelModalStyles(theme).dragHandle} />
          
          <View style={modelModalStyles(theme).modalHeader}>
            <Text style={modelModalStyles(theme).modalTitle}>
              {currentType === 'text' ? 'All Text Models' : 
               currentType === 'web-search' ? 'Web Search Models' : 'Models'}
            </Text>
            <TouchableOpacity 
              onPress={() => setModalVisible(false)}
              style={modelModalStyles(theme).closeButton}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          {/* SIMPLIFIED: Only text models section list */}
          <SectionList
            sections={organizedTextModels}
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => (
              <ModelOption 
                model={item} 
                selected={item.name === selectedTextModel} 
                onSelect={handleSelect}
              />
            )}
            renderSectionHeader={({ section }) => <SectionHeader section={section} />}
            contentContainerStyle={modelModalStyles(theme).modalContent}
            style={modelModalStyles(theme).modalList}
            stickySectionHeadersEnabled={true}
          />
        </View>
      </Modal>
    </>
  );
}
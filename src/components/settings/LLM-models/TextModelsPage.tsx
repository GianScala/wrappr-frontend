import React, { useState, useCallback, useRef, memo } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, SectionList, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import { useAuth } from '../../../../src/contexts/AuthContext';
import { useAppContext } from '../../../../src/contexts/AppContext';
import { LLMModel } from '../../../../types/models';

interface TextModelsSectionProps {
  textModels: LLMModel[];
  selectedTextModel: string;
}

const formatProviderName = (provider: string) => {
  switch (provider) {
    case 'openai': return 'OpenAI';
    case 'anthropic': return 'Anthropic';
    case 'groq': return 'Groq';
    default: return provider.charAt(0).toUpperCase() + provider.slice(1);
  }
};

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'free': return 'green';
    case 'pro': return 'blue';
    case 'premium': return 'gold';
    default: return 'gray';
  }
};

const ModelItem = memo(({ model, selected, onSelect, theme }: { 
  model: LLMModel; 
  selected: boolean; 
  onSelect: (modelName: string) => void; 
  theme: ReturnType<typeof useTheme>; 
}) => {
  const capabilities = [];
  if (model.capabilities.webSearchCapable) {
    capabilities.push(<Ionicons key="web" name="globe" size={16} color={theme.colors.primary} />);
  }
  if (model.capabilities.multimodal) {
    capabilities.push(<Ionicons key="multi" name="images" size={16} color={theme.colors.primary} />);
  }
  if (model.capabilities.functionCalling) {
    capabilities.push(<Ionicons key="func" name="code" size={16} color={theme.colors.primary} />);
  }

  return (
    <TouchableOpacity
      onPress={() => onSelect(model.name)}
      style={[styles.modelItem, selected && styles.selectedModelItem]}
    >
      <View style={styles.modelInfo}>
        <View style={styles.modelHeader}>
          <Text style={styles.modelName}>{model.displayName}</Text>
          <View style={[styles.tierDot, { backgroundColor: getTierColor(model.tier) }]} />
        </View>
        {model.description && <Text style={styles.modelDescription}>{model.description}</Text>}
        <View style={styles.capabilities}>
          {model.capabilities.maxTokens && (
            <Text style={styles.capabilityText}>Max: {model.capabilities.maxTokens}</Text>
          )}
          {model.capabilities.contextWindow && (
            <Text style={styles.capabilityText}>Ctx: {model.capabilities.contextWindow}</Text>
          )}
        </View>
        {capabilities.length > 0 && (
          <View style={styles.badges}>{capabilities}</View>
        )}
      </View>
      {selected && <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />}
    </TouchableOpacity>
  );
});

export default function TextModelsSection({ textModels, selectedTextModel }: TextModelsSectionProps) {
  const theme = useTheme();
  const { profile, updateUserProfile } = useAuth();
  const { setSelectedTextModel } = useAppContext();
  const [modalVisible, setModalVisible] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 10,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 50) setModalVisible(false);
      },
    })
  ).current;

  const handleSelect = useCallback(async (modelName: string) => {
    try {
      await setSelectedTextModel(modelName);
      if (profile?.uid) {
        await updateUserProfile(profile.uid, { preferredTextModel: modelName });
      }
    } catch (err) {
      console.error('Error updating text model:', err);
    } finally {
      setModalVisible(false);
    }
  }, [profile, setSelectedTextModel, updateUserProfile]);

  const findModelByName = (name: string) => textModels.find(m => m.name === name);
  const getDisplayName = (model: LLMModel | undefined) => model?.displayName || model?.name || name;

  const groupedModels = textModels.reduce((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = [];
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, LLMModel[]>);

  const sections = Object.entries(groupedModels).map(([provider, models]) => ({
    title: formatProviderName(provider),
    data: models.sort((a, b) => a.displayName.localeCompare(b.displayName)),
  }));

  const styles = StyleSheet.create({
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
    modalWrapper: {
      flex: 1,
      paddingTop: 8,
      backgroundColor: theme.colors.background,
    },
    dragHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 8,
      backgroundColor: theme.colors.border,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 16,
      backgroundColor: theme.colors.background,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '500',
      fontFamily: 'SpaceGrotesk-Regular',
      color: theme.colors.text,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    modalContent: {
      padding: 16,
      paddingBottom: 40,
    },
    sectionHeader: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.background,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '500',
      color: theme.colors.text,
    },
    modelItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.border,
    },
    selectedModelItem: {
      backgroundColor: theme.colors.primary + '20',
    },
    modelInfo: {
      flex: 1,
    },
    modelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    modelName: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
    },
    tierDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginLeft: 8,
    },
    modelDescription: {
      fontSize: 14,
      color: theme.colors.secondary,
      marginTop: 4,
    },
    capabilities: {
      flexDirection: 'row',
      marginTop: 4,
    },
    capabilityText: {
      fontSize: 12,
      color: theme.colors.secondary,
      marginRight: 8,
    },
    badges: {
      flexDirection: 'row',
      marginTop: 4,
      gap: 8,
    },
  });

  return (
    <>
      <View style={styles.row}>
        <Text style={styles.label}>TEXT MODEL</Text>
        <Text style={styles.value}>{getDisplayName(findModelByName(selectedTextModel))}</Text>
      </View>
      <TouchableOpacity 
        style={styles.modelButton} 
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.buttonContent}>
          <Text style={styles.buttonText}>Text Models</Text>
          <Text style={styles.buttonSub}>{textModels.length} available</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.secondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalWrapper} {...panResponder.panHandlers}>
          <View style={styles.dragHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Text Models</Text>
            <TouchableOpacity 
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.name}
            renderSectionHeader={({ section: { title } }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <ModelItem 
                model={item} 
                selected={item.name === selectedTextModel} 
                onSelect={handleSelect} 
                theme={theme} 
              />
            )}
            contentContainerStyle={styles.modalContent}
            style={{ backgroundColor: theme.colors.background }}
          />
        </View>
      </Modal>
    </>
  );
}
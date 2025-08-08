import React, { useState, useCallback, useRef, memo } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, FlatList, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import { useAuth } from '../../../../src/contexts/AuthContext';
import { useAppContext } from '../../../../src/contexts/AppContext';

interface ImageModelsSectionProps {
  imageModels: LLMModel[];
  selectedImageModel: string;
}

interface LLMModel {
  name: string;
  displayName?: string;
  tier: 'free' | 'pro' | 'premium';
  provider?: 'openai' | 'anthropic' | 'groq';
}

const ModelOption = memo(({ model, selected, onSelect, theme }: { 
  model: LLMModel; 
  selected: boolean; 
  onSelect: (modelName: string) => void; 
  theme: ReturnType<typeof useTheme>; 
}) => (
  <TouchableOpacity
    onPress={() => onSelect(model.name)}
    disabled={selected}
    style={[
      {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginVertical: 4,
        borderRadius: 20,
        borderWidth: 0.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        backgroundColor: selected ? theme.colors.primary + '20' : theme.colors.background,
        borderColor: selected ? theme.colors.primary : theme.colors.border,
      },
    ]}
    activeOpacity={0.8}
  >
    <Text style={{
      flex: 1,
      fontSize: 14,
      fontFamily: 'SpaceGrotesk-Regular',
      color: selected ? theme.colors.primary : theme.colors.text,
      fontWeight: selected ? '500' : '400'
    }}>
      {model.displayName || model.name}
    </Text>
    {selected && <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} />}
  </TouchableOpacity>
));

export default function ImageModelsSection({ imageModels, selectedImageModel }: ImageModelsSectionProps) {
  const theme = useTheme();
  const { profile, updateUserProfile } = useAuth();
  const { setSelectedImageModel } = useAppContext();
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
      await setSelectedImageModel(modelName);
      if (profile?.uid) {
        await updateUserProfile(profile.uid, { preferredImageModel: modelName });
      }
    } catch (err) {
      console.error('Error updating image model:', err);
    } finally {
      setModalVisible(false);
    }
  }, [profile, setSelectedImageModel, updateUserProfile]);

  const findModelByName = (name: string) => imageModels.find(m => m.name === name);
  const getDisplayName = (model: LLMModel | undefined) => model?.displayName || model?.name || name;

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
    separator: {
      height: 0.5,
      backgroundColor: theme.colors.border,
      marginHorizontal: 16,
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
  });

  return (
    <>
      <View style={[styles.row, { borderTopWidth: 0.5, borderTopColor: theme.colors.border }]}>
        <Text style={styles.label}>IMAGE MODEL</Text>
        <Text style={styles.value}>
          {getDisplayName(findModelByName(selectedImageModel))}
        </Text>
      </View>
      
      <View style={styles.separator} />
      
      <TouchableOpacity 
        style={styles.modelButton} 
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.buttonContent}>
          <Text style={styles.buttonText}>Image Models</Text>
          <Text style={styles.buttonSub}>{imageModels.length} available</Text>
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
            <Text style={styles.modalTitle}>Image Models</Text>
            <TouchableOpacity 
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={imageModels}
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => (
              <ModelOption 
                model={item} 
                selected={item.name === selectedImageModel} 
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
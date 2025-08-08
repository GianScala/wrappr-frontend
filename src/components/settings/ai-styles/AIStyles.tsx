// components/AIStyles.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import { useAuth } from '../../../../src/contexts/AuthContext';

export default function AIStyles() {
  const theme = useTheme();
  const { profile, updateUserProfile } = useAuth();

  const handleAIStyleChange = async (newStyle: 'concise' | 'exhaustive' | 'friendly') => {
    if (profile?.uid) {
      try {
        await updateUserProfile(profile.uid, { aiStyle: newStyle });
        console.log('✅ AI Style updated:', newStyle);
      } catch (error) {
        console.error('❌ Failed to update AI style:', error);
        Alert.alert('Error', 'Failed to update AI style preference');
      }
    }
  };

  const aiStyles = [
    { 
      id: 'concise', 
      label: 'Concise', 
      description: 'Brief and to the point',
      icon: 'flash' as const,
      color: '#3b82f6'
    },
    { 
      id: 'exhaustive', 
      label: 'Exhaustive', 
      description: 'Detailed and comprehensive',
      icon: 'library' as const,
      color: '#8b5cf6'
    },
    { 
      id: 'friendly', 
      label: 'Friendly', 
      description: 'Warm and conversational',
      icon: 'happy' as const,
      color: '#10b981'
    },
  ];

  const styles = StyleSheet.create({
    container: {
      marginVertical: 2,
      paddingVertical: 4,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 4,
      paddingVertical: 12,
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
      paddingVertical: 2,
      paddingHorizontal: 4,
    },
    stylesContainer: {
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
    styleOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    styleIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    styleContent: {
      flex: 1,
    },
    styleLabel: {
      fontSize: 14,
      fontWeight: '500',
      fontFamily: 'SpaceGrotesk-Regular',
      color: theme.colors.text,
      marginBottom: 2,
    },
    styleDescription: {
      fontSize: 12,
      fontFamily: 'SpaceGrotesk-Regular',
      color: theme.colors.secondary,
    },
    radioButton: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    radioUnselected: {
      borderColor: theme.colors.border,
      backgroundColor: 'transparent',
    },
    radioInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
    },
    separator: {
      height: 0.5,
      backgroundColor: theme.colors.border,
      marginHorizontal: 16,
    },
  });

  if (!profile) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <FontAwesome6 name="feather-pointed" size={14} color={theme.colors.primary} />
        </View>
        <Text style={styles.title}>AI Preferences</Text>
      </View>

      {/* Content Section */}
      <View style={styles.contentSection}>
        <View style={styles.stylesContainer}>
          {aiStyles.map((style, index) => (
            <React.Fragment key={style.id}>
              <TouchableOpacity
                onPress={() => handleAIStyleChange(style.id as any)}
                style={styles.styleOption}
                activeOpacity={0.8}
              >
                <View style={[styles.styleIconContainer, {
                  backgroundColor: `${style.color}10`,
                }]}>
                  <Ionicons name={style.icon} size={16} color={style.color} />
                </View>
                
                <View style={styles.styleContent}>
                  <Text style={styles.styleLabel}>{style.label}</Text>
                  <Text style={styles.styleDescription}>{style.description}</Text>
                </View>
                
                <View style={[
                  styles.radioButton,
                  profile.aiStyle === style.id ? styles.radioSelected : styles.radioUnselected
                ]}>
                  {profile.aiStyle === style.id && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </TouchableOpacity>
              
              {index < aiStyles.length - 1 && (
                <View style={styles.separator} />
              )}
            </React.Fragment>
          ))}
        </View>
      </View>
    </View>
  );
}
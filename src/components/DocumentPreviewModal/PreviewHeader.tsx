// components/DocumentPreviewModal/PreviewHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PreviewHeaderProps } from '../../../types/preview';

export const PreviewHeader = React.memo<PreviewHeaderProps>(({
  title,
  originalName,
  icon = 'document',
  theme,
  onClose
}) => (
  <View 
    style={[styles.container, { 
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background 
    }]}
    accessible
    accessibilityRole="header"
  >
    <View style={styles.content}>
      <View 
        style={[styles.iconContainer, { 
          backgroundColor: `${"#6A5ACD"}15` 
        }]}
        accessibilityIgnoresInvertColors
      >
        <Ionicons 
          name={icon as any} 
          size={20} 
          color="#6A5ACD"
          accessibilityRole="image"
          accessibilityLabel={`${icon} icon`}
        />
      </View>
      
      <View style={styles.textContainer}>
        <Text 
          numberOfLines={1} 
          style={[styles.title, { color: theme.colors.text }]}
          accessibilityRole="text"
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        <Text 
          style={[styles.subtitle, { color: theme.colors.secondary }]}
          accessibilityRole="text"
        >
          Document Preview
        </Text>
        {originalName && originalName !== title && (
          <Text 
            style={[styles.originalName, { color: theme.colors.secondary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
            accessibilityRole="text"
          >
            Original: {originalName}
          </Text>
        )}
      </View>
    </View>
    
    <TouchableOpacity
      onPress={onClose}
      style={[styles.closeButton, { 
        backgroundColor: `${theme.colors.error}10`,
        ...Platform.select({
          ios: { shadowOpacity: 0.1 },
          android: { elevation: 1 }
        })
      }]}
      accessibilityLabel="Close preview"
      accessibilityRole="button"
      accessibilityHint="Closes the document preview"
      activeOpacity={0.7}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Ionicons 
        name="close" 
        size={20} 
        color={theme.colors.error} 
        accessibilityRole="image"
      />
    </TouchableOpacity>
  </View>
));

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    minWidth: 0, // Needed for text truncation to work properly
  },
  title: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    marginTop: 2,
  },
  originalName: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 10,
    lineHeight: 14,
    fontStyle: 'italic',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
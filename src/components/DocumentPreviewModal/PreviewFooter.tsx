// components/DocumentPreviewModal/PreviewFooter.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { PreviewFooterProps } from '../../../types/preview';

const PreviewFooterComponent: React.FC<PreviewFooterProps> = ({
  documentType,
  contentLength,
  theme,
  onDone
}) => (
  <View style={[styles.container, { 
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  }]}>
    <View style={styles.info}>
      <Text 
        style={[styles.documentType, { color: theme.colors.secondary }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {documentType}
      </Text>
      {contentLength != null && (
        <Text style={[styles.contentLength, { color: theme.colors.secondary }]}>
          {contentLength.toLocaleString()} chars
        </Text>
      )}
    </View>
    
    <TouchableOpacity
      onPress={onDone}
      style={[styles.doneButton, { backgroundColor: theme.colors.primary }]}
      accessibilityLabel="Done viewing document"
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={styles.doneText}>Done</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  info: {
    gap: 4,
    marginRight: 12,
    fontFamily: 'SpaceGrotesk-Regular',

  },
  documentType: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  contentLength: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.8,
  },
  doneButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 40,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: {
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 14,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export const PreviewFooter = React.memo(PreviewFooterComponent);
PreviewFooter.displayName = 'PreviewFooter';
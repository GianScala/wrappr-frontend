// components/DocumentCard/CardDetails.tsx
import React, { FC } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { Document } from './useCardLogic';

interface CardDetailsProps {
  document: Document;
}

const CardDetails: FC<CardDetailsProps> = ({ document }) => {
  const theme = useTheme();

  return (
    <View style={[styles.section, { borderTopColor: theme.colors.border }]}>
      <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>File Details</Text>
      <View style={[styles.contentBlock, {
        backgroundColor: theme.colors.background,
        borderColor: theme.colors.border,
      }]}>
        <Text style={[styles.detailText, { color: theme.colors.text }]}>
          <Text style={{ fontWeight: '600' }}>Original Name: </Text>
          {document.name}
        </Text>
        <Text style={[styles.detailText, { color: theme.colors.text }]}>
          <Text style={{ fontWeight: '600' }}>Type: </Text>
          {document.type}
        </Text>
        <Text style={[styles.detailText, { color: theme.colors.text }]}>
          <Text style={{ fontWeight: '600' }}>Document ID: </Text>
          {document.id}
        </Text>
      </View>

      {document.description && (
        <>
          <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>Description</Text>
          <View style={[styles.contentBlock, {
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border,
          }]}>
            <Text style={[styles.descriptionText, { color: theme.colors.text }]}>
              {document.description}
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

export default CardDetails;

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  contentBlock: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

// components/chat/sources/SourcesFooter.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebSearchData } from '../../../../types/SourcesTypes';

interface SourcesFooterProps {
  webSearchData: WebSearchData;
  colors: Record<string, string>;
}

export const SourcesFooter: React.FC<SourcesFooterProps> = ({
  webSearchData,
  colors
}) => (
  <View style={[styles.footer, { borderTopColor: colors.border }]}>
    <Text style={[styles.footerText, { color: colors.text }]}>
      {webSearchData.tavily_hits_count} results processed
    </Text>
  </View>
);

const styles = StyleSheet.create({
  footer: {
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    opacity: 0.6,
  },
});
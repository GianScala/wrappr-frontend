import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { WebSourceCitation } from '../../../../types/SourcesTypes';

interface SourceCardProps {
  source: WebSourceCitation;
  onPressLink: (url: string) => void;
  colors: Record<string, string>;
  cardWidth: number;
}

export const SourceCard: React.FC<SourceCardProps> = memo(({
  source,
  onPressLink,
  colors,
  cardWidth,
}) => {
  const handlePress = useCallback(() => {
    onPressLink(source.url);
  }, [onPressLink, source.url]);

  return (
    <View style={[styles.wrapper, { width: cardWidth }]}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: pressed
              ? `${colors.primary || '#007AFF'}12`
              : colors.surface || colors.background,
            borderColor: colors.border,
            shadowColor: colors.text,
          },
        ]}
        accessible={true}
        accessibilityLabel={`Source from ${source.domain}: ${source.title}`}
        accessibilityRole="button"
        accessibilityHint="Opens source in browser"
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text
              style={[styles.domain, { color: colors.text }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {source.domain}
            </Text>
            <View style={[styles.citationCircle, { borderColor: colors.primary || '#007AFF' }]}>
              <Text style={[styles.citation, { color: colors.primary || '#007AFF' }]}>
                #{source.citation_number}
              </Text>
            </View>
          </View>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            {source.title}
          </Text>
        </View>
        <View style={[styles.linkIcon, { borderColor: colors.primary || '#007AFF' }]}>
          <Text style={[styles.linkIconText, { color: colors.primary || '#007AFF' }]}>
            ↗
          </Text>
        </View>
      </Pressable>
    </View>
  );
});

SourceCard.displayName = 'SourceCard';

const styles = StyleSheet.create({
  wrapper: {
    marginRight: 12,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: 12, // Reduced from 16
    height: 100, // Reduced from 110
    position: 'relative',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  content: {
    flex: 1,
    paddingRight: 22, // Reduced from 28
    justifyContent: 'space-between', // Better vertical alignment
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6, // Reduced from 8
    height: 20, // Fixed height for proper alignment
  },
  domain: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 10,
    opacity: 0.65,
    fontWeight: '500',
    flex: 1,
    marginRight: 6, // Added margin for better spacing
  },
  citation: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 9, // Reduced from 11
    fontWeight: '700',
    lineHeight: 10, // Adjusted for better circle fit
  },
  citationCircle: {
    width: 20, // Fixed circular size
    height: 20, // Fixed circular size
    borderWidth: 0.5,
    borderRadius: 10, // Perfect circle
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    flex: 1,
  },
  linkIcon: {
    position: 'absolute',
    top: 12,
    right: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderRadius: 10, // Perfect circle to match citation
  },
  linkIconText: {
    fontSize: 10, // Reduced from 14
    fontWeight: '700',
    lineHeight: 10, // Adjusted for better circle fit
  },
});
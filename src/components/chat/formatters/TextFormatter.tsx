import React, { useCallback, useMemo } from 'react';
import { Text, View, StyleSheet, TextStyle } from 'react-native';

interface Props {
  text: string;
  colors: Record<string, string>;
  textStyle?: TextStyle | TextStyle[];
}

export const SimpleTextFormatter: React.FC<Props> = React.memo(({
  text,
  colors,
  textStyle,
}) => {
  const parseContent = useMemo(() => {
    if (!text || typeof text !== 'string') return [];

    // Split into paragraphs and process each
    const sections = text.trim().split(/\n\n+/).filter(section => section.trim());
    const parsedSections = [];

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim();
      const lines = section.split('\n').map(line => line.trim()).filter(Boolean);
      
      // Check if this is a bullet list
      const isBulletSection = lines.every(line => line.match(/^•\s+/));
      
      if (isBulletSection) {
        // Parse bullet list
        const bullets = lines.map(line => line.replace(/^•\s+/, ''));
        parsedSections.push({
          type: 'bulletList',
          content: bullets,
          key: `bullets-${i}`
        });
      } else {
        // Regular paragraph
        parsedSections.push({
          type: 'paragraph',
          content: section,
          key: `paragraph-${i}`
        });
      }
    }

    return parsedSections;
  }, [text]);

  const CitationBadge: React.FC<{ number: string }> = React.memo(({ number }) => (
    <View>
      <Text style={[
        styles.citationText,
        { color: colors.citationText || colors.primary }
      ]}>
        {number}
      </Text>
    </View>
  ));

  const renderInlineContent = useCallback((content: string) => {
    // Enhanced regex for formatting
    const formatRegex = /\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[(\d+)\]|\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = formatRegex.exec(content))) {
      const [fullMatch, bold, italic, code, numCitation, linkTitle, linkUrl] = match;
      const matchIndex = match.index;

      // Add text before match
      if (matchIndex > lastIndex) {
        const textContent = content.slice(lastIndex, matchIndex);
        if (textContent) {
          parts.push(
            <Text key={`text-${lastIndex}`} style={[styles.text, textStyle, { color: colors.text }]}>
              {textContent}
            </Text>
          );
        }
      }

      // Add formatted content
      if (bold) {
        parts.push(
          <Text key={`bold-${matchIndex}`} style={[styles.text, styles.bold, textStyle, { color: colors.text }]}>
            {bold}
          </Text>
        );
      } else if (italic) {
        parts.push(
          <Text key={`italic-${matchIndex}`} style={[styles.text, styles.italic, textStyle, { color: colors.text }]}>
            {italic}
          </Text>
        );
      } else if (code) {
        parts.push(
          <Text key={`code-${matchIndex}`} style={[
            styles.code,
            { 
              color: colors.codeText || colors.text,
              backgroundColor: colors.codeBackground || colors.secondary + '20'
            }
          ]}>
            {code}
          </Text>
        );
      } else if (numCitation) {
        parts.push(<CitationBadge key={`citation-${matchIndex}`} number={numCitation} />);
      } else if (linkTitle && linkUrl) {
        // Web search citation link
        parts.push(
          <Text key={`link-${matchIndex}`} style={[
            styles.text, 
            styles.citationLink,
            { color: colors.linkText || colors.primary }
          ]}>
            {linkTitle}
          </Text>
        );
      }

      lastIndex = matchIndex + fullMatch.length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      const remainingText = content.slice(lastIndex);
      if (remainingText) {
        parts.push(
          <Text key={`text-${lastIndex}`} style={[styles.text, textStyle, { color: colors.text }]}>
            {remainingText}
          </Text>
        );
      }
    }

    return parts;
  }, [colors, textStyle]);

  if (!parseContent.length) return null;

  return (
    <View style={styles.container}>
      {parseContent.map(({ type, content, key }) => {
        if (type === 'bulletList') {
          return (
            <View key={key} style={styles.bulletListContainer}>
              {content.map((bullet, index) => (
                <View key={`${key}-${index}`} style={styles.bulletRow}>
                  <Text style={[styles.bulletPoint, { color: colors.text }]}>•</Text>
                  <View style={styles.bulletContent}>
                    <Text style={[styles.text, textStyle, { color: colors.text }]}>
                      {renderInlineContent(bullet)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          );
        } else {
          return (
            <View key={key} style={styles.paragraphContainer}>
              <Text style={[styles.text, textStyle, { color: colors.text }]}>
                {renderInlineContent(content)}
              </Text>
            </View>
          );
        }
      })}
    </View>
  );
});

SimpleTextFormatter.displayName = 'SimpleTextFormatter';

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
    fontFamily: 'SpaceGrotesk-Regular',
    textAlign: 'left',
  },
  paragraphContainer: {
    marginBottom: 16,
  },
  bulletListContainer: {
    marginBottom: 16,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 4,
    alignItems: 'flex-start',
  },
  bulletPoint: {
    fontSize: 15,
    lineHeight: 24,
    marginRight: 12,
    fontFamily: 'SpaceGrotesk-Regular',
    marginTop: 0,
  },
  bulletContent: {
    flex: 1,
  },
  bold: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontWeight: '700',
  },
  italic: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontStyle: 'italic',
  },
  code: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  citationBadge: {
    minWidth: 24,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  citationText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
    lineHeight: 14,
  },
  citationLink: {
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});
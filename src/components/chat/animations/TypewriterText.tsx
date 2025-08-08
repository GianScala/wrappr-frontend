import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, Animated, StyleSheet, TextStyle, Easing } from 'react-native';

interface TypewriterTextProps {
  text: string;
  colors: Record<string, string>;
  speed?: number;
  onComplete?: () => void;
  textStyle?: TextStyle | TextStyle[];
}

interface FormattedSection {
  type: 'paragraph' | 'bulletList';
  content: string;
  bullets?: string[];
  key: string;
}

interface FormattedElement {
  type: 'text' | 'bold' | 'italic' | 'code' | 'citation' | 'link';
  content: string;
  url?: string;
  number?: string;
}

export const TypewriterText: React.FC<TypewriterTextProps> = React.memo(({
  text,
  colors,
  speed = 4,
  onComplete,
  textStyle,
}) => {
  const [displayedSections, setDisplayedSections] = useState<FormattedSection[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Pre-parse all content into formatted sections
  const formattedSections = useMemo((): FormattedSection[] => {
    if (!text || typeof text !== 'string') return [];

    let cleaned = text.trim();
    
    // Remove AI prefixes
    const prefixes = [/^ai\s+(réponse|response):\s*/i, /^assistant:\s*/i];
    for (const prefix of prefixes) {
      cleaned = cleaned.replace(prefix, '');
    }

    // Split into sections
    const rawSections = cleaned
      .replace(/\s*\/\/\s*/g, '\n\n')
      .split(/\n\n+/)
      .filter(section => section.trim());

    return rawSections.map((section, index) => {
      const lines = section.split('\n').map(line => line.trim()).filter(Boolean);
      const isBulletSection = lines.every(line => line.match(/^•\s+/));
      
      if (isBulletSection) {
        return {
          type: 'bulletList',
          content: section,
          bullets: lines.map(line => line.replace(/^•\s+/, '')),
          key: `bullets-${index}`
        };
      } else {
        return {
          type: 'paragraph',
          content: section,
          key: `paragraph-${index}`
        };
      }
    });
  }, [text]);

  // Parse inline formatting for a text string
  const parseInlineFormatting = useCallback((content: string): FormattedElement[] => {
    const formatRegex = /\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[(\d+)\]|\[([^\]]+)\]\(([^)]+)\)/g;
    const elements: FormattedElement[] = [];
    let lastIndex = 0;

    let match;
    while ((match = formatRegex.exec(content))) {
      const [fullMatch, bold, italic, code, numCitation, linkTitle, linkUrl] = match;
      const matchIndex = match.index;

      // Add text before match
      if (matchIndex > lastIndex) {
        const textContent = content.slice(lastIndex, matchIndex);
        if (textContent) {
          elements.push({ type: 'text', content: textContent });
        }
      }

      // Add formatted element
      if (bold) {
        elements.push({ type: 'bold', content: bold });
      } else if (italic) {
        elements.push({ type: 'italic', content: italic });
      } else if (code) {
        elements.push({ type: 'code', content: code });
      } else if (numCitation) {
        elements.push({ type: 'citation', content: '', number: numCitation });
      } else if (linkTitle && linkUrl) {
        elements.push({ type: 'link', content: linkTitle, url: linkUrl });
      }

      lastIndex = matchIndex + fullMatch.length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      const remainingText = content.slice(lastIndex);
      if (remainingText) {
        elements.push({ type: 'text', content: remainingText });
      }
    }

    return elements;
  }, []);

  // Render formatted elements
  const renderFormattedText = useCallback((content: string, maxLength?: number) => {
    const elements = parseInlineFormatting(content);
    const parts: React.ReactNode[] = [];
    let currentLength = 0;

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      let displayContent = element.content;

      // Truncate if we have a max length
      if (maxLength !== undefined) {
        const remaining = maxLength - currentLength;
        if (remaining <= 0) break;
        
        if (element.type === 'text' || element.type === 'bold' || element.type === 'italic') {
          displayContent = element.content.slice(0, remaining);
          currentLength += displayContent.length;
        } else {
          currentLength += element.content.length;
        }
      }

      const key = `element-${i}`;

      switch (element.type) {
        case 'bold':
          parts.push(
            <Text key={key} style={[styles.text, styles.bold, textStyle, { color: colors.text }]}>
              {displayContent}
            </Text>
          );
          break;
        case 'italic':
          parts.push(
            <Text key={key} style={[styles.text, styles.italic, textStyle, { color: colors.text }]}>
              {displayContent}
            </Text>
          );
          break;
        case 'code':
          parts.push(
            <Text key={key} style={[
              styles.code,
              { 
                color: colors.codeText || colors.text,
                backgroundColor: colors.codeBackground || colors.secondary + '20'
              }
            ]}>
              {displayContent}
            </Text>
          );
          break;
        case 'citation':
          parts.push(
            <View key={key} style={styles.citationBadge}>
              <Text style={[
                styles.citationText,
                { color: colors.citationText || colors.primary }
              ]}>
                {element.number}
              </Text>
            </View>
          );
          break;
        case 'link':
          parts.push(
            <Text key={key} style={[
              styles.text,
              styles.citationLink,
              { color: colors.linkText || colors.primary }
            ]}>
              {displayContent}
            </Text>
          );
          break;
        default:
          parts.push(
            <Text key={key} style={[styles.text, textStyle, { color: colors.text }]}>
              {displayContent}
            </Text>
          );
      }

      if (maxLength !== undefined && currentLength >= maxLength) break;
    }

    return parts;
  }, [colors, textStyle, parseInlineFormatting]);

  // Typewriter effect
  useEffect(() => {
    if (!formattedSections.length) {
      console.log('⌨️ [TypewriterText] No sections to type, calling onComplete immediately');
      onComplete?.();
      return;
    }

    if (isComplete) {
      console.log('⌨️ [TypewriterText] Already complete, not starting effect');
      return;
    }

    console.log('⌨️ [TypewriterText] Starting typewriter effect:', {
      sectionsCount: formattedSections.length,
      currentSection: currentSectionIndex,
      currentChar: currentCharIndex
    });

    intervalRef.current = setInterval(() => {
      const currentSection = formattedSections[currentSectionIndex];
      
      if (!currentSection) {
        console.log('⌨️ [TypewriterText] No more sections, completing');
        setIsComplete(true);
        onComplete?.();
        return;
      }

      // Get content length for current section
      const getContentLength = (section: FormattedSection) => {
        if (section.type === 'bulletList') {
          return section.bullets?.reduce((total, bullet) => total + bullet.length, 0) || 0;
        }
        return section.content.length;
      };

      const totalLength = getContentLength(currentSection);

      if (currentCharIndex < totalLength) {
        // Update current section with partial content
        setDisplayedSections(prev => {
          const newSections = [...prev];
          
          if (currentSection.type === 'bulletList') {
            // Handle bullet lists
            let remainingChars = currentCharIndex + 1;
            const partialBullets: string[] = [];
            
            for (const bullet of currentSection.bullets || []) {
              if (remainingChars <= 0) break;
              if (remainingChars >= bullet.length) {
                partialBullets.push(bullet);
                remainingChars -= bullet.length;
              } else {
                partialBullets.push(bullet.slice(0, remainingChars));
                remainingChars = 0;
              }
            }

            const partialSection: FormattedSection = {
              ...currentSection,
              bullets: partialBullets
            };

            if (newSections[currentSectionIndex]) {
              newSections[currentSectionIndex] = partialSection;
            } else {
              newSections.push(partialSection);
            }
          } else {
            // Handle paragraphs
            const partialContent = currentSection.content.slice(0, currentCharIndex + 1);
            const partialSection: FormattedSection = {
              ...currentSection,
              content: partialContent
            };

            if (newSections[currentSectionIndex]) {
              newSections[currentSectionIndex] = partialSection;
            } else {
              newSections.push(partialSection);
            }
          }

          return newSections;
        });

        setCurrentCharIndex(prev => prev + 1);
      } else {
        // Move to next section
        if (currentSectionIndex < formattedSections.length - 1) {
          console.log('⌨️ [TypewriterText] Moving to next section:', currentSectionIndex + 1);
          setCurrentSectionIndex(prev => prev + 1);
          setCurrentCharIndex(0);
        } else {
          console.log('⌨️ [TypewriterText] All sections complete, calling onComplete');
          setIsComplete(true);
          onComplete?.();
        }
      }
    }, speed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [formattedSections, currentSectionIndex, currentCharIndex, isComplete, speed, onComplete]);

  if (!formattedSections.length) return null;

  return (
    <View style={styles.container}>
      {displayedSections.map((section, index) => {
        if (section.type === 'bulletList') {
          return (
            <View key={section.key} style={styles.bulletListContainer}>
              {section.bullets?.map((bullet, bulletIndex) => (
                <View key={`${section.key}-${bulletIndex}`} style={styles.bulletRow}>
                  <Text style={[styles.bulletPoint, { color: colors.text }]}>•</Text>
                  <View style={styles.bulletContent}>
                    <Text style={[styles.text, textStyle, { color: colors.text }]}>
                      {renderFormattedText(bullet)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          );
        } else {
          return (
            <View key={section.key} style={styles.paragraphContainer}>
              <Text style={[styles.text, textStyle, { color: colors.text }]}>
                {renderFormattedText(section.content)}
              </Text>
            </View>
          );
        }
      })}
    </View>
  );
});

TypewriterText.displayName = 'TypewriterText';

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
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
    borderWidth: 1,
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
import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, LayoutAnimation, Platform, UIManager, Dimensions } from 'react-native';
import { useSourcesData } from '../../../../src/hooks/useSourcesData';
import { WebSourceCitation, WebSearchData, FilterType } from '../../../../types/SourcesTypes';
import { SourcesHeader } from './SourcesHeader';
import { SourcesContent } from './SourcesContent';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  sources: WebSourceCitation[] | any[]; // Accept both formats
  webSearchData: WebSearchData;
  colors: Record<string, string>;
  messageId: string;
  responseText?: string; // Add response text to extract citations
}

export const SourcesSection: React.FC<Props> = React.memo(({
  sources,
  webSearchData,
  colors,
  messageId,
  responseText = ''
}) => {
  console.log('🏗️ [SourcesSection] Initializing with:', {
    messageId,
    sourcesLength: sources?.length,
    sourcesType: Array.isArray(sources) ? 'array' : typeof sources,
    firstSource: sources?.[0],
    responseTextLength: responseText?.length,
    responseTextPreview: responseText?.substring(0, 200),
    webSearchData: {
      search_performed: webSearchData?.search_performed,
      sources_count: webSearchData?.sources_count,
      web_source_citations_count: webSearchData?.web_source_citations_count,
      sources_length: webSearchData?.sources?.length,
      citations_length: webSearchData?.web_source_citations?.length
    }
  });

  const [activeFilter, setActiveFilter] = useState<FilterType>('sources');
  const [isCollapsed, setIsCollapsed] = useState(true);
  const rotateAnim = useMemo(() => new Animated.Value(0), []);

  // Extract citation numbers from the response text
  const citedNumbers = useMemo(() => {
    console.log('🔍 [SourcesSection] Analyzing response text:', {
      messageId,
      hasResponseText: Boolean(responseText),
      responseTextLength: responseText?.length || 0,
      responseTextPreview: responseText?.substring(0, 300) + '...',
      responseTextFull: responseText // Log full text for debugging
    });

    if (!responseText) {
      console.log('⚠️ [SourcesSection] No response text provided, showing all sources');
      return new Set<number>();
    }
    
    // Try multiple citation patterns
    const patterns = [
      /\[(\d+)\]/g,           // [1], [2], [3]
      /\((\d+)\)/g,           // (1), (2), (3)  
      /\^(\d+)/g,             // ^1, ^2, ^3
      /\s(\d+)\s/g,           // spaced numbers
      /source\s*(\d+)/gi,     // source 1, source 2
      /ref\s*(\d+)/gi         // ref 1, ref 2
    ];
    
    let allNumbers: number[] = [];
    
    patterns.forEach((pattern, index) => {
      const matches = responseText.match(pattern);
      if (matches) {
        const numbers = matches.map(match => {
          const num = match.replace(/[\[\]()^]/g, '').replace(/source\s*/gi, '').replace(/ref\s*/gi, '').trim();
          return parseInt(num);
        }).filter(n => !isNaN(n) && n > 0);
        
        if (numbers.length > 0) {
          console.log(`🎯 [SourcesSection] Pattern ${index + 1} (${pattern}) found:`, {
            matches,
            extractedNumbers: numbers
          });
          allNumbers = [...allNumbers, ...numbers];
        }
      }
    });
    
    // Remove duplicates and sort
    const uniqueNumbers = [...new Set(allNumbers)].sort((a, b) => a - b);
    
    console.log('🔢 [SourcesSection] Final citation analysis:', {
      messageId,
      responseTextLength: responseText.length,
      allNumbersFound: allNumbers,
      uniqueNumbers,
      totalCitationsFound: uniqueNumbers.length,
      willFilterSources: uniqueNumbers.length > 0
    });
    
    return new Set(uniqueNumbers);
  }, [responseText, messageId]);

  // Normalize and filter sources to only show cited ones
  const normalizedSources = useMemo(() => {
    if (!sources || !Array.isArray(sources)) {
      console.log('❌ [SourcesSection] Invalid sources data:', sources);
      return [];
    }

    const normalized = sources.map((source, index) => {
      // If it's already in the correct format
      if (source.id && source.title && source.url) {
        return source as WebSourceCitation;
      }

      // If it's in the basic sources format, convert it
      return {
        id: source.id || `source-${index}`,
        title: source.title || 'Untitled Source',
        url: source.url || '',
        snippet: source.snippet || source.description || '',
        domain: source.domain || (source.url ? new URL(source.url).hostname : ''),
        favicon_url: source.favicon_url || source.favicon,
        citation_number: index + 1,
        images: source.images || [],
        video_metadata: source.video_metadata,
        result_type: source.result_type || 'web'
      } as WebSourceCitation;
    });

    // Filter to only include sources that were actually cited
    // If no citations found in text, show first 3 sources as fallback (safer than showing all)
    const citedSources = citedNumbers.size > 0 ? 
      normalized.filter(source => {
        const isCited = citedNumbers.has(source.citation_number);
        console.log(`🎯 [SourcesSection] Source ${source.citation_number} (${source.title.substring(0, 40)}...) cited: ${isCited}`);
        return isCited;
      }) : 
      normalized.slice(0, 3); // Show only first 3 if no citations found

    console.log('🔄 [SourcesSection] Source filtering result:', {
      messageId,
      totalSources: normalized.length,
      citedNumbers: Array.from(citedNumbers),
      citedSourcesCount: citedSources.length,
      showingAll: citedNumbers.size === 0,
      citedTitles: citedSources.map(s => `${s.citation_number}: ${s.title.substring(0, 30)}...`),
      finalSourceIds: citedSources.map(s => s.citation_number)
    });

    return citedSources;
  }, [sources, messageId, citedNumbers]);

  const { validatedSources, mediaData, filterCounts } = useSourcesData(normalizedSources, webSearchData);

  console.log('📊 [SourcesSection] useSourcesData result:', {
    messageId,
    validatedSourcesCount: validatedSources.length,
    filterCounts,
    mediaData: {
      imagesCount: mediaData.images?.length || 0,
      videosCount: mediaData.videos?.length || 0
    }
  });

  const hasAnySources = useMemo(() => {
    const result = filterCounts.sources > 0 || filterCounts.images > 0 || filterCounts.videos > 0;
    console.log('🎯 [SourcesSection] hasAnySources check:', {
      messageId,
      filterCounts,
      hasAnySources: result
    });
    return result;
  }, [filterCounts, messageId]);

  const cardWidth = useMemo(() => 
    Math.min(Dimensions.get('window').width * 0.85, 300),
    []
  );

  const toggleCollapse = useCallback(() => {
    console.log('🎭 [SourcesSection] Toggling collapse:', { 
      messageId, 
      currentState: isCollapsed ? 'collapsed' : 'expanded',
      newState: isCollapsed ? 'expanded' : 'collapsed'
    });
    
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCollapsed(prev => !prev);
    
    Animated.timing(rotateAnim, {
      toValue: isCollapsed ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isCollapsed, rotateAnim, messageId]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  if (!hasAnySources) {
    console.log('❌ [SourcesSection] No sources available, showing error state');
    return (
      <View style={[styles.errorContainer, { backgroundColor: `${colors.warning || '#666'}15` }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          🔍 No sources available
        </Text>
      </View>
    );
  }

  console.log('✅ [SourcesSection] Rendering sources section with:', {
    messageId,
    isCollapsed,
    activeFilter,
    totalSources: filterCounts.sources + filterCounts.images + filterCounts.videos
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.surface || colors.background }]}>
      <Pressable
        onPress={toggleCollapse}
        style={({ pressed }) => [
          styles.header,
          {
            borderBottomColor: colors.border,
            opacity: pressed ? 0.7 : 1,
          }
        ]}
        accessibilityLabel={`${isCollapsed ? 'Show' : 'Hide'} sources`}
        accessibilityRole="button"
      >
        <Text style={[styles.headerText, { color: colors.text }]}>
          Sources ({filterCounts.sources + filterCounts.images + filterCounts.videos})
        </Text>
        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
          <Text style={[styles.chevron, { color: colors.text }]}>▼</Text>
        </Animated.View>
      </Pressable>

      {!isCollapsed && (
        <View style={styles.content}>
          <SourcesHeader
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            filterCounts={filterCounts}
            colors={colors}
          />
          <SourcesContent
            activeFilter={activeFilter}
            validatedSources={validatedSources}
            mediaData={mediaData}
            colors={colors}
            cardWidth={cardWidth}
          />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  headerText: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chevron: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    backgroundColor: 'transparent',
  },
  errorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 4,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '400',
    opacity: 0.7,
  },
});
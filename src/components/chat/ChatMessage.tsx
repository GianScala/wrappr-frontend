import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ToastAndroid,
  Alert,
  Animated,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SimpleTextFormatter } from './formatters/TextFormatter';
import { TypewriterText } from './animations/TypewriterText';
import { ThinkingDots } from './animations/ThinkingDots';
import { SourcesSection } from './sources/SourcesSection';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Type definitions
export interface WebSourceCitation {
  id: string;
  title: string;
  url: string;
  snippet: string;
  domain: string;
  favicon_url?: string;
  citation_number: number;
  images: string[];
  video_metadata?: any;
  result_type?: string;
}

export interface WebSearchData {
  enabled: boolean;
  search_performed: boolean;
  sources: Array<{ title: string; url: string; snippet: string }>;
  sources_count: number;
  web_source_citations: WebSourceCitation[];
  web_source_citations_count: number;
  tavily_hits_count: number;
  images_count: number;
}

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp?: Date | string | null;
  model?: string;
  tokens?: { prompt: number; completion: number; total: number };
  cost?: { input: number; output: number; total: number; currency: string };
  isLoading?: boolean;
  web_search?: WebSearchData;
}

interface ChatMessageProps {
  message: Message;
  index: number;
  colors: Record<string, string>;
}

// Constants for better maintainability
const ANIMATION_DURATION = 250;
const ANIMATION_DELAY_MULTIPLIER = 30;
const COPY_SUCCESS_MESSAGE = 'Copied to clipboard';

// Custom hook for animations - optimized to prevent unnecessary re-creation
const useMessageAnimations = (index: number) => {
  const slideAnim = useRef(new Animated.Value(15)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const hasAnimated = useRef(false);

  const startAnimations = useCallback(() => {
    // Prevent re-running animations
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const delay = index * ANIMATION_DELAY_MULTIPLIER;
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, slideAnim, fadeAnim, scaleAnim]);

  return { slideAnim, fadeAnim, scaleAnim, startAnimations };
};

// Main component
const ChatMessage: React.FC<ChatMessageProps> = React.memo(({ message, index, colors }) => {
  // Early return for invalid message
  if (!message?.id) {
    console.error('❌ [ChatMessage] Invalid message at index:', index);
    return <ErrorMessage colors={colors} />;
  }

  const { id, isUser, isLoading, text, timestamp, model, tokens, cost, web_search } = message;
  
  // Optimize typing state initialization and management
  const [isTyping, setIsTyping] = useState(() => {
    // Only start typing if it's an AI message with text that's not loading
    return !isUser && !isLoading && Boolean(text) && text.length > 0;
  });
  
  // Track previous loading state to detect transitions
  const prevLoadingRef = useRef(isLoading);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  const { slideAnim, fadeAnim, scaleAnim, startAnimations } = useMessageAnimations(index);

  // Effects
  useEffect(() => {
    startAnimations();
  }, [startAnimations]);

  // Optimized effect for handling loading to content transition
  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    const isNowLoaded = !isLoading;
    
    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Handle transition from loading to loaded with text
    if (wasLoading && isNowLoaded && !isUser && text && text.length > 0) {
      // Start typing animation for new content
      setIsTyping(true);
      
      // Safety timeout to prevent stuck typing state
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, Math.max(5000, text.length * 50)); // Dynamic timeout based on text length
    }
    
    // If loading starts, stop typing
    if (isLoading && !wasLoading) {
      setIsTyping(false);
    }
    
    prevLoadingRef.current = isLoading;
    
    // Cleanup timeout on unmount
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isLoading, isUser, text]);

  // Memoized values - optimized to prevent unnecessary recalculations
  const formattedTime = useMemo(() => {
    if (!timestamp) return '';
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      return isNaN(date.getTime()) 
        ? '' 
        : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }, [timestamp]);

  const webSearchMemo = useMemo(() => {
    console.log('🔍 [ChatMessage] WebSearch Debug:', {
      messageId: id,
      search_performed: web_search?.search_performed,
      citations_array_length: web_search?.web_source_citations?.length,
      citations_count_property: web_search?.web_source_citations_count,
      sources_array_length: web_search?.sources?.length,
      sources_count_property: web_search?.sources_count,
      full_web_search_object: web_search
    });

    // Check both the actual array length and the count property
    const citationsArray = web_search?.web_source_citations || [];
    const sourcesArray = web_search?.sources || [];
    
    const hasWebSources = Boolean(
      web_search?.search_performed && 
      (citationsArray.length > 0 || sourcesArray.length > 0)
    );
    
    // Use actual array length as primary source of truth
    const sourcesCount = Math.max(
      citationsArray.length,
      sourcesArray.length,
      web_search?.web_source_citations_count || 0,
      web_search?.sources_count || 0
    );

    console.log('🎯 [ChatMessage] WebSearch Result:', {
      messageId: id,
      hasWebSources,
      sourcesCount,
      willShowSources: hasWebSources && !isLoading && !isTyping
    });

    return { hasWebSources, sourcesCount, citationsArray, sourcesArray };
  }, [
    id,
    isLoading, 
    isTyping,
    web_search?.search_performed, 
    web_search?.web_source_citations?.length, 
    web_search?.web_source_citations_count,
    web_search?.sources?.length,
    web_search?.sources_count
  ]);

  // Callbacks - optimized to prevent unnecessary re-renders
  const copyToClipboard = useCallback(async () => {
    if (!text?.trim()) return;
    
    try {
      await Clipboard.setStringAsync(text);
      const successMessage = COPY_SUCCESS_MESSAGE;
      
      if (Platform.OS === 'android') {
        ToastAndroid.show(successMessage, ToastAndroid.SHORT);
      } else {
        Alert.alert('', successMessage);
      }
    } catch (error) {
      console.error('❌ [ChatMessage] Copy failed:', error);
      const errorMessage = 'Failed to copy';
      
      if (Platform.OS === 'android') {
        ToastAndroid.show(errorMessage, ToastAndroid.SHORT);
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  }, [text]);

  const handleTypingComplete = useCallback(() => {
    console.log('⌨️ [ChatMessage] Typing completed for message:', id);
    
    // Clear timeout when typing completes naturally
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Use a more subtle animation for typing completion
    LayoutAnimation.configureNext({
      duration: 150,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
    
    setIsTyping(false);
    
    // Log state after typing completion
    setTimeout(() => {
      console.log('📝 [ChatMessage] State after typing completion:', {
        messageId: id,
        isTyping: false,
        isLoading,
        hasWebSearch: Boolean(web_search?.search_performed),
        sourcesAvailable: Boolean(web_search?.web_source_citations?.length || web_search?.sources?.length)
      });
    }, 200);
  }, [id, isLoading, web_search]);

  // Memoized animation styles to prevent recalculation
  const animatedStyle = useMemo(() => ({
    opacity: fadeAnim,
    transform: [
      { translateY: slideAnim },
      { scale: scaleAnim }
    ],
  }), [fadeAnim, slideAnim, scaleAnim]);

  // Render user message
  if (isUser) {
    return (
      <Animated.View
        style={[
          styles.messageBlock,
          styles.userBlock,
          animatedStyle,
          { backgroundColor: colors.background }
        ]}
      >
        <View style={styles.userContent}>
          <Pressable
            onLongPress={copyToClipboard}
            style={({ pressed }) => [
              styles.pressableContent,
              { opacity: pressed ? 0.8 : 1 }
            ]}
            accessibilityLabel="Copy user message"
            accessibilityRole="button"
            accessibilityHint="Long press to copy message"
          >
            <SimpleTextFormatter
              text={text}
              colors={colors}
              textStyle={[styles.userText, { color: colors.text }]}
            />
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  // Render AI message
  return (
    <Animated.View
      style={[
        styles.messageBlock,
        styles.aiBlock,
        animatedStyle,
        { backgroundColor: colors.background }
      ]}
    >
      {/* Header */}
      <MessageHeader
        hasWebSources={webSearchMemo.hasWebSources}
        sourcesCount={webSearchMemo.sourcesCount}
        formattedTime={formattedTime}
        colors={colors}
      />

      {/* Content */}
      <View style={styles.aiContent}>
        {isLoading ? (
          <ThinkingDots colors={colors} />
        ) : (
          <Pressable
            onLongPress={copyToClipboard}
            style={({ pressed }) => [
              styles.pressableContent,
              { opacity: pressed ? 0.8 : 1 }
            ]}
            accessibilityLabel="Copy AI response"
            accessibilityRole="button"
            accessibilityHint="Long press to copy response"
          >
            <ContentRenderer
              text={text}
              isTyping={isTyping}
              colors={colors}
              onTypingComplete={handleTypingComplete}
            />
          </Pressable>
        )}
      </View>

      {/* Sources */}
      {(() => {
        const shouldShowSources = webSearchMemo.hasWebSources && !isLoading && !isTyping;
        console.log('📋 [ChatMessage] Sources Render Check:', {
          messageId: id,
          hasWebSources: webSearchMemo.hasWebSources,
          isLoading,
          isTyping,
          shouldShowSources,
          citationsLength: webSearchMemo.citationsArray.length,
          sourcesLength: webSearchMemo.sourcesArray.length
        });

        if (!shouldShowSources) {
          console.log('❌ [ChatMessage] Not showing sources because:', {
            hasWebSources: webSearchMemo.hasWebSources,
            isLoading,
            isTyping
          });
          return null;
        }

        // Use citations array if available, otherwise fall back to sources array
        const sourcesToUse = webSearchMemo.citationsArray.length > 0 
          ? webSearchMemo.citationsArray 
          : webSearchMemo.sourcesArray;

        console.log('✅ [ChatMessage] Rendering SourcesSection with:', {
          messageId: id,
          sourcesToUse: sourcesToUse.length,
          usingCitations: webSearchMemo.citationsArray.length > 0
        });

        return (
          <View style={styles.sourcesWrapper}>
            <SourcesSection
              sources={sourcesToUse}
              webSearchData={web_search!}
              colors={colors}
              messageId={id}
            />
          </View>
        );
      })()}

      {/* Footer */}
      {!isLoading && !isTyping && (
        <MessageFooter
          model={model}
          hasWebSources={webSearchMemo.hasWebSources}
          sourcesCount={webSearchMemo.sourcesCount}
          tokens={tokens}
          cost={cost}
          colors={colors}
        />
      )}
    </Animated.View>
  );
});

// Optimized content renderer to prevent unnecessary re-renders
const ContentRenderer: React.FC<{
  text: string;
  isTyping: boolean;
  colors: Record<string, string>;
  onTypingComplete: () => void;
}> = React.memo(({ text, isTyping, colors, onTypingComplete }) => {
  console.log('🎭 [ContentRenderer] Rendering with:', { 
    textLength: text?.length, 
    isTyping, 
    hasText: Boolean(text) 
  });

  if (isTyping && text && text.length > 0) {
    return (
      <TypewriterText
        text={text}
        colors={colors}
        onComplete={onTypingComplete}
      />
    );
  }
  
  return <SimpleTextFormatter text={text} colors={colors} />;
});

// Subcomponents for better organization
const ErrorMessage: React.FC<{ colors: Record<string, string> }> = React.memo(({ colors }) => (
  <View style={[styles.errorContainer, { backgroundColor: colors.error || '#FF000020' }]}>
    <Text style={[styles.errorText, { color: colors.text || '#FF0000' }]}>
      ⚠️ Message data unavailable
    </Text>
  </View>
));

interface MessageHeaderProps {
  hasWebSources: boolean;
  sourcesCount: number;
  formattedTime: string;
  colors: Record<string, string>;
}

const MessageHeader: React.FC<MessageHeaderProps> = React.memo(({
  hasWebSources,
  sourcesCount,
  formattedTime,
  colors
}) => (
  <View style={[styles.aiHeader, { borderBottomColor: colors.border }]}>
    <View style={styles.aiHeaderLeft}>
      <Text style={[styles.aiLabel, { color: colors.text }]}>ANSWER</Text>
      {hasWebSources && (
        <View style={styles.badgeContainer}>
          <View style={[styles.searchBadge, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.searchBadgeText, { color: colors.background }]}>
              {sourcesCount} Source{sourcesCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      )}
    </View>
    {formattedTime && (
      <Text style={[styles.time, { color: colors.text }]}>{formattedTime}</Text>
    )}
  </View>
));

interface MessageFooterProps {
  model?: string;
  hasWebSources: boolean;
  sourcesCount: number;
  tokens?: { prompt: number; completion: number; total: number };
  cost?: { input: number; output: number; total: number; currency: string };
  colors: Record<string, string>;
}

const MessageFooter: React.FC<MessageFooterProps> = React.memo(({
  model,
  hasWebSources,
  sourcesCount,
  tokens,
  cost,
  colors
}) => (
  <View style={[styles.aiFooter, { borderTopColor: colors.border }]}>
    <View style={styles.metaGroup}>
      {model && <Text style={[styles.meta, { color: colors.text }]}>{model}</Text>}
      {hasWebSources && (
        <Text style={[styles.meta, { color: colors.text }]}>
          {sourcesCount} source{sourcesCount !== 1 ? 's' : ''}
        </Text>
      )}
    </View>
    <View style={styles.metaGroup}>
      {tokens && tokens.total > 0 && (
        <Text style={[styles.meta, { color: colors.text }]}>
          {tokens.total.toLocaleString()}T
        </Text>
      )}
      {cost && cost.total > 0 && (
        <Text style={[styles.meta, { color: colors.text }]}>
          ${cost.total.toFixed(4)}
        </Text>
      )}
    </View>
  </View>
));

export default ChatMessage;

const styles = StyleSheet.create({
  messageBlock: {
    marginVertical: 3,
    padding: 4,
  },
  userBlock: {
    paddingHorizontal: 16,
  },
  userContent: {
    paddingVertical: 6,
  },
  userText: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 18,
    lineHeight: 26,
  },
  aiBlock: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginVertical: 4,
    borderRadius: 8,
  },
  aiHeader: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 14,
    borderBottomWidth: 0.5,
  },
  aiHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  aiLabel: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    opacity: 0.7,
    letterSpacing: 0.5,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  searchBadgeText: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 10,
    fontWeight: '500',
  },
  time: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 11,
    opacity: 0.6,
    fontWeight: '500',
  },
  aiContent: {
    marginBottom: 6,
  },
  sourcesWrapper: {
    marginTop: 4,
    marginBottom: 8,
  },
  aiFooter: {
    fontFamily: 'SpaceGrotesk-Regular',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 10,
    borderTopWidth: 0.5,
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  meta: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 10,
    opacity: 0.6,
    fontWeight: '500',
  },
  pressableContent: {
    borderRadius: 4,
  },
  errorContainer: {
    padding: 16,
    borderRadius: 8,
    margin: 4,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
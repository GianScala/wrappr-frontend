// components/chat/ChatMessages.tsx
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useTheme } from '../../../src/contexts/ThemeContext';
import ChatMessage from './ChatMessage';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp?: Date | string | null;
  model?: string;
  tokens?: { prompt: number; completion: number; total: number };
  cost?: { input: number; output: number; total: number; currency: string };
  isLoading?: boolean;
}

interface ChatMessagesProps {
  messages: Message[];
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  const { colors } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => (
      <ChatMessage message={item} index={index} colors={colors} />
    ),
    [colors]
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const handleScroll = useCallback(
    (event: any) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const threshold = 100;
      const nearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - threshold;
      setIsNearBottom(nearBottom);
    },
    []
  );

  // Auto-scroll to bottom when new messages arrive and user is near bottom
  useEffect(() => {
    if (isNearBottom && messages.length > 0) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length, isNearBottom]);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: 120, // Approximate item height
      offset: 120 * index,
      index,
    }),
    []
  );

  const handleScrollToEnd = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        style={styles.flatList}
        contentContainerStyle={[
          styles.contentContainer,
          { backgroundColor: colors.background }
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        removeClippedSubviews={true}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={5}
        getItemLayout={getItemLayout}
        showsVerticalScrollIndicator={false}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 100,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexGrow: 1,
  },
});

export default ChatMessages;
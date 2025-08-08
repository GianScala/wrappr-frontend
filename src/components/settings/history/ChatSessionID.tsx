import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import { useChatHistory } from '../../../../src/hooks/useChatHistory';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
}

interface ChatSessionIDProps {
  sessionId: string;
  onBack: () => void;
}

export default function ChatSessionID({ sessionId, onBack }: ChatSessionIDProps) {
  const theme = useTheme();
  const { getSessionMessages } = useChatHistory();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, [sessionId]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const msgs = await getSessionMessages(sessionId);
      setMessages(msgs);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const MessageItem = ({ message }: { message: ChatMessage }) => (
    <View style={[
      styles.messageItem, 
      { 
        backgroundColor: message.role === 'user' 
          ? theme.colors.primary + '20' 
          : theme.colors.surface,
        alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
      }
    ]}>
      <Text style={[styles.messageRole, { color: theme.colors.secondary }]}>
        {message.role.toUpperCase()}
      </Text>
      <Text style={[styles.messageContent, { color: theme.colors.text }]}>
        {message.content}
      </Text>
      <Text style={[styles.messageTime, { color: theme.colors.secondary }]}>
        {message.timestamp.toLocaleTimeString()}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {sessionId.substring(0, 12)}...
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.secondary }]}>
            Loading messages...
          </Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.secondary }]}>
            No messages in this session
          </Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageItem message={item} />}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  messagesList: {
    padding: 16,
    gap: 12,
  },
  messageItem: {
    padding: 12,
    borderRadius: 12,
    maxWidth: '85%',
  },
  messageRole: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 10,
  },
});
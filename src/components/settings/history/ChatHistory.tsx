import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import { useAuth } from '../../../../src/contexts/AuthContext';
import { useChatHistory } from '../../../../src/hooks/useChatHistory';
import ChatSessionID from './ChatSessionID';

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
  model: string;
}

export default function ChatHistory() {
  const theme = useTheme();
  const { profile } = useAuth();
  const { chatSessions, deleteSession, subscribeToUserSessions } = useChatHistory();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.uid) {
      const unsubscribe = subscribeToUserSessions(profile.uid);
      return () => unsubscribe();
    }
  }, [profile?.uid, subscribeToUserSessions]);

  const handleDeleteSession = async (sessionId: string) => {
    Alert.alert(
      "Delete Session",
      `Delete session ${sessionId.substring(0, 8)}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
          try {
            await deleteSession(sessionId);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete session');
          }
        }}
      ]
    );
  };

  const SessionItem = ({ session }: { session: ChatSession }) => (
    <View style={[styles.sessionItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <TouchableOpacity 
        style={styles.sessionInfo}
        onPress={() => setSelectedSessionId(session.id)}
      >
        <Text style={[styles.sessionId, { color: theme.colors.primary }]}>
          {session.id}
        </Text>
        <Text style={[styles.sessionMeta, { color: theme.colors.secondary }]}>
          {session.messageCount} messages • {session.model}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => handleDeleteSession(session.id)}
        style={[styles.deleteButton, { backgroundColor: theme.colors.error }]}
      >
        <Ionicons name="trash" size={16} color="white" />
      </TouchableOpacity>
    </View>
  );

  if (selectedSessionId) {
    return (
      <ChatSessionID 
        sessionId={selectedSessionId} 
        onBack={() => setSelectedSessionId(null)} 
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.header}>
        <Ionicons name="chatbubbles" size={20} color={theme.colors.primary} />
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Chat Sessions ({chatSessions.length})
        </Text>
      </View>

      {chatSessions.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.colors.secondary }]}>
          No sessions yet
        </Text>
      ) : (
        <FlatList
          data={chatSessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SessionItem session={item} />}
          contentContainerStyle={styles.sessionsList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    maxHeight: 400,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  sessionsList: {
    paddingBottom: 8,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionId: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  sessionMeta: {
    fontSize: 11,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 20,
  },
});
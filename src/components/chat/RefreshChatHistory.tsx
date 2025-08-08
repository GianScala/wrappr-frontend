// app/(tabs)/components/chat/RefreshChatHistory.tsx
import React, { useState } from 'react';
import { TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RefreshChatHistoryProps {
  onRefresh: () => Promise<void>;
  theme: any;
}

const RefreshChatHistory: React.FC<RefreshChatHistoryProps> = ({ onRefresh, theme }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;

    Alert.alert(
      'New Chat Session',
      'Start a new chat conversation? This will clear your current chat history.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'New Chat',
          style: 'default',
          onPress: async () => {
            try {
              setIsRefreshing(true);
              await onRefresh();
              console.log('[RefreshChatHistory] Chat history refreshed successfully');
            } catch (error) {
              console.error('[RefreshChatHistory] Failed to refresh chat history:', error);
              Alert.alert('Error', 'Failed to start new chat session. Please try again.');
            } finally {
              setIsRefreshing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      onPress={handleRefresh}
      style={[
        styles.refreshButton,
        { 
          backgroundColor: theme.colors.primary,
          opacity: isRefreshing ? 0.6 : 1,
          ...theme.shadows?.sm
        },
      ]}
      activeOpacity={0.7}
      disabled={isRefreshing}
    >
      <Ionicons 
        name={isRefreshing ? "hourglass" : "chatbubble-outline"} 
        size={20} 
        color="#fff" 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});

export default RefreshChatHistory;
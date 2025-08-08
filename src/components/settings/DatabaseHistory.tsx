// components/DatabaseHistory.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/contexts/ThemeContext';
import ChatHistory from './history/ChatHistory';
import Database from './database/Database';

export default function DatabaseHistory() {
  const theme = useTheme();
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showDatabase, setShowDatabase] = useState(false);

  const handleChatSelect = (chatId: string) => {
    console.log('Selected chat:', chatId);
    setShowChatHistory(false);
  };

  const handleDatabaseClose = () => {
    console.log('🟡 DatabaseHistory: handleDatabaseClose called');
    setShowDatabase(false);
  };

  const historyItems = [
    {
      id: 'chat-history',
      title: 'Chat History',
      subtitle: 'View your conversation history',
      icon: 'chatbubbles' as const,
      color: '#f59e0b',
      action: () => {
        console.log('🟡 Opening chat history');
        setShowChatHistory(true);
      }
    },
    {
      id: 'database-rag',
      title: 'Database',
      subtitle: 'View your knowledge database',
      icon: 'server' as const,
      color: '#8b5cf6',
      action: () => {
        console.log('🟡 Opening database');
        setShowDatabase(true);
      }
    }
  ];

  const styles = StyleSheet.create({
    container: {
      marginVertical: 2,
      paddingVertical: 4,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 4,
      paddingVertical: 12,
    },
    iconContainer: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.primary + '10',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: '500',
      fontFamily: 'SpaceGrotesk-Regular',
      color: theme.colors.text,
    },
    contentSection: {
      paddingVertical: 4,
      paddingHorizontal: 4,
    },
    historyContainer: {
      backgroundColor: theme.colors.background,
      borderRadius: 18,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      paddingVertical: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    historyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    historyIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    historyContent: {
      flex: 1,
    },
    historyTitle: {
      fontSize: 14,
      fontWeight: '500',
      fontFamily: 'SpaceGrotesk-Regular',
      color: theme.colors.text,
      marginBottom: 2,
    },
    historySubtitle: {
      fontSize: 12,
      fontFamily: 'SpaceGrotesk-Regular',
      color: theme.colors.secondary,
    },
    separator: {
      height: 0.5,
      backgroundColor: theme.colors.border,
      marginHorizontal: 16,
    },
  });

  return (
    <>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="server" size={16} color={theme.colors.primary} />
          </View>
          <Text style={styles.title}>Your Data</Text>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          <View style={styles.historyContainer}>
            {historyItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <TouchableOpacity
                  onPress={() => {
                    console.log(`🟡 Pressed ${item.title}`);
                    item.action();
                  }}
                  style={styles.historyButton}
                  activeOpacity={0.8}
                >
                  <View style={[styles.historyIconContainer, {
                    backgroundColor: `${item.color}10`,
                  }]}>
                    <Ionicons name={item.icon} size={16} color={item.color} />
                  </View>
                  
                  <View style={styles.historyContent}>
                    <Text style={styles.historyTitle}>{item.title}</Text>
                    <Text style={styles.historySubtitle}>{item.subtitle}</Text>
                  </View>
                  
                  <Ionicons 
                    name="chevron-forward" 
                    size={16} 
                    color={theme.colors.secondary}
                  />
                </TouchableOpacity>
                
                {index < historyItems.length - 1 && (
                  <View style={styles.separator} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>
      </View>

      {/* Modals */}
      <Modal
        visible={showChatHistory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          console.log('🟡 Chat history modal onRequestClose');
          setShowChatHistory(false);
        }}
      >
        <ChatHistory onChatSelect={handleChatSelect} />
      </Modal>

      <Modal
        visible={showDatabase}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          console.log('🟡 Database modal onRequestClose');
          setShowDatabase(false);
        }}
      >
        <Database onClose={handleDatabaseClose} />
      </Modal>
    </>
  );
}
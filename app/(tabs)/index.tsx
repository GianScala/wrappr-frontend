// app/(tabs)/index.tsx - AI Style Controller that works with your existing jm-chat.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Octicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import HamburgerIcon from '../../assets/icons/hamburger-icon';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { useAppContext } from '../../src/contexts/AppContext';

// Import your existing ChatScreen component
import ChatScreen from './jm-chat';

const MEMORY_COLOR = '#8B5CF6';
const AI_STYLES = [
  { 
    id: 'concise', 
    label: 'Concise', 
    description: 'Brief and to the point',
    icon: 'flash' as const,
    color: '#3b82f6'
  },
  { 
    id: 'exhaustive', 
    label: 'Exhaustive', 
    description: 'Detailed and comprehensive',
    icon: 'library' as const,
    color: '#8b5cf6'
  },
  { 
    id: 'friendly', 
    label: 'Friendly', 
    description: 'Warm and conversationally engaging',
    icon: 'happy' as const,
    color: '#10b981'
  },
];

export default function MainChatScreen() {
  console.log('🔧 MainChatScreen: Rendering main AI chat interface...');
  
  const theme = useTheme();
  const { profile, updateUserProfile, user } = useAuth();
  
  // Safely access AppContext with error boundary
  const [appContextError, setAppContextError] = useState<string | null>(null);
  let appContext = null;
  
  try {
    appContext = useAppContext();
    console.log('✅ AppContext loaded successfully:', {
      isReady: appContext.isReady,
      selectedModel: appContext.selectedTextModel,
      canUseWebSearch: appContext.canUseWebSearch,
    });
  } catch (error) {
    console.error('❌ AppContext error:', error);
    const errorMessage = error?.message || 'AppContext not available';
    if (appContextError !== errorMessage) {
      setAppContextError(errorMessage);
    }
  }

  // Safely access orchestrator with fallback
  const [orchestratorError, setOrchestratorError] = useState<string | null>(null);
  let startNewSession = null;
  
  try {
    const { useOrchestrator } = require('../../src/hooks/useOrchestrator');
    const orchestrator = useOrchestrator();
    startNewSession = orchestrator?.startNewSession;
    console.log('✅ useOrchestrator loaded successfully');
  } catch (error) {
    console.warn('⚠️ useOrchestrator not available:', error);
    const errorMessage = error?.message || 'useOrchestrator not available';
    if (orchestratorError !== errorMessage) {
      setOrchestratorError(errorMessage);
    }
    
    // Create a fallback function
    startNewSession = () => {
      console.log('🔄 New session requested (fallback)');
      setChatKey(`chat-${Date.now()}`);
    };
  }

  // State for chat interface
  const [chatKey, setChatKey] = useState<string>('chat');
  const [memoryActive, setMemoryActive] = useState(false);
  const [styleModalVisible, setStyleModalVisible] = useState(false);

  const styles = useMemo(() => createStyles(theme), [theme]);

  // Get current AI style with fallback
  const currentStyle = useMemo(() => {
    const style = AI_STYLES.find(style => style.id === profile?.aiStyle);
    return style || AI_STYLES[2]; // Default to friendly
  }, [profile?.aiStyle]);

  // Handle new chat session
  const handleNewSession = useCallback(async () => {
    try {
      console.log('🔄 Starting new session...');
      if (startNewSession && typeof startNewSession === 'function') {
        await startNewSession();
      }
      setChatKey(`chat-${Date.now()}`);
      console.log('✅ New session started');
    } catch (err) {
      console.error('❌ Failed to start new session:', err);
      // Still reset the chat key as fallback
      setChatKey(`chat-${Date.now()}`);
      Alert.alert('Session Reset', 'Started a new conversation');
    }
  }, [startNewSession]);

  // Handle memory toggle
  const handleMemoryPress = useCallback(() => {
    setMemoryActive(prev => {
      const newValue = !prev;
      console.log(`🧠 Memory toggled: ${newValue}`);
      return newValue;
    });
  }, []);

  // Handle menu/settings navigation
  const handleMenuPress = useCallback(() => {
    console.log('📱 Menu button pressed, navigating to settings...');
    
    try {
      if (router && typeof router.push === 'function') {
        console.log('🔍 Router available, attempting navigation...');
        router.push('/settings');
        console.log('✅ Navigation to settings initiated');
      } else {
        console.error('❌ Router not available or invalid');
        Alert.alert('Navigation Error', 'Settings page is currently unavailable. Please restart the app.');
      }
    } catch (error) {
      console.error('❌ Navigation error:', error);
      Alert.alert('Navigation Error', 'Could not open settings. Please try restarting the app.');
    }
  }, []);

  // Handle AI style selector press
  const handleStylePress = useCallback(() => {
    console.log('🎨 Style selector pressed...');
    
    if (!user?.uid) {
      Alert.alert('Error', 'Please log in to change AI style');
      return;
    }
    
    if (!updateUserProfile || typeof updateUserProfile !== 'function') {
      Alert.alert('Error', 'Style selection is currently unavailable');
      return;
    }
    
    setStyleModalVisible(true);
    console.log('✅ Style modal opened');
  }, [user?.uid, updateUserProfile]);

  // Handle AI style change
  const handleStyleChange = useCallback(async (newStyle: 'concise' | 'exhaustive' | 'friendly') => {
    console.log('🔄 Changing AI style to:', newStyle);
    
    if (!user?.uid) {
      console.error('❌ No user UID available');
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!updateUserProfile || typeof updateUserProfile !== 'function') {
      console.error('❌ updateUserProfile function not available');
      Alert.alert('Error', 'Profile update not available');
      return;
    }

    try {
      await updateUserProfile(user.uid, { aiStyle: newStyle });
      setStyleModalVisible(false);
      console.log('✅ AI Style updated successfully:', newStyle);
    } catch (error) {
      console.error('❌ Failed to update AI style:', error);
      Alert.alert('Error', 'Failed to update AI style preference. Please try again.');
    }
  }, [user?.uid, updateUserProfile]);

  // Render AI style selection modal
  const renderStyleModal = () => (
    <Modal
      visible={styleModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setStyleModalVisible(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setStyleModalVisible(false)}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>AI Style</Text>
            <TouchableOpacity
              onPress={() => setStyleModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.stylesList}>
            {AI_STYLES.map((style, index) => (
              <React.Fragment key={style.id}>
                <TouchableOpacity
                  onPress={() => handleStyleChange(style.id as any)}
                  style={styles.styleOption}
                  activeOpacity={0.8}
                >
                  <View style={[styles.styleIconContainer, {
                    backgroundColor: `${style.color}15`,
                  }]}>
                    <Ionicons name={style.icon} size={16} color={style.color} />
                  </View>
                  
                  <View style={styles.styleContent}>
                    <Text style={styles.styleLabel}>{style.label}</Text>
                    <Text style={styles.styleDescription}>{style.description}</Text>
                  </View>
                  
                  <View style={[
                    styles.radioButton,
                    profile?.aiStyle === style.id ? styles.radioSelected : styles.radioUnselected
                  ]}>
                    {profile?.aiStyle === style.id && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                </TouchableOpacity>
                
                {index < AI_STYLES.length - 1 && (
                  <View style={styles.separator} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Debug information
  console.log('🔍 MainChatScreen Debug Info:', {
    themeLoaded: !!theme,
    profileLoaded: !!profile,
    userAuthenticated: !!user,
    currentAiStyle: profile?.aiStyle,
    currentStyleLabel: currentStyle.label,
    updateUserProfileAvailable: typeof updateUserProfile === 'function',
    appContextAvailable: !!appContext,
    appContextReady: appContext?.isReady,
    selectedModel: appContext?.selectedTextModel,
    canUseWebSearch: appContext?.canUseWebSearch,
    memoryActive,
    styleModalVisible,
    appContextError,
    orchestratorError,
  });

  // Show error state if critical services are unavailable
  if (!theme) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#ffffff' }]} edges={['top', 'bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Theme service unavailable. Please restart the app.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      {/* Header with AI Controls */}
      <View style={styles.header}>
        {/* Menu Button */}
        <TouchableOpacity 
          onPress={handleMenuPress} 
          style={styles.iconButton} 
          activeOpacity={0.7}
        >
          <HamburgerIcon width={20} height={20} color={theme.colors.text} />
        </TouchableOpacity>

        {/* AI Style Selector */}
        <TouchableOpacity
          onPress={handleStylePress}
          style={styles.styleSelector}
          activeOpacity={0.8}
        >
          <View style={[styles.styleSelectorIcon, { backgroundColor: `${currentStyle.color}15` }]}>
            <Ionicons name={currentStyle.icon} size={16} color={currentStyle.color} />
          </View>
          <Text style={styles.styleSelectorText} numberOfLines={1}>
            {currentStyle.label}
          </Text>
          <Ionicons name="chevron-down" size={16} color={theme.colors.secondary} />
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {/* New Chat Button */}
          <TouchableOpacity
            onPress={handleNewSession}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <Octicons
              name="plus"
              size={20}
              color={theme.colors.text}
            />
          </TouchableOpacity>

          {/* Memory Toggle Button */}
          <TouchableOpacity
            onPress={handleMemoryPress}
            style={[
              styles.iconButton,
              memoryActive && styles.memoryActiveButton,
            ]}
            activeOpacity={0.7}
          >
            <Ionicons
              name="bulb-outline"
              size={20}
              color={memoryActive ? MEMORY_COLOR : theme.colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Your Existing Chat Component - NO CHANGES NEEDED */}
      <ChatScreen
        key={chatKey}
        memoryEnabled={memoryActive}
        onMemoryToggle={setMemoryActive}
      />

      {/* AI Style Selection Modal */}
      {renderStyleModal()}

      {/* Development Error Banners */}
      {__DEV__ && (appContextError || orchestratorError) && (
        <View style={styles.debugBanner}>
          {appContextError && (
            <Text style={styles.debugText}>⚠️ AppContext: {appContextError}</Text>
          )}
          {orchestratorError && (
            <Text style={styles.debugText}>⚠️ Orchestrator: {orchestratorError}</Text>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: { 
    flex: 1 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface || 'transparent',
  },
  memoryActiveButton: {
    borderColor: MEMORY_COLOR,
    borderWidth: 1,
  },
  styleSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface || theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  styleSelectorIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  styleSelectorText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'SpaceGrotesk-Regular',
    color: theme.colors.text,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-Regular',
    color: theme.colors.text,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface || 'transparent',
  },
  stylesList: {
    backgroundColor: theme.colors.surface || theme.colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  styleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  styleIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  styleContent: {
    flex: 1,
  },
  styleLabel: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'SpaceGrotesk-Regular',
    color: theme.colors.text,
    marginBottom: 2,
  },
  styleDescription: {
    fontSize: 13,
    fontFamily: 'SpaceGrotesk-Regular',
    color: theme.colors.secondary,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  radioUnselected: {
    borderColor: theme.colors.border,
    backgroundColor: 'transparent',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  separator: {
    height: 0.5,
    backgroundColor: theme.colors.border,
    marginHorizontal: 16,
  },
  // Error and debug styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk-Regular',
  },
  debugBanner: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    backgroundColor: 'orange',
    padding: 8,
    borderRadius: 4,
    zIndex: 1000,
  },
  debugText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
});
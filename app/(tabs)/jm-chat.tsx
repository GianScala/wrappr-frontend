import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import {
  View,
  FlatList,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  ActivityIndicator,
  Text,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { useAppContext } from '../../src/contexts/AppContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import ChatMessage from '../../src/components/chat/ChatMessage';
import ChatInput from '../../src/components/chat/ChatInput';
import ChatSuggestions from '../../src/components/chat/ChatSuggestions';
import { useOrchestrator } from '../../src/hooks/useOrchestrator';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  loading?: boolean;
  // Add other message properties as needed
}

interface ChatScreenProps {
  memoryEnabled?: boolean;
  onMemoryToggle?: (enabled: boolean) => void;
}

const KEYBOARD_VERTICAL_OFFSET = 50;
const SCROLL_DELAY = 100;
const AUTO_FOCUS_DELAY = 500;

const ChatScreen: React.FC<ChatScreenProps> = ({
  memoryEnabled = false,
  onMemoryToggle,
}) => {
  console.log('🔧 ChatScreen rendering with props:', { memoryEnabled });
  console.log('🤖 Model Debug Info:', {
    selectedTextModel: selectedTextModel ? {
      id: selectedTextModel.id,
      name: selectedTextModel.name,
      webSearchCapable: selectedTextModel.webSearchCapable
    } : 'null',
    textModelsCount: textModels?.length || 0,
    textModels: textModels?.map(m => ({ 
      id: m.id, 
      name: m.name, 
      webSearchCapable: m.webSearchCapable 
    })) || [],
    hasAppContext: !!appContextHook
  });

  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  // Add error handling for useOrchestrator
  let orchestratorHook;
  try {
    orchestratorHook = useOrchestrator();
    console.log('✅ ChatScreen: useOrchestrator loaded successfully');
  } catch (error) {
    console.error('❌ ChatScreen: useOrchestrator error:', error);
    orchestratorHook = {
      sendChatMessage: null,
      loading: false,
      currentSessionId: null,
      getChatMessages: null,
    };
  }

  const {
    sendChatMessage,
    loading,
    currentSessionId,
    getChatMessages,
  } = orchestratorHook;

  // Add error handling for useAuth
  let authHook;
  try {
    authHook = useAuth();
    console.log('✅ ChatScreen: useAuth loaded successfully');
  } catch (error) {
    console.error('❌ ChatScreen: useAuth error:', error);
    authHook = {
      profile: null,
      canUseService: () => true,
      upgradeToProURL: '',
      updateTokenUsage: () => {},
    };
  }

  const {
    profile,
    canUseService,
    upgradeToProURL,
    updateTokenUsage,
  } = authHook;

  // Add error handling for useAppContext
  let appContextHook;
  try {
    appContextHook = useAppContext();
    console.log('✅ ChatScreen: useAppContext loaded successfully');
  } catch (error) {
    console.error('❌ ChatScreen: useAppContext error:', error);
    appContextHook = {
      textModels: [],
      selectedTextModel: null,
      setSelectedTextModel: () => {},
    };
  }

  const {
    textModels,
    selectedTextModel,
    setSelectedTextModel,
  } = appContextHook;

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [ragEnabled, setRagEnabled] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Refs
  const flatListRef = useRef<FlatList<Message>>(null);
  const inputRef = useRef<any>(null);
  const lastSessionIdRef = useRef<string | null>(null);

  // Memoized styles - Fixed to prevent unnecessary re-renders
  const containerStyle = useMemo(
    () => [styles.container, { backgroundColor: theme?.colors?.background || '#ffffff' }],
    [theme?.colors?.background]
  );
  
  const listContentStyle = useMemo(
    () => [styles.listContent, { paddingBottom: insets.bottom + 80 }],
    [insets.bottom]
  );

  // Utility functions
  const generateId = useCallback(
    (prefix: string) => `${prefix}-${Date.now()}-${Math.random()}`,
    []
  );

  const scrollToEnd = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, SCROLL_DELAY);
  }, []);

  // Load messages effect - Enhanced with better error handling and debugging
  useEffect(() => {
    const loadMessages = async () => {
      console.log('🔄 Load messages effect triggered:', { 
        currentSessionId, 
        hasChatMessages: !!getChatMessages, 
        loadingMessages,
        lastSessionId: lastSessionIdRef.current 
      });

      if (!currentSessionId) {
        console.log('⚠️ No current session ID, skipping message load');
        return;
      }

      if (!getChatMessages) {
        console.log('⚠️ getChatMessages not available, skipping message load');
        return;
      }

      if (loadingMessages) {
        console.log('⚠️ Already loading messages, skipping');
        return;
      }

      // Prevent loading same session twice
      if (lastSessionIdRef.current === currentSessionId) {
        console.log('⚠️ Session already loaded, skipping:', currentSessionId);
        return;
      }

      console.log('📥 Loading messages for session:', currentSessionId);
      setLoadingMessages(true);
      
      try {
        const sessionMessages = await getChatMessages(currentSessionId);
        console.log('📨 Raw session messages received:', {
          messagesType: typeof sessionMessages,
          isArray: Array.isArray(sessionMessages),
          length: sessionMessages?.length || 'N/A',
          firstMessage: sessionMessages?.[0] ? {
            id: sessionMessages[0].id,
            isUser: sessionMessages[0].isUser,
            hasText: !!sessionMessages[0].text
          } : 'None'
        });

        if (sessionMessages && Array.isArray(sessionMessages)) {
          // Transform messages to ensure they have the correct structure
          const transformedMessages = sessionMessages.map(msg => ({
            id: msg.id || `msg-${Date.now()}-${Math.random()}`,
            text: msg.text || msg.content || msg.message || '',
            isUser: msg.isUser || msg.role === 'user' || msg.sender === 'user',
            timestamp: msg.timestamp || msg.created_at || new Date(),
            model: msg.model,
            tokens: msg.tokens,
            cost: msg.cost,
            web_search: msg.web_search,
            loading: false // Ensure loaded messages are not in loading state
          }));

          console.log('✅ Transformed messages:', {
            originalCount: sessionMessages.length,
            transformedCount: transformedMessages.length,
            sample: transformedMessages[0] ? {
              id: transformedMessages[0].id,
              isUser: transformedMessages[0].isUser,
              hasText: !!transformedMessages[0].text
            } : 'None'
          });

          setMessages(transformedMessages);
        } else {
          console.log('⚠️ No valid messages array received, setting empty messages');
          setMessages([]);
        }
        
        lastSessionIdRef.current = currentSessionId;
        setSessionInitialized(true);
      } catch (error) {
        console.error('❌ Error loading messages:', error);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [currentSessionId, getChatMessages]); // Fixed: removed loadingMessages from deps

  // Auto focus effect - Fixed to prevent infinite loops
  useEffect(() => {
    if (sessionInitialized && messages.length === 0) {
      const timer = setTimeout(() => {
        if (inputRef.current?.focus) {
          inputRef.current.focus();
        }
      }, AUTO_FOCUS_DELAY);

      return () => clearTimeout(timer);
    }
  }, [sessionInitialized, messages.length]); // Fixed dependency array

  // Scroll to end when messages change - Fixed to prevent loops
  useEffect(() => {
    if (messages.length > 0 && sessionInitialized) {
      scrollToEnd();
    }
  }, [messages.length, sessionInitialized, scrollToEnd]);

  // Keyboard listeners - Fixed to prevent memory leaks
  useEffect(() => {
    const keyboardWillShow = () => setIsKeyboardVisible(true);
    const keyboardWillHide = () => setIsKeyboardVisible(false);

    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      keyboardWillShow
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      keyboardWillHide
    );

    return () => {
      showSubscription?.remove();
      hideSubscription?.remove();
    };
  }, []);

  // Alert function - Fixed dependencies
  const showTokenLimitAlert = useCallback(() => {
    const tokensUsed = profile?.tokensUsed ?? 0;
    const tokenLimit = profile?.tokenLimit ?? 0;
    
    Alert.alert(
      'Token Limit Reached',
      `You've used ${tokensUsed.toLocaleString()} of ${tokenLimit.toLocaleString()} tokens.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upgrade',
          onPress: () => {
            if (upgradeToProURL) {
              Linking.openURL(upgradeToProURL);
            }
          },
        },
      ]
    );
  }, [profile?.tokensUsed, profile?.tokenLimit, upgradeToProURL]);

  // Send message handler - Fixed dependencies with enhanced debugging
  const handleSend = useCallback(async () => {
    console.log('🚀 HandleSend called with:', { 
      inputText: inputText.trim(), 
      loading, 
      sendChatMessage: !!sendChatMessage,
      selectedModel: selectedTextModel,
      webSearchEnabled,
      ragEnabled
    });
    
    if (!inputText.trim() || !sendChatMessage || loading) {
      console.log('⚠️ HandleSend early return:', { 
        hasInput: !!inputText.trim(), 
        hasSendFunction: !!sendChatMessage, 
        loading 
      });
      return;
    }

    const messageText = inputText.trim();
    setInputText('');

    // Check token limits
    if (!canUseService?.('text')) {
      console.log('⚠️ Token limit reached');
      showTokenLimitAlert();
      return;
    }

    // Create user message
    const userMessage: Message = {
      id: generateId('user'),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
    };

    // Create loading message
    const loadingMessage: Message = {
      id: generateId('assistant'),
      text: '',
      isUser: false,
      timestamp: new Date(),
      loading: true,
    };

    console.log('💬 Adding messages to state:', { userMessage, loadingMessage });
    
    // Add messages to state
    setMessages(prev => {
      const newMessages = [...prev, userMessage, loadingMessage];
      console.log('📝 Updated messages array length:', newMessages.length);
      return newMessages;
    });
    
    try {
      console.log('📡 Sending message to API...', {
        message: messageText,
        memoryEnabled,
        webSearchEnabled,
        ragEnabled,
        selectedModel: selectedTextModel,
        modelSupportsWebSearch: selectedTextModel?.webSearchCapable,
        availableModels: textModels?.length || 0
      });
      
      // Send message
      const response = await sendChatMessage({
        message: messageText,
        model: selectedTextModel?.id || selectedTextModel?.name, // Add model parameter
        memoryEnabled,
        webSearchEnabled,
        ragEnabled,
      });

      console.log('📨 API Response received:', response);

      // Check for response content in multiple possible formats
      const responseContent = response?.content || response?.response || response?.text;
      const hasError = response?.error || !response?.success;
      
      if (responseContent) {
        console.log('✅ Valid response content found:', responseContent.substring(0, 100) + '...');
        // Replace loading message with actual response
        setMessages(prev => {
          const updatedMessages = prev.map(msg => 
            msg.id === loadingMessage.id 
              ? { 
                  ...msg, 
                  text: responseContent, 
                  loading: false,
                  web_search: response?.web_search // Pass through web search data
                }
              : msg
          );
          console.log('📝 Messages after response update:', updatedMessages.length);
          return updatedMessages;
        });

        // Update token usage if available
        const tokensUsed = response.tokensUsed || response?.tokens?.total_tokens || response?.usage?.total_tokens;
        if (tokensUsed && updateTokenUsage) {
          console.log('🔢 Updating token usage:', tokensUsed);
          updateTokenUsage(tokensUsed);
        }
      } else if (hasError && response?.error) {
        console.log('❌ API returned error, showing error message:', response.error);
        // Replace loading message with error message
        setMessages(prev => 
          prev.map(msg => 
            msg.id === loadingMessage.id 
              ? { ...msg, text: `⚠️ ${response.error}`, loading: false }
              : msg
          )
        );
      } else {
        console.log('❌ No response content, removing loading message');
        // Remove loading message if no response
        setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));
      }
    } catch (error) {
      console.error('❌ Send message error:', error);
      // Replace loading message with error message
      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingMessage.id 
            ? { ...msg, text: 'Sorry, something went wrong. Please try again.', loading: false }
            : msg
        )
      );
    }
  }, [
    inputText,
    sendChatMessage,
    loading,
    canUseService,
    memoryEnabled,
    webSearchEnabled,
    ragEnabled,
    generateId,
    showTokenLimitAlert,
    updateTokenUsage,
  ]);

  // Suggestion handler - Fixed dependencies
  const handleSuggestionSelect = useCallback(
    (suggestion: string) => {
      setInputText(suggestion);
      if (inputRef.current?.focus) {
        inputRef.current.focus();
      }
      setTimeout(() => handleSend(), 0);
    },
    [handleSend]
  );

  // Render message - Fixed to prevent re-renders with debugging
  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      console.log('🎨 Rendering message:', { id: item.id, isUser: item.isUser, hasText: !!item.text, loading: item.loading });
      return (
        <ChatMessage message={item} colors={theme?.colors || {}} />
      );
    },
    [theme?.colors]
  );

  // Loading state
  if (loadingMessages) {
    return (
      <SafeAreaView style={containerStyle} edges={['left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme?.colors?.primary || '#007AFF'} />
          <Text style={[styles.loadingText, { color: theme?.colors?.text || '#000000' }]}>
            Loading messages...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  console.log('✅ ChatScreen about to render with messages:', messages.length);

  return (
    <SafeAreaView style={containerStyle} edges={['left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={
          Platform.OS === 'ios'
            ? insets.bottom + KEYBOARD_VERTICAL_OFFSET
            : 0
        }
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.flex}>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={listContentStyle}
              removeClippedSubviews={false}
              windowSize={10}
              maxToRenderPerBatch={5}
              initialNumToRender={10}
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 100,
              }}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: theme?.colors?.secondary || '#666666' }]}>
                    No messages yet. Start a conversation!
                  </Text>
                </View>
              )}
            />

            {messages.length === 0 && !isKeyboardVisible && (
              <ChatSuggestions
                onSuggestionPress={handleSuggestionSelect}
                theme={theme}
              />
            )}

            {/* ChatInput with memory props */}
            <View style={styles.inputWrapper}>
              <ChatInput
                ref={inputRef}
                onSendMessage={handleSend}
                selectedModel={selectedTextModel}
                availableModels={textModels}
                onModelSelect={setSelectedTextModel}
                isLoading={loading}
                webSearchEnabled={webSearchEnabled}
                onWebSearchToggle={setWebSearchEnabled}
                ragEnabled={ragEnabled}
                onRagToggle={setRagEnabled}
                text={inputText}
                setText={setInputText}
                memoryEnabled={memoryEnabled}
                onMemoryToggle={onMemoryToggle}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  listContent: {
    paddingHorizontal: 16,
    flexGrow: 1,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
    textAlign: 'center',
  },
  inputWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

export default ChatScreen;
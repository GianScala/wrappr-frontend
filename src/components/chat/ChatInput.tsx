import React, {
  forwardRef,
  useRef,
  useImperativeHandle,
  useState,
  useMemo,
  useEffect,
} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Keyboard,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ModelSelector from './ModelSelector';
import ModernButton from './ModernButton';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  modelSupportsWebSearch,
  WEB_SEARCH_MODEL,
  getModelByName,
  type LLMModel,
} from '../../../types/models';

/*****************************
 * Types
 *****************************/
interface ChatInputProps {
  onSendMessage: () => void;
  selectedModel: string;
  availableModels: LLMModel[];
  onModelSelect: (model: string) => void;
  isLoading: boolean;
  /* Web search */
  webSearchEnabled: boolean;
  onWebSearchToggle: (enabled: boolean) => void;
  /* RAG */
  ragEnabled: boolean;
  onRagToggle: (enabled: boolean) => void;
  /* Memory */
  memoryEnabled?: boolean;
  onMemoryToggle?: (enabled: boolean) => void;
  /* Text */
  text: string;
  setText: (text: string) => void;
}

/*****************************
 * Component
 *****************************/
// In ChatInput.tsx, around line 55-75, change:

const ChatInput = forwardRef<any, ChatInputProps>((props, ref) => {
  const {
    onSendMessage,
    selectedModel,
    availableModels = [], // Add default empty array here
    onModelSelect,
    isLoading,
    webSearchEnabled,
    onWebSearchToggle,
    ragEnabled,
    onRagToggle,
    memoryEnabled = false,
    onMemoryToggle,
    text,
    setText,
  } = props;

  // Also add safety check in the useMemo:
  const filteredModels = useMemo(() => {
    if (webSearchEnabled) {
      return (availableModels || [])
        .filter((m) => m.capabilities?.webSearchCapable)
        .map((m) => m.name);
    }
    return (availableModels || []).map((m) => m.name);
  }, [availableModels, webSearchEnabled]);

  const theme = useTheme();
  const insets = useSafeAreaInsets();

  /*****************************
   * Local state & refs
   *****************************/
  const inputRef = useRef<TextInput>(null);
  const [inputHeight, setInputHeight] = useState(48);
  const [inputFocused, setInputFocused] = useState(false);

  // NEW: track memory toggle locally (seeded from prop, kept in sync)
  const [memoryActive, setMemoryActive] = useState(memoryEnabled);
  useEffect(() => {
    setMemoryActive(memoryEnabled);
  }, [memoryEnabled]);

  /*****************************
   * Styling constants
   *****************************/
  const MEMORY_COLOR = '#8B5CF6'; // purple
  const RAG_COLOR = '#3B82F6'; // blue


  useEffect(() => {
    if (webSearchEnabled && !modelSupportsWebSearch(selectedModel)) {
      const webModel = filteredModels[0] || WEB_SEARCH_MODEL;
      onModelSelect(webModel);
    }
  }, [webSearchEnabled, selectedModel, filteredModels, onModelSelect]);

  const canSend = !!text.trim() && !isLoading;

  /*****************************
   * Imperative handle
   *****************************/
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
  }));

  /*****************************
   * Helpers (display names, icons, placeholders)
   *****************************/
  const getModelDisplayName = (model: string) => {
    const fromConfig = getModelByName(model)?.displayName;
    if (fromConfig) return fromConfig;
    const map: Record<string, string> = {
      'gpt-4o': 'GPT‑4o',
      'gpt-4-turbo': 'GPT‑4 Turbo',
      'gpt-3.5': 'GPT‑3.5',
      'claude-3.5-sonnet': 'Claude 3.5',
      'claude-3-opus': 'Claude 3 Opus',
      'claude-3-haiku': 'Claude 3 Haiku',
    };
    for (const [key, val] of Object.entries(map)) {
      if (model.toLowerCase().includes(key)) return val;
    }
    return model
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const getModelIcon = (model: string) => {
    if (model.includes('gpt')) return 'flash';
    if (model.includes('claude')) return 'book-outline';
    if (model.includes('gemma')) return 'flame';
    if (model.includes('llama')) return 'code-outline';
    return 'chatbubble-ellipses';
  };

  const getPlaceholderText = () => {
    if (webSearchEnabled && ragEnabled) return 'Ask with web + knowledge base…';
    if (webSearchEnabled) return 'Ask with web search…';
    if (ragEnabled) return 'Ask your knowledge base…';
    return 'Ask anything…';
  };

  const getStatusText = () => {
    const caps: string[] = [];
    if (webSearchEnabled) caps.push('Web');
    if (ragEnabled) caps.push('RAG');
    if (!caps.length) {
      return modelSupportsWebSearch(selectedModel) ? 'Enhanced model' : 'Standard mode';
    }
    return `${caps.join(' + ')} enabled`;
  };

  const getStatusColor = () =>
    webSearchEnabled || ragEnabled ? theme.colors.primary : theme.colors.secondary;

  const showWebSearchWarning = webSearchEnabled && !filteredModels.length;

  /*****************************
   * Event handlers
   *****************************/
  const handleWebSearchToggle = () => {
    const next = !webSearchEnabled;
    if (next && filteredModels.length === 0) {
      Alert.alert('Web search unavailable', 'No models support web search.', [
        { text: 'OK' },
      ]);
      return;
    }
    onWebSearchToggle(next);
    if (next && !modelSupportsWebSearch(selectedModel)) {
      const webModel =
        availableModels.find((m) => m.capabilities?.webSearchCapable)?.name ||
        WEB_SEARCH_MODEL;
      onModelSelect(webModel);
    }
  };

  const handleRagToggle = () => onRagToggle(!ragEnabled);

  // UPDATED: new handler for memory
  const handleMemoryActivated = () => {
    const next = !memoryActive;
    setMemoryActive(next);
    if (typeof onMemoryToggle === 'function') {
      onMemoryToggle(next);
    }
  };

  const handleSend = () => {
    if (!canSend) return;
    onSendMessage();
    setText('');
    setInputHeight(48);
    Keyboard.dismiss();
  };

  const handleContentSizeChange = ({
    nativeEvent: {
      contentSize: { height },
    },
  }: any) => {
    setInputHeight(Math.min(Math.max(height, 48), 280));
  };

  /*****************************
   * Styles
   *****************************/
  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderRadius: 24,
      paddingHorizontal: 12,
      paddingTop: 18,
      paddingBottom: Math.max(insets.bottom + 4, 12),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.12,
      shadowRadius: 14,
      elevation: 5,
      borderColor: theme.colors.border,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
      marginBottom: 6,
      paddingHorizontal: 6,
    },
    input: {
      flex: 1,
      fontFamily: 'SpaceGrotesk-Regular',
      fontSize: 14,
      paddingVertical: 12,
      paddingHorizontal: 14,
      minHeight: 32,
      maxHeight: 320,
      backgroundColor: theme.colors.background,
      borderRadius: 20,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      textAlignVertical: 'top',
      color: theme.colors.text,
      lineHeight: 20,
    },
    inputFocused: {
      borderColor: theme.colors.primary,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
    divider: {
      height: 1,
      marginVertical: 10,
      marginHorizontal: 4,
      backgroundColor: theme.colors.border,
      opacity: 0.25,
    },
    modelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
    },
    modelInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 8,
    },
    modelIconContainer: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: theme.colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.primary + '30',
    },
    modelTextContainer: {
      flex: 1,
    },
    modelName: {
      fontSize: 11,
      fontWeight: '600',
      fontFamily: 'SpaceGrotesk-Regular',
      color: theme.colors.text,
      marginBottom: 1,
    },
    modelSubtext: {
      fontSize: 9,
      fontFamily: 'SpaceGrotesk-Regular',
      fontWeight: '400',
    },
    warningSubtext: {
      fontSize: 9,
      fontFamily: 'SpaceGrotesk-Regular',
      color: '#FF6B6B',
      fontWeight: '500',
    },
    headerControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    sendButtonContainer: { position: 'relative' },
    sendButtonGlow: {
      position: 'absolute',
      top: -2,
      left: -2,
      right: -2,
      bottom: -2,
      borderRadius: 22,
      backgroundColor: theme.colors.primary + '20',
      opacity: canSend ? 1 : 0,
    },
  });

  // apply purple border when memory is active
  const containerStyle = [
    styles.container,
    memoryActive && { borderColor: MEMORY_COLOR },
  ];

  /*****************************
   * Render
   *****************************/
  return (
    <View style={containerStyle}>
      {/* Input area */}
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            { height: inputHeight },
            inputFocused && styles.inputFocused,
          ]}
          value={text}
          onChangeText={setText}
          onContentSizeChange={handleContentSizeChange}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          placeholder={getPlaceholderText()}
          placeholderTextColor={theme.colors.secondary}
          multiline
          maxLength={2000}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
          enablesReturnKeyAutomatically
        />
        {/* Send button */}
        <View style={styles.sendButtonContainer}>
          <View style={styles.sendButtonGlow} />
          <ModernButton
            icon={canSend ? 'arrow-up' : 'arrow-up-outline'}
            onPress={handleSend}
            variant="send"
            size="medium"
            disabled={!canSend}
            loading={isLoading}
          />
        </View>
      </View>

      <View style={styles.divider} />

      {/* Model header & controls */}
      <View style={styles.modelHeader}>
        {/* Model info */}
        <View style={styles.modelInfo}>
          <View style={styles.modelIconContainer}>
            <Ionicons
              name={
                webSearchEnabled && ragEnabled
                  ? 'layers'
                  : webSearchEnabled
                  ? 'globe'
                  : ragEnabled
                  ? 'library'
                  : getModelIcon(selectedModel)
              }
              size={14}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.modelTextContainer}>
            <Text style={styles.modelName} numberOfLines={1} ellipsizeMode="tail">
              {getModelDisplayName(selectedModel)}
            </Text>
            {showWebSearchWarning ? (
              <Text style={styles.warningSubtext}>No web search models available</Text>
            ) : (
              <Text style={[styles.modelSubtext, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            )}
          </View>
        </View>

        {/* Toggles & model selector */}
        <View style={styles.headerControls}>
          {/* Web search toggle */}
          <ModernButton
            icon="globe"
            onPress={handleWebSearchToggle}
            variant="toggle"
            size="small"
            active={webSearchEnabled}
          />

          {/* RAG toggle */}
          <ModernButton
            icon="library"
            onPress={handleRagToggle}
            variant="toggle"
            size="small"
            active={ragEnabled}
            color={ragEnabled ? RAG_COLOR : undefined}
            backgroundColor={ragEnabled ? RAG_COLOR + '20' : undefined}
            borderColor={ragEnabled ? RAG_COLOR : undefined}
          />

          {/* Memory toggle */}
          <ModernButton
            icon="hardware-chip-outline"
            onPress={handleMemoryActivated}
            variant="toggle"
            size="small"
            active={memoryActive}
            color={memoryActive ? MEMORY_COLOR : undefined}
            backgroundColor={memoryActive ? MEMORY_COLOR + '20' : undefined}
            borderColor={memoryActive ? MEMORY_COLOR : undefined}
          />

          {/* Model selector */}
          <ModelSelector
            selectedModel={selectedModel}
            availableModels={filteredModels}
            onModelSelect={onModelSelect}
            compact
          />
        </View>
      </View>
    </View>
  );
});

export default ChatInput;

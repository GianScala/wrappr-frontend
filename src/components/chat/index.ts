// components/chat/index.ts

// Main chat components
export { default as ChatMessages } from './ChatMessages';
export { default as ChatMessage } from './ChatMessage';
export { default as ChatInput } from './ChatInput';
export { default as ChatSuggestions } from './ChatSuggestions';
export { default as ModelSelector } from './ModelSelector';
export { default as RefreshChatHistory } from './RefreshChatHistory';

// Formatter components
// Update this line to use a named export if 'TextFormatter' is a named export
export { SimpleTextFormatter } from './formatters/TextFormatter';

// Animation components
export { SmoothTextRenderer } from './animations/TypewriterText';
export { default as ThinkingDots } from './animations/ThinkingDots';

// Type exports
export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp?: Date | string | null;
  model?: string;
  tokens?: { prompt: number; completion: number; total: number };
  cost?: { input: number; output: number; total: number; currency: string };
  isLoading?: boolean;
}

// Re-export any other types that might be used across components
export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

export interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  models: any[];
}

export interface ChatSuggestionsProps {
  suggestions: string[];
  onSuggestionPress: (suggestion: string) => void;
}

export interface RefreshChatHistoryProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}
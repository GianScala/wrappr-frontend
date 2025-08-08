// types/chat.ts

export interface ChatMessage {
    id: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    timestamp: Date;
    model?: string;
    tokens?: number;
    metadata?: {
      imageGenerated?: boolean;
      codeExecuted?: boolean;
      searchPerformed?: boolean;
    };
  }
  
  export interface ChatSession {
    id: string;
    userId: string;
    title: string;
    lastMessage: string;
    timestamp: Date;
    messageCount: number;
    model: string;
    messages?: ChatMessage[];
    isArchived?: boolean;
    isFavorite?: boolean;
    tags?: string[];
    totalTokens?: number;
    estimatedCost?: number;
  }
  
  export interface ChatHistoryFilter {
    searchQuery?: string;
    model?: string;
    dateRange?: {
      start: Date;
      end: Date;
    };
    isArchived?: boolean;
    isFavorite?: boolean;
    tags?: string[];
  }
  
  export interface ChatHistoryStats {
    totalChats: number;
    totalMessages: number;
    totalTokens: number;
    estimatedTotalCost: number;
    mostUsedModel: string;
    averageMessagesPerChat: number;
    chatsByModel: Record<string, number>;
    chatsByDate: Record<string, number>;
  }
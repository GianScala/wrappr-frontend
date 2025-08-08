// hooks/orchestrator/useChat.ts
import { useState, useCallback, useRef } from 'react';
import { serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { ChatHistoryService } from '../../../src/services/chatHistoryService';
import { chatService, ChatResponse as ServiceChatResponse, TokenUsage, CostBreakdown } from '../../../src/services/chatService';
import { DEFAULT_TEXT_MODEL, modelSupportsWebSearch, WebSearchSource } from '../../../types/models';

export interface ChatRequest {
  message: string;
  model?: string;
  sessionId?: string;
  createNewSession?: boolean;
  sessionTitle?: string;
  webSearchEnabled?: boolean;
  ragEnabled?: boolean;
}

export interface ChatResponse {
  tokens: any;
  success: boolean;
  response?: string;
  model?: string;
  provider?: string;
  usage?: TokenUsage;
  cost?: CostBreakdown;
  user_context_applied?: {
    ai_style: string;
    username?: string;
    email?: string;
    tier: string;
  };
  personalization?: {
    system_prompt_sections: number;
    chat_history_included: boolean;
    user_identified: boolean;
  };
  error?: string;
  sessionId?: string;
  webSearchSources?: WebSearchSource[]; 
  webSearchUsed?: boolean;
  web_search?: {
    enabled: boolean;
    search_performed: boolean;
    sources: Array<{title: string; url: string; snippet: string}>;
    sources_count: number;
    web_source_citations: Array<{
      id: string;
      title: string;
      url: string;
      snippet: string;
      domain: string;
      favicon_url?: string;
      citation_number: number;
      images: string[];
    }>;
    web_source_citations_count: number;
    tavily_hits_count: number;
    images_count: number;
  };
  rag?: {
    enabled: boolean;
    search_performed: boolean;
    sources: Array<{
      content: string;
      source: string;
      score: number;
      metadata: any;
    }>;
    sources_count: number;
    database_citations: Array<{
      id: string;
      content: string;
      source: string;
      score: number;
      citation_number: number;
    }>;
    database_citations_count: number;
  };
  hybrid_mode?: boolean;
}

// Utility function to clean undefined values from objects
const cleanUndefinedValues = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefinedValues);
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanUndefinedValues(value);
      }
    }
    return cleaned;
  }
  
  return obj;
};

// Enhanced metadata extraction with complete web search support
const extractSafeMetadata = (response: ServiceChatResponse) => {
  const metadata: any = {};
  
  if (response.user_context_applied) {
    metadata.user_context_applied = cleanUndefinedValues({
      ai_style: response.user_context_applied.ai_style || 'friendly',
      username: response.user_context_applied.username || null,
      email: response.user_context_applied.email || null,
      tier: response.user_context_applied.tier || 'free'
    });
  }
  
  // Handle personalization
  if (response.personalization) {
    metadata.personalization = cleanUndefinedValues({
      system_prompt_sections: response.personalization.system_prompt_sections || 0,
      chat_history_included: response.personalization.chat_history_included || false,
      user_identified: response.personalization.user_identified || false
    });
  }
  
  // Handle web search metadata
  if (response.web_search) {
    metadata.web_search = cleanUndefinedValues(response.web_search);
  }

  // ADD: Handle RAG metadata
  if (response.rag) {
    metadata.rag = cleanUndefinedValues(response.rag);
  }

  // ADD: Handle hybrid mode
  if (response.hybrid_mode !== undefined) {
    metadata.hybrid_mode = response.hybrid_mode;
  }

  // Legacy support
  if (response.webSearchSources) {
    metadata.webSearchSources = response.webSearchSources;
  }

  if (response.webSearchUsed !== undefined) {
    metadata.webSearchUsed = response.webSearchUsed;
  }
  
  return Object.keys(metadata).length > 0 ? metadata : null;
};

export const useChat = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  const chatHistoryService = useRef(new ChatHistoryService()).current;

  const generateSessionTitle = (message: string): string => {
    const title = message.slice(0, 50).trim();
    return title.length < message.length ? `${title}...` : title;
  };

  const startNewSession = useCallback(async () => {
    setCurrentSessionId(null);
    setError(null);

    try {
      const result = await chatService.newSession();
      console.log('✅ New chat session started');
      return { success: true, session_id: result.session_id };
    } catch (err) {
      console.warn("Backend session creation failed, continuing locally:", err);
      return { success: true };
    }
  }, []);

  const sendMessage = useCallback(async ({
    message,
    model = DEFAULT_TEXT_MODEL,
    sessionId,
    createNewSession = false,
    sessionTitle,
    webSearchEnabled = false,
    ragEnabled = false, // ADD THIS
  }: ChatRequest): Promise<ChatResponse> => {
    if (!message.trim()) return { success: false, error: "Message cannot be empty", tokens: null };
    if (!user?.uid) return { success: false, error: "User not authenticated", tokens: null };
    if (!profile) return { success: false, error: "User profile not loaded", tokens: null };

    // Validate web search compatibility
    if (webSearchEnabled && !modelSupportsWebSearch(model)) {
      return { 
        success: false, 
        error: `Web search is not supported by model ${model}. Please use a web search capable model.`,
        tokens: null
      };
    }

    setLoading(true);
    setError(null);

    try {
      let activeSessionId = sessionId || currentSessionId;

      // Create new session if needed
      if (createNewSession || !activeSessionId) {
        const title = sessionTitle || generateSessionTitle(message);
        activeSessionId = await chatHistoryService.createChatSession(
          user.uid,
          title,
          model
        );
        setCurrentSessionId(activeSessionId);
        console.log(`✅ Chat session created: ${activeSessionId}`);
      }

      console.log(`🔄 Sending message with user context:`, {
        model,
        ai_style: profile.aiStyle,
        username: profile.username,
        tier: profile.tier,
        session_id: activeSessionId,
        webSearchEnabled,
        ragEnabled, // ADD THIS
        webSearchSupported: modelSupportsWebSearch(model)
      });

      // Save user message with capability flags
      if (activeSessionId) {
        try {
          const userMessageData = {
            role: 'user' as const,
            content: message.trim(),
            model,
            api_key_used: 'user_input',
            sessionId: activeSessionId,
            timestamp: serverTimestamp(),
            metadata: {
              webSearchRequested: webSearchEnabled,
              ragRequested: ragEnabled, // ADD THIS
              webSearchCapable: modelSupportsWebSearch(model)
            }
          };
          
          const userMessageId = await chatHistoryService.addMessage(activeSessionId, userMessageData);
          console.log(`✅ User message saved: ${userMessageId}`);
        } catch (userMsgError) {
          console.error('❌ Failed to save user message:', userMsgError);
        }
      }

      // Send to backend with capability flags
      const response: ServiceChatResponse = await chatService.sendMessage(
        message.trim(),
        model,
        profile,
        activeSessionId,
        webSearchEnabled,
        ragEnabled // ADD THIS
      );

      console.log('✅ Received response:', {
        success: response.success,
        ai_style_applied: response.user_context_applied?.ai_style,
        total_tokens: response.usage?.total_tokens,
        total_cost: response.cost?.total,
        webSearchUsed: response.webSearchUsed,
        webSearchSourcesCount: response.webSearchSources?.length || 0,
        ragSourcesCount: response.rag?.sources_count || 0, // ADD THIS
        hybridMode: response.hybrid_mode // ADD THIS
      });

      // Save assistant response with enhanced metadata
      if (activeSessionId && response.success && response.response) {
        try {
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const safeMetadata = extractSafeMetadata(response);
          
          const assistantMessage = cleanUndefinedValues({
            role: 'assistant' as const,
            content: response.response,
            model: response.model || model,
            api_key_used: 'chatservice',
            timestamp: serverTimestamp(),
            tokens: {
              prompt: response.usage?.prompt_tokens || 0,
              completion: response.usage?.completion_tokens || 0, 
              total: response.usage?.total_tokens || 0
            },
            cost: {
              input: response.cost?.input || 0,
              output: response.cost?.output || 0,
              total: response.cost?.total || 0,
              currency: response.cost?.currency || 'USD'
            },
            sessionId: activeSessionId,
            metadata: safeMetadata
          });
          
          const assistantMessageId = await chatHistoryService.addMessage(activeSessionId, assistantMessage);
          console.log(`✅ Assistant message saved: ${assistantMessageId} with capability data`);
        } catch (assistantMsgError) {
          console.error('❌ Failed to save assistant message:', assistantMsgError);
        }
      }

      // Convert service response to hook response format
      const hookResponse: ChatResponse = {
        success: response.success,
        response: response.response,
        model: response.model,
        provider: response.provider,
        usage: response.usage,
        cost: response.cost,
        user_context_applied: response.user_context_applied,
        personalization: response.personalization,
        sessionId: activeSessionId,
        tokens: response.usage,
        webSearchSources: response.webSearchSources,
        webSearchUsed: response.webSearchUsed,
        web_search: response.web_search,
        rag: response.rag, // ADD THIS
        hybrid_mode: response.hybrid_mode, // ADD THIS
      };

      return hookResponse;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to send message";
      console.error('❌ Chat error:', errorMessage);
      setError(errorMessage);
      return { success: false, error: errorMessage, tokens: null };
    } finally {
      setLoading(false);
    }
  }, [user, profile, currentSessionId, chatHistoryService]);


  const setActiveSession = useCallback((sessionId: string | null) => {
    setCurrentSessionId(sessionId);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const testConnection = useCallback(async () => {
    try {
      const isHealthy = await chatService.healthCheck();
      return { success: isHealthy };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  return {
    sendMessage,
    startNewSession,
    setActiveSession,
    clearError,
    testConnection,
    loading,
    error,
    currentSessionId,
  };
};
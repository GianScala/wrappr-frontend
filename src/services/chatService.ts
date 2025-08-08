// services/chatService.ts
import { UserProfile } from './userService';
import { WebSearchSource } from '../types/models';

interface UserContext {
  user_id: string;
  email?: string;
  username?: string;
  tier: string;
  ai_style: string;
}

interface ChatRequest {
  message: string;
  model: string;
  session_id?: string;
  user_context: UserContext;
  web_search_enabled?: boolean;
  rag_enabled?: boolean; // ADD THIS
}

interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface CostBreakdown {
  input: number;
  output: number;
  total: number;
  currency: string;
}

interface ChatResponse {
  success: boolean;
  response: string;
  model: string;
  provider: string;
  usage: TokenUsage;
  cost: CostBreakdown;
  user_context_applied: {
    ai_style: string;
    username?: string;
    email?: string;
    tier: string;
  };
  personalization: {
    system_prompt_sections: number;
    chat_history_included: boolean;
    user_identified: boolean;
  };
  webSearchUsed?: boolean;
  webSearchSources?: WebSearchSource[];
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
  // ADD RAG SUPPORT:
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
  hybrid_mode?: boolean; // ADD THIS
}

interface ErrorResponse {
  detail: string;
  status_code?: number;
}

export class ChatService {
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || "http://192.168.0.19:8000";
    console.log(`🔧 ChatService initialized with URL: ${this.baseURL}`);
  }

  /**
   * Send a chat message with full user context for personalization and optional web search + RAG
   */
  async sendMessage(
    message: string,
    model: string,
    profile: UserProfile,
    sessionId?: string,
    webSearchEnabled: boolean = false,
    ragEnabled: boolean = false, // ADD THIS PARAMETER
    authToken?: string
  ): Promise<ChatResponse> {
    try {
      console.log(`🔄 ChatService: Sending to ${this.baseURL}/api/chat`);
      console.log(`🔄 Message details:`, {
        model,
        ai_style: profile.aiStyle,
        username: profile.username,
        tier: profile.tier,
        session_id: sessionId,
        web_search_enabled: webSearchEnabled,
        rag_enabled: ragEnabled, // ADD THIS
        message_preview: message.substring(0, 50) + '...'
      });
      
      // Create user context from profile
      const user_context: UserContext = {
        user_id: profile.uid,
        email: profile.email,
        username: profile.username,
        tier: profile.tier,
        ai_style: profile.aiStyle,
      };

      const payload: ChatRequest = {
        message,
        model,
        session_id: sessionId,
        user_context,
        web_search_enabled: webSearchEnabled,
        rag_enabled: ragEnabled // ADD THIS
      };

      console.log('📤 Chat payload:', {
        model: payload.model,
        ai_style: payload.user_context.ai_style,
        username: payload.user_context.username,
        tier: payload.user_context.tier,
        session_id: payload.session_id,
        web_search_enabled: payload.web_search_enabled,
        rag_enabled: payload.rag_enabled, // ADD THIS
        url: `${this.baseURL}/api/chat`
      });

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-User-ID': profile.uid,
        'X-User-Tier': profile.tier,
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      // Send request
      const response = await fetch(`${this.baseURL}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      console.log(`📥 Response status: ${response.status} ${response.statusText}`);

      // Handle errors
      if (!response.ok) {
        const errorData: ErrorResponse = await response.json().catch(() => ({
          detail: `HTTP ${response.status}: ${response.statusText}`
        }));
        
        console.error('❌ ChatService HTTP error:', {
          status: response.status,
          detail: errorData.detail,
          url: `${this.baseURL}/api/chat`
        });
        
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      // Parse response
      const data: ChatResponse = await response.json();
      
      console.log('✅ Chat response received:', {
        success: data.success,
        model: data.model,
        provider: data.provider,
        prompt_tokens: data.usage?.prompt_tokens,
        completion_tokens: data.usage?.completion_tokens,
        total_tokens: data.usage?.total_tokens,
        total_cost: data.cost?.total,
        ai_style_applied: data.user_context_applied?.ai_style,
        system_prompt_sections: data.personalization?.system_prompt_sections,
        web_search_used: data.webSearchUsed,
        sources_count: data.webSearchSources?.length || 0,
        web_search_data: data.web_search,
        rag_data: data.rag, // ADD THIS
        hybrid_mode: data.hybrid_mode, // ADD THIS
      });

      // Log web search details if used
      if (data.webSearchUsed && data.webSearchSources) {
        console.log('🔍 Web search results:', {
          sources_found: data.webSearchSources.length,
          sample_titles: data.webSearchSources.slice(0, 3).map(s => s.title)
        });
      }

      // Log RAG details if used
      if (data.rag?.search_performed) {
        console.log('🗃️ RAG search results:', {
          sources_found: data.rag.sources_count,
          database_citations: data.rag.database_citations_count
        });
      }

      // Log hybrid mode if active
      if (data.hybrid_mode) {
        console.log('🔄 HYBRID MODE ACTIVE:', {
          web_sources: data.web_search?.sources_count || 0,
          rag_sources: data.rag?.sources_count || 0
        });
      }

      return data;
    } catch (error) {
      console.error('❌ ChatService error:', error);
      console.error('❌ Error details:', {
        url: `${this.baseURL}/api/chat`,
        error_type: (error as Error)?.constructor?.name,
        message: (error as Error)?.message
      });
      throw error;
    }
  }
  /**
   * Start a new chat session
   */
  async newSession(): Promise<{ success: boolean; session_id?: string }> {
    try {
      console.log('🆕 ChatService: Creating new session');
      
      const response = await fetch(`${this.baseURL}/api/chat/new-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ New session created');
      
      return data;
    } catch (error) {
      console.error('❌ Failed to create new session:', error);
      throw error;
    }
  }

  /**
   * Test connection to chat service
   */
  async healthCheck(): Promise<boolean> {
    try {
      console.log(`🔍 ChatService: Health check to ${this.baseURL}/health`);
      
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const isHealthy = response.ok;
      console.log(`🔍 ChatService health check: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
      
      return isHealthy;
    } catch (error) {
      console.error('❌ ChatService health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();

// Export types for use in components
export type { 
  ChatRequest, 
  ChatResponse, 
  UserContext, 
  TokenUsage, 
  CostBreakdown 
};
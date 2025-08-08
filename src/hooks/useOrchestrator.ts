// hooks/useOrchestrator.ts
import { useCallback } from 'react';
import { useChat } from './orchestrator/useChat';
import { useModels } from './orchestrator/useModels';
import { useSubscription } from './orchestrator/useSubscription';
import { useAnalytics } from './orchestrator/useAnalytics';
import { useAuth } from '../contexts/AuthContext';
import { modelSupportsWebSearch } from '../../types/models';

export const useOrchestrator = () => {
  const { profile } = useAuth();
  const chat = useChat();
  const models = useModels();
  const subscription = useSubscription();
  const analytics = useAnalytics();

  const testConnection = useCallback(async () => {
    try {
      const result = await chat.testConnection();
      return result;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [chat]);

  // Fixed: Removed image references
  const loading = chat.loading || models.loading || subscription.loading;
  const error = chat.error || models.error || subscription.error;

  const clearError = useCallback(() => {
    chat.clearError();
    models.clearError();
    subscription.clearError();
  }, [chat, models, subscription]);

  const recordModelSelection = useCallback(async (model: string) => {
    try {
      const modelInfo = await models.getModelInfo(model);
      if (modelInfo && profile) {
        await analytics.trackModelSelection(model, modelInfo.tier_required);
        console.log(`✅ Model selection recorded: ${model} (style: ${profile.aiStyle}, webSearch: ${modelSupportsWebSearch(model)})`);
      }
    } catch (err) {
      console.error('Failed to record model selection:', err);
    }
  }, [analytics, models, profile]);

  // Enhanced message sending with web search and RAG support
  const sendChatMessage = useCallback(async (
    request: Parameters<typeof chat.sendMessage>[0] & { 
      webSearchEnabled?: boolean;
      ragEnabled?: boolean;
    }
  ) => {
    try {
      // Validate web search compatibility
      if (request.webSearchEnabled && !modelSupportsWebSearch(request.model || '')) {
        console.error(`❌ Web search requested but model ${request.model} doesn't support it`);
        return {
          success: false,
          error: `Web search is not supported by the selected model. Please choose a web search capable model.`
        };
      }

      // Send message with user context and capability flags
      const response = await chat.sendMessage({
        ...request,
        webSearchEnabled: request.webSearchEnabled || false,
        ragEnabled: request.ragEnabled || false
      });
      
      // Track analytics with capability info
      if (response.success && profile) {
        await analytics.trackMessageSent(
          request.model || 'unknown',
          response.usage?.total_tokens || 0,
          response.sessionId
        );
        console.log(`📊 Message analytics tracked:`, {
          ai_style: response.user_context_applied?.ai_style,
          webSearchUsed: response.webSearchUsed,
          webSourcesRetrieved: response.webSearchSources?.length || 0,
          ragSourcesRetrieved: response.rag?.sources_count || 0,
          hybridMode: response.hybrid_mode
        });
      }
      
      return response;
    } catch (err) {
      console.error('Failed to send message:', err);
      throw err;
    }
  }, [chat, analytics, profile]);

  // Track web search usage
  const trackWebSearchUsed = useCallback(async (
    model: string, 
    sourcesCount: number, 
    sessionId?: string
  ) => {
    if (profile) {
      await analytics.trackFeatureUsed('web_search', {
        model,
        sources_count: sourcesCount,
        session_id: sessionId,
        user_ai_style: profile.aiStyle,
        user_tier: profile.tier,
        user_id: profile.uid
      });
      console.log(`📊 Web search usage tracked: ${sourcesCount} sources from ${model}`);
    }
  }, [analytics, profile]);

  // Track RAG usage
  const trackRagUsed = useCallback(async (
    model: string, 
    sourcesCount: number, 
    sessionId?: string
  ) => {
    if (profile) {
      await analytics.trackFeatureUsed('rag_search', {
        model,
        sources_count: sourcesCount,
        session_id: sessionId,
        user_ai_style: profile.aiStyle,
        user_tier: profile.tier,
        user_id: profile.uid
      });
      console.log(`📊 RAG usage tracked: ${sourcesCount} sources from ${model}`);
    }
  }, [analytics, profile]);

  // Track hybrid mode usage
  const trackHybridUsed = useCallback(async (
    model: string,
    webSourcesCount: number,
    ragSourcesCount: number,
    sessionId?: string
  ) => {
    if (profile) {
      await analytics.trackFeatureUsed('hybrid_mode', {
        model,
        web_sources_count: webSourcesCount,
        rag_sources_count: ragSourcesCount,
        total_sources: webSourcesCount + ragSourcesCount,
        session_id: sessionId,
        user_ai_style: profile.aiStyle,
        user_tier: profile.tier,
        user_id: profile.uid
      });
      console.log(`📊 Hybrid mode tracked: ${webSourcesCount} web + ${ragSourcesCount} RAG sources`);
    }
  }, [analytics, profile]);

  // Validate web search model compatibility
  const validateWebSearchRequest = useCallback((model: string, webSearchEnabled: boolean) => {
    if (webSearchEnabled && !modelSupportsWebSearch(model)) {
      return {
        valid: false,
        error: `Web search is not supported by ${model}. Please select a web search capable model.`
      };
    }
    return { valid: true };
  }, []);

  // Validate RAG request (all models support RAG)
  const validateRagRequest = useCallback((model: string, ragEnabled: boolean) => {
    // All models support RAG, so always valid
    return { valid: true };
  }, []);

  return {
    // Chat - Enhanced with web search and RAG support
    sendChatMessage,
    startNewSession: chat.startNewSession,
    setActiveSession: chat.setActiveSession,
    currentSessionId: chat.currentSessionId,

    // Models
    getModels: models.fetchModels,
    validateModel: models.validateModel,
    getModelInfo: models.getModelInfo,
    checkModelAccess: models.checkModelAccess,
    models: models.models,

    // Subscription
    createSubscription: subscription.createSubscription,
    cancelSubscription: subscription.cancelSubscription,
    getSubscriptionStatus: subscription.getSubscriptionStatus,
    canAccessPremiumFeatures: subscription.canAccessPremiumFeatures,

    // Analytics - Enhanced with capability tracking
    recordUserAnalytics: analytics.recordUserAnalytics,
    recordModelSelection,
    trackMessageSent: analytics.trackMessageSent,
    trackImageGenerated: analytics.trackImageGenerated,
    trackFeatureUsed: analytics.trackFeatureUsed,
    trackWebSearchUsed,
    trackRagUsed,
    trackHybridUsed,
 
    // Capability validation
    validateWebSearchRequest,
    validateRagRequest,

    // Utilities
    testConnection,
    loading,
    error,
    clearError,

    // User context info
    userContext: profile ? {
      ai_style: profile.aiStyle,
      tier: profile.tier,
      username: profile.username,
      language: profile.appLanguage
    } : null
  };
};
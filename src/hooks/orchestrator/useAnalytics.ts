// hooks/orchestrator/useAnalytics.ts
import { useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApiClient } from './useApiClient';

export type AnalyticsAction = 
  | 'model_select'
  | 'message_sent'
  | 'image_generated'
  | 'session_created'
  | 'session_deleted'
  | 'subscription_started'
  | 'subscription_cancelled'
  | 'feature_used';

export interface AnalyticsEvent {
  action: AnalyticsAction;
  category?: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

export interface UserAnalyticsRequest {
  model?: string;
  action: AnalyticsAction;
  metadata?: Record<string, any>;
}

export const useAnalytics = () => {
  const { user, profile } = useAuth();
  const { post } = useApiClient();

  // Track user-specific analytics
  const recordUserAnalytics = useCallback(async ({
    model,
    action,
    metadata = {},
  }: UserAnalyticsRequest) => {
    try {
      console.log(`📊 Recording user analytics: ${action} for ${model || 'N/A'}`);
      
      await post('/api/user/analytics', {
        model: model || 'unknown',
        action,
        metadata: {
          ...metadata,
          user_ai_style: profile?.aiStyle,
          user_tier: profile?.tier,
          timestamp: new Date().toISOString()
        }
      });
      
      console.log(`✅ User analytics recorded: ${action} for ${model || 'N/A'}`);
    } catch (err: any) {
      console.warn('⚠️ Failed to record user analytics:', {
        action,
        model,
        error: err.message,
        status: err.status
      });
    }
  }, [post, profile]);

  // Track message sent - FIXED parameter order and mapping
  const trackMessageSent = useCallback(async (
    model: string,
    tokenCount: number,
    sessionId?: string
  ) => {
    await recordUserAnalytics({
      model,
      action: 'message_sent',
      metadata: {
        token_count: tokenCount,
        session_id: sessionId,
        user_ai_style: profile?.aiStyle,
        user_tier: profile?.tier,
        timestamp: new Date().toISOString()
      }
    });
  }, [recordUserAnalytics, profile]);

  // Track model selection
  const trackModelSelection = useCallback(async (
    newModel: string,
    tierRequired?: string,
    metadata: any = {}
  ) => {
    await recordUserAnalytics({
      model: newModel,
      action: 'model_select',
      metadata: { 
        tier_required: tierRequired,
        previous_model: metadata.previous_model || 'unknown',
        timestamp: new Date().toISOString(),
        ...metadata
      },
    });
  }, [recordUserAnalytics]);

  // Track image generation
  const trackImageGenerated = useCallback(async (
    model: string,
    promptLength: number,
    imageCount: number = 1,
    sessionId?: string
  ) => {
    await recordUserAnalytics({
      model,
      action: 'image_generated',
      metadata: {
        prompt_length: promptLength,
        image_count: imageCount,
        session_id: sessionId,
        timestamp: new Date().toISOString()
      }
    });
  }, [recordUserAnalytics]);

  // Track feature usage
  const trackFeatureUsed = useCallback(async (
    featureName: string,
    metadata: any = {}
  ) => {
    await recordUserAnalytics({
      action: 'feature_used',
      metadata: {
        feature: featureName,
        user_ai_style: profile?.aiStyle,
        user_tier: profile?.tier,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    });
  }, [recordUserAnalytics, profile]);

  // Track session events
  const trackSessionCreated = useCallback(async (
    sessionId: string,
    sessionType: 'chat' | 'image'
  ) => {
    await recordUserAnalytics({
      action: 'session_created',
      metadata: {
        session_id: sessionId,
        session_type: sessionType,
        timestamp: new Date().toISOString()
      }
    });
  }, [recordUserAnalytics]);

  const trackSessionDeleted = useCallback(async (sessionId: string) => {
    await recordUserAnalytics({
      action: 'session_deleted',
      metadata: {
        session_id: sessionId,
        timestamp: new Date().toISOString()
      }
    });
  }, [recordUserAnalytics]);

  // Track subscription events
  const trackSubscriptionStarted = useCallback(async (
    tier: 'pro' | 'premium',
    priceId: string
  ) => {
    await recordUserAnalytics({
      action: 'subscription_started',
      metadata: {
        tier,
        price_id: priceId,
        timestamp: new Date().toISOString()
      }
    });
  }, [recordUserAnalytics]);

  const trackSubscriptionCancelled = useCallback(async (
    tier: 'pro' | 'premium',
    reason?: string
  ) => {
    await recordUserAnalytics({
      action: 'subscription_cancelled',
      metadata: {
        tier,
        reason,
        timestamp: new Date().toISOString()
      }
    });
  }, [recordUserAnalytics]);

  return {
    // Specific tracking methods
    trackModelSelection,
    trackMessageSent,
    trackImageGenerated,
    trackSessionCreated,
    trackSessionDeleted,
    trackSubscriptionStarted,
    trackSubscriptionCancelled,
    trackFeatureUsed,
    
    // Main method
    recordUserAnalytics,
  };
};
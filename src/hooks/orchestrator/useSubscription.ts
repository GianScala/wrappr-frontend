// hooks/orchestrator/useSubscription.ts
import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateUserSubscription } from '../../../src/services/userService';
import { useApiClient } from './useApiClient';

export interface SubscriptionRequest {
  priceId: string;
  email: string;
}

export interface SubscriptionResponse {
  success: boolean;
  sessionUrl?: string;
  subscriptionId?: string;
  customerId?: string;
  error?: string;
}

export interface SubscriptionStatus {
  active: boolean;
  tier: 'free' | 'pro' | 'premium';
  subscriptionId?: string;
  customerId?: string;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
}

export const useSubscription = () => {
  const { user, profile, updateUserProfile } = useAuth();
  const { post } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new subscription
  const createSubscription = useCallback(async ({
    priceId,
    email,
  }: SubscriptionRequest): Promise<SubscriptionResponse> => {
    if (!user?.uid) {
      return { success: false, error: "User not authenticated" };
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`💳 Creating subscription for user: ${user.uid}`);
      
      const data = await post<SubscriptionResponse>('/api/subscription/create', {
        price_id: priceId,
        customer_email: email,
        success_url: `${window.location.origin}/subscription/success`,
        cancel_url: `${window.location.origin}/subscription/cancel`,
      });

      console.log("✅ Subscription created:", data);

      // Update user profile in Firebase if subscription was created successfully
      if (data.success && data.subscriptionId) {
        await updateUserSubscription(user.uid, {
          tier: 'pro',
          subscriptionId: data.subscriptionId,
          subscriptionStatus: 'active',
          customerId: data.customerId,
          subscriptionCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        });

        // Update local profile
        if (updateUserProfile) {
          await updateUserProfile(user.uid, {
            tier: 'pro',
            subscriptionStatus: 'active',
          });
        }
      }

      return {
        success: data.success,
        sessionUrl: data.sessionUrl,
        subscriptionId: data.subscriptionId,
        customerId: data.customerId,
        error: data.error,
      };
    } catch (err: any) {
      console.error("❌ Subscription error:", err);
      const errorMessage = err.message || "Failed to create subscription";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, post, updateUserProfile]);

  // Cancel subscription
  const cancelSubscription = useCallback(async (
    subscriptionId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user?.uid) {
      return { success: false, error: "User not authenticated" };
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🚫 Canceling subscription: ${subscriptionId}`);
      
      const data = await post<{ success: boolean; error?: string }>(
        '/api/subscription/cancel',
        { subscription_id: subscriptionId }
      );

      if (data.success) {
        // Update user profile in Firebase
        await updateUserSubscription(user.uid, {
          tier: 'free',
          subscriptionStatus: 'canceled',
          cancelAtPeriodEnd: true,
        });

        // Update local profile
        if (updateUserProfile) {
          await updateUserProfile(user.uid, {
            tier: 'free',
            subscriptionStatus: 'canceled',
          });
        }
      }

      return { success: data.success, error: data.error };
    } catch (err: any) {
      console.error("❌ Cancel subscription error:", err);
      const errorMessage = err.message || "Failed to cancel subscription";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, post, updateUserProfile]);

  // Get current subscription status
  const getSubscriptionStatus = useCallback((): SubscriptionStatus => {
    if (!profile) {
      return {
        active: false,
        tier: 'free',
      };
    }

    const isActive = profile.subscriptionStatus === 'active' && 
                    profile.tier !== 'free';

    return {
      active: isActive,
      tier: profile.tier || 'free',
      subscriptionId: profile.subscriptionId,
      customerId: profile.customerId,
      currentPeriodEnd: profile.subscriptionCurrentPeriodEnd,
      cancelAtPeriodEnd: profile.cancelAtPeriodEnd,
    };
  }, [profile]);

  // Check if user can access premium features
  const canAccessPremiumFeatures = useCallback((): boolean => {
    const status = getSubscriptionStatus();
    return status.active && (status.tier === 'pro' || status.tier === 'premium');
  }, [getSubscriptionStatus]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Methods
    createSubscription,
    cancelSubscription,
    getSubscriptionStatus,
    canAccessPremiumFeatures,
    clearError,
    
    // State
    loading,
    error,
  };
};
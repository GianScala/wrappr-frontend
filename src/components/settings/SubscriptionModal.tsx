// components/SubscriptionModal.tsx
import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  ActivityIndicator,
  PanResponder 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useOrchestrator } from '../../../src/hooks/useOrchestrator';

interface SubscriptionModalProps {
  onClose: () => void;
  onSubscriptionSuccess: (newTier: 'pro') => void;
  currentTier: 'free' | 'pro';
}

interface PlanFeature {
  text: string;
  included: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: PlanFeature[];
  isPopular?: boolean;
  stripePriceId: string;
}

export default function SubscriptionModal({ 
  onClose, 
  onSubscriptionSuccess, 
  currentTier 
}: SubscriptionModalProps) {
  const theme = useTheme();
  const { profile } = useAuth();
  const { createSubscription } = useOrchestrator();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 10,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 50) onClose();
      },
    })
  ).current;

  const plans: SubscriptionPlan[] = [
    {
      id: 'pro-weekly',
      name: 'Pro Weekly',
      price: '$4.99',
      period: '/week',
      stripePriceId: 'price_weekly_pro', // Replace with your Stripe price ID
      features: [
        { text: 'Unlimited AI conversations', included: true },
        { text: 'Access to premium models', included: true },
        { text: 'Priority support', included: true },
        { text: 'Advanced image generation', included: true },
        { text: 'Export chat history', included: true },
        { text: 'Custom model preferences', included: true }
      ]
    },
    {
      id: 'pro-monthly',
      name: 'Pro Monthly',
      price: '$20.99',
      period: '/month',
      stripePriceId: 'price_monthly_pro', // Replace with your Stripe price ID
      isPopular: true,
      features: [
        { text: 'Unlimited AI conversations', included: true },
        { text: 'Access to premium models', included: true },
        { text: 'Priority support', included: true },
        { text: 'Advanced image generation', included: true },
        { text: 'Export chat history', included: true },
        { text: 'Custom model preferences', included: true },
        { text: 'Best value per month!', included: true }
      ]
    },
    {
      id: 'pro-yearly',
      name: 'Pro Yearly',
      price: '$199.00',
      period: '/year',
      stripePriceId: 'price_yearly_pro', // Replace with your Stripe price ID
      features: [
        { text: 'Unlimited AI conversations', included: true },
        { text: 'Access to premium models', included: true },
        { text: 'Priority support', included: true },
        { text: 'Advanced image generation', included: true },
        { text: 'Export chat history', included: true },
        { text: 'Custom model preferences', included: true },
        { text: 'Save over $50 per year!', included: true }
      ]
    }
  ];

  const freeFeatures: PlanFeature[] = [
    { text: '100 messages per month', included: true },
    { text: 'Basic AI models only', included: true },
    { text: 'Limited image generation', included: true },
    { text: 'Community support', included: true },
    { text: 'Advanced features', included: false },
    { text: 'Premium models', included: false }
  ];

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!profile?.uid) {
      Alert.alert('Error', 'Please sign in to subscribe');
      return;
    }

    setLoading(true);
    setSelectedPlan(plan.id);

    try {
      const result = await createSubscription({
        userId: profile.uid,
        priceId: plan.stripePriceId,
        email: profile.email
      });

      if (result.success) {
        Alert.alert(
          'Success!', 
          'Your subscription has been activated. Welcome to Pro!',
          [{ text: 'OK', onPress: () => onSubscriptionSuccess('pro') }]
        );
      } else {
        throw new Error(result.error || 'Subscription failed');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      Alert.alert('Error', error.message || 'Failed to process subscription');
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const PlanCard = ({ plan, isCurrent = false }: { plan: SubscriptionPlan | null, isCurrent?: boolean }) => (
    <View style={[
      styles.planCard,
      {
        backgroundColor: theme.colors.card,
        borderColor: plan?.isPopular ? theme.colors.primary : theme.colors.border,
        borderWidth: plan?.isPopular ? 2 : 1,
      },
      isCurrent && { opacity: 0.6 }
    ]}>
      {plan?.isPopular && (
        <View style={[styles.popularBadge, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.popularText}>MOST POPULAR</Text>
        </View>
      )}
      
      <Text style={[styles.planName, { color: theme.colors.text }]}>
        {plan ? plan.name : 'Free Plan'}
      </Text>
      
      <View style={styles.priceContainer}>
        <Text style={[styles.price, { color: theme.colors.text }]}>
          {plan ? plan.price : '$0'}
        </Text>
        <Text style={[styles.period, { color: theme.colors.secondary }]}>
          {plan ? plan.period : '/month'}
        </Text>
      </View>

      <View style={styles.featuresContainer}>
        {(plan ? plan.features : freeFeatures).map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Ionicons 
              name={feature.included ? "checkmark-circle" : "close-circle"} 
              size={16} 
              color={feature.included ? theme.colors.success : theme.colors.error} 
            />
            <Text style={[
              styles.featureText, 
              { 
                color: feature.included ? theme.colors.text : theme.colors.secondary,
                textDecorationLine: feature.included ? 'none' : 'line-through'
              }
            ]}>
              {feature.text}
            </Text>
          </View>
        ))}
      </View>

      {plan && !isCurrent && (
        <TouchableOpacity
          style={[
            styles.subscribeButton,
            {
              backgroundColor: plan.isPopular ? theme.colors.primary : theme.colors.card,
              borderColor: theme.colors.primary,
            }
          ]}
          onPress={() => handleSubscribe(plan)}
          disabled={loading}
        >
          {loading && selectedPlan === plan.id ? (
            <ActivityIndicator color={plan.isPopular ? '#fff' : theme.colors.primary} />
          ) : (
            <Text style={[
              styles.subscribeButtonText,
              { color: plan.isPopular ? '#fff' : theme.colors.primary }
            ]}>
              Subscribe
            </Text>
          )}
        </TouchableOpacity>
      )}

      {isCurrent && (
        <View style={[styles.currentPlanBadge, { backgroundColor: theme.colors.success }]}>
          <Text style={styles.currentPlanText}>CURRENT PLAN</Text>
        </View>
      )}
    </View>
  );

  return (
    <View 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      {...panResponder.panHandlers}
    >
      <View style={[styles.dragHandle, { backgroundColor: theme.colors.border }]} />
      
                <View style={[styles.header, { 
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.background,
            paddingHorizontal: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
          }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Choose Your Plan
        </Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={theme.colors.iconActive} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, { color: theme.colors.secondary }]}>
          Unlock the full potential of AI with our Pro plans
        </Text>

        <View style={styles.plansContainer}>
          <PlanCard plan={null} isCurrent={currentTier === 'free'} />
          {plans.map(plan => (
            <PlanCard 
              key={plan.id} 
              plan={plan} 
              isCurrent={currentTier === 'pro'} 
            />
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.secondary }]}>
            • Cancel anytime • Secure payment with Stripe • No hidden fees
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    padding: 20,
    borderRadius: 16,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
  },
  period: {
    fontSize: 16,
    marginLeft: 4,
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  subscribeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  currentPlanBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  currentPlanText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
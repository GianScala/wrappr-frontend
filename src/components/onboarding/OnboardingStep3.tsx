// components/onboarding/OnboardingStep3.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useModels } from '../../../src/contexts/ModelContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import { AuthButton } from '../auth/AuthButton';
import { LLMModel } from '../../../types/models';

interface OnboardingStep3Props {
  textModel: string;
  onUpdateModels: (textModel: string) => void;
  onComplete: () => void;
  onBack: () => void;
  loading: boolean;
}

export const OnboardingStep3: React.FC<OnboardingStep3Props> = ({
  textModel,
  onUpdateModels,
  onComplete,
  onBack,
  loading,
}) => {
  const theme = useTheme();
  const { textModels, loading: modelsLoading } = useModels();
  const { profile } = useAuth();

  // Function to check if user can use a model based on tier
  const canUseModel = (model: LLMModel): boolean => {
    if (!profile) return true; // Allow during onboarding
    
    if (model.tier === 'free') return true;
    if (model.tier === 'pro' && (profile.tier === 'pro' )) return true;    
    return false;
  };

  const renderModelOption = (model: LLMModel, isSelected: boolean, onSelect: () => void) => {
    const canUse = canUseModel(model);
    
    return (
      <Pressable
        key={model.name}
        style={[
          styles.modelOption,
          {
            backgroundColor: theme.colors.surface || theme.colors.background,
            borderColor: isSelected 
              ? theme.colors.primary 
              : theme.colors.border,
            borderWidth: isSelected ? 2 : 1,
            opacity: canUse ? 1 : 0.6,
          },
        ]}
        onPress={canUse ? onSelect : undefined}
        disabled={!canUse}
      >
        <View style={styles.modelHeader}>
          <Text style={[styles.modelLabel, { color: theme.colors.text }]}>
            {model.displayName}
          </Text>
          <View style={styles.badges}>
            {model.tier !== 'free' && (
              <Text style={[styles.tierBadge, { 
                color: theme.colors.primary,
                backgroundColor: `${theme.colors.primary}22`,
              }]}>
                {model.tier.toUpperCase()}
              </Text>
            )}
            {model.capabilities.webSearchCapable && (
              <Text style={[styles.webSearchBadge, { 
                color: '#10b981',
                backgroundColor: '#10b98122',
              }]}>
                WEB SEARCH
              </Text>
            )}
          </View>
        </View>
        
        {model.description && (
          <Text style={[styles.modelDescription, { color: theme.colors.secondary }]}>
            {model.description}
          </Text>
        )}
        
        <View style={styles.capabilities}>
          <Text style={[styles.capability, { color: theme.colors.secondary }]}>
            • {model.provider.toUpperCase()}
          </Text>
          {model.capabilities.webSearchCapable && (
            <Text style={[styles.capability, { color: '#10b981' }]}>
              • Web Search Enabled
            </Text>
          )}
          {model.capabilities.codeExecution && (
            <Text style={[styles.capability, { color: theme.colors.secondary }]}>
              • Code Execution
            </Text>
          )}
          {model.capabilities.contextWindow && (
            <Text style={[styles.capability, { color: theme.colors.secondary }]}>
              • {(model.capabilities.contextWindow / 1000).toFixed(0)}k context
            </Text>
          )}
          {model.capabilities.maxTokens && (
            <Text style={[styles.capability, { color: theme.colors.secondary }]}>
              • {(model.capabilities.maxTokens / 1000).toFixed(0)}k max tokens
            </Text>
          )}
        </View>
        
        {!canUse && (
          <Text style={[styles.upgradeText, { color: theme.colors.primary }]}>
            Upgrade to {model.tier} to use this model
          </Text>
        )}
      </Pressable>
    );
  };

  if (modelsLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.secondary }]}>
          Loading available models...
        </Text>
      </View>
    );
  }

  // Filter models to prioritize free tier and web search capable models
  const sortedTextModels = [...textModels].sort((a, b) => {
    // Prioritize free models first
    if (a.tier === 'free' && b.tier !== 'free') return -1;
    if (a.tier !== 'free' && b.tier === 'free') return 1;
    
    // Then prioritize web search capable models
    if (a.capabilities.webSearchCapable && !b.capabilities.webSearchCapable) return -1;
    if (!a.capabilities.webSearchCapable && b.capabilities.webSearchCapable) return 1;
    
    return 0;
  });


  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Select AI Models
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.secondary }]}>
            Choose your preferred models for text and images. Models with web search can access real-time information.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Text Model
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.secondary }]}>
            Choose a model for chat and text generation
          </Text>
          {sortedTextModels.map((model) => 
            renderModelOption(
              model,
              textModel === model.name,
              () => onUpdateModels(model.name)
            )
          )}
        </View>

      </ScrollView>

      <View style={styles.buttons}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backText, { color: theme.colors.primary }]}>
            Back
          </Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <AuthButton 
            title="Complete Setup" 
            onPress={onComplete} 
            loading={loading}
            disabled={!textModel }
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    marginTop: 16,
  },
  scrollView: { flex: 1 },
  header: { marginTop: 20, marginBottom: 32 },
  title: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 28,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 20,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    marginBottom: 16,
    opacity: 0.8,
  },
  modelOption: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  modelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  modelLabel: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 16,
    flex: 1,
  },
  badges: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  tierBadge: {
    fontSize: 10,
    fontFamily: 'SpaceGrotesk-Bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textAlign: 'center',
    minWidth: 40,
  },
  webSearchBadge: {
    fontSize: 10,
    fontFamily: 'SpaceGrotesk-Bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textAlign: 'center',
  },
  modelDescription: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  capabilities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  capability: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  upgradeText: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Medium',
    marginTop: 8,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
    gap: 16,
  },
  backButton: {
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  backText: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 16,
  },
});
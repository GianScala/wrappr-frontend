// app/(auth)/onboarding.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useModels } from '../../src/contexts/ModelContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { OnboardingStep1 } from '../../src/components/onboarding/OnboardingStep1';
import { OnboardingStep2 } from '../../src/components/onboarding/OnboardingStep2';
import { OnboardingStep3 } from '../../src/components/onboarding/OnboardingStep3';
import { ProgressIndicator } from '../../src/components/onboarding/ProgressIndicator';
import { DEFAULT_TEXT_MODEL } from '../../types/models';

export interface OnboardingData {
  username: string;
  aiStyle: 'concise' | 'exhaustive' | 'friendly';
  preferredTextModel: string;
}

const OnboardingScreen: React.FC = () => {
  const { user, updateOnboardingPreferences, profile } = useAuth();
  const { textModels, loading: modelsLoading } = useModels();
  const theme = useTheme();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    username: '',
    aiStyle: 'friendly',
    preferredTextModel: DEFAULT_TEXT_MODEL,
  });

  // Redirect if user already completed onboarding
  useEffect(() => {
    console.log('🔍 Checking onboarding status:', {
      profileExists: !!profile,
      onboardingCompleted: profile?.onboardingCompleted,
    });

    if (profile?.onboardingCompleted) {
      console.log('✅ User already completed onboarding, redirecting to main app...');
      router.replace('/(tabs)');
    }
  }, [profile?.onboardingCompleted]);

  // Update default models when they become available
  useEffect(() => {
    if (!modelsLoading && textModels.length > 0) {
      // Find the best default text model (prioritize web search capable, free tier)
      const webSearchModels = textModels.filter(m => 
        m.capabilities.webSearchCapable && m.tier === 'free'
      );
      const defaultTextModel = webSearchModels.length > 0 
        ? webSearchModels[0].name 
        : textModels.find(m => m.tier === 'free')?.name || textModels[0]?.name || DEFAULT_TEXT_MODEL;

      console.log('🎯 Setting optimal defaults:', { 
        defaultTextModel, 
        webSearchCapable: webSearchModels.length > 0 
      });

      setOnboardingData(prev => ({
        ...prev,
        preferredTextModel: prev.preferredTextModel === DEFAULT_TEXT_MODEL ? defaultTextModel : prev.preferredTextModel,
      }));
    }
  }, [modelsLoading, textModels]);

  const handleNext = useCallback(() => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleComplete = useCallback(async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to complete onboarding.');
      return;
    }

    // Validate selections
    if (!onboardingData.username.trim()) {
      Alert.alert('Error', 'Please enter a username.');
      setCurrentStep(1);
      return;
    }

    if (!onboardingData.preferredTextModel) {
      Alert.alert('Error', 'Please select a preferred text model.');
      setCurrentStep(3);
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 Completing onboarding with data:', onboardingData);
      
      await updateOnboardingPreferences({
        username: onboardingData.username.trim(),
        aiStyle: onboardingData.aiStyle,
        preferredTextModel: onboardingData.preferredTextModel,
      });

      console.log('✅ Onboarding completed successfully');
      
      // Don't navigate manually - the useEffect above will handle redirection
      // when the profile updates with onboardingCompleted: true
      
    } catch (error) {
      console.error('❌ Onboarding failed:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
      setLoading(false);
    }
  }, [user, onboardingData, updateOnboardingPreferences]);

  const updateData = useCallback((data: Partial<OnboardingData>) => {
    console.log('📝 Updating onboarding data:', data);
    setOnboardingData(prev => ({ ...prev, ...data }));
  }, []);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <OnboardingStep1
            username={onboardingData.username}
            onUpdateUsername={(username) => updateData({ username })}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <OnboardingStep2
            aiStyle={onboardingData.aiStyle}
            onUpdateStyle={(aiStyle) => updateData({ aiStyle })}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <OnboardingStep3
            textModel={onboardingData.preferredTextModel}
            onUpdateModels={(textModel) =>
              updateData({ 
                preferredTextModel: textModel, 
              })
            }
            onComplete={handleComplete}
            onBack={handleBack}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <ProgressIndicator currentStep={currentStep} totalSteps={3} />
        {renderStep()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 20 },
});

export default OnboardingScreen;
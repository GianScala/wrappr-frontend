
// components/onboarding/OnboardingStep2.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { AuthButton } from '../auth/AuthButton';

interface OnboardingStep2Props {
  aiStyle: 'concise' | 'exhaustive' | 'friendly';
  onUpdateStyle: (style: 'concise' | 'exhaustive' | 'friendly') => void;
  onNext: () => void;
  onBack: () => void;
}

const AI_STYLES = [
  {
    value: 'concise' as const,
    title: 'Concise',
    description: 'Straight to the point, minimal explanations',
    icon: 'flash-outline' as const,
  },
  {
    value: 'exhaustive' as const,
    title: 'Exhaustive',
    description: 'Detailed responses with comprehensive information',
    icon: 'book-outline' as const,
  },
  {
    value: 'friendly' as const,
    title: 'Friendly',
    description: 'Conversational and approachable tone',
    icon: 'happy-outline' as const,
  },
];

export const OnboardingStep2: React.FC<OnboardingStep2Props> = ({
  aiStyle,
  onUpdateStyle,
  onNext,
  onBack,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Choose your AI style
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.secondary }]}>
            How would you like Jammy to respond?
          </Text>
        </View>

        <View style={styles.options}>
          {AI_STYLES.map((style) => (
            <Pressable
              key={style.value}
              style={[
                styles.option,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: aiStyle === style.value 
                    ? theme.colors.primary 
                    : theme.colors.border,
                  borderWidth: aiStyle === style.value ? 2 : 1,
                },
              ]}
              onPress={() => onUpdateStyle(style.value)}
            >
              <View style={styles.optionContent}>
                <Ionicons
                  name={style.icon}
                  size={24}
                  color={aiStyle === style.value 
                    ? theme.colors.primary 
                    : theme.colors.icon}
                />
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, { color: theme.colors.text }]}>
                    {style.title}
                  </Text>
                  <Text style={[styles.optionDescription, { color: theme.colors.secondary }]}>
                    {style.description}
                  </Text>
                </View>
              </View>
              {aiStyle === style.value && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={theme.colors.primary}
                />
              )}
            </Pressable>
          ))}
        </View>

        <View style={styles.buttons}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={[styles.backText, { color: theme.colors.primary }]}>
              Back
            </Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <AuthButton title="Continue" onPress={onNext} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'space-between' },
  header: { marginTop: 40 },
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
  },
  options: {
    paddingHorizontal: 20,
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  optionDescription: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
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

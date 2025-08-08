
// components/onboarding/OnboardingStep1.tsx
import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { AuthButton } from '../auth/AuthButton';

interface OnboardingStep1Props {
  username: string;
  onUpdateUsername: (username: string) => void;
  onNext: () => void;
}

export const OnboardingStep1: React.FC<OnboardingStep1Props> = ({
  username,
  onUpdateUsername,
  onNext,
}) => {
  const theme = useTheme();
  const isValid = username.trim().length >= 3;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            What should we call you?
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.secondary }]}>
            Choose a username for your Jammy'n profile
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            }]}
            placeholder="Enter username"
            placeholderTextColor={theme.colors.secondary}
            value={username}
            onChangeText={onUpdateUsername}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
          />
          <Text style={[styles.hint, { color: theme.colors.secondary }]}>
            At least 3 characters
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <AuthButton
            title="Continue"
            onPress={onNext}
            disabled={!isValid}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
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
  inputContainer: { paddingHorizontal: 20 },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  hint: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    marginTop: 8,
    marginLeft: 4,
  },
  buttonContainer: { paddingHorizontal: 20, paddingBottom: 20 },
});

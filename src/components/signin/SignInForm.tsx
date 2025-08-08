// src/components/signin/SignInForm.tsx - UPDATED
import React, { useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface SignInFormProps {
  email: string;
  password: string;
  isSignUp: boolean;
  loading: boolean;
  showPassword: boolean;
  emailFocused: boolean;
  passwordFocused: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onTogglePassword: () => void;
  onEmailFocus: () => void;
  onEmailBlur: () => void;
  onPasswordFocus: () => void;
  onPasswordBlur: () => void;
  onSubmit: () => void;
  onForgotPassword?: () => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({
  email,
  password,
  isSignUp,
  loading,
  showPassword,
  emailFocused,
  passwordFocused,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onEmailFocus,
  onEmailBlur,
  onPasswordFocus,
  onPasswordBlur,
  onSubmit,
  onForgotPassword,
}) => {
  const theme = useTheme();
  const passwordRef = useRef<TextInput>(null);

  return (
    <View style={styles.form}>
      {/* Email Input */}
      <View style={[
        styles.inputContainer,
        { 
          borderColor: emailFocused ? theme.colors.primary : theme.colors.border,
          borderWidth: emailFocused ? 2 : 1,
          backgroundColor: theme.colors.inputBackground || theme.colors.background,
        }
      ]}>
        <Ionicons 
          name="mail-outline" 
          size={20} 
          color={emailFocused ? theme.colors.primary : theme.colors.textSecondary} 
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          value={email}
          onChangeText={onEmailChange}
          placeholder="Email address"
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          onFocus={onEmailFocus}
          onBlur={onEmailBlur}
        />
      </View>

      {/* Password Input */}
      <View style={[
        styles.inputContainer,
        { 
          borderColor: passwordFocused ? theme.colors.primary : theme.colors.border,
          borderWidth: passwordFocused ? 2 : 1,
          backgroundColor: theme.colors.inputBackground || theme.colors.background,
        }
      ]}>
        <Ionicons 
          name="lock-closed-outline" 
          size={20} 
          color={passwordFocused ? theme.colors.primary : theme.colors.textSecondary} 
          style={styles.inputIcon}
        />
        <TextInput
          ref={passwordRef}
          style={[styles.input, { color: theme.colors.text }]}
          value={password}
          onChangeText={onPasswordChange}
          placeholder="Password"
          placeholderTextColor={theme.colors.textSecondary}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete="password"
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          onFocus={onPasswordFocus}
          onBlur={onPasswordBlur}
        />
        <TouchableOpacity
          onPress={onTogglePassword}
          style={styles.eyeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons 
            name={showPassword ? "eye-off" : "eye"} 
            size={20} 
            color={theme.colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>

      {/* Forgot Password - Show only in sign-in mode */}
      {!isSignUp && onForgotPassword && (
        <TouchableOpacity 
          style={styles.forgotButton} 
          onPress={onForgotPassword}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.forgotText, { color: theme.colors.primary }]}>
            Forgot password?
          </Text>
        </TouchableOpacity>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.button,
          { 
            backgroundColor: theme.colors.primary,
            opacity: loading ? 0.8 : 1,
          }
        ]}
        onPress={onSubmit}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.textInverse} size="small" />
        ) : (
          <View style={styles.buttonContent}>
            <Text style={[styles.buttonText, { color: theme.colors.textInverse }]}>
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Text>
            <Ionicons 
              name="arrow-forward" 
              size={20} 
              color={theme.colors.textInverse} 
              style={styles.buttonIcon}
            />
          </View>
        )}
      </TouchableOpacity>

      {/* Sign-up specific disclaimer */}
      {isSignUp && (
        <Text style={[styles.disclaimer, { color: theme.colors.textSecondary }]}>
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  eyeButton: {
    padding: 4,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'SpaceGrotesk-Medium',
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: 'SpaceGrotesk-Regular',
    marginTop: 8,
  },
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const { resetPassword } = useAuth(); // USING CORRECT METHOD FROM AUTHCONTEXT
  const { email: paramEmail } = useLocalSearchParams<{ email?: string }>();
  
  const [email, setEmail] = useState(paramEmail || '');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  console.log('🔧 ForgotPassword screen loaded with email:', paramEmail);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleSendReset = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    
    console.log('📧 Reset password request for:', trimmedEmail);
    
    if (!validateEmail(trimmedEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🚀 Calling resetPassword from AuthContext');
      const result = await resetPassword(trimmedEmail);
      
      console.log('📧 Reset password result:', result);
      
      if (result.success) {
        setEmailSent(true);
        console.log('✅ Password reset email sent successfully');
      } else {
        console.log('❌ Password reset failed:', result.message);
        Alert.alert('Reset Failed', result.message);
      }
      
    } catch (error: any) {
      console.error('❌ Unexpected password reset error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    console.log('🔙 Navigating back to sign in');
    router.replace('/(auth)/signin');
  };

  if (emailSent) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
          </View>
          
          <Text style={[styles.title, { color: colors.text }]}>
            Email Sent!
          </Text>
          
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Password reset instructions sent to:
          </Text>
          
          <View style={[styles.emailContainer, { backgroundColor: colors.inputBackground }]}>
            <Text style={[styles.email, { color: colors.primary }]}>
              {email}
            </Text>
          </View>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Check your inbox and spam folder for the reset link.
          </Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleBackToSignIn}
          >
            <Text style={[styles.buttonText, { color: colors.textInverse }]}>
              Back to Sign In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.resendContainer}
            onPress={() => setEmailSent(false)}
          >
            <Text style={[styles.resendText, { color: colors.textSecondary }]}>
              Didn't receive it? 
            </Text>
            <Text style={[styles.resendLink, { color: colors.primary }]}>
              Try again
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBackToSignIn}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="key-outline" size={64} color={colors.primary} />
          </View>
          
          <Text style={[styles.title, { color: colors.text }]}>
            Reset Password
          </Text>
          
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter your email to receive reset instructions.
          </Text>

          <View style={[
            styles.inputContainer,
            { 
              borderColor: colors.border,
              backgroundColor: colors.inputBackground || colors.background,
            }
          ]}>
            <Ionicons 
              name="mail-outline" 
              size={20} 
              color={colors.textSecondary} 
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="done"
              onSubmitEditing={handleSendReset}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button, 
              { 
                backgroundColor: colors.primary,
                opacity: loading ? 0.8 : 1,
              }
            ]}
            onPress={handleSendReset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textInverse} size="small" />
            ) : (
              <>
                <Text style={[styles.buttonText, { color: colors.textInverse }]}>
                  Send Reset Link
                </Text>
                <Ionicons 
                  name="paper-plane" 
                  size={18} 
                  color={colors.textInverse} 
                  style={styles.buttonIcon}
                />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.footer}
            onPress={handleBackToSignIn}
          >
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Remember your password? 
            </Text>
            <Text style={[styles.linkText, { color: colors.primary }]}>
              Sign in
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 24,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  button: {
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 15,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  linkText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  emailContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignSelf: 'center',
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
});
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Animated
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function EmailVerificationScreen() {
  const { colors } = useTheme();
  const { 
    user, 
    resendVerificationEmail, 
    refreshUserEmailStatus, 
    isEmailVerified,
    logout 
  } = useAuth();
  
  const { email } = useLocalSearchParams<{ email: string }>();
  
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [checkCount, setCheckCount] = useState(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    // Auto-check verification status every 3 seconds, but limit to 20 attempts
    const interval = setInterval(() => {
      if (checkCount < 20) {
        checkVerificationStatus(true); // Silent check
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [checkCount]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timeout = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timeout);
    }
  }, [resendTimer]);

  const checkVerificationStatus = async (silent = false) => {
    if (checking) return;
    
    if (!silent) setChecking(true);
    
    try {
      await refreshUserEmailStatus();
      setCheckCount(prev => prev + 1);
      
      if (isEmailVerified()) {
        Alert.alert(
          '✅ Email Verified!',
          'Your email has been verified successfully.',
          [{
            text: 'Continue',
            onPress: () => router.replace('/(auth)/signin'),
          }]
        );
        return;
      }
    } catch (error) {
      console.error('❌ Verification check failed:', error);
      if (!silent) {
        Alert.alert('Error', 'Unable to check verification status. Please try again.');
      }
    } finally {
      if (!silent) setChecking(false);
    }
  };

  const handleResendEmail = async () => {
    if (resending || resendTimer > 0) return;

    setResending(true);
    try {
      const targetEmail = email || user?.email;
      if (!targetEmail) {
        throw new Error('No email address available');
      }

      const result = await resendVerificationEmail(targetEmail);
      
      if (result.success) {
        Alert.alert('📧 Email Sent!', 'Please check your inbox for the verification link.');
        setResendTimer(60);
        setCheckCount(0); // Reset check counter
      } else {
        Alert.alert('Error', result.message || 'Failed to send verification email');
      }
    } catch (error: any) {
      console.error('❌ Resend email error:', error);
      Alert.alert('Error', error.message || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  const handleBackToSignIn = () => {
    Alert.alert(
      'Go Back?',
      'You will need to verify your email before you can sign in.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Go Back', 
          style: 'destructive',
          onPress: () => router.replace('/(auth)/signin')
        }
      ]
    );
  };

  const displayEmail = email || user?.email || 'your email';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="mail-outline" size={64} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          Verify Your Email
        </Text>
        
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          We sent a verification link to:
        </Text>
        
        <View style={[styles.emailContainer, { backgroundColor: colors.inputBackground }]}>
          <Text style={[styles.email, { color: colors.primary }]}>
            {displayEmail}
          </Text>
        </View>

        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Click the link in your email to verify your account. This may take a few minutes to arrive.
        </Text>

        <TouchableOpacity
          style={[
            styles.button, 
            styles.primaryButton, 
            { backgroundColor: colors.primary },
            checking && styles.buttonDisabled
          ]}
          onPress={() => checkVerificationStatus(false)}
          disabled={checking}
        >
          {checking ? (
            <ActivityIndicator color={colors.textInverse} size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.textInverse} />
              <Text style={[styles.buttonText, { color: colors.textInverse }]}>
                I've Verified My Email
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.secondaryButton,
            { borderColor: colors.primary },
            (resending || resendTimer > 0) && styles.buttonDisabled,
          ]}
          onPress={handleResendEmail}
          disabled={resending || resendTimer > 0}
        >
          {resending ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <>
              <Ionicons 
                name="paper-plane-outline" 
                size={18} 
                color={resendTimer > 0 ? colors.textSecondary : colors.primary} 
              />
              <Text style={[
                styles.secondaryButtonText, 
                { color: resendTimer > 0 ? colors.textSecondary : colors.primary }
              ]}>
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Email'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.footer}
          onPress={handleBackToSignIn}
        >
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Wrong email? 
          </Text>
          <Text style={[styles.linkText, { color: colors.primary }]}>
            Go back to sign in
          </Text>
        </TouchableOpacity>

        <View style={[styles.helpContainer, { backgroundColor: colors.inputBackground }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.helpText, { color: colors.textSecondary }]}>
            Check your spam folder if you don't see the email
          </Text>
        </View>

        {checkCount >= 15 && (
          <View style={[styles.troubleContainer, { backgroundColor: colors.error + '10' }]}>
            <Ionicons name="warning-outline" size={20} color={colors.error} />
            <Text style={[styles.troubleText, { color: colors.error }]}>
              Still having trouble? Contact support for help.
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk-Regular',
  },
  emailContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
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
    paddingHorizontal: 8,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryButton: {
    // backgroundColor set dynamically
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk-SemiBold',
    marginLeft: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk-SemiBold',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
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
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  helpText: {
    fontSize: 13,
    marginLeft: 8,
    fontFamily: 'SpaceGrotesk-Regular',
    flex: 1,
  },
  troubleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  troubleText: {
    fontSize: 13,
    marginLeft: 8,
    fontFamily: 'SpaceGrotesk-Regular',
    flex: 1,
  },
});
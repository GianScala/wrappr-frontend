// SignInScreen.tsx
import React, { useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { SignInHeader } from '../../src/components/signin/SignInHeader';
import { SignInForm } from '../../src/components/signin/SignInForm';
import { SignInFooter } from '../../src/components/signin/SignInFooter';
import { ThemeToggle } from '../../src/components/signin/ThemeToggle';
import { ErrorModal } from '../../src/components/common/ErrorModal';
import { SuccessModal } from '../../src/components/common/SuccessModal';
import { useSignInLogic } from '../../src/components/signin/hooks/useSignInLogic';
import { useSignInAnimations } from '../../src/components/signin/hooks/useSignInAnimations';

const { height } = Dimensions.get('window');

export default function SignInScreen() {
  const { colors, isLoaded } = useTheme();
  const { user, loading: authLoading, refreshEmailVerificationStatus } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();

  const signInLogic = useSignInLogic();
  const { fadeAnim, scaleAnim } = useSignInAnimations();


  useEffect(() => {
    if (authLoading || !user) return;

    (async () => {
      try {
        await refreshEmailVerificationStatus(); 
        if (user.emailVerified) {
          console.log('✅ Verified → navigating into app');
          router.replace('/(tabs)');
        } else {
          console.log('⚠️ Still not verified — staying on SignIn');
        }
      } catch (e) {
        console.warn('Failed to refresh verification status', e);
      }
    })();
  }, [user, authLoading, refreshEmailVerificationStatus, router]);


  useEffect(() => {
    if (signInLogic.showSuccessModal && signInLogic.error) {
      signInLogic.clearError();
    }
  }, [signInLogic.showSuccessModal, signInLogic]);

  //

  const focusHandler = useCallback(
    (field: 'email' | 'password') => {
      if (field === 'email') signInLogic.setEmailFocused(true);
      else signInLogic.setPasswordFocused(true);
      setTimeout(() => scrollViewRef.current?.scrollTo({ y: 100, animated: true }), 100);
    },
    [signInLogic]
  );
  const handleEmailBlur = () => signInLogic.setEmailFocused(false);
  const handlePasswordBlur = () => signInLogic.setPasswordFocused(false);

  //
  // 4) Toggles & nav
  //
  const togglePwd = () => signInLogic.setShowPassword(!signInLogic.showPassword);
  const toggleMode = () => signInLogic.setIsSignUp(!signInLogic.isSignUp);
  const handleForgotPassword = useCallback(() => {
    router.push('/(auth)/forgot-password');
  }, [router]);

  //
  // 5) Show loader while theme/auth initializes
  //
  if (!isLoaded || authLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
      </View>
    );
  }

  //
  // 6) If verified (caught above), show “Redirecting…”
  //
  if (user && user.emailVerified) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Redirecting...</Text>
      </View>
    );
  }


  const showError = !!signInLogic.error && !signInLogic.showSuccessModal;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? -20 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            {/* Banner if signed-in but NOT verified */}
            {user && user.emailVerified === false && (
              <View
                style={[
                  styles.warningContainer,
                  { backgroundColor: colors.warningBackground, borderColor: colors.warning },
                ]}
              >
                <Text style={[styles.warningText, { color: colors.warning }]}>
                  ⚠️ Please verify your email before continuing
                </Text>
              </View>
            )}

            <SignInHeader isSignUp={signInLogic.isSignUp} />

            <SignInForm
              email={signInLogic.email}
              password={signInLogic.password}
              isSignUp={signInLogic.isSignUp}
              loading={signInLogic.loading}
              showPassword={signInLogic.showPassword}
              emailFocused={signInLogic.emailFocused}
              passwordFocused={signInLogic.passwordFocused}
              onEmailChange={signInLogic.setEmail}
              onPasswordChange={signInLogic.setPassword}
              onTogglePassword={togglePwd}
              onEmailFocus={() => focusHandler('email')}
              onEmailBlur={handleEmailBlur}
              onPasswordFocus={() => focusHandler('password')}
              onPasswordBlur={handlePasswordBlur}
              onSubmit={signInLogic.handleAuth}
              onForgotPassword={handleForgotPassword}
            />

            <SignInFooter isSignUp={signInLogic.isSignUp} onToggleMode={toggleMode} />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ThemeToggle />

      <SuccessModal
        visible={signInLogic.showSuccessModal}
        title="Verification Email Sent!"
        message={signInLogic.successMessage}
        actionText="Back to Sign In"
        onAction={signInLogic.handleSuccessAction}
        onClose={signInLogic.handleSuccessAction}
      />

      <ErrorModal
        visible={showError}
        error={signInLogic.error}
        onClose={signInLogic.clearError}
        onAction={signInLogic.handleErrorAction}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContainer: { flexGrow: 1, minHeight: height },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Medium',
  },
  warningContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  warningText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Medium',
    textAlign: 'center',
  },
});

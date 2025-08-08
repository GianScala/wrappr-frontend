// src/components/signin/hooks/useSignInLogic.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { Keyboard } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { getUserProfile } from '../../../services/userService';
import { UserFriendlyError } from '../../../utils/errorHandler';

export const useSignInLogic = () => {
  /* Form State --------------------------------------------------- */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  /* Modal states ------------------------------------------------- */
  const [error, setError] = useState<UserFriendlyError | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  /* Track component mount ---------------------------------------- */
  const isMountedRef = useRef(true);

  const { signIn, signUp, signOut, resendVerificationEmail } = useAuth();

  /* Cleanup on unmount ------------------------------------------- */
  useEffect(() => () => { isMountedRef.current = false }, []);

  /* Input validation --------------------------------------------- */
  const validateInputs = useCallback((): boolean => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError({
        title: 'Missing Information',
        message: 'Please enter both email and password to continue.',
        actionText: 'OK',
        severity: 'warning'
      });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError({
        title: 'Invalid Email',
        message: 'Please enter a valid email address.',
        actionText: 'OK',
        severity: 'warning'
      });
      return false;
    }
    if (isSignUp && password.length < 6) {
      setError({
        title: 'Password Too Short',
        message: 'Password must be at least 6 characters long.',
        actionText: 'OK',
        severity: 'warning'
      });
      return false;
    }
    return true;
  }, [email, password, isSignUp]);

  /* Success modal helper ----------------------------------------- */
  const showSuccess = useCallback((addr: string) => {
    setError(null);
    setSuccessMessage(
      `We've sent a verification email to ${addr}. Please check your inbox and click the link to verify your account.`
    );
    setShowSuccessModal(true);
    setPassword('');
  }, []);

  /* Error modal helper ------------------------------------------- */
  const showErrorModal = useCallback((uf: UserFriendlyError) => {
    setShowSuccessModal(false);
    setSuccessMessage('');
    setError(uf);
  }, []);

  /* Handle sign-up ------------------------------------------------ */
  const handleSignUp = useCallback(async (addr: string, pwd: string) => {
    try {
      const user = await signUp(addr, pwd);
      // Firebase automatically sends verification in signUp implementation
      showSuccess(addr);
    } catch (e: any) {
      const code = e.code as string;
      if (code === 'auth/email-already-in-use') {
        showErrorModal({
          title: 'Email Already Registered',
          message: 'This email is already associated with an account. Try signing in instead.',
          actionText: 'Sign In',
          severity: 'error'
        });
      } else if (code === 'auth/weak-password') {
        showErrorModal({
          title: 'Weak Password',
          message: 'Password should be at least 6 characters long.',
          actionText: 'OK',
          severity: 'error'
        });
      } else {
        showErrorModal({
          title: 'Sign Up Failed',
          message: e.message || 'An error occurred during sign up. Please try again.',
          actionText: 'OK',
          severity: 'error'
        });
      }
    }
  }, [signUp, showSuccess, showErrorModal]);

  /* Handle sign-in ------------------------------------------------ */
  const handleSignIn = useCallback(async (addr: string, pwd: string) => {
    try {
      const cred = await signIn(addr, pwd);

      // 1) enforce email verification
      if (!cred.user.emailVerified) {
        await signOut();
        showErrorModal({
          title: 'Email Not Verified',
          message: 'Please verify your email before signing in. Check your inbox for the verification link.',
          actionText: 'Resend Verification',
          severity: 'warning'
        });
        return;
      }

      // 2) enforce existing profile
      const profile = await getUserProfile(cred.user.uid);
      if (!profile) {
        await signOut();
        showErrorModal({
          title: 'No Account Found',
          message: 'No user profile exists. Please create an account first.',
          actionText: 'Create Account',
          severity: 'error'
        });
        return;
      }

      // 3) success: AuthGuard will navigate onward
    } catch (e: any) {
      const code = e.code as string;
      if (code === 'auth/user-not-found') {
        showErrorModal({
          title: 'Account Not Found',
          message: 'No account found with this email address. Would you like to create a new account?',
          actionText: 'Create Account',
          severity: 'error'
        });
      } else if (code === 'auth/wrong-password') {
        showErrorModal({
          title: 'Incorrect Password',
          message: 'The password you entered is incorrect. Would you like to reset your password?',
          actionText: 'Reset Password',
          severity: 'error'
        });
      } else if (code === 'auth/invalid-email') {
        showErrorModal({
          title: 'Invalid Email',
          message: 'Please enter a valid email address.',
          actionText: 'OK',
          severity: 'warning'
        });
      } else if (code === 'auth/network-request-failed') {
        showErrorModal({
          title: 'Network Error',
          message: 'Please check your internet connection and try again.',
          actionText: 'OK',
          severity: 'warning'
        });
      } else {
        showErrorModal({
          title: 'Sign In Failed',
          message: 'An unexpected error occurred. Please try again.',
          actionText: 'OK',
          severity: 'error'
        });
      }
    }
  }, [signIn, signOut, showErrorModal]);

  /* Main authentication handler ---------------------------------- */
  const handleAuth = useCallback(async () => {
    if (!validateInputs()) return;

    Keyboard.dismiss();
    setLoading(true);
    setError(null);
    setShowSuccessModal(false);
    setSuccessMessage('');

    const addr = email.trim().toLowerCase();
    try {
      if (isSignUp) {
        await handleSignUp(addr, password);
      } else {
        await handleSignIn(addr, password);
      }
    } catch {
      if (isMountedRef.current) {
        showErrorModal({
          title: 'Something Went Wrong',
          message: 'An unexpected error occurred. Please try again.',
          actionText: 'OK',
          severity: 'error'
        });
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [email, password, isSignUp, validateInputs, handleSignUp, handleSignIn, showErrorModal]);

  /* Error modal action handler ----------------------------------- */
  const handleErrorAction = useCallback(() => {
    const act = error?.actionText;
    setError(null);
    setShowSuccessModal(false);
    setSuccessMessage('');

    switch (act) {
      case 'Sign In':
        setIsSignUp(false);
        break;
      case 'Create Account':
        setIsSignUp(true);
        break;
      case 'Resend Verification':
        resendVerificationEmail();
        break;
      case 'Reset Password':
        router.push(`/(auth)/forgot-password?email=${encodeURIComponent(email.trim())}`);
        break;
    }
  }, [error?.actionText, email.trim(), resendVerificationEmail]);

  /* Success modal action handler --------------------------------- */
  const handleSuccessAction = useCallback(() => {
    setShowSuccessModal(false);
    setSuccessMessage('');
    setIsSignUp(false);
    setEmail('');
  }, []);

  /* Clear modals ------------------------------------------------- */
  const clearError = useCallback(() => setError(null), []);
  const clearSuccessModal = useCallback(() => {
    setShowSuccessModal(false);
    setSuccessMessage('');
  }, []);

  /* Forgot-password shortcut ------------------------------------ */
  const handleForgotPassword = useCallback(() => {
    setError(null);
    setShowSuccessModal(false);
    const addr = email.trim();
    router.push(
      addr
        ? `/(auth)/forgot-password?email=${encodeURIComponent(addr)}`
        : '/(auth)/forgot-password'
    );
  }, [email]);

  /* Reset password when switching modes -------------------------- */
  useEffect(() => {
    if (!loading) setPassword('');
  }, [isSignUp, loading]);

  /* Dismiss keyboard when switching modes ------------------------ */
  useEffect(() => {
    Keyboard.dismiss();
  }, [isSignUp]);

  return {
    // State
    email,
    password,
    isSignUp,
    loading,
    showPassword,
    emailFocused,
    passwordFocused,
    error,
    showSuccessModal,
    successMessage,
    // Setters
    setEmail,
    setPassword,
    setIsSignUp,
    setShowPassword,
    setEmailFocused,
    setPasswordFocused,
    // Actions
    handleAuth,
    handleForgotPassword,
    handleErrorAction,
    clearError,
    handleSuccessAction,
    clearSuccessModal,
  };
};

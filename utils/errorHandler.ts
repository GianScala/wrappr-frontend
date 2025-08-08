// src/utils/errorHandler.ts
export interface UserFriendlyError {
    title: string;
    message: string;
    actionText?: string;
    severity: 'error' | 'warning' | 'info';
  }
  
  export const getAuthErrorMessage = (error: any): UserFriendlyError => {
    // Log the actual error for debugging (only in development)
    if (__DEV__) {
      console.log('🚨 Error Handler - Processing error:', {
        code: error.code,
        message: error.message,
        fullError: error
      });
    }
  
    // Map Firebase errors to user-friendly messages
    const errorMap: { [key: string]: UserFriendlyError } = {
      // Authentication errors
      'auth/user-not-found': {
        title: 'Account Not Found',
        message: 'We couldn\'t find an account with this email address. Please check your email or create a new account.',
        actionText: 'Create Account',
        severity: 'warning'
      },
      'auth/wrong-password': {
        title: 'Incorrect Password',
        message: 'The password you entered is incorrect. Please try again or reset your password.',
        actionText: 'Try Again',
        severity: 'error'
      },
      'auth/invalid-credential': {
        title: 'Invalid Credentials',
        message: 'The email or password you entered is incorrect. Please check your credentials and try again.',
        actionText: 'Try Again',
        severity: 'error'
      },
      'auth/invalid-email': {
        title: 'Invalid Email',
        message: 'Please enter a valid email address.',
        actionText: 'Fix Email',
        severity: 'warning'
      },
      'auth/email-already-in-use': {
        title: 'Email Already Registered',
        message: 'This email is already associated with an account. Try signing in instead.',
        actionText: 'Sign In',
        severity: 'info'
      },
      'auth/weak-password': {
        title: 'Password Too Weak',
        message: 'Please choose a stronger password with at least 6 characters.',
        actionText: 'Try Again',
        severity: 'warning'
      },
      'auth/email-not-verified': {
        title: 'Email Not Verified',
        message: 'Please verify your email address before signing in. Check your inbox for a verification link.',
        actionText: 'Resend Email',
        severity: 'warning'
      },
      'auth/too-many-requests': {
        title: 'Too Many Attempts',
        message: 'Too many unsuccessful attempts. Please wait a few minutes before trying again.',
        actionText: 'Wait & Retry',
        severity: 'error'
      },
      'auth/network-request-failed': {
        title: 'Connection Problem',
        message: 'Please check your internet connection and try again.',
        actionText: 'Retry',
        severity: 'error'
      },
      'auth/verification-sent': {
        title: 'Verification Email Sent',
        message: 'We\'ve sent a verification link to your email. Please check your inbox and verify your account.',
        actionText: 'Got It',
        severity: 'info'
      }
    };
  
    // Return mapped error or generic fallback
    const result = errorMap[error.code] || {
      title: 'Something Went Wrong',
      message: 'We encountered an unexpected issue. Please try again in a moment.',
      actionText: 'Try Again',
      severity: 'error'
    };
  
    if (__DEV__) {
      console.log('🚨 Error Handler - Mapped to:', result);
    }
  
    return result;
  };
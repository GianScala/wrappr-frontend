
// utils/auth/validation.ts
export const VALID_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email: string): boolean => {
  return VALID_EMAIL_REGEX.test(email.trim());
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'Email already in use.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try later.';
    case 'auth/network-request-failed':
      return 'Network error.';
    case 'auth/weak-password':
      return 'Password too weak.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    default:
      return 'Something went wrong. Please try again.';
  }
};
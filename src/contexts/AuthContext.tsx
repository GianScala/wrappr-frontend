import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  fetchSignInMethodsForEmail,
  signOut as fbSignOut,
} from 'firebase/auth';
import { auth } from '../../config/firebase';
import {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  UserProfile,
} from '../services/userService';
import { getAuthErrorMessage, UserFriendlyError } from '../../utils/errorHandler';
import { validateEmail, validatePassword } from '../../utils/auth/validation';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
export interface AuthResult {
  success: boolean;
  error?: UserFriendlyError;
  needsVerification?: boolean;
  user?: User;
}

type AuthState = 'loading' | 'unauthenticated' | 'authenticated';

interface AuthContextShape {
  /* state */
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  authState: AuthState;
  updateTokenUsage(tokens: number): void;
  /* auth flow */
  signIn(email: string, password: string): Promise<AuthResult>;
  signUp(email: string, password: string): Promise<AuthResult>;
  signOut(): Promise<void>;
  refresh(): Promise<void>;
  /* onboarding */
  updateOnboardingPreferences(data: {
    username?: string;
    aiStyle?: string;
    preferredTextModel?: string;
  }): Promise<void>;
  /* profile updates */
  updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void>;

  /* helpers */
  resendVerificationEmail(): Promise<AuthResult>;
  resetPassword(email: string): Promise<AuthResult>;
  changePassword(
    currentPwd: string,
    newPwd: string
  ): Promise<AuthResult>;
}

/* ------------------------------------------------------------------ */
/* Context + Provider                                                 */
/* ------------------------------------------------------------------ */
const AuthContext = createContext<AuthContextShape | null>(null);
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState<AuthState>('loading');

  /* --------------------  listener  -------------------- */
  useEffect(
    () =>
      onAuthStateChanged(auth, async fbUser => {
        console.log('🔄 Auth state changed:', fbUser?.email || 'no user');
        setLoading(true);
        setUser(fbUser);

        if (!fbUser) {
          console.log('👤 No Firebase user - setting unauthenticated');
          setProfile(null);
          setAuthState('unauthenticated');
          setLoading(false);
          return;
        }

        console.log('🔍 Firebase user found, fetching Firestore profile...');
        console.log('📊 Firebase Auth data:', {
          uid: fbUser.uid,
          email: fbUser.email,
          firebaseEmailVerified: fbUser.emailVerified, // This might be stale!
          creationTime: fbUser.metadata.creationTime,
          lastSignInTime: fbUser.metadata.lastSignInTime,
        });

        /* fetch or create Firestore profile */
        try {
          let firestoreProfile = await getUserProfile(fbUser.uid);
          
          if (!firestoreProfile) {
            console.log('📝 No Firestore profile found, creating one...');
            await createUserProfile(fbUser.uid, fbUser.email!);
            firestoreProfile = await getUserProfile(fbUser.uid);
          }

          if (firestoreProfile) {
            console.log('✅ Firestore profile retrieved:', {
              uid: firestoreProfile.uid,
              email: firestoreProfile.email,
              firestoreEmailVerified: firestoreProfile.emailVerified, // This is the truth!
              onboardingCompleted: firestoreProfile.onboardingCompleted,
              createdAt: firestoreProfile.createdAt,
            });

            // 🚨 IMPORTANT: Check if Firebase emailVerified doesn't match Firestore
            if (fbUser.emailVerified !== firestoreProfile.emailVerified) {
              console.log('⚠️ EMAIL VERIFICATION MISMATCH:', {
                firebaseAuthSays: fbUser.emailVerified,
                firestoreProfileSays: firestoreProfile.emailVerified,
                action: 'Using Firestore as source of truth'
              });
            }

            setProfile(firestoreProfile);
            setAuthState('authenticated');
          } else {
            console.error('❌ Failed to create/retrieve Firestore profile');
            setProfile(null);
            setAuthState('unauthenticated');
          }
        } catch (error) {
          console.error('❌ Error handling user profile:', error);
          setProfile(null);
          setAuthState('unauthenticated');
        }
        
        setLoading(false);
      }),
    []
  );

  /* -------------------- updateTokenUsage -------------------- */
  const updateTokenUsage = useCallback((tokens: number) => {
    console.log('Token usage updated:', tokens);
  }, []);

  /* -------------------- helpers -------------------- */
  const refresh = useCallback(async () => {
    const fbUser = auth.currentUser;
    if (!fbUser) {
      console.log('❌ No current user to refresh');
      return;
    }

    console.log('🔄 Refreshing user data...');
    
    try {
      // 1. Refresh Firebase Auth user
      await fbUser.reload();
      console.log('✅ Firebase user reloaded');
      
      // 2. Re-fetch Firestore profile (source of truth)
      const freshProfile = await getUserProfile(fbUser.uid);
      
      if (freshProfile) {
        console.log('✅ Fresh Firestore profile loaded:', {
          emailVerified: freshProfile.emailVerified,
          onboardingCompleted: freshProfile.onboardingCompleted
        });
        
        // 3. If Firebase Auth shows verified but Firestore doesn't, update Firestore
        if (fbUser.emailVerified && !freshProfile.emailVerified) {
          console.log('🔄 Firebase Auth verified, updating Firestore profile...');
          await updateUserProfile(fbUser.uid, { emailVerified: true });
          // Re-fetch after update
          const updatedProfile = await getUserProfile(fbUser.uid);
          setProfile(updatedProfile);
        } else {
          setProfile(freshProfile);
        }
      } else {
        console.error('❌ No profile found during refresh');
      }
    } catch (error) {
      console.error('❌ Error refreshing user:', error);
    }
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      // Validate input
      if (!validateEmail(email)) {
        return {
          success: false,
          error: getAuthErrorMessage({ code: 'auth/invalid-email' })
        };
      }

      if (!validatePassword(password)) {
        return {
          success: false,
          error: getAuthErrorMessage({ code: 'auth/weak-password' })
        };
      }

      try {
        console.log('🔐 Signing in user...');
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        
        // Force reload to get latest Firebase Auth status
        await user.reload();
        
        console.log('📊 After sign-in, Firebase Auth says:', {
          emailVerified: user.emailVerified
        });
        
        // Get Firestore profile to check REAL verification status
        const userProfile = await getUserProfile(user.uid);
        
        if (userProfile) {
          console.log('📊 After sign-in, Firestore profile says:', {
            emailVerified: userProfile.emailVerified
          });
          
          // Use Firestore as source of truth
          if (!userProfile.emailVerified) {
            console.log('📧 Email not verified according to Firestore, sending verification...');
            await sendEmailVerification(user);
            return {
              success: false,
              error: getAuthErrorMessage({ code: 'auth/email-not-verified' }),
              needsVerification: true,
              user,
            };
          }
        } else {
          console.log('❌ No Firestore profile found after sign-in');
          return {
            success: false,
            error: getAuthErrorMessage({ code: 'auth/user-not-found' })
          };
        }
        
        console.log('✅ Sign in successful');
        return { success: true, user };
      } catch (e: any) {
        console.error('❌ Sign in error:', e.code);
        return { 
          success: false, 
          error: getAuthErrorMessage(e)
        };
      }
    },
    []
  );

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    // Validate input
    if (!validateEmail(email)) {
      return {
        success: false,
        error: getAuthErrorMessage({ code: 'auth/invalid-email' })
      };
    }

    if (!validatePassword(password)) {
      return {
        success: false,
        error: getAuthErrorMessage({ code: 'auth/weak-password' })
      };
    }

    try {
      console.log('📝 Checking if email exists...');
      if ((await fetchSignInMethodsForEmail(auth, email)).length) {
        return {
          success: false,
          error: getAuthErrorMessage({ code: 'auth/email-already-in-use' })
        };
      }
      
      console.log('🆕 Creating new user...');
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(user);
      
      // Create Firestore profile with emailVerified: false
      await createUserProfile(user.uid, email);
      
      console.log('✅ Sign up successful, verification email sent');
      return {
        success: true,
        needsVerification: true,
        user,
      };
    } catch (e: any) {
      console.error('❌ Sign up error:', e.code);
      return { 
        success: false, 
        error: getAuthErrorMessage(e)
      };
    }
  }, []);

  const signOut = useCallback(async () => {
    console.log('👋 Signing out...');
    await fbSignOut(auth);
  }, []);

  const resendVerificationEmail = useCallback(async (): Promise<AuthResult> => {
    const u = auth.currentUser;
    if (!u) return { 
      success: false, 
      error: getAuthErrorMessage({ code: 'auth/user-not-found' })
    };
    
    // Check Firestore profile for verification status
    const userProfile = await getUserProfile(u.uid);
    if (userProfile?.emailVerified) {
      return { 
        success: false, 
        error: { 
          title: 'Already Verified', 
          message: 'Your email is already verified.', 
          severity: 'info' 
        }
      };
    }
    
    try {
      await sendEmailVerification(u);
      return { 
        success: true, 
        error: getAuthErrorMessage({ code: 'auth/verification-sent' })
      };
    } catch (e: any) {
      return { 
        success: false, 
        error: getAuthErrorMessage(e)
      };
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    if (!validateEmail(email)) {
      return {
        success: false,
        error: getAuthErrorMessage({ code: 'auth/invalid-email' })
      };
    }

    try {
      await sendPasswordResetEmail(auth, email);
      return { 
        success: true, 
        error: { 
          title: 'Reset Email Sent', 
          message: 'Password reset instructions sent to your email.', 
          severity: 'info' 
        }
      };
    } catch (e: any) {
      return { 
        success: false, 
        error: getAuthErrorMessage(e)
      };
    }
  }, []);

  const changePassword = useCallback(
    async (currentPwd: string, newPwd: string): Promise<AuthResult> => {
      const u = auth.currentUser;
      if (!u || !u.email) return { 
        success: false, 
        error: getAuthErrorMessage({ code: 'auth/user-not-found' })
      };

      if (!validatePassword(newPwd)) {
        return {
          success: false,
          error: getAuthErrorMessage({ code: 'auth/weak-password' })
        };
      }

      try {
        const cred = EmailAuthProvider.credential(u.email, currentPwd);
        await reauthenticateWithCredential(u, cred);
        await updatePassword(u, newPwd);
        return { 
          success: true, 
          error: { 
            title: 'Password Changed', 
            message: 'Your password has been updated successfully.', 
            severity: 'info' 
          }
        };
      } catch (e: any) {
        return { 
          success: false, 
          error: getAuthErrorMessage(e)
        };
      }
    },
    []
  );

  /* -------------------- onboarding -------------------- */
  const updateOnboardingPreferences = useCallback(async (data: {
    username?: string;
    aiStyle?: "concise" | "exhaustive" | "friendly";
    preferredTextModel?: string;
  }): Promise<void> => {
    const u = auth.currentUser;
    if (!u) {
      throw new Error('No authenticated user found');
    }

    console.log('🔄 Updating onboarding preferences:', { uid: u.uid, data });

    try {
      // Update the user profile with onboarding data and mark as completed
      await updateUserProfile(u.uid, {
        ...data,
        onboardingCompleted: true,
        lastActive: new Date(),
      });

      console.log('✅ Onboarding preferences updated in Firestore');

      // Refresh the profile in context
      const updatedProfile = await getUserProfile(u.uid);
      if (updatedProfile) {
        console.log('✅ Profile refreshed:', {
          onboardingCompleted: updatedProfile.onboardingCompleted,
          username: updatedProfile.username,
          aiStyle: updatedProfile.aiStyle,
          preferredTextModel: updatedProfile.preferredTextModel,
        });
        setProfile(updatedProfile);
      }
    } catch (error) {
      console.error('❌ Failed to update onboarding preferences:', error);
      throw error;
    }
  }, []);

  /* -------------------- profile updates -------------------- */
  const updateUserProfileInContext = useCallback(async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
    console.log('🔄 Updating user profile from context:', { uid, updates });

    try {
      // Update in Firestore
      await updateUserProfile(uid, updates);

      // Refresh the profile in context
      const updatedProfile = await getUserProfile(uid);
      if (updatedProfile) {
        console.log('✅ Profile updated and refreshed in context');
        setProfile(updatedProfile);
      }
    } catch (error) {
      console.error('❌ Failed to update user profile:', error);
      throw error;
    }
  }, []);

  const value: AuthContextShape = {
    user,
    profile,
    loading,
    authState,
    updateTokenUsage,
    signIn,
    signUp,
    signOut,
    refresh,
    updateOnboardingPreferences,
    updateUserProfile: updateUserProfileInContext,
    resendVerificationEmail,
    resetPassword,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
import React, { useEffect, useRef } from 'react';
import { router, useSegments } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authState, profile, user } = useAuth();
  const segments = useSegments();
  const currentPath = segments.join('/') || '(tabs)';
  
  // Prevent infinite navigation loops
  const lastNavigationRef = useRef<string | null>(null);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('🔄 AuthGuard navigation effect triggered');
    console.log('📊 Context Data:', {
      authState,
      currentPath,
      userExists: !!user,
      userEmail: user?.email,
      contextProfileExists: !!profile,
    });

    // Clear any pending navigation
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    const navigate = (path: string, reason: string) => {
      // Prevent duplicate navigation to same path
      if (lastNavigationRef.current === path) {
        console.log(`⚠️ Skipping duplicate navigation to ${path}`);
        return;
      }

      console.log(`🔄 ${reason}`);
      console.log(`🔄 Navigating to: ${path}`);
      
      lastNavigationRef.current = path;
      
      // Use timeout to prevent rapid navigation cycles
      navigationTimeoutRef.current = setTimeout(() => {
        try {
          router.replace(path as any);
        } catch (error) {
          console.error('❌ Navigation error:', error);
          lastNavigationRef.current = null;
        }
      }, 100);
    };

    // Handle loading state
    if (authState === 'loading') {
      console.log('⏳ Auth still loading, no navigation needed');
      return;
    }

    // Handle unauthenticated state
    if (authState === 'unauthenticated') {
      console.log('❌ User not authenticated, checking redirect...');
      
      // Only redirect if not already on auth screens
      if (!currentPath.includes('auth') && currentPath !== '+not-found') {
        navigate('/(auth)/signin', 'Redirecting to signin...');
      } else {
        console.log('⏳ AuthGuard: User unauthenticated, showing loading while redirecting');
      }
      return;
    }

    // Handle authenticated state
    if (authState === 'authenticated') {
      // Check onboarding completion
      if (!profile?.onboardingCompleted) {
        console.log('⚠️ User authenticated but onboarding not completed');
        if (!currentPath.includes('onboarding')) {
          navigate('/(auth)/onboarding', 'Redirecting to onboarding...');
        }
        return;
      }

      // Redirect away from auth/onboarding screens if fully authenticated
      if (currentPath.includes('auth') || currentPath.includes('onboarding')) {
        navigate('/(tabs)', 'Redirecting authenticated user to main app');
        return;
      }

      // User is fully authenticated and on valid route
      console.log('✅ ROUTING: All conditions satisfied - user can access:', currentPath);
      lastNavigationRef.current = null; // Clear navigation lock
      return;
    }

    console.log('⚠️ Unhandled auth state:', authState);
  }, [authState, profile?.onboardingCompleted, currentPath, user?.email]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // Only show loading during initial auth state determination
  if (authState === 'loading') {
    console.log('⏳ AuthGuard: Rendering loading screen');
    return null; // or your loading component
  }

  // Always render children - let the routing handle what page to show
  return <>{children}</>;
};

export default AuthGuard;
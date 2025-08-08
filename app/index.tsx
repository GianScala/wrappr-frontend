import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../src/contexts/AuthContext";
import { useModels } from "../src/contexts/ModelContext";
import { useTheme } from "../src/contexts/ThemeContext";

export default function Index() {
  const { user, loading: authLoading, profile, authState } = useAuth();
  const { loading: modelsLoading } = useModels();
  const { colors, isLoaded: themeLoaded } = useTheme();

  console.log("🔍 INDEX: Current state:", {
    authState,
    authLoading,
    modelsLoading,
    themeLoaded,
    userExists: !!user,
    profileExists: !!profile,
    emailVerified: user?.emailVerified,
    onboardingComplete: profile?.onboardingCompleted,
  });

  useEffect(() => {
    // Don't navigate while loading
    if (authLoading || modelsLoading || !themeLoaded) {
      console.log("⏳ INDEX: Still loading...");
      return;
    }

    // Use a small delay to ensure state is settled
    const timer = setTimeout(() => {
      console.log("🚀 INDEX: Starting navigation logic...");

      if (authState === "unauthenticated") {
        console.log("🚪 INDEX: Not authenticated -> signin");
        router.replace("/(auth)/signin");
        return;
      }

      if (authState === "authenticated") {
        // Check if onboarding is needed
        if (!profile?.onboardingCompleted) {
          console.log("📱 INDEX: Need onboarding");
          router.replace("/(auth)/onboarding");
          return;
        }

        // All good - go to main app
        console.log("✅ INDEX: All conditions met -> tabs");
        router.replace("/(tabs)");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [
    authState,
    authLoading,
    modelsLoading,
    themeLoaded,
    profile?.onboardingCompleted,
  ]);

  // Loading message based on state
  const getLoadingMessage = () => {
    if (authLoading) return "Checking authentication...";
    if (!themeLoaded) return "Loading theme...";
    if (modelsLoading) return "Loading AI models...";
    if (user && !profile) return "Loading profile...";
    return "Preparing app...";
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary || "#007AFF"} />

      <Text style={[styles.loadingText, { color: colors.text }]}>
        {getLoadingMessage()}
      </Text>

      {/* Debug info in development */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={[styles.debugText, { color: colors.secondary }]}>
            Auth: {authState} | Theme: {themeLoaded ? "✅" : "⏳"} | Models:{" "}
            {modelsLoading ? "⏳" : "✅"}
          </Text>
          {user && (
            <Text style={[styles.debugText, { color: colors.secondary }]}>
              Email verified: {user.emailVerified ? "✅" : "❌"} | Onboarding:{" "}
              {profile?.onboardingCompleted ? "✅" : "❌"}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: "SpaceGrotesk-Regular",
    textAlign: "center",
  },
  debugContainer: {
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  debugText: {
    fontSize: 12,
    fontFamily: "SpaceGrotesk-Regular",
    textAlign: "center",
    marginVertical: 2,
  },
});

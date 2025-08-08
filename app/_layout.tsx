import React from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "../src/contexts/AuthContext";
import { ThemeProvider } from "../src/contexts/ThemeContext";
import { ModelProvider } from "../src/contexts/ModelContext";
import { AppProvider } from "../src/contexts/AppContext";
import AuthGuard from "../src/components/auth/AuthGuard";

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "SpaceGrotesk-Regular": require("../assets/fonts/SpaceGrotesk-Regular.ttf"),
    "SpaceGrotesk-SemiBold": require("../assets/fonts/SpaceGrotesk-SemiBold.ttf"),
  });

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadText}>Loading fonts…</Text>
      </View>
    );
  }

  if (fontError) {
    return (
      <View style={styles.loader}>
        <Text style={styles.errorText}>Font loading failed</Text>
        <Text style={styles.errorSub}>Please restart the app</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider>
          <ModelProvider>
            <AppProvider>
              <AuthGuard>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: "slide_from_right",
                    gestureEnabled: true,
                    animationDuration: 300,
                  }}
                >
                  {/* Landing/redirect page */}
                  <Stack.Screen
                    name="index"
                    options={{
                      animation: "none",
                      gestureEnabled: false,
                    }}
                  />

                  {/* Authentication screens */}
                  <Stack.Screen
                    name="(auth)/signin"
                    options={{ animation: "fade" }}
                  />
                  <Stack.Screen
                    name="(auth)/forgot-password"
                    options={{ animation: "slide_from_right" }}
                  />
                  <Stack.Screen
                    name="(auth)/email-verification"
                    options={{ animation: "slide_from_right" }}
                  />
                  <Stack.Screen
                    name="(auth)/onboarding"
                    options={{ animation: "slide_from_right" }}
                  />

                  {/* Main app screens */}
                  <Stack.Screen
                    name="(tabs)"
                    options={{
                      headerShown: false,
                      animation: "fade",
                    }}
                  />

                  {/* Settings modal */}
                  <Stack.Screen
                    name="settings"
                    options={{
                      presentation: "modal",
                      animation: "slide_from_bottom",
                      gestureEnabled: true,
                      headerShown: false,
                      animationDuration: 250,
                    }}
                  />
                </Stack>
              </AuthGuard>
            </AppProvider>
          </ModelProvider>
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadText: {
    marginTop: 16,
    fontFamily: "SpaceGrotesk-Regular",
    fontSize: 16,
    color: "#333",
  },
  errorText: {
    fontFamily: "SpaceGrotesk-SemiBold",
    fontSize: 18,
    color: "#F00",
    textAlign: "center",
    marginBottom: 8,
  },
  errorSub: {
    fontFamily: "SpaceGrotesk-Regular",
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});

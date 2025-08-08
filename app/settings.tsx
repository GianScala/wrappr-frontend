// SettingsModal.tsx

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '../src/contexts/AuthContext';
import { useAppContext } from '../src/contexts/AppContext';
import { useTheme } from '../src/contexts/ThemeContext';

import ProfileHeader from '../src/components/settings/user-profile/ProfileHeader';
import TokenUsage from '../src/components/settings/token-usage/TokenUsage';
import ModelsCard from '../src/components/settings/LLM-models/ModelsCard';
import AIStyles from '../src/components/settings/ai-styles/AIStyles';
import DatabaseHistory from '../src/components/settings/DatabaseHistory';
import QuickActions from '../src/components/settings/QuickActions';

const APP_VERSION = '1.0.1';

export default function SettingsModal() {
  const { profile, signOut, user } = useAuth();
  const { textModels, selectedTextModel } = useAppContext();
  const theme = useTheme();

  const handleImageUpdate = (newImageUrl: string | null) => {
    console.log('✅ Profile image updated:', newImageUrl);
  };

  const handleTierUpdate = (newTier: 'free' | 'pro') => {
    console.log('✅ Tier updated:', newTier);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            // 1) Clear all local storage
            await AsyncStorage.clear();

            // (If you use other persisted caches, clear them here too)

            // 2) Sign out from Firebase
            await signOut();

            // 3) Reset navigation to the public 'signin' route
            router.replace('/signin');
          } catch (error) {
            console.error('❌ Sign-out error:', error);
            // Even on failure, force redirect
            router.replace('/signin');
          }
        },
      },
    ]);
  };

  // Simple loading state while we know nothing about user/profile
  if (!user || !profile) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: theme.colors.background },
        ]}>
        <Text style={[styles.loadingText, { color: theme.colors.secondary }]}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
          },
        ]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Settings
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.closeButton,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}
            activeOpacity={0.7}>
            <Ionicons name="close" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Profile & Settings Sections */}
        <ProfileHeader
          profile={profile}
          onImageUpdate={handleImageUpdate}
          onTierUpdate={handleTierUpdate}
        />

        <TokenUsage profile={profile} />
        <AIStyles />
        <DatabaseHistory />

        <ModelsCard
          textModels={textModels}
          selectedTextModel={selectedTextModel}
        />
        <QuickActions />

        {/* Appearance */}
        <View style={styles.appearanceCard}>
          <View style={styles.appearanceHeader}>
            <View
              style={[
                styles.appearanceIconContainer,
                { backgroundColor: theme.colors.primary + '10' },
              ]}>
              <Ionicons
                name="color-palette"
                size={16}
                color={theme.colors.primary}
              />
            </View>
            <Text style={[styles.appearanceTitle, { color: theme.colors.text }]}>
              Appearance
            </Text>
          </View>

          <View style={styles.appearanceContent}>
            <TouchableOpacity
              onPress={theme.toggleTheme}
              style={[
                styles.themeToggle,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                },
              ]}
              activeOpacity={0.7}>
              <View style={styles.themeToggleContent}>
                <Text
                  style={[
                    styles.themeToggleTitle,
                    { color: theme.colors.text },
                  ]}>
                  Dark Mode
                </Text>
                <Text
                  style={[
                    styles.themeToggleSubtitle,
                    { color: theme.colors.secondary },
                  ]}>
                  {theme.isDark ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
              <View
                style={[
                  styles.switchContainer,
                  {
                    backgroundColor: theme.isDark
                      ? theme.colors.primary
                      : theme.colors.border,
                  },
                ]}>
                <View
                  style={[
                    styles.switchThumb,
                    { transform: [{ translateX: theme.isDark ? 16 : 2 }] },
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleLogout}
          activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text
            style={[styles.versionText, { color: theme.colors.secondary }]}>
            Jammy Chat v{APP_VERSION}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Styles unchanged from your original
const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'SpaceGrotesk-Regular',
  },
  header: { paddingTop: 40, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 0.5 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '600', fontFamily: 'SpaceGrotesk-Regular' },
  closeButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  appearanceCard: { marginVertical: 2, paddingVertical: 4 },
  appearanceHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingVertical: 12 },
  appearanceIconContainer: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  appearanceTitle: { fontSize: 16, fontWeight: '500', fontFamily: 'SpaceGrotesk-Regular' },
  appearanceContent: { paddingVertical: 4, paddingHorizontal: 4 },
  themeToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  themeToggleContent: { flex: 1 },
  themeToggleTitle: { fontSize: 14, fontWeight: '500', fontFamily: 'SpaceGrotesk-Regular', marginBottom: 2 },
  themeToggleSubtitle: { fontSize: 12, fontFamily: 'SpaceGrotesk-Regular' },
  switchContainer: { width: 40, height: 24, borderRadius: 12, padding: 2, justifyContent: 'center' },
  switchThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF' },
  signOutButton: { padding: 16, borderRadius: 40, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginVertical: 16, backgroundColor: '#ef4444' },
  signOutText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500', fontFamily: 'SpaceGrotesk-Regular', marginLeft: 8 },
  versionContainer: { alignItems: 'center', marginTop: 24, marginBottom: 12 },
  versionText: { fontSize: 12, fontWeight: '400', fontFamily: 'SpaceGrotesk-Regular', opacity: 0.6 },
});

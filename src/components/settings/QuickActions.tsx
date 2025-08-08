// components/QuickActions.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/contexts/ThemeContext';

export default function QuickActions() {
  const theme = useTheme();

  const quickActions = [
    {
      id: 'help-support',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      icon: 'help-circle' as const,
      color: '#10b981',
      action: () => Alert.alert("Help & Support", "For support, please contact us at support@jammy.ai")
    },
    {
      id: 'privacy-policy',
      title: 'Privacy Policy',
      subtitle: 'Read our privacy policy',
      icon: 'shield-checkmark' as const,
      color: '#6366f1',
      action: () => Alert.alert("Privacy Policy", "Opening privacy policy...")
    },
    {
      id: 'feedback',
      title: 'Send Feedback',
      subtitle: 'Help us improve the app',
      icon: 'star' as const,
      color: '#f97316',
      action: () => Alert.alert("Feedback", "Thank you for your interest! Feedback feature coming soon.")
    },
    {
      id: 'rate-app',
      title: 'Rate Our App',
      subtitle: 'Share your experience',
      icon: 'heart' as const,
      color: '#ef4444',
      action: () => Alert.alert("Rate App", "Thank you! This will open the app store rating.")
    }
  ];

  const styles = StyleSheet.create({
    container: {
      marginVertical: 8,
      paddingVertical: 4,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 4,
      paddingVertical: 12,
    },
    iconContainer: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.primary + '10',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: '500',
      fontFamily: 'SpaceGrotesk-Regular',
      color: theme.colors.text,
    },
    contentSection: {
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    actionsContainer: {
      backgroundColor: theme.colors.background,
      borderRadius: 20,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      paddingVertical: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    actionIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    actionContent: {
      flex: 1,
    },
    actionTitle: {
      fontSize: 14,
      fontWeight: '500',
      fontFamily: 'SpaceGrotesk-Regular',
      color: theme.colors.text,
      marginBottom: 2,
    },
    actionSubtitle: {
      fontSize: 12,
      fontFamily: 'SpaceGrotesk-Regular',
      color: theme.colors.secondary,
      lineHeight: 16,
    },
    separator: {
      height: 0.5,
      backgroundColor: theme.colors.border,
      marginHorizontal: 16,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="apps" size={16} color={theme.colors.primary} />
        </View>
        <Text style={styles.title}>Quick Actions</Text>
      </View>

      {/* Content Section */}
      <View style={styles.contentSection}>
        <View style={styles.actionsContainer}>
          {quickActions.map((action, index) => (
            <React.Fragment key={action.id}>
              <TouchableOpacity
                onPress={action.action}
                style={styles.actionButton}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconContainer, {
                  backgroundColor: `${action.color}10`,
                }]}>
                  <Ionicons name={action.icon} size={16} color={action.color} />
                </View>
                
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>
                    {action.title}
                  </Text>
                  <Text style={styles.actionSubtitle}>
                    {action.subtitle}
                  </Text>
                </View>
                
                <Ionicons 
                  name="chevron-forward" 
                  size={16} 
                  color={theme.colors.secondary}
                />
              </TouchableOpacity>
              
              {index < quickActions.length - 1 && (
                <View style={styles.separator} />
              )}
            </React.Fragment>
          ))}
        </View>
      </View>
    </View>
  );
}
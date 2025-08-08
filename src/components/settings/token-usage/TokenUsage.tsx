// components/TokenUsage.tsx
import React from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import { UserProfile } from '../../../../services/userService';

interface TokenUsageProps {
  profile: UserProfile;
}

const STATUS = [
  { min: 0, max: 79, label: 'Healthy', color: '#22c55e' },
  { min: 80, max: 94, label: 'Warning', color: '#f59e0b' },
  { min: 95, max: 100, label: 'Limit', color: '#ef4444' },
];

function getStatus(usagePercent: number) {
  return STATUS.find(s => usagePercent >= s.min && usagePercent <= s.max) || STATUS[0];
}

export default function TokenUsage({ profile }: TokenUsageProps) {
  const theme = useTheme();
  const tokensLeft = profile.tokenLimit - profile.tokensUsed;
  const usagePercent = Math.min((profile.tokensUsed / profile.tokenLimit) * 100, 100);
  const status = getStatus(usagePercent);

  // Animation
  const progressAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: usagePercent,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [usagePercent]);

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const feedbackText =
    usagePercent < 80
      ? 'Plenty of tokens left'
      : usagePercent < 95
      ? 'Getting close to your limit'
      : tokensLeft < 0
      ? 'You have exceeded your token limit'
      : 'Token limit nearly reached';

  const styles = StyleSheet.create({
    // Clean container without background boxes
    container: {
      marginVertical: 4,
      paddingVertical: 4,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 4,
      paddingVertical: 2,
    },
    iconContainer: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: status.color + '10',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: '500',
      fontFamily: 'SpaceGrotesk-Regular',
      color: theme.colors.text,
      flex: 1,
    },
    statusChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 40,
      backgroundColor: status.color + '10',
      borderWidth: 0.5,
      borderColor: status.color,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '500',
      fontFamily: 'SpaceGrotesk-Regular',
      color: status.color,
      letterSpacing: 0.2,
    },

    // Clean content section
    contentSection: {
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    usageContainer: {
      backgroundColor: theme.colors.background,
      borderRadius: 18,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    usageHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: 16,
      justifyContent: 'center',
    },
    usageCount: {
      fontSize: 28,
      fontWeight: '500',
      fontFamily: 'SpaceGrotesk-Regular',
      color: theme.colors.text,
      letterSpacing: -0.5,
    },
    usageLimit: {
      fontSize: 16,
      fontWeight: '400',
      fontFamily: 'SpaceGrotesk-Regular',
      color: theme.colors.secondary,
      marginLeft: 4,
    },
    
    // Professional progress bar
    progressBarContainer: {
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.border + '30',
      overflow: 'hidden',
      marginBottom: 16,
    },
    progressBar: {
      height: '100%',
      borderRadius: 4,
      backgroundColor: status.color,
    },
    
    // Info text styling
    infoSection: {
      alignItems: 'center',
      gap: 4,
    },
    remainingText: {
      fontSize: 14,
      fontWeight: '500',
      fontFamily: 'SpaceGrotesk-Regular',
      color: tokensLeft < 0 ? status.color : theme.colors.text,
      textAlign: 'center',
    },
    feedbackText: {
      fontSize: 12,
      fontFamily: 'SpaceGrotesk-Regular',
      color: theme.colors.secondary,
      textAlign: 'center',
      lineHeight: 16,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="flash" size={16} color={status.color} />
        </View>
        
        <Text style={styles.title}>Token Usage</Text>
        
        <View style={styles.statusChip}>
          <Text style={styles.statusText}>
            {status.label}
          </Text>
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.contentSection}>
        <View style={styles.usageContainer}>
          {/* Usage Numbers */}
          <View style={styles.usageHeader}>
            <Text style={styles.usageCount}>
              {profile.tokensUsed.toLocaleString()}
            </Text>
            <Text style={styles.usageLimit}>
              / {profile.tokenLimit.toLocaleString()}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <Animated.View style={[styles.progressBar, {
              width: progressBarWidth,
            }]} />
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.remainingText}>
              {tokensLeft >= 0
                ? `${tokensLeft.toLocaleString()} tokens remaining`
                : 'Limit exceeded'}
            </Text>
            
            <Text style={styles.feedbackText}>
              {feedbackText}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
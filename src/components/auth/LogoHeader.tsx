// components/auth/LogoHeader.tsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../../../src/contexts/ThemeContext';

interface LogoHeaderProps {
  subtitle: string;
}

export const LogoHeader: React.FC<LogoHeaderProps> = ({ subtitle }) => {
  const theme = useTheme();

  return (
    <View style={styles.header}>
      <View style={[styles.logoContainer, {
        backgroundColor: theme.colors.primaryBackground,
        ...theme.shadows.sm,
      }]}>
        <Image
          source={require('../../../assets/icon.png')}
          style={styles.logo}
          resizeMode="cover"
        />
      </View>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Jammy'n
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.secondary }]}>
        {subtitle}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: 48 },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: { width: '100%', height: '100%' },
  title: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 28,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 16,
  },
});
// src/components/signin/SignInHeader.tsx
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface SignInHeaderProps {
  isSignUp: boolean;
}

export const SignInHeader: React.FC<SignInHeaderProps> = ({ isSignUp }) => {
    const theme = useTheme();
  
  
  // require your logo asset
  const logo = require('../../../assets/icon.png');

  return (
    <>
      {/* Full rounded logo without background container */}
      <View style={styles.logoWrapper}>
        <Image
          source={logo}
          style={[
            styles.logoImage,
            {
              // Add a subtle shadow that adapts to theme
              shadowColor: theme.colors.text,
              shadowOffset: {
                width: 0,
                height: 4,
              },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 8,
            }
          ]}
          resizeMode="cover"
        />
      </View>
      <Text style={[styles.subtitle, { color: theme.colors.text }]}>
        {isSignUp ? 'Create your account' : 'Sign in to continue'}
      </Text>
    </>
  );
};

const styles = StyleSheet.create({
  logoWrapper: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  logoImage: {
    width: 96,
    height: 96,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)', // Subtle border
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'SpaceGrotesk-SemiBold',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'SpaceGrotesk',
    lineHeight: 22,
  },
});
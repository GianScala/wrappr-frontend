// src/components/signin/SignInFooter.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface SignInFooterProps {
  isSignUp: boolean;
  onToggleMode: () => void;
}

export const SignInFooter: React.FC<SignInFooterProps> = ({ isSignUp, onToggleMode }) => {
  const theme = useTheme();
  

  return (
    <>
      <View style={styles.divider}>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
        <Text style={[styles.dividerText, { color: theme.colors.text }]}>OR</Text>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
      </View>

      <TouchableOpacity onPress={onToggleMode} style={styles.switchButton}>
        <Text style={[styles.switchText, { color: theme.colors.text }]}>
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <Text style={[styles.switchLink, { color: theme.colors.primary }]}>
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </Text>
        </Text>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    fontFamily: 'SpaceGrotesk',
  },
  switchButton: {
    alignSelf: 'center',
  },
  switchText: {
    fontSize: 15,
    fontFamily: 'SpaceGrotesk',
  },
  switchLink: {
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
});
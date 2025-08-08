
// components/auth/ThemeToggle.tsx
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/contexts/ThemeContext';

interface ThemeToggleProps {
  disabled?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ disabled = false }) => {
  const theme = useTheme();

  return (
    <Pressable
      onPress={theme.toggleTheme}
      style={[styles.themeToggle, {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      }]}
      disabled={disabled}
    >
      <Ionicons
        name={theme.isDark ? 'sunny' : 'moon'}
        size={16}
        color={theme.colors.icon}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  themeToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
});
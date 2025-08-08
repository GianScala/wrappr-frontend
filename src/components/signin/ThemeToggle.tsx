// src/components/signin/ThemeToggle.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { toggleTheme } = useTheme();
  const theme = useTheme();
  const darkMode = useTheme();
  
  const isDarkMode = darkMode;

  const handleToggle = () => {
    console.log('🔥 ThemeToggle - Button pressed!');
    console.log('🔥 ThemeToggle - Current mode:', darkMode ? 'dark' : 'light');
    console.log('🔥 ThemeToggle - isDarkMode:', isDarkMode);
    console.log('🔥 ThemeToggle - Current background color:', theme.colors.background);
    console.log('🔥 ThemeToggle - toggleTheme function exists:', typeof toggleTheme);
    
    try {
      console.log('🔥 ThemeToggle - About to call toggleTheme...');
      toggleTheme();
      console.log('🔥 ThemeToggle - toggleTheme called successfully!');
    } catch (error) {
      console.error('🚨 ThemeToggle - Error calling toggleTheme:', error);
    }
    
    // Check after a delay
    setTimeout(() => {
      console.log('🔥 ThemeToggle - After 200ms - mode:', darkMode ? 'dark' : 'light');
      console.log('🔥 ThemeToggle - After 200ms - background:', theme.colors.background);
    }, 200);
  };

  console.log('🔄 ThemeToggle - Component rendering with mode:', darkMode ? 'dark' : 'light');

  return (
    <TouchableOpacity
      style={[
        styles.themeToggle,
        { 
          backgroundColor: theme.colors.input,
          borderColor: theme.colors.border,
        }
      ]}
      onPress={handleToggle}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons 
        name={isDarkMode ? "sunny" : "moon"} 
        size={24} 
        color={theme.colors.primary} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  themeToggle: {
    position: 'absolute',
    top: 50,
    right: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 10,
    zIndex: 9999,
  },
});
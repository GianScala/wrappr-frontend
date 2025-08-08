import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

export type ThemeMode = 'light' | 'dark';

interface ThemeColors {
  primary: string;
  primaryBackground: string;
  primaryHover: string;
  primaryPressed: string;
  background: string;
  surface: string;
  card: string;
  text: string;
  secondary: string;
  border: string;
  icon: string;
  iconActive: string;
  accent: string;
  accentBackground: string;
  success: string;
  successBackground: string;
  warning: string;
  warningBackground: string;
  error: string;
  errorBackground: string;
  info: string;
  infoBackground: string;
  disabled: string;
  disabledBackground: string;
  textInverse: string; // Add this missing property
}

interface Theme {
  colors: ThemeColors;
  spacing: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl', number>;
  borderRadius: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full', number>;
  shadows: Record<'sm' | 'md' | 'lg', {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  }>;
  typography: {
    fontSizes: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl', number>;
    fontWeights: Record<'light' | 'regular' | 'medium' | 'semibold' | 'bold', string>;
  };
}

interface ThemeContextType extends Theme {
  isDark: boolean;
  toggleTheme: () => Promise<void>;
  isLoaded: boolean; // Expose loading state
}

const brand = {
  primary: '#E65100',
  primaryHover: '#D84315',
  primaryPressed: '#BF360C',
  accent: '#FFF3E0',
};

const neutral = {
  light: {
    background: '#FFFFFF',
    surface: '#F7F9FA',
    card: '#FFFFFF',
    text: '#0F1419',
    secondary: '#536471',
    border: '#EFF3F4',
    disabled: '#8B98A5',
    disabledBackground: '#F7F9FA',
    textInverse: '#FFFFFF',
  },
  dark: {
    background: '#121212',
    surface: '#1E1E1E',
    card: '#242424',
    text: '#E0E0E0',
    secondary: '#A0A0A0',
    border: '#2C2C2C',
    disabled: '#555555',
    disabledBackground: '#2C2C2C',
    textInverse: '#121212',
  },
};

const functional = {
  success: '#00BA7C',
  warning: '#FFD400',
  error: '#F4212E',
  info: '#E65100',
};

const baseTheme: Omit<Theme, 'colors'> = {
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  borderRadius: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, full: 999 },
  shadows: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 12 },
  },
  typography: {
    fontSizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20, xxl: 24 },
    fontWeights: { light: '300', regular: '400', medium: '500', semibold: '600', bold: '700' },
  },
};

const lightTheme: Theme = {
  ...baseTheme,
  colors: {
    primary: brand.primary,
    primaryBackground: brand.accent,
    primaryHover: brand.primaryHover,
    primaryPressed: brand.primaryPressed,
    background: neutral.light.background,
    surface: neutral.light.surface,
    card: neutral.light.card,
    text: neutral.light.text,
    secondary: neutral.light.secondary,
    border: neutral.light.border,
    icon: neutral.light.secondary,
    iconActive: brand.primary,
    accent: brand.primary,
    accentBackground: brand.accent,
    success: functional.success,
    successBackground: 'rgba(0, 186, 124, 0.1)',
    warning: functional.warning,
    warningBackground: 'rgba(255, 212, 0, 0.1)',
    error: functional.error,
    errorBackground: 'rgba(244, 33, 46, 0.1)',
    info: functional.info,
    infoBackground: 'rgba(230, 81, 0, 0.1)',
    disabled: neutral.light.disabled,
    disabledBackground: neutral.light.disabledBackground,
    textInverse: neutral.light.textInverse,
  },
};

const darkTheme: Theme = {
  ...baseTheme,
  colors: {
    primary: brand.primary,
    primaryBackground: 'rgba(230, 81, 0, 0.3)',
    primaryHover: brand.primaryHover,
    primaryPressed: brand.primaryPressed,
    background: neutral.dark.background,
    surface: neutral.dark.surface,
    card: neutral.dark.card,
    text: neutral.dark.text,
    secondary: neutral.dark.secondary,
    border: neutral.dark.border,
    icon: neutral.dark.secondary,
    iconActive: brand.primary,
    accent: brand.primary,
    accentBackground: 'rgba(255, 243, 224, 0.2)',
    success: functional.success,
    successBackground: 'rgba(0, 186, 124, 0.3)',
    warning: functional.warning,
    warningBackground: 'rgba(255, 212, 0, 0.3)',
    error: functional.error,
    errorBackground: 'rgba(244, 33, 46, 0.3)',
    info: functional.info,
    infoBackground: 'rgba(230, 81, 0, 0.3)',
    disabled: neutral.dark.disabled,
    disabledBackground: neutral.dark.disabledBackground,
    textInverse: neutral.dark.textInverse,
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
  systemPreferred?: boolean;
}

export function ThemeProvider({ children, systemPreferred = true }: ThemeProviderProps) {
  const [isDark, setIsDark] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem('theme');
        if (stored) {
          setIsDark(stored === 'dark');
        } else if (systemPreferred) {
          const colorScheme = Appearance.getColorScheme();
          setIsDark(colorScheme === 'dark');
          
          const subscription = Appearance.addChangeListener(({ colorScheme }) => {
            setIsDark(colorScheme === 'dark');
          });
          
          return () => subscription?.remove();
        }
      } catch (error) {
        console.warn('Failed to load theme preference:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    
    loadTheme();
  }, [systemPreferred]);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    try {
      await AsyncStorage.setItem('theme', next ? 'dark' : 'light');
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  // CRITICAL FIX: Always provide the context, even when not loaded
  // Use default theme if not loaded yet
  const contextValue: ThemeContextType = {
    ...theme,
    isDark,
    toggleTheme,
    isLoaded
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export const getThemeColors = (mode: ThemeMode): ThemeColors => 
  mode === 'dark' ? darkTheme.colors : lightTheme.colors;

export const createThemedStyles = <T extends Record<string, any>>(fn: (theme: Theme) => T) => fn;
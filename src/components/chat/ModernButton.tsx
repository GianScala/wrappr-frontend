// components/ui/ModernButton.tsx
import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/contexts/ThemeContext';

interface ModernButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'toggle' | 'send' | 'attachment';
  size?: 'small' | 'medium' | 'large';
  active?: boolean;
  disabled?: boolean;
  loading?: boolean;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  style?: any;
}

const ModernButton: React.FC<ModernButtonProps> = ({
  icon,
  onPress,
  variant = 'secondary',
  size = 'medium',
  active = false,
  disabled = false,
  loading = false,
  color,
  backgroundColor,
  borderColor,
  style,
}) => {
  const theme = useTheme();

  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return { width: 36, height: 36, borderRadius: 18 };
      case 'medium':
        return { width: 44, height: 44, borderRadius: 22 };
      case 'large':
        return { width: 52, height: 52, borderRadius: 26 };
      default:
        return { width: 44, height: 44, borderRadius: 22 };
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 18;
      case 'medium':
        return 20;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };

  const getButtonStyle = () => {
    const baseSize = getButtonSize();
    
    switch (variant) {
      case 'send':
        return {
          ...baseSize,
          backgroundColor: disabled ? '#E5E7EB' : theme.colors.primary,
          borderWidth: 0.5,
          borderColor: disabled ? '#D1D5DB' : '#C0C4CC',
          shadowColor: disabled ? 'transparent' : theme.colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: disabled ? 0 : 0.25,
          shadowRadius: disabled ? 0 : 8,
          elevation: disabled ? 2 : 6,
          transform: [{ scale: disabled ? 0.96 : 1 }],
        };
      
      case 'toggle':
        return {
          ...baseSize,
          backgroundColor: active 
            ? (backgroundColor || theme.colors.background)
            : theme.colors.background,
          borderWidth: 0.5,
          borderColor: active 
            ? (borderColor || theme.colors.primary)
            : '#C0C4CC',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 3,
        };

      case 'attachment':
        return {
          ...baseSize,
          backgroundColor: theme.colors.background,
          borderWidth: 0.5,
          borderColor: '#C0C4CC',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
        };
      
      case 'primary':
        return {
          ...baseSize,
          backgroundColor: backgroundColor || theme.colors.primary,
          borderWidth: 0.5,
          borderColor: '#C0C4CC',
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        };
      
      case 'secondary':
      default:
        return {
          ...baseSize,
          backgroundColor: backgroundColor || theme.colors.background,
          borderWidth: 0.5,
          borderColor: borderColor || '#C0C4CC',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 3,
        };
    }
  };

  const getIconColor = () => {
    if (color) return color;
    
    switch (variant) {
      case 'send':
        return disabled ? '#9CA3AF' : '#FFFFFF';
      case 'toggle':
        return active ? (color || theme.colors.primary) : '#6B7280';
      case 'attachment':
        return '#6B7280';
      case 'primary':
        return '#FFFFFF';
      case 'secondary':
      default:
        return theme.colors.text || '#374151';
    }
  };

  const getIconName = () => {
    if (loading) return 'hourglass-outline';
    return icon;
  };

  const styles = StyleSheet.create({
    container: {
      position: 'relative',
    },
    button: {
      alignItems: 'center',
      justifyContent: 'center',
      opacity: disabled ? 0.5 : 1,
      ...getButtonStyle(),
    },
    pressedOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      borderRadius: getButtonSize().borderRadius,
    },
  });

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={styles.button}
        activeOpacity={0.8}
      >
        <Ionicons
          name={getIconName()}
          size={getIconSize()}
          color={getIconColor()}
        />
      </TouchableOpacity>
    </View>
  );
};

export default ModernButton;
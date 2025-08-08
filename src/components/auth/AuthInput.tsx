import React, { memo, useCallback, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/contexts/ThemeContext';

interface AuthInputProps extends Omit<TextInputProps, 'style'> {
  icon: keyof typeof Ionicons.glyphMap;
  showToggle?: boolean;
  onToggle?: () => void;
}

export const AuthInput = memo<AuthInputProps>(({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
  editable = true,
  showToggle = false,
  onToggle,
  onFocus,
  onBlur,
  ...restProps
}) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback((e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  }, [onFocus]);

  const handleBlur = useCallback((e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  }, [onBlur]);

  return (
    <View
      style={[
        styles.inputGroup,
        {
          backgroundColor: theme.colors.surface,
          borderColor: isFocused ? theme.colors.primary : theme.colors.border,
          borderWidth: isFocused ? 2 : 1,
          opacity: editable ? 1 : 0.6,
        }
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={isFocused ? theme.colors.primary : theme.colors.secondary}
        style={styles.inputIcon}
      />

      <TextInput
        style={[
          styles.input,
          {
            color: theme.colors.text,
            opacity: editable ? 1 : 0.7,
          }
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.secondary}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        autoCorrect={false}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        secureTextEntry={secureTextEntry}
        onFocus={handleFocus}
        onBlur={handleBlur}
        blurOnSubmit={false}
        {...restProps}
      />

      {showToggle && onToggle && (
        <Pressable
          onPress={onToggle}
          disabled={!editable}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.toggleButton}
        >
          <Ionicons
            name={secureTextEntry ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={editable ? theme.colors.secondary : theme.colors.border}
          />
        </Pressable>
      )}
    </View>
  );
});

AuthInput.displayName = 'AuthInput';

const styles = StyleSheet.create({
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    paddingVertical: 0,
  },
  toggleButton: {
    marginLeft: 8,
    padding: 4,
  },
});
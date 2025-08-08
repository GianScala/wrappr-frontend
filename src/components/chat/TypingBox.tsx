import React, { forwardRef, useRef, useImperativeHandle, useState, useCallback } from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../../../src/contexts/ThemeContext';

interface TypingBoxProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  onSubmitEditing: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  maxLength?: number;
}

const TypingBox = forwardRef<TextInput, TypingBoxProps>(({
  value,
  onChangeText,
  placeholder,
  onSubmitEditing,
  onFocus,
  onBlur,
  maxLength = 2000,
}, ref) => {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  
  // Height management
  const [inputHeight, setInputHeight] = useState(MIN_HEIGHT);
  const [inputFocused, setInputFocused] = useState(false);
  
  // Constants
  const PADDING_TOP = 10;
  const PADDING_BOTTOM = 10;
  const LINE_HEIGHT = 22;
  const MAX_LINES =2;
  const MIN_HEIGHT = PADDING_TOP + LINE_HEIGHT + PADDING_BOTTOM; // 42
  const MAX_HEIGHT = PADDING_TOP + (LINE_HEIGHT * MAX_LINES) + PADDING_BOTTOM; // 86

  useImperativeHandle(ref, () => inputRef.current!);

  const handleContentSizeChange = useCallback((event: any) => {
    const contentHeight = event.nativeEvent.contentSize.height;
    const desiredHeight = contentHeight + PADDING_TOP + PADDING_BOTTOM;
    const newHeight = Math.min(Math.max(desiredHeight, MIN_HEIGHT), MAX_HEIGHT);
    setInputHeight(newHeight);
  }, []);

  const handleFocus = useCallback(() => {
    setInputFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setInputFocused(false);
    onBlur?.();
  }, [onBlur]);

  const styles = StyleSheet.create({
    input: {
      flex: 1,
      fontFamily: 'SpaceGrotesk-Regular',
      fontSize: 14,
      fontWeight: '400',
      paddingVertical: 10,
      paddingHorizontal: 18,
      height: inputHeight,
      backgroundColor: theme.colors.surface || theme.colors.background,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: inputFocused ? theme.colors.primary : theme.colors.border,
      textAlignVertical: 'top',
      color: theme.colors.text,
      lineHeight: LINE_HEIGHT,
      includeFontPadding: false,
      shadowColor: inputFocused ? theme.colors.primary : 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: inputFocused ? 0.15 : 0,
      shadowRadius: 12,
      elevation: inputFocused ? 6 : 0,
    },
  });

  return (
    <TextInput
      ref={inputRef}
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      onContentSizeChange={handleContentSizeChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.secondary}
      multiline
      maxLength={maxLength}
      returnKeyType="send"
      onSubmitEditing={onSubmitEditing}
      blurOnSubmit={false}
      enablesReturnKeyAutomatically
      scrollEnabled={inputHeight === MAX_HEIGHT}
    />
  );
});

export default TypingBox;
// assets/icons/hamburger-icon.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface HamburgerIconProps {
  width?: number;
  height?: number;
  color?: string;
  style?: ViewStyle;
}

const HamburgerIcon: React.FC<HamburgerIconProps> = ({
  width = 24,
  height = 24,
  color = '#000',
  style,
}) => {
  const topLineWidth = width * 0.9;
  const bottomLineWidth = topLineWidth * 0.75; // 3/4 of top line
  const lineHeight = Math.max(2, width * 0.08); // Responsive height with minimum
  const lineSpacing = lineHeight * 1.5; // Close spacing between lines

  return (
    <View style={[{ width, height, justifyContent: 'center', alignItems: 'flex-start' }, style]}>
      <View 
        style={[
          styles.line, 
          { 
            backgroundColor: color, 
            width: topLineWidth,
            height: lineHeight,
            borderRadius: lineHeight / 2,
            marginBottom: lineSpacing
          }
        ]} 
      />
      <View 
        style={[
          styles.line, 
          { 
            backgroundColor: color, 
            width: bottomLineWidth,
            height: lineHeight,
            borderRadius: lineHeight / 2
          }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  line: {
    // Base line styles - dimensions set dynamically above
  },
});

export default HamburgerIcon;
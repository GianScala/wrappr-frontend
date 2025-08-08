import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { FilterType } from '../../../../types/SourcesTypes';

interface FilterButtonProps {
  type: FilterType;
  icon: string;
  count: number;
  isActive: boolean;
  onPress: (type: FilterType) => void;
  colors: Record<string, string>;
}

export const FilterButton: React.FC<FilterButtonProps> = React.memo(({ 
  type, 
  icon, 
  count, 
  isActive, 
  onPress, 
  colors 
}) => (
  <Pressable
    onPress={() => onPress(type)}
    style={({ pressed }) => [
      styles.button,
      {
        backgroundColor: isActive 
          ? colors.primary || colors.accent || '#007AFF'
          : colors.surface || colors.background,
        borderColor: isActive 
          ? colors.primary || colors.accent || '#007AFF'
          : colors.border,
        opacity: pressed ? 0.7 : 1,
      }
    ]}
    accessibilityRole="button"
    accessibilityLabel={`Show ${type}, ${count} items`}
    accessibilityState={{ selected: isActive }}
  >
    <Text style={[styles.icon, { color: isActive ? '#FFF' : colors.text }]}>
      {icon}
    </Text>
    <Text style={[styles.text, { color: isActive ? '#FFF' : colors.text }]}>
      {count}
    </Text>
  </Pressable>
));

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    minWidth: 50,
  },
  icon: {
    fontSize: 14,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
});
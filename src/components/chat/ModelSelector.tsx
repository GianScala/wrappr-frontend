// ModelSelector.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/contexts/ThemeContext';

interface ModelData {
  name: string;
  displayName?: string;
  provider?: 'openai' | 'anthropic' | 'groq';
  type?: 'text' | 'image';
  tier?: 'free' | 'pro' | 'premium';
}

interface ModelSelectorProps {
  selectedModel?: string;
  availableModels?: (string | ModelData)[];
  onModelSelect: (model: string) => void;
  compact?: boolean;
}

const DIMENSIONS = {
  DROPDOWN_WIDTH: 180,
  COMPACT_DROPDOWN_WIDTH: 160,
  ITEM_HEIGHT: 48,
  MAX_DROPDOWN_HEIGHT: 48 * 4.5,
} as const;

const ICONS = {
  openai: 'flash',
  anthropic: 'book-outline',
  groq: 'flame',
  llama: 'code-outline',
  default: 'code-outline',
} as const;

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel = '',
  availableModels = [],
  onModelSelect,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { colors } = useTheme();

  // Build the list; if it's empty but we have a selectedModel, fall back to that
  const models = useMemo(() => {
    const list = availableModels
      .filter(m => m != null)
      // normalize to ModelData|string
      .map(m => m!);
    if (list.length === 0 && selectedModel) {
      return [selectedModel];
    }
    return list;
  }, [availableModels, selectedModel]);

  const getModelName = useCallback((m: string | ModelData) =>
    typeof m === 'string' ? m : m.name
  , []);

  const getModelDisplayName = useCallback((m: string | ModelData) => {
    const name = getModelName(m);
    const map: Record<string, string> = {
      'gpt-4o-mini': 'GPT-4o Mini',
      'gpt-4o': 'GPT-4o',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'claude-3-opus-20240229': 'Claude 3 Opus',
      'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
      'claude-3-haiku-20240307': 'Claude 3 Haiku',
      'llama3-70b-8192': 'LLaMA 3 70B',
      'llama3-8b-8192': 'LLaMA 3 8B',
      'mixtral-8x7b-32768': 'Mixtral 8x7B',
      'dall-e-3': 'DALL·E 3',
      'dall-e-2': 'DALL·E 2',
    };
    if (map[name]) return map[name];
    if (typeof m === 'object' && m.displayName) return m.displayName;
    return name
      .split(/[-_.]/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }, [getModelName]);

  const currentModel = useMemo(() => {
    // pick selectedModel if in list, else first
    const has = models.some(m => getModelName(m) === selectedModel);
    return has ? selectedModel : getModelName(models[0]);
  }, [models, selectedModel, getModelName]);

  const getModelIcon = useCallback((m: string | ModelData) => {
    const name = getModelName(m).toLowerCase();
    if (name.startsWith('gpt')) return ICONS.openai;
    if (name.startsWith('claude')) return ICONS.anthropic;
    if (name.includes('groq') || name.includes('mixtral') || name.includes('gemma')) return ICONS.groq;
    if (name.includes('llama')) return ICONS.llama;
    return ICONS.default;
  }, [getModelName]);

  const toggleDropdown = useCallback(() => setIsOpen(o => !o), []);
  const closeDropdown  = useCallback(() => setIsOpen(false), []);

  const handleModelSelect = useCallback((m: string | ModelData) => {
    const name = getModelName(m);
    onModelSelect(name);
    closeDropdown();
  }, [onModelSelect, closeDropdown, getModelName]);

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <TouchableOpacity
        style={[styles.button, compact && styles.compactButton]}
        onPress={toggleDropdown}
        accessibilityLabel={compact ? 'Select model' : `Current model: ${getModelDisplayName(currentModel)}`}
        accessibilityRole="button"
        activeOpacity={0.5}
      >
        <Ionicons name={getModelIcon(currentModel)} size={20} color={colors.primary} />
        {!compact && (
          <Text style={[styles.buttonText, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
            {getModelDisplayName(currentModel)}
          </Text>
        )}
      </TouchableOpacity>

      {isOpen && (
        <View
          style={[
            styles.dropdown,
            { backgroundColor: colors.surface, borderColor: colors.border },
            compact ? styles.compactDropdown : styles.regularDropdown
          ]}
        >
          <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
            {models.map((m, idx) => {
              const name = getModelName(m);
              const selected = name === currentModel;
              return (
                <TouchableOpacity
                  key={name + idx}
                  style={[styles.item, selected && { backgroundColor: `${colors.primary}22` }]}
                  onPress={() => handleModelSelect(m)}
                  accessibilityLabel={getModelDisplayName(m)}
                  accessibilityRole="menuitem"
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={getModelIcon(m)}
                    size={18}
                    color={selected ? colors.primary : colors.text}
                    style={styles.itemIcon}
                  />
                  <Text
                    style={[styles.itemText, { color: selected ? colors.primary : colors.text }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {getModelDisplayName(m)}
                  </Text>
                  {selected && <Ionicons name="radio-button-on" size={18} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'relative', zIndex: 1000 },
  compactContainer: { marginRight: 2 },
  button: { flexDirection: 'row', alignItems: 'center', padding: 6, borderRadius: 16, minHeight: 38 },
  compactButton: { padding: 6 },
  buttonText: { marginLeft: 6, fontSize: 14, fontWeight: '600', fontFamily: 'SpaceGrotesk-SemiBold', maxWidth: 120 },
  dropdown: { position: 'absolute', width: DIMENSIONS.DROPDOWN_WIDTH, borderRadius: 12, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 5, paddingVertical: 8, zIndex: 1001 },
  regularDropdown: { bottom: '100%', right: 0, marginBottom: 10 },
  compactDropdown: { width: DIMENSIONS.COMPACT_DROPDOWN_WIDTH, bottom: '100%', right: 0, marginBottom: 10 },
  scrollView: { maxHeight: DIMENSIONS.MAX_DROPDOWN_HEIGHT },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, height: DIMENSIONS.ITEM_HEIGHT },
  itemIcon: { marginRight: 8 },
  itemText: { fontSize: 15, flex: 1, fontFamily: 'SpaceGrotesk-Regular' },
});

export default React.memo(ModelSelector);

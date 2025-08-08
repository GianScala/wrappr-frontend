import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChatSuggestionsProps {
  onSuggestionPress: (suggestion: string) => void;
  theme: any;
}

const ChatSuggestions: React.FC<ChatSuggestionsProps> = ({ onSuggestionPress, theme }) => {
  const suggestions = [
    {
      icon: 'bulb-outline',
      text: 'Explain quantum computing',
      category: 'Learn'
    },
    {
      icon: 'code-slash-outline',
      text: 'Write Python function',
      category: 'Code'
    },
    {
      icon: 'create-outline',
      text: 'Short story about time travel',
      category: 'Create'
    },
    {
      icon: 'analytics-outline',
      text: 'AI trends for 2024',
      category: 'Research'
    },
    {
      icon: 'school-outline',
      text: 'Spanish study plan',
      category: 'Study'
    },
    {
      icon: 'restaurant-outline',
      text: 'Healthy dinner recipe',
      category: 'Cook'
    },
    {
      icon: 'fitness-outline',
      text: '30-day workout routine',
      category: 'Fitness'
    },
    {
      icon: 'briefcase-outline',
      text: 'Professional email template',
      category: 'Work'
    }
  ];

  const renderSuggestion = (suggestion: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.suggestionCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.shadow || '#000',
        }
      ]}
      activeOpacity={0.8}
      onPress={() => onSuggestionPress(suggestion.text)}
    >
      <View style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '12' }]}>
          <Ionicons
            name={suggestion.icon}
            size={16}
            color={theme.colors.primary}
          />
        </View>
        <View style={styles.textContainer}>
          <Text 
            style={[styles.suggestionText, { color: theme.colors.text }]} 
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {suggestion.text}
          </Text>
          <Text style={[styles.categoryText, { color: theme.colors.secondary }]}>
            {suggestion.category}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: theme.colors.text }]}>
          Try asking about...
        </Text>
      </View>
      <ScrollView
        horizontal
        style={styles.scrollView}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={140}
        snapToAlignment="start"
      >
        {suggestions.map((suggestion, index) => renderSuggestion(suggestion, index))}
      </ScrollView>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 13,
    fontFamily: 'SpaceGrotesk-Regular',
    fontWeight: '500',
    opacity: 0.7,
  },
  scrollView: {
    paddingLeft: 16,
  },
  scrollContent: {
    paddingRight: 32,
    gap: 8,
  },
  suggestionCard: {
    width: 140,
    borderRadius: 16,
    borderWidth: 1,
    padding: 0,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  suggestionText: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Regular',
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: 2,
  },
  categoryText: {
    fontSize: 10,
    fontFamily: 'SpaceGrotesk-Regular',
    fontWeight: '400',
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default ChatSuggestions;
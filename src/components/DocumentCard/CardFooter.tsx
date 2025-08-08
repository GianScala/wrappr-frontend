// components/DocumentCard/CardFooter.tsx
import React, { FC } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/contexts/ThemeContext';

interface CardFooterProps {
  hasEmbeddings: boolean;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

const CardFooter: FC<CardFooterProps> = ({
  hasEmbeddings,
  expanded,
  onToggle,
  onDelete,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
      <View style={styles.badgeContainer}>
        {hasEmbeddings && (
          <View style={[styles.ragBadge, { backgroundColor: theme.colors.success + '20' }]}>
            <Text style={[styles.ragBadgeText, { color: theme.colors.success }]}>
              RAG
            </Text>
          </View>
        )}
      </View>
      <View style={styles.actionContainer}>
        <TouchableOpacity onPress={onToggle} style={styles.expandButton} activeOpacity={0.7}>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.colors.secondary}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={[styles.deleteButton, { backgroundColor: theme.colors.error + '10' }]} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CardFooter;

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderTopWidth: 1,
  },
  badgeContainer: {
    flex: 1,
  },
  ragBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  ragBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
  },
});

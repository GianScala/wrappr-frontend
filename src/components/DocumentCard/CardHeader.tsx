// components/DocumentCard/CardHeader.tsx
import React, { FC, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/contexts/ThemeContext';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface CardHeaderProps {
  displayName: string;
  formattedSize: string;
  formattedDate: string;
  IconName?: IoniconName;
  statusIcon: IoniconName;
  statusColor: string;
  statusText: string;
  onPreview: () => void;
  loadingContent: boolean;
  hasEmbeddings: boolean;
  onDelete: () => void;
}

const extensionToIcon: Record<string, IoniconName> = {
  pdf: 'document-text-outline',
  doc: 'document-text-outline',
  docx: 'document-text-outline',
  ppt: 'play-sharp',
  pptx: 'play-sharp',
  txt: 'document-outline',
  md: 'document-text-outline',
  csv: 'bar-chart-outline',
};

const CardHeader: FC<CardHeaderProps> = ({
  displayName,
  formattedSize,
  formattedDate,
  IconName,
  statusIcon,
  statusColor,
  statusText,
  onPreview,
  loadingContent,
  hasEmbeddings,
  onDelete,
}) => {
  const theme = useTheme();

  // derive a document icon from filename if no explicit IconName passed
  const docIcon = useMemo<IoniconName>(() => {
    if (IconName) return IconName;
    const ext = displayName.split('.').pop()?.toLowerCase() ?? '';
    return extensionToIcon[ext] || 'document-outline';
  }, [displayName, IconName]);

  return (
    <View style={styles.header}>
      <View style={[styles.iconContainer, { backgroundColor: `${"#6A5ACD"}15` }]}>
        <Ionicons name={docIcon} size={18} color="#6A5ACD" />
      </View>

      <View style={styles.documentInfo}>
        <Text
          style={[styles.documentTitle, { color: theme.colors.text }]}
          numberOfLines={2}
        >
          {displayName}
        </Text>

        <View style={styles.metadataRow}>
          <Text style={[styles.metadataText, { color: theme.colors.secondary }]}>
            {formattedSize}
          </Text>
          <View style={[styles.separator, { backgroundColor: theme.colors.secondary }]} />
          <Text style={[styles.metadataText, { color: theme.colors.secondary }]}>
            {formattedDate}
          </Text>
        </View>

        <View style={styles.statusContainer}>
          <Ionicons name={statusIcon} size={14} color={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          onPress={onPreview}
          disabled={loadingContent}
          style={[styles.actionButton, { backgroundColor: theme.colors.primary + '10' }]}
          activeOpacity={0.7}
        >
          {loadingContent ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Ionicons name="eye-outline" size={18} color={theme.colors.primary} />
          )}
        </TouchableOpacity>

        {/* Add delete button */}
        <TouchableOpacity
          onPress={onDelete}
          style={[styles.actionButton, { backgroundColor: theme.colors.error + '10' }]}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CardHeader;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  documentInfo: {
    flex: 1,
    paddingRight: 8,
  },
  documentTitle: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginRight: 6,
    lineHeight: 20,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metadataText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 10,
    fontWeight: '500',
  },
  separator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 10,
    marginLeft: 6,
    fontWeight: '600',
  },
  ragBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginLeft: 8,
  },
  ragBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
});
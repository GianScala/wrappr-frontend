// src/components/common/ErrorModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { UserFriendlyError } from '../../utils/errorHandler';

interface ErrorModalProps {
  visible: boolean;
  error: UserFriendlyError | null;
  onClose: () => void;
  onAction?: () => void;
}

const { width } = Dimensions.get('window');

export const ErrorModal: React.FC<ErrorModalProps> = ({
  visible,
  error,
  onClose,
  onAction,
}) => {
  const theme = useTheme();

  if (!error) return null;

  const getIconName = (severity: string) => {
    switch (severity) {
      case 'error': return 'close-circle';
      case 'warning': return 'warning';
      case 'info': return 'information-circle';
      default: return 'alert-circle';
    }
  };

  const getIconColor = (severity: string) => {
    switch (severity) {
      case 'error': return theme.colors.error;
      case 'warning': return theme.colors.warning;
      case 'info': return theme.colors.info;
      default: return theme.colors.error;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <Animated.View style={[
          styles.modalContainer,
          { backgroundColor: theme.colors.surface }
        ]}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name={getIconName(error.severity)}
              size={48}
              color={getIconColor(error.severity)}
            />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {error.title}
          </Text>

          {/* Message */}
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            {error.message}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {/* Action Button (if provided) */}
            {onAction && error.actionText && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: theme.colors.primary }
                ]}
                onPress={() => {
                  onAction();
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.actionButtonText, { color: theme.colors.textInverse }]}>
                  {error.actionText}
                </Text>
              </TouchableOpacity>
            )}

            {/* Close Button */}
            <TouchableOpacity
              style={[
                styles.closeButton,
                { 
                  backgroundColor: theme.colors.surfaceVariant,
                  marginTop: onAction ? 12 : 0
                }
              ]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={[styles.closeButtonText, { color: theme.colors.text }]}>
                {onAction ? 'Cancel' : 'OK'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: Math.min(width - 48, 340),
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    fontFamily: 'SpaceGrotesk',
  },
  buttonContainer: {
    width: '100%',
  },
  actionButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  closeButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'SpaceGrotesk-Medium',
  },
});
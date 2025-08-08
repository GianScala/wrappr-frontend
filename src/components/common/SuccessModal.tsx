// src/components/common/SuccessModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface SuccessModalProps {
  visible: boolean;
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export const SuccessModal: React.FC<SuccessModalProps> = ({
  visible,
  title,
  message,
  actionText = 'OK',
  onAction,
  onClose,
}) => {
  const theme = useTheme();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modal, { backgroundColor: theme.colors.surface }]}>
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.success }]}>
                <Ionicons 
                  name="checkmark-circle" 
                  size={48} 
                  color={theme.colors.success} 
                />
              </View>

              <Text style={[styles.title, { color: theme.colors.text }]}>
                {title}
              </Text>

              <Text style={[styles.message, { color: theme.colors.text }]}>
                {message}
              </Text>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
                onPress={handleAction}
                activeOpacity={0.8}
              >
                <Text style={[styles.actionButtonText, { color: theme.colors.textInverse }]}>
                  {actionText}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modal: {
    width: width - 48,
    maxWidth: 400,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    fontFamily: 'SpaceGrotesk',
  },
  actionButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
});
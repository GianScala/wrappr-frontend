// components/DocumentPreviewModal/index.tsx
import React, { useMemo } from 'react';
import {
  Modal,
  SafeAreaView,
  View,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { usePreviewLogic } from './usePreviewLogic';
import { PreviewHeader } from './PreviewHeader';
import { PreviewContent } from './PreviewContent';
import { PreviewFooter } from './PreviewFooter';
import type { DocumentPreviewModalProps } from '../../../types/preview';

const DocumentPreviewModalComponent: React.FC<DocumentPreviewModalProps> = ({
  visible,
  onClose,
  title,
  originalName,
  content,
  documentType = 'text/plain',
  isLoading = false,
}) => {
  const theme = useTheme();
  const { icon, formatted } = usePreviewLogic(content || null, documentType);

  const modalStyle = useMemo(() => ({
    backgroundColor: theme.colors.background,
  }), [theme.colors.background]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent={Platform.OS === 'android'}
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape']}
      accessibilityViewIsModal
    >
      <SafeAreaView style={[styles.container, modalStyle]}>
        <PreviewHeader
          title={title}
          originalName={originalName}
          icon={icon}
          theme={theme}
          onClose={onClose}
        />
        
        <View style={styles.contentWrapper}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            showsVerticalScrollIndicator={false}
            alwaysBounceVertical={false}
            accessibilityLabel="Document content"
          >
            <PreviewContent
              isLoading={isLoading}
              content={content}
              formatted={formatted}
              documentType={documentType}
              title={title}
            />
          </ScrollView>
        </View>
        
        <PreviewFooter
          documentType={documentType}
          contentLength={content?.length}
          theme={theme}
          onDone={onClose}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
});

const DocumentPreviewModal = React.memo(DocumentPreviewModalComponent);
DocumentPreviewModal.displayName = 'DocumentPreviewModal';
export default DocumentPreviewModal;
import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  Pressable, 
  Modal, 
  ActivityIndicator,
  StatusBar,
  Dimensions,
  SafeAreaView
} from 'react-native';

interface FullImageViewProps {
  imageUrl: string;
  onClose: () => void;
  colors: Record<string, string>;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const FullImageView: React.FC<FullImageViewProps> = ({
  imageUrl,
  onClose,
  colors,
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  const handleImageLoad = useCallback((event: any) => {
    const { width, height } = event.nativeEvent.source;
    setImageDimensions({ width, height });
    setImageLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoading(false);
    setImageError(true);
  }, []);

  const handleBackdropPress = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleClosePress = useCallback(() => {
    onClose();
  }, [onClose]);

  const getImageStyle = () => {
    if (imageDimensions.width === 0 || imageDimensions.height === 0) {
      return styles.fullImage;
    }

    const imageAspectRatio = imageDimensions.width / imageDimensions.height;
    const screenAspectRatio = screenWidth / (screenHeight * 0.8);

    if (imageAspectRatio > screenAspectRatio) {
      // Image is wider than screen ratio
      return {
        width: screenWidth * 0.9,
        height: (screenWidth * 0.9) / imageAspectRatio,
      };
    } else {
      // Image is taller than screen ratio
      return {
        width: (screenHeight * 0.8) * imageAspectRatio,
        height: screenHeight * 0.8,
      };
    }
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View style={styles.overlay}>
        <Pressable 
          style={styles.backdrop} 
          onPress={handleBackdropPress}
          accessible={true}
          accessibilityLabel="Close image view"
          accessibilityRole="button"
        />
        
        <SafeAreaView style={styles.container}>
          {/* Header with close button */}
          <View style={styles.header}>
            <Pressable
              style={styles.closeButton}
              onPress={handleClosePress}
              accessible={true}
              accessibilityLabel="Close image"
              accessibilityRole="button"
              accessibilityHint="Closes the full screen image view"
            >
              <View style={styles.closeButtonInner}>
                <Text style={styles.closeIcon}>×</Text>
              </View>
            </Pressable>
          </View>

          {/* Image container */}
          <View style={styles.imageContainer}>
            {imageError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>
                  Unable to load image
                </Text>
                <Pressable style={styles.retryButton} onPress={() => {
                  setImageError(false);
                  setImageLoading(true);
                }}>
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Image
                  source={{ uri: imageUrl }}
                  style={[styles.fullImage, getImageStyle()]}
                  resizeMode="contain"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
                
                {imageLoading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    <Text style={styles.loadingText}>Loading image...</Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Footer with image info */}
          <View style={styles.footer}>
            <Text style={styles.imageInfo} numberOfLines={1}>
              Tap outside to close
            </Text>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    zIndex: 10,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  closeIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '300',
    lineHeight: 24,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  fullImage: {
    maxWidth: screenWidth * 0.9,
    maxHeight: screenHeight * 0.8,
    borderRadius: 8,
  },
  loadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 24,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
    opacity: 0.8,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  imageInfo: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
});

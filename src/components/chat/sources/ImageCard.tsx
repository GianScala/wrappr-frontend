import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, Modal } from 'react-native';
import { WebSourceCitation } from '../../../../types/SourcesTypes';

interface ImageCardProps {
  item: WebSourceCitation & { imageUrl: string };
  colors: Record<string, string>;
  cardWidth: number;
}

const ImageCard: React.FC<ImageCardProps> = memo(({ item, colors, cardWidth }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handleImageLoad = () => setImageLoading(false);
  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <>
      <View style={[styles.wrapper, { width: cardWidth }]}>
        <Pressable
          onPress={() => setIsFullScreen(true)}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: pressed ? `${colors.primary}15` : colors.background,
              borderColor: colors.border,
            },
          ]}
          accessibilityLabel={`Image: ${item.title}. Tap to view full size.`}
          accessibilityRole="button"
        >
          <View style={styles.imageContainer}>
            {imageError ? (
              <View style={[styles.errorContainer, { backgroundColor: colors.border }]}>
                <Text style={[styles.errorText, { color: colors.text }]}>Image unavailable</Text>
              </View>
            ) : (
              <>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.image}
                  resizeMode="cover"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
                {imageLoading && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                )}
              </>
            )}
          </View>
        </Pressable>
      </View>

      <Modal
        visible={isFullScreen}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setIsFullScreen(false)}
      >
        <View style={styles.fullScreenContainer}>
          <Pressable style={styles.closeButton} onPress={() => setIsFullScreen(false)}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </>
  );
});

ImageCard.displayName = 'ImageCard';

const styles = StyleSheet.create({
  wrapper: {
    marginRight: 10,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    height: 200,
  },
  imageContainer: {
    height: '100%',
  },
  image: {
    width: '100',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    opacity: 0.6,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ImageCard;
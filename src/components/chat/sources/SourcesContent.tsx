import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, View, Text, Linking } from 'react-native';
import { SourceCard } from './SourceCard';
import { ImageCard } from './ImageCard';
import { VideoCard } from './VideoCard';
import { FullImageView } from './FullImageView';
import { FilterType, MediaData, WebSourceCitation } from '../../../../types/SourcesTypes';

interface SourcesContentProps {
  activeFilter: FilterType;
  validatedSources: WebSourceCitation[];
  mediaData: MediaData;
  colors: Record<string, string>;
  cardWidth: number;
}

export const SourcesContent: React.FC<SourcesContentProps> = ({
  activeFilter,
  validatedSources,
  mediaData,
  colors,
  cardWidth,
}) => {
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);

  const handlePressLink = useCallback((url: string) => {
    if (activeFilter === 'images') {
      setFullImageUrl(url);
    } else {
      Linking.openURL(url).catch(err => 
        console.warn('Error opening URL:', err)
      );
    }
  }, [activeFilter]);

  const handleCloseFullImage = useCallback(() => {
    setFullImageUrl(null);
  }, []);

  const renderEmptyState = useCallback((message: string) => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyText, { color: colors.text }]}>
        {message}
      </Text>
    </View>
  ), [colors.text]);

  const renderSources = useCallback(() => {
    if (!validatedSources?.length) {
      return renderEmptyState('No sources available');
    }
    
    return validatedSources.map(source => (
      <SourceCard
        key={`source-${source.id}`}
        source={source}
        onPressLink={handlePressLink}
        colors={colors}
        cardWidth={cardWidth}
      />
    ));
  }, [validatedSources, handlePressLink, colors, cardWidth, renderEmptyState]);

  const renderImages = useCallback(() => {
    if (!mediaData?.images?.length) {
      return renderEmptyState('No images available');
    }
    
    return mediaData.images.map((item, index) => (
      <ImageCard
        key={`image-${item.id || index}`}
        item={item}
        onPress={handlePressLink}
        colors={colors}
        cardWidth={cardWidth}
      />
    ));
  }, [mediaData?.images, handlePressLink, colors, cardWidth, renderEmptyState]);

  const renderVideos = useCallback(() => {
    if (!mediaData?.videos?.length) {
      return renderEmptyState('No videos available');
    }
    
    return mediaData.videos.map(video => (
      <VideoCard
        key={`video-${video.id}`}
        video={video}
        onPress={handlePressLink}
        colors={colors}
        cardWidth={cardWidth}
      />
    ));
  }, [mediaData?.videos, handlePressLink, colors, cardWidth, renderEmptyState]);

  const renderContent = useCallback(() => {
    switch (activeFilter) {
      case 'sources':
        return renderSources();
      case 'images':
        return renderImages();
      case 'videos':
        return renderVideos();
      default:
        return renderEmptyState('Invalid filter selected');
    }
  }, [activeFilter, renderSources, renderImages, renderVideos, renderEmptyState]);

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollContainer}
        decelerationRate="fast"
        snapToInterval={cardWidth + 12}
        snapToAlignment="start"
      >
        {renderContent()}
      </ScrollView>
      
      {fullImageUrl && (
        <FullImageView
          imageUrl={fullImageUrl}
          onClose={handleCloseFullImage}
          colors={colors}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    maxHeight: 400,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    minHeight: 120,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
    fontWeight: '500',
  },
});
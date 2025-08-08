// components/chat/sources/VideoCard.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { WebSourceCitation } from '../../../../types/SourcesTypes';

interface VideoCardProps {
  video: WebSourceCitation;
  onPress: (url: string) => void;
  colors: Record<string, string>;
  cardWidth: number;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onPress,
  colors,
  cardWidth
}) => (
  <View style={[styles.videoCard, { width: cardWidth }]}>
    <Pressable
      onPress={() => onPress(video.url)}
      style={({ pressed }) => [
        styles.videoCardInner,
        {
          backgroundColor: pressed ? colors.primary + '10' : colors.background,
          borderColor: colors.border,
        }
      ]}
    >
      {video.video_metadata?.thumbnail && (
        <Image
          source={{ uri: video.video_metadata.thumbnail }}
          style={styles.videoThumbnail}
          resizeMode="cover"
        />
      )}
      <View style={styles.videoOverlay}>
        <View style={styles.playButton}>
          <Text style={styles.playIcon}>▶</Text>
        </View>
      </View>
      <View style={styles.videoInfo}>
        <Text style={[styles.videoTitle, { color: colors.text }]} numberOfLines={2}>
          {video.title}
        </Text>
        <Text style={[styles.videoPlatform, { color: colors.text }]}>
          {video.video_metadata?.platform?.toUpperCase() || 'VIDEO'}
        </Text>
      </View>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  videoCard: {
    marginRight: 12,
  },
  videoCardInner: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: 160,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 20,
    color: '#000',
  },
  videoInfo: {
    padding: 12,
  },
  videoTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  videoPlatform: {
    fontSize: 10,
    opacity: 0.7,
  },
});
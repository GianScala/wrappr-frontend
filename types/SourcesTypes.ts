// Filter types
export type FilterType = 'sources' | 'images' | 'videos';

// Base source citation interface
export interface WebSourceCitation {
  id: string;
  title: string;
  url: string;
  domain?: string;
  citation_number?: number;
  images?: string[];
  thumbnail?: string;
  result_type?: string;
  video_metadata?: VideoMetadata[];
  description?: string;
  published_date?: string;
  author?: string;
}

// Video metadata interface
export interface VideoMetadata {
  source?: WebSourceCitation;
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  embed_url?: string;
  duration?: string;
  view_count?: number;
  published_date?: string;
  channel?: string;
  description?: string;
}

// Image data interface
export interface ImageData extends WebSourceCitation {
  imageUrl: string;
  alt_text?: string;
  width?: number;
  height?: number;
  file_size?: number;
}

// Media data container
export interface MediaData {
  images: ImageData[];
  videos: VideoMetadata[];
}

// Filter counts for UI
export interface FilterCounts {
  sources: number;
  images: number;
  videos: number;
}

// Web search response data
export interface WebSearchData {
  tavily_hits_count: number;
  videos: Array<{
    video_id: string;
    url: string;
    title: string;
    thumbnail: string;
    embed_url: string;
    duration?: string;
    view_count?: number;
    published_date?: string;
    channel?: string;
  }>;
  images?: Array<{
    image_id: string;
    url: string;
    title: string;
    thumbnail: string;
    source_url: string;
    alt_text?: string;
    width?: number;
    height?: number;
  }>;
  sources?: WebSourceCitation[];
}

// Component props interfaces
export interface SourcesContentProps {
  activeFilter: FilterType;
  validatedSources: WebSourceCitation[];
  mediaData: MediaData;
  colors: Record<string, string>;
  cardWidth: number;
}

export interface SourceCardProps {
  source: WebSourceCitation;
  onPressLink: (url: string) => void;
  colors: Record<string, string>;
  cardWidth: number;
}

export interface ImageCardProps {
  item: ImageData;
  onPress: (imageUrl: string) => void;
  colors: Record<string, string>;
  cardWidth: number;
}

export interface VideoCardProps {
  video: VideoMetadata;
  onPress: (url: string) => void;
  colors: Record<string, string>;
  cardWidth: number;
}

export interface FilterButtonProps {
  type: FilterType;
  icon: string;
  count: number;
  isActive: boolean;
  onPress: (type: FilterType) => void;
  colors: Record<string, string>;
}

export interface SourcesHeaderProps {
  activeFilter: FilterType;
  setActiveFilter: (filter: FilterType) => void;
  filterCounts: FilterCounts;
  colors: Record<string, string>;
}

export interface FullImageViewProps {
  imageUrl: string;
  onClose: () => void;
  colors: Record<string, string>;
}

// Utility types
export type MediaType = 'image' | 'video' | 'source';

export interface MediaItem {
  id: string;
  type: MediaType;
  url: string;
  title: string;
  thumbnail?: string;
  source?: WebSourceCitation;
}

// Error handling types
export interface SourceError {
  id: string;
  message: string;
  type: 'network' | 'parsing' | 'validation';
  timestamp: Date;
}

// Loading states
export interface LoadingStates {
  sources: boolean;
  images: boolean;
  videos: boolean;
}

// Search configuration
export interface SearchConfig {
  maxResults: number;
  includeImages: boolean;
  includeVideos: boolean;
  language?: string;
  region?: string;
}

// Analytics/tracking types
export interface SourceInteraction {
  sourceId: string;
  action: 'view' | 'click' | 'share';
  timestamp: Date;
  filterType: FilterType;
}

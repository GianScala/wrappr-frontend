import { useMemo } from 'react';
import { WebSourceCitation, MediaData, FilterCounts, WebSearchData } from '../../types/SourcesTypes';

export const useSourcesData = (sources: WebSourceCitation[], webSearchData: WebSearchData) => {
  console.log('🔧 [useSourcesData] Input data:', {
    sourcesCount: sources?.length,
    firstSource: sources?.[0],
    webSearchData: {
      search_performed: webSearchData?.search_performed,
      sources_count: webSearchData?.sources_count,
      videos_count: webSearchData?.videos?.length
    }
  });

  const validatedSources = useMemo(() => {
    if (!sources || !Array.isArray(sources)) {
      console.log('❌ [useSourcesData] Invalid sources input:', sources);
      return [];
    }

    const validated = sources.filter(s => {
      const isValid = s && s.id && s.title && s.url;
      if (!isValid) {
        console.log('⚠️ [useSourcesData] Invalid source filtered out:', s);
      }
      return isValid;
    });

    console.log('✅ [useSourcesData] Validated sources:', {
      originalCount: sources.length,
      validatedCount: validated.length,
      sampleValidated: validated[0]
    });

    return validated;
  }, [sources]);

  const { mediaData, filterCounts } = useMemo(() => {
    console.log('🎬 [useSourcesData] Processing media data...');
    
    const seenImageUrls = new Set<string>();
    const images = validatedSources.flatMap(src => {
      const sourceImages = (src.images || []).map(imageUrl => ({ 
        source: src, 
        imageUrl,
        id: `${src.id}-${imageUrl}` 
      }));
      return sourceImages;
    }).filter(item => {
      if (seenImageUrls.has(item.imageUrl)) return false;
      seenImageUrls.add(item.imageUrl);
      return true;
    });

    const seenVideoIds = new Set<string>();
    const sourceVideos = validatedSources.flatMap(src => {
      if (Array.isArray(src.video_metadata) && src.video_metadata.length) {
        return src.video_metadata.map(meta => ({ source: src, ...meta }));
      }
      if (src.result_type === 'video' && src.thumbnail) {
        return [{
          source: src,
          id: src.id,
          url: src.url,
          title: src.title,
          thumbnail: src.thumbnail
        }];
      }
      return [];
    }).filter(v => {
      if (seenVideoIds.has(v.id)) return false;
      seenVideoIds.add(v.id);
      return true;
    });

    const externalVideos = (webSearchData?.videos || []).map(v => ({
      id: v.video_id || v.id,
      url: v.url,
      title: v.title,
      thumbnail: v.thumbnail,
      embed_url: v.embed_url
    })).filter(v => {
      if (seenVideoIds.has(v.id)) return false;
      seenVideoIds.add(v.id);
      return true;
    });

    const videos = [...sourceVideos, ...externalVideos];

    const mediaData: MediaData = { images, videos };
    const filterCounts: FilterCounts = {
      sources: validatedSources.length,
      images: images.length,
      videos: videos.length,
    };

    console.log('📊 [useSourcesData] Media processing complete:', {
      validatedSourcesCount: validatedSources.length,
      imagesCount: images.length,
      videosCount: videos.length,
      filterCounts
    });

    return { mediaData, filterCounts };
  }, [validatedSources, webSearchData?.videos]);

  console.log('🎯 [useSourcesData] Final result:', {
    validatedSourcesCount: validatedSources.length,
    filterCounts,
    hasAnySources: filterCounts.sources > 0 || filterCounts.images > 0 || filterCounts.videos > 0
  });

  return { validatedSources, mediaData, filterCounts };
};
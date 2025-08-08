// utils/responseAdapter.ts
export interface BackendWebSearchResponse {
  enabled: boolean;
  search_performed: boolean;
  sources: Array<{title: string; url: string; snippet: string}>;
  sources_count: number;
  web_source_citations?: Array<{
    id: string;
    title: string;
    url: string;
    snippet: string;
    domain: string;
    favicon_url?: string;
    citation_number: number;
    images: string[];
  }>;
  web_source_citations_count?: number;
  tavily_hits: Array<any>;
  tavily_hits_count: number;
  images: string[];
  images_count: number;
  citation_context_length?: number;
}

export interface BackendRagResponse {
  enabled: boolean;
  search_performed: boolean;
  sources: Array<{
    content: string;
    source: string;
    score: number;
    metadata: any;
  }>;
  sources_count: number;
  database_citations: Array<{
    id: string;
    content: string;
    source: string;
    score: number;
    citation_number: number;
  }>;
  database_citations_count: number;
}

export interface BackendResponse {
  success: boolean;
  response: string;
  model?: string;
  provider?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost?: {
    input_cost: number;
    output_cost: number;
    total_cost: number;
    currency: string;
  };
  web_search?: BackendWebSearchResponse;
  rag?: BackendRagResponse;
  hybrid_mode?: boolean;
}

export interface FrontendWebSearchData {
  enabled: boolean;
  search_performed: boolean;
  sources: Array<{title: string; url: string; snippet: string}>;
  sources_count: number;
  web_source_citations: Array<{
    id: string;
    title: string;
    url: string;
    snippet: string;
    domain: string;
    favicon_url?: string;
    citation_number: number;
    images: string[];
  }>;
  web_source_citations_count: number;
  tavily_hits_count: number;
  images_count: number;
}

export function adaptBackendResponse(
  backendResponse: BackendResponse,
  webSearchEnabled: boolean
): FrontendWebSearchData | undefined {
  console.log('🔧 [ResponseAdapter] Processing response:', {
    webSearchEnabled,
    hasWebSearchData: !!backendResponse.web_search,
    searchPerformed: backendResponse.web_search?.search_performed,
    webSourceCitationsCount: backendResponse.web_search?.web_source_citations_count || 0,
  });

  if (!webSearchEnabled) {
    return undefined;
  }

  const webSearchData = backendResponse.web_search;
  if (!webSearchData) {
    console.log('🔧 [ResponseAdapter] No web_search data in response');
    return {
      enabled: true,
      search_performed: false,
      sources: [],
      sources_count: 0,
      web_source_citations: [],
      web_source_citations_count: 0,
      tavily_hits_count: 0,
      images_count: 0,
    };
  }

  const webSourceCitations = (webSearchData.web_source_citations || []).map(source => ({
    id: source.id || `source-${Math.random()}`,
    title: source.title || 'Untitled',
    url: source.url || '',
    snippet: source.snippet || '',
    domain: source.domain || 'unknown.com',
    favicon_url: source.favicon_url || undefined,
    citation_number: source.citation_number || 0,
    images: source.images || [],
  }));

  const frontendData: FrontendWebSearchData = {
    enabled: webSearchData.enabled,
    search_performed: webSearchData.search_performed,
    sources: webSearchData.sources || [],
    sources_count: webSearchData.sources_count || 0,
    web_source_citations: webSourceCitations,
    web_source_citations_count: webSourceCitations.length,
    tavily_hits_count: webSearchData.tavily_hits_count || 0,
    images_count: webSearchData.images_count || 0,
  };

  console.log('✅ [ResponseAdapter] Converted data:', {
    searchPerformed: frontendData.search_performed,
    sourcesCount: frontendData.sources_count,
    citationsCount: frontendData.web_source_citations_count,
    tavilyHits: frontendData.tavily_hits_count,
  });

  return frontendData;
}
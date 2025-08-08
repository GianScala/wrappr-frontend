// types/models.ts - Optimized for Text Models Only

export interface ModelCapabilities {
  webSearchCapable: boolean;
  codeExecution: boolean;
  maxTokens?: number;
  contextWindow?: number;
  multimodal?: boolean;
  functionCalling?: boolean;
  streaming?: boolean;
}

export interface LLMModel {
  name: string;
  displayName: string;
  provider: 'openai' | 'anthropic' | 'groq';
  type: 'text'; 
  tier: 'free' | 'pro' | 'premium';
  capabilities: ModelCapabilities;
  description?: string;
}

export interface WebSearchSource {
  title: string;
  url: string;
  snippet: string;
  domain?: string;
  timestamp?: string;
}

export interface ModelResponse {
  text_models: LLMModel[];
}

export interface ModelService {
  getAvailableModels(
    idToken?: string, 
    updateTokenUsage?: (delta: number) => Promise<void>
  ): Promise<ModelResponse>;
  getModelById(id: string): LLMModel | null;
  getModelsByTier(tier: 'free' | 'pro' | 'premium'): LLMModel[];
  getTextModels(): LLMModel[];
  getWebSearchCapableModels(): LLMModel[];
  refreshModels(updateTokenUsage?: (delta: number) => Promise<void>): Promise<void>;
}

// ————————————————————————————————————————————————
// GLOBAL TOGGLE: flip this to `true` to grant web‐search to *all* text models
export const ENABLE_WEB_SEARCH_FOR_ALL_TEXT_MODELS = false;
// ————————————————————————————————————————————————

export const AVAILABLE_MODELS = {
  text: {
    'gpt-4o-mini': {
      name: 'gpt-4o-mini',
      displayName: 'GPT-4o Mini',
      provider: 'openai' as const,
      type: 'text' as const,
      tier: 'free' as const,
      capabilities: {
        webSearchCapable: ENABLE_WEB_SEARCH_FOR_ALL_TEXT_MODELS || false,
        codeExecution: true,
        maxTokens: 16384,
        contextWindow: 128000,
        multimodal: false,
        functionCalling: true,
        streaming: true,
      },
      description: 'Fast and efficient model for everyday tasks',
    },
    'gpt-4o': {
      name: 'gpt-4o',
      displayName: 'GPT-4o',
      provider: 'openai' as const,
      type: 'text' as const,
      tier: 'free' as const,
      capabilities: {
        webSearchCapable: ENABLE_WEB_SEARCH_FOR_ALL_TEXT_MODELS || true,
        codeExecution: true,
        maxTokens: 4096,
        contextWindow: 128000,
        multimodal: true,
        functionCalling: true,
        streaming: true,
      },
      description: 'Most capable OpenAI model with multimodal capabilities and web search',
    },
    'gpt-3.5-turbo': {
      name: 'gpt-3.5-turbo',
      displayName: 'GPT-3.5 Turbo',
      provider: 'openai' as const,
      type: 'text' as const,
      tier: 'free' as const,
      capabilities: {
        webSearchCapable: ENABLE_WEB_SEARCH_FOR_ALL_TEXT_MODELS || false,
        codeExecution: true,
        maxTokens: 4096,
        contextWindow: 16384,
        multimodal: false,
        functionCalling: true,
        streaming: true,
      },
      description: 'Legacy model, fast responses',
    },
    'claude-3-opus-20240229': {
      name: 'claude-3-opus-20240229',
      displayName: 'Claude 3 Opus',
      provider: 'anthropic' as const,
      type: 'text' as const,
      tier: 'premium' as const,
      capabilities: {
        webSearchCapable: ENABLE_WEB_SEARCH_FOR_ALL_TEXT_MODELS || false,
        codeExecution: true,
        maxTokens: 4096,
        contextWindow: 200000,
        multimodal: true,
        functionCalling: true,
        streaming: true,
      },
      description: 'Most powerful Claude 3 model',
    },
    'claude-3-sonnet-20240229': {
      name: 'claude-3-sonnet-20240229',
      displayName: 'Claude 3 Sonnet',
      provider: 'anthropic' as const,
      type: 'text' as const,
      tier: 'free' as const,
      capabilities: {
        webSearchCapable: ENABLE_WEB_SEARCH_FOR_ALL_TEXT_MODELS || false,
        codeExecution: true,
        maxTokens: 4096,
        contextWindow: 200000,
        multimodal: true,
        functionCalling: true,
        streaming: true,
      },
      description: 'Balanced Claude 3 model',
    },
    'claude-3-haiku-20240307': {
      name: 'claude-3-haiku-20240307',
      displayName: 'Claude 3 Haiku',
      provider: 'anthropic' as const,
      type: 'text' as const,
      tier: 'free' as const,
      capabilities: {
        webSearchCapable: ENABLE_WEB_SEARCH_FOR_ALL_TEXT_MODELS || false,
        codeExecution: true,
        maxTokens: 4096,
        contextWindow: 200000,
        multimodal: true,
        functionCalling: true,
        streaming: true,
      },
      description: 'Fastest Claude 3 model',
    },
    'llama3-8b-8192': {
      name: 'llama3-8b-8192',
      displayName: 'LLaMA 3 8B',
      provider: 'groq' as const,
      type: 'text' as const,
      tier: 'free' as const,
      capabilities: {
        webSearchCapable: ENABLE_WEB_SEARCH_FOR_ALL_TEXT_MODELS || true,
        codeExecution: true,
        maxTokens: 8192,
        contextWindow: 8192,
        multimodal: false,
        functionCalling: false,
        streaming: true,
      },
      description: 'Fast LLaMA 3 8B model on GROQ',
    },
    'gemma2-9b-it': {
      name: 'gemma2-9b-it',
      displayName: 'Gemma 2 (9B)',
      provider: 'groq' as const,
      type: 'text' as const,
      tier: 'free' as const,
      capabilities: {
        webSearchCapable: ENABLE_WEB_SEARCH_FOR_ALL_TEXT_MODELS || true,
        codeExecution: true,
        maxTokens: 8192,
        contextWindow: 8192,
        multimodal: false,
        functionCalling: false,
        streaming: true,
      },
      description: 'Lightweight and efficient model from Google, running on Groq',
    },
    'llama-3.3-70b-versatile': {
      name: 'llama-3.3-70b-versatile',
      displayName: 'LLaMA 3.3 (70B Versatile)',
      provider: 'groq' as const,
      type: 'text' as const,
      tier: 'free' as const,
      capabilities: {
        webSearchCapable: ENABLE_WEB_SEARCH_FOR_ALL_TEXT_MODELS || true,
        codeExecution: true,
        maxTokens: 32768,
        contextWindow: 131072,
        multimodal: false,
        functionCalling: true,
        streaming: true,
      },
      description: "Meta's latest LLaMA model optimized for versatile tasks",
    },
    'llama-3.1-8b-instant': {
      name: 'llama-3.1-8b-instant',
      displayName: 'LLaMA 3.1 (8B Instant)',
      provider: 'groq' as const,
      type: 'text' as const,
      tier: 'free' as const,
      capabilities: {
        webSearchCapable: ENABLE_WEB_SEARCH_FOR_ALL_TEXT_MODELS || true,
        codeExecution: true,
        maxTokens: 8192,
        contextWindow: 131072,
        multimodal: false,
        functionCalling: false,
        streaming: true,
      },
      description: 'Blazing fast and efficient for instant responses',
    },
  },
};

export const WEB_SEARCH_MODEL = 'gpt-4o';
export const DEFAULT_TEXT_MODEL = 'gpt-4o-mini';

export const getModelByName = (n: string): LLMModel | null =>
  (AVAILABLE_MODELS.text as any)[n] || null;

export const getTextModels = (): LLMModel[] =>
  Object.values(AVAILABLE_MODELS.text);

export const getWebSearchCapableModels = (): LLMModel[] =>
  getTextModels().filter(m => m.capabilities.webSearchCapable);

export const modelSupportsWebSearch = (n: string): boolean =>
  Boolean(getModelByName(n)?.capabilities.webSearchCapable);

export const getModelsByProvider = (provider: 'openai' | 'anthropic' | 'groq'): LLMModel[] =>
  getTextModels().filter(m => m.provider === provider);

export const getModelsByTier = (tier: 'free' | 'pro' | 'premium'): LLMModel[] =>
  getTextModels().filter(m => m.tier === tier);
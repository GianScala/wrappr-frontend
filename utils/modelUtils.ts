// src/utils/modelUtils.ts
import { LLMModel } from '../../types/models';

export const MODEL_ICONS: Record<string, string> = {
  'dall-e': 'color-palette',
  'stable-diffusion': 'brush',
  'midjourney': 'sparkles',
  'leonardo': 'diamond',
  'gpt': 'flash',
  'claude': 'diamond',
  'gemini': 'search',
  'llama': 'logo-facebook',
  'mixtral': 'wind',
  'groq': 'speedometer',
};

export const PROVIDER_ICONS: Record<string, string> = {
  'openai': 'flash',
  'anthropic': 'diamond',
  'google': 'search',
  'meta': 'logo-facebook',
  'groq': 'speedometer',
  'mistral': 'wind',
};

export const PROVIDER_COLORS: Record<string, string> = {
  'openai': '#10A37F',
  'anthropic': '#FF9900',
  'google': '#4285F4',
  'meta': '#1877F2',
  'groq': '#FF6B35',
  'mistral': '#FF7000',
};

export function getModelIcon(model: LLMModel): string {
  const key = Object.keys(MODEL_ICONS)
    .find(k => model.name.toLowerCase().includes(k));
  return key ? MODEL_ICONS[key] : 'cube';
}

export function getProviderIcon(provider?: string): string {
  if (typeof provider === 'string') {
    return PROVIDER_ICONS[provider.toLowerCase()] || 'cube';
  } else {
    return 'cube';
  }
}

export function getProviderColor(provider?: string): string {
  if (typeof provider === 'string') {
    return PROVIDER_COLORS[provider.toLowerCase()] || '#666666';
  } else {
    return '#666666';
  }
}

export function getTierColor(tier: 'free' | 'pro' | 'premium'): string {
  switch (tier) {
    case 'free': return '#10B981';
    case 'pro': return '#F59E0B';
    case 'premium': return '#EF4444';
    default: return '#6B7280';
  }
}

export function formatContextLength(contextLength?: number): string {
  if (!contextLength) return '';
  
  if (contextLength >= 1000000) {
    return `${(contextLength / 1000000).toFixed(1)}M`;
  }
  if (contextLength >= 1000) {
    return `${Math.round(contextLength / 1000)}K`;
  }
  return contextLength.toString();
}

export function getTierBadge(tier: 'free' | 'pro' | 'premium', theme: any) {
  const badgeStyle = {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 6,
  };
  
  const textStyle = {
    fontSize: 10,
    fontWeight: '600' as const,
    fontFamily: 'SpaceGrotesk-Regular',
    letterSpacing: 0.5,
  };

  switch (tier) {
    case 'free':
      return {
        style: { ...badgeStyle, backgroundColor: theme.colors.success + '20' },
        textStyle: { ...textStyle, color: theme.colors.success },
        text: 'FREE'
      };
    case 'pro':
      return {
        style: { ...badgeStyle, backgroundColor: theme.colors.warning + '20' },
        textStyle: { ...textStyle, color: theme.colors.warning },
        text: 'PRO'
      };
    case 'premium':
      return {
        style: { ...badgeStyle, backgroundColor: theme.colors.error + '20' },
        textStyle: { ...textStyle, color: theme.colors.error },
        text: 'PREMIUM'
      };
    default:
      return null;
  }
}
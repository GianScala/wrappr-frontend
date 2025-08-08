// services/modelService.ts - FIXED VERSION

import { 
  LLMModel, 
  ModelResponse, 
  ModelService, 
  DEFAULT_TEXT_MODEL,
  getModelByName,
  getTextModels as getLocalTextModels,
} from '../../types/models';

class ModelServiceImpl implements ModelService {
  private models: LLMModel[] = getLocalTextModels();
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getAvailableModels(
    idToken?: string, 
    updateTokenUsage?: (delta: number) => Promise<void>
  ): Promise<ModelResponse> {
    const now = Date.now();

    // Return cached if still fresh
    if (now - this.lastFetch < this.CACHE_DURATION && this.models.length > 0) {
      console.log("🔄 ModelService: Returning cached models", {
        text: this.getTextModels().length,
        webSearchCapable: this.getWebSearchCapableModels().length,
        totalModels: this.models.length
      });
      return this.formatResponse();
    }

    const maxRetries = 3;
    let retryCount = 0;
    let delay = 1000;

    while (retryCount <= maxRetries) {
      try {
        console.log(`🔄 ModelService: Fetching models from backend (attempt ${retryCount + 1})`);
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

        const response = await fetch('http://192.168.0.19:8000/models', {
          method: 'GET',
          headers,
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();

        // 1️⃣ Grab the arrays the backend sent
        const backendTextModels = data.text_models || [];

        // 2️⃣ Merge with local definitions so we keep our local .capabilities
        const textModels: LLMModel[] = backendTextModels.length > 0
          ? backendTextModels.map((model: any) => {
              const local = getModelByName(model.name);
              return local
                ? { ...local, ...model } // Merge backend data with local capabilities
                : ({ ...model, type: 'text' } as LLMModel);
            })
          : getLocalTextModels();

        // 🔥 FIX: Actually save the fetched models!
        this.models = textModels;
        this.lastFetch = now;

        console.log('✅ ModelService: Models fetched & saved:', {
          text: textModels.length,
          webSearchCapable: this.getWebSearchCapableModels().length,
          totalModels: this.models.length,
        });

        // Update token usage if provided by backend
        const tokensUsed = data.tokensUsed || 0;
        if (updateTokenUsage && tokensUsed > 0) {
          try {
            await updateTokenUsage(tokensUsed);
          } catch (tokenError) {
            console.warn('⚠️ Failed to update token usage:', tokenError);
          }
        }

        return this.formatResponse();
        
      } catch (error: any) {
        console.warn(`❌ ModelService: Fetch attempt ${retryCount + 1} failed:`, error.message);
        
        // Retry logic on quota errors
        if (error.message.includes('auth/quota-exceeded') && retryCount < maxRetries) {
          console.warn(`⚠️ Quota exceeded, retrying in ${delay}ms…`);
          await new Promise(r => setTimeout(r, delay));
          delay *= 2;
          retryCount++;
          continue;
        }
        
        // For other errors, break out of retry loop
        retryCount++;
        if (retryCount > maxRetries) break;
      }
    }

    console.warn('❌ ModelService: Max retries reached, using defaults');
    this.models = getLocalTextModels(); // Use full default models, not just one
    this.lastFetch = now;
    return this.formatResponse();
  }

  private formatResponse(): ModelResponse {
    const textModels = this.getTextModels();
    console.log('🔧 formatResponse:', {
      totalModels: this.models.length,
      textCount: textModels.length,
      webSearchCapable: this.getWebSearchCapableModels().length,
    });
    return {
      text_models: textModels,
    };
  }

  getModelById(id: string): LLMModel | null {
    return this.models.find(m => m.name === id) || getModelByName(id) || null;
  }

  getModelsByTier(tier: 'free' | 'pro' | 'premium'): LLMModel[] {
    return this.models.filter(m => m.tier === tier);
  }

  getTextModels(): LLMModel[] {
    return this.models.filter(m => m.type === 'text');
  }

  getWebSearchCapableModels(): LLMModel[] {
    return this.models.filter(m => m.type === 'text' && m.capabilities?.webSearchCapable);
  }

  async refreshModels(updateTokenUsage?: (delta: number) => Promise<void>): Promise<void> {
    this.lastFetch = 0; // force a refetch
    let idToken: string | undefined;
    
    // Dynamic import of auth to avoid circular dependency
    try {
      const { auth } = await import('../../config/firebase');
      if (auth?.currentUser) {
        idToken = await auth.currentUser.getIdToken(true);
      }
    } catch (error) {
      console.warn('⚠️ Could not get auth token:', error);
    }
    
    await this.getAvailableModels(idToken, updateTokenUsage);
  }
}

// Export a singleton
const modelServiceInstance = new ModelServiceImpl();
export const modelService = modelServiceInstance;
export default modelServiceInstance;
export { ModelServiceImpl };
// hooks/orchestrator/useModels.ts
import { useState, useCallback, useEffect } from 'react';
import { useApiClient } from './useApiClient';

interface ModelDefinition {
  name: string;
  tier: string;
  description?: string;
}

export interface ModelsResponse {
  text_models: ModelDefinition[];
  image_models: ModelDefinition[];
}

export interface ModelInfo {
  name: string;
  available: boolean;
  tier_required?: string;
  description?: string;
}

export const useModels = () => {
  const { get } = useApiClient();
  const [models, setModels] = useState<ModelsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(0);

  const fetchModels = useCallback(async (forceRefresh = false): Promise<ModelsResponse | null> => {
    // Cache for 5 minutes
    if (!forceRefresh && models && Date.now() - lastUpdated < 300000) {
      return models;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await get<ModelsResponse>('/models');
      setModels(data);
      setLastUpdated(Date.now());
      return data;
    } catch (err: any) {
      setError(err.message || "Failed to fetch models");
      return null;
    } finally {
      setLoading(false);
    }
  }, [get, models, lastUpdated]);

  const validateModel = useCallback(async (modelName: string): Promise<boolean> => {
    if (!models) {
      await fetchModels();
    }
    return !!models?.text_models.find(m => m.name === modelName) || 
           !!models?.image_models.find(m => m.name === modelName);
  }, [models, fetchModels]);

  const getModelInfo = useCallback(async (modelName: string): Promise<ModelInfo | null> => {
    try {
      if (!models) {
        await fetchModels();
      }
      
      const textModel = models?.text_models.find(m => m.name === modelName);
      if (textModel) {
        return {
          name: textModel.name,
          available: true,
          tier_required: textModel.tier,
          description: textModel.description
        };
      }

      const imageModel = models?.image_models.find(m => m.name === modelName);
      if (imageModel) {
        return {
          name: imageModel.name,
          available: true,
          tier_required: imageModel.tier,
          description: imageModel.description
        };
      }

      return null;
    } catch (err) {
      console.error('Failed to get model info:', err);
      return null;
    }
  }, [models, fetchModels]);

  const checkModelAccess = useCallback((modelName: string, userTier: string): boolean => {
    const model = models?.text_models.find(m => m.name === modelName) || 
                 models?.image_models.find(m => m.name === modelName);
    
    if (!model) return false;
    
    const tierOrder = ['free', 'pro', 'premium'];
    return tierOrder.indexOf(userTier) >= tierOrder.indexOf(model.tier);
  }, [models]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return {
    models,
    loading,
    error,
    fetchModels,
    validateModel,
    getModelInfo,
    checkModelAccess,
    clearError,
  };
};
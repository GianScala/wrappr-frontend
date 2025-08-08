// src/contexts/ModelContext.tsx - Fixed to prevent unnecessary updates
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import deepEqual from 'fast-deep-equal';
import { auth } from '../../config/firebase';
import { useAuth } from './AuthContext';
import { LLMModel, getTextModels } from '../../types/models';

let modelService: any;
let modelServiceLoaded = false;

const loadModelService = async () => {
  if (modelServiceLoaded) return modelService;
  try {
    const m = await import('../services/modelService');
    modelService = m.modelService ?? m.default;
    modelServiceLoaded = true;
    return modelService;
  } catch (err) {
    console.error('❌ Failed to load modelService:', err);
    modelServiceLoaded = true;
    return null;
  }
};

interface ModelContextShape {
  textModels: LLMModel[];
  webSearchModels: LLMModel[];
  loading: boolean;
  error: Error | null;
  refresh(): Promise<void>;
}

const ModelContext = createContext<ModelContextShape | null>(null);
export const useModels = () => {
  const ctx = useContext(ModelContext);
  if (!ctx) throw new Error('useModels must be used inside <ModelProvider>');
  return ctx;
};

export const ModelProvider = ({ children }: { children: ReactNode }) => {
  const { updateTokenUsage, user, authState } = useAuth();

  const [textModels, setTextModels] = useState<LLMModel[]>(getTextModels());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // refs to avoid re-render loops
  const fetching = useRef(false);
  const fetchedOnce = useRef(false);
  const lastAuthState = useRef(authState);

  /* ---------- derived ---------- */
  const webSearchModels = useMemo(
    () => textModels.filter(m => m.capabilities.webSearchCapable),
    [textModels]
  );

  /* ---------- core fetch ---------- */
  const fetchModels = useCallback(async () => {
    if (fetching.current || authState === 'loading') {
      return;
    }

    console.log('🔄 fetchModels started');
    fetching.current = true;
    setLoading(true);
    setError(null);

    try {
      const svc = await loadModelService();
      const defaultModels = getTextModels();

      if (!svc?.getAvailableModels) {
        console.warn('⚠️ modelService unavailable – using defaults');
        setTextModels(prev => deepEqual(prev, defaultModels) ? prev : defaultModels);
        fetchedOnce.current = true;
        return;
      }

      const idToken = user && authState === 'authenticated' 
        ? await auth.currentUser?.getIdToken(true).catch(() => undefined)
        : undefined;

      const { text_models = defaultModels } = await svc.getAvailableModels(
        idToken,
        updateTokenUsage
      );

      // Only update if models actually changed
      setTextModels(prev => {
        if (deepEqual(prev, text_models)) {
          console.log('📋 Models unchanged, skipping update');
          return prev;
        }
        console.log('✅ Models updated:', text_models.length);
        return text_models;
      });
      
      fetchedOnce.current = true;
    } catch (err) {
      console.error('❌ fetchModels error – using defaults:', err);
      setError(err as Error);
      const defaultModels = getTextModels();
      setTextModels(prev => deepEqual(prev, defaultModels) ? prev : defaultModels);
      fetchedOnce.current = true;
    } finally {
      fetching.current = false;
      setLoading(false);
    }
  }, [updateTokenUsage, user, authState]);

  /* Fetch models when auth state changes to authenticated - SIMPLIFIED */
  useEffect(() => {
    const currentAuthState = authState;
    
    // Only log changes
    if (lastAuthState.current !== currentAuthState) {
      console.log('🔄 ModelProvider: Auth state changed:', lastAuthState.current, '->', currentAuthState);
      lastAuthState.current = currentAuthState;
    }

    if (currentAuthState === 'authenticated' && !fetchedOnce.current) {
      console.log('🔄 ModelProvider: Fetching models for authenticated user');
      fetchModels();
    } else if (currentAuthState === 'unauthenticated') {
      console.log('🔄 ModelProvider: User logged out, resetting');
      fetchedOnce.current = false;
      fetching.current = false;
      setLoading(false);
      setTextModels(getTextModels());
    }
  }, [authState, fetchModels]); // Simplified dependencies

  const refresh = useCallback(async () => {
    if (fetching.current) return;
    fetchedOnce.current = false;
    await fetchModels();
  }, [fetchModels]);

  const value = {
    textModels,
    webSearchModels,
    loading,
    error,
    refresh,
  };

  return (
    <ModelContext.Provider value={value}>
      {children}
    </ModelContext.Provider>
  );
};
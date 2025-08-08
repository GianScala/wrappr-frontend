// contexts/AppContext.tsx - Final fixed version
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useModels } from './ModelContext';

interface AppContextType {
  selectedTextModel: string;
  setSelectedTextModel: (modelName: string) => void;
  isReady: boolean;
  canUseWebSearch: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return ctx;
};

const DEFAULT_TEXT_MODEL = 'gpt-4o-mini';

export function AppProvider(props: { children: React.ReactNode }) {
  const auth = useAuth();
  const models = useModels();
  const [selectedTextModel, setSelectedTextModelState] = useState(DEFAULT_TEXT_MODEL);
  const [isReady, setIsReady] = useState(false);
  
  const renderCount = useRef(0);
  const initialized = useRef(false);
  renderCount.current++;

  console.log('🔧 AppProvider render #', renderCount.current, '| Auth:', auth.authState, '| Models loading:', models.loading, '| Ready:', isReady);

  // Calculate derived values
  const canUseWebSearch = models.textModels.find(m => m.name === selectedTextModel)?.capabilities?.webSearchCapable || false;

  // SINGLE useEffect for initialization
  useEffect(() => {
    console.log('🔧 AppContext effect:', {
      authState: auth.authState,
      modelsLoading: models.loading,
      modelsCount: models.textModels.length,
      initialized: initialized.current,
      profileModel: auth.profile?.preferredTextModel
    });

    // Reset on logout
    if (auth.authState === 'unauthenticated') {
      console.log('🔄 Resetting AppContext for unauthenticated user');
      setSelectedTextModelState(DEFAULT_TEXT_MODEL);
      setIsReady(false);
      initialized.current = false;
      return;
    }

    // Initialize when authenticated and models are ready
    if (
      auth.authState === 'authenticated' &&
      !models.loading &&
      models.textModels.length > 0 &&
      !initialized.current
    ) {
      console.log('✅ Initializing AppContext');
      
      const preferredModel = auth.profile?.preferredTextModel || DEFAULT_TEXT_MODEL;
      const modelExists = models.textModels.some(m => m.name === preferredModel);
      
      if (modelExists) {
        setSelectedTextModelState(preferredModel);
      } else {
        const userTier = auth.profile?.tier || 'free';
        const availableModels = models.textModels.filter(m => userTier === 'pro' || m.tier === 'free');
        const finalModel = availableModels[0]?.name || DEFAULT_TEXT_MODEL;
        setSelectedTextModelState(finalModel);
      }
      
      setIsReady(true);
      initialized.current = true;
      
      console.log('🎯 AppContext initialized with model:', preferredModel);
    }
  }, [auth.authState, models.loading, models.textModels.length, auth.profile?.preferredTextModel, auth.profile?.tier]);

  const handleSetSelectedTextModel = useCallback((modelName: string) => {
    if (!modelName) return;
    
    const model = models.textModels.find(m => m.name === modelName);
    if (!model) return;
    
    const userTier = auth.profile?.tier || 'free';
    if (userTier === 'free' && model.tier !== 'free') return;
    
    setSelectedTextModelState(modelName);
  }, [models.textModels, auth.profile?.tier]);

  const value: AppContextType = {
    selectedTextModel,
    setSelectedTextModel: handleSetSelectedTextModel,
    isReady,
    canUseWebSearch,
  };

  return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
}
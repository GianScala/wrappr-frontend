// hooks/orchestrator/useApiClient.ts
import { useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE_URL = "http://192.168.0.19:8000";

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface UserContext {
  user_id: string;
  email?: string;
  username?: string;
  tier: string;
  ai_style: string;
}

export const useApiClient = () => {
  const { user, profile } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);

  const tier = profile?.tier ?? "free";

  // Generate auth headers with full user context
  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = user ? await user.getIdToken() : "";
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "X-User-Tier": tier,
      "X-User-ID": user?.uid ?? "anonymous",
    };

    // Add additional user context headers
    if (profile) {
      headers["X-User-AI-Style"] = profile.aiStyle;
      headers["X-User-Language"] = profile.appLanguage || "en";
      if (profile.username) {
        headers["X-User-Name"] = profile.username;
      }
    }

    return headers;
  }, [user, tier, profile]);

  // Create full user context object for API requests
  const createUserContext = useCallback((): UserContext => {
    return {
      user_id: user?.uid ?? "anonymous",
      email: profile?.email,
      username: profile?.username,
      tier: profile?.tier ?? "free",
      ai_style: profile?.aiStyle ?? "friendly",
    };
  }, [user, profile]);

  // Add user context to request body (for requests that need it)
  const withUserContext = useCallback((body: any, includeFullContext = false) => {
    const baseContext = {
      user_id: user?.uid ?? "anonymous",
      user_tier: tier,
      timestamp: new Date().toISOString(),
    };

    if (includeFullContext && profile) {
      return {
        ...body,
        user_context: createUserContext(),
        ...baseContext
      };
    }

    return {
      ...body,
      ...baseContext
    };
  }, [user, tier, profile, createUserContext]);

  // Generic request handler with abort support
  const makeRequest = useCallback(async <T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = await getAuthHeaders();

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    // Log request details for debugging
    console.log(`🔄 API Request: ${options.method || 'GET'} ${endpoint}`, {
      user_id: user?.uid,
      ai_style: profile?.aiStyle,
      tier
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: ApiError = {
          message: errorData.error || errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
          code: errorData.code,
          status: response.status,
        };
        console.error(`❌ API Error: ${error.message}`);
        throw error;
      }

      const data = await response.json();
      console.log(`✅ API Response: ${response.status}`);
      return data;
    } finally {
      abortControllerRef.current = null;
    }
  }, [getAuthHeaders, user, profile, tier]);

  // Cancel any in-flight requests
  const cancelRequests = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  // POST request helper - supports both legacy and new user context formats
  const post = useCallback(async <T = any>(
    endpoint: string,
    data: any,
    options?: RequestInit & { includeFullUserContext?: boolean }
  ): Promise<T> => {
    const { includeFullUserContext = false, ...requestOptions } = options || {};
    
    return makeRequest<T>(endpoint, {
      ...requestOptions,
      method: 'POST',
      body: JSON.stringify(withUserContext(data, includeFullUserContext)),
    });
  }, [makeRequest, withUserContext]);

  // GET request helper
  const get = useCallback(async <T = any>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> => {
    return makeRequest<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }, [makeRequest]);

  // PUT request helper
  const put = useCallback(async <T = any>(
    endpoint: string,
    data: any,
    options?: RequestInit & { includeFullUserContext?: boolean }
  ): Promise<T> => {
    const { includeFullUserContext = false, ...requestOptions } = options || {};
    
    return makeRequest<T>(endpoint, {
      ...requestOptions,
      method: 'PUT',
      body: JSON.stringify(withUserContext(data, includeFullUserContext)),
    });
  }, [makeRequest, withUserContext]);

  // DELETE request helper
  const del = useCallback(async <T = any>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> => {
    return makeRequest<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }, [makeRequest]);

  // Special method for chat requests with full user context
  const postWithFullContext = useCallback(async <T = any>(
    endpoint: string,
    data: any,
    options?: RequestInit
  ): Promise<T> => {
    return post<T>(endpoint, data, { ...options, includeFullUserContext: true });
  }, [post]);

  return {
    // Core methods
    makeRequest,
    post,
    get,
    put,
    delete: del,
    
    // Enhanced methods with user context
    postWithFullContext,
    
    // Utilities
    cancelRequests,
    withUserContext,
    createUserContext,
    
    // Constants and context
    API_BASE_URL,
    userContext: profile ? createUserContext() : null,
    isAuthenticated: !!user,
    userTier: tier,
  };
};
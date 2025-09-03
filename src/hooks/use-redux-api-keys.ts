import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import { 
  loadApiKeys, 
  addApiKey, 
  updateApiKey, 
  deleteApiKey, 
  setDefaultApiKey,
  updateLastUsed,
  selectApiKeys,
  selectApiKeysLoading,
  selectApiKeysError,
  ApiKey,
} from '@/store/slices/apiKeySlice';

interface UseReduxApiKeysReturn {
  // State
  apiKeys: ApiKey[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadKeys: () => void;
  addKey: (apiKey: Omit<ApiKey, 'id' | 'createdAt'>) => Promise<void>;
  updateKey: (id: string, updates: Partial<ApiKey>) => Promise<void>;
  deleteKey: (id: string) => Promise<void>;
  setDefault: (id: string, service: string) => Promise<void>;
  markAsUsed: (id: string) => void;
}

/**
 * Hook for managing API keys using Redux state
 * Provides a clean interface for API key operations with automatic persistence
 */
export function useReduxApiKeys(): UseReduxApiKeysReturn {
  const dispatch = useAppDispatch();
  const apiKeys = useAppSelector(selectApiKeys);
  const loading = useAppSelector(selectApiKeysLoading);
  const error = useAppSelector(selectApiKeysError);

  // Actions
  const loadKeys = useCallback(() => {
    dispatch(loadApiKeys());
  }, [dispatch]);

  const addKey = useCallback(async (apiKeyData: Omit<ApiKey, 'id' | 'createdAt'>) => {
    await dispatch(addApiKey(apiKeyData)).unwrap();
  }, [dispatch]);

  const updateKey = useCallback(async (id: string, updates: Partial<ApiKey>) => {
    await dispatch(updateApiKey({ id, updates })).unwrap();
  }, [dispatch]);

  const deleteKey = useCallback(async (id: string) => {
    await dispatch(deleteApiKey(id)).unwrap();
  }, [dispatch]);

  const setDefault = useCallback(async (id: string, service: string) => {
    await dispatch(setDefaultApiKey({ id, service })).unwrap();
  }, [dispatch]);

  const markAsUsed = useCallback((id: string) => {
    dispatch(updateLastUsed(id));
  }, [dispatch]);

  return {
    // State
    apiKeys,
    loading,
    error,
    
    // Actions
    loadKeys,
    addKey,
    updateKey,
    deleteKey,
    setDefault,
    markAsUsed,
  };
}

/**
 * Hook specifically for getting API keys for a service
 * Useful for components that only need keys for a specific service
 */
export function useServiceApiKeys(service: string) {
  const dispatch = useAppDispatch();
  const apiKeys = useAppSelector(selectApiKeys);
  const loading = useAppSelector(selectApiKeysLoading);
  
  // Filter keys for this service
  const keys = apiKeys.filter(key => key.service === service);
  const defaultKey = keys.find(key => key.isDefault) || keys[0];

  const markAsUsed = useCallback((id: string) => {
    dispatch(updateLastUsed(id));
  }, [dispatch]);

  return {
    keys,
    defaultKey,
    loading,
    markAsUsed,
  };
}

/**
 * Hook for backward compatibility with existing secure API key hook pattern
 * This provides a migration path from the old localStorage-based system to Redux
 */
export function useReduxSecureApiKey(service: string) {
  const dispatch = useAppDispatch();
  const apiKeys = useAppSelector(selectApiKeys);
  const loading = useAppSelector(selectApiKeysLoading);
  
  // Filter keys for this service
  const keys = apiKeys.filter(key => key.service === service);
  const defaultKey = keys.find(key => key.isDefault) || keys[0];

  const storeApiKey = useCallback(async (apiKey: string, name?: string): Promise<boolean> => {
    try {
      await dispatch(addApiKey({
        name: name || `${service} API Key`,
        service,
        key: apiKey,
        isEncrypted: false, // Will be handled by middleware
        isDefault: keys.length === 0, // Set as default if it's the first key for this service
      })).unwrap();
      return true;
    } catch {
      return false;
    }
  }, [dispatch, service, keys.length]);

  const retrieveApiKey = useCallback(async (): Promise<string | null> => {
    if (defaultKey) {
      // Mark as used
      dispatch(updateLastUsed(defaultKey.id));
      return defaultKey.key;
    }
    return null;
  }, [defaultKey, dispatch]);

  const removeApiKey = useCallback(async (): Promise<boolean> => {
    if (defaultKey) {
      try {
        await dispatch(deleteApiKey(defaultKey.id)).unwrap();
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }, [defaultKey, dispatch]);

  const updateApiKeyFunc = useCallback(async (newApiKey: string): Promise<boolean> => {
    if (defaultKey) {
      try {
        await dispatch(updateApiKey({ 
          id: defaultKey.id, 
          updates: { key: newApiKey } 
        })).unwrap();
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }, [defaultKey, dispatch]);

  const getMaskedKey = useCallback((): string => {
    if (!defaultKey) return '';
    const key = defaultKey.key;
    if (key.length <= 8) return '••••••••';
    return `${key.slice(0, 4)}${'•'.repeat(Math.max(8, key.length - 8))}${key.slice(-4)}`;
  }, [defaultKey]);

  const isKeySet = useCallback((): boolean => {
    return !!defaultKey;
  }, [defaultKey]);

  return {
    state: {
      isLoading: loading,
      error: null,
      maskedKey: getMaskedKey(),
      hasKey: isKeySet(),
    },
    storeApiKey,
    retrieveApiKey,
    updateApiKey: updateApiKeyFunc,
    removeApiKey,
    getMaskedKey,
    isKeySet,
    clearError: () => {}, // No-op for compatibility
  };
}

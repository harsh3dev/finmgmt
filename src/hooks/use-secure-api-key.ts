import { useState, useCallback, useEffect } from 'react';
import { 
  encryptApiKey, 
  decryptApiKey, 
  maskApiKey, 
  secureWipe,
  isValidEncryptedData,
  type EncryptedData 
} from '@/lib/crypto-utils';

interface SecureApiKeyState {
  isLoading: boolean;
  error: string | null;
  maskedKey: string;
  hasKey: boolean;
}

interface UseSecureApiKeyOptions {
  storageKey: string;
  autoLoad?: boolean;
  onError?: (error: string) => void;
}

interface UseSecureApiKeyReturn {
  state: SecureApiKeyState;
  storeApiKey: (apiKey: string) => Promise<boolean>;
  retrieveApiKey: () => Promise<string | null>;
  updateApiKey: (newApiKey: string) => Promise<boolean>;
  removeApiKey: () => Promise<boolean>;
  getMaskedKey: () => string;
  clearError: () => void;
  isKeySet: () => boolean;
}

export function useSecureApiKey({
  storageKey,
  autoLoad = true,
  onError,
}: UseSecureApiKeyOptions): UseSecureApiKeyReturn {
  const [state, setState] = useState<SecureApiKeyState>({
    isLoading: autoLoad,
    error: null,
    maskedKey: '',
    hasKey: false,
  });

  const updateState = useCallback((updates: Partial<SecureApiKeyState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleError = useCallback((error: string) => {
    updateState({ error, isLoading: false });
    onError?.(error);
    console.error(`[useSecureApiKey:${storageKey}]`, error);
  }, [storageKey, onError, updateState]);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const getStorageKey = useCallback(() => {
    return `secure-api-key-${storageKey}`;
  }, [storageKey]);

  const hasStoredKey = useCallback((): boolean => {
    try {
      const stored = localStorage.getItem(getStorageKey());
      if (!stored) return false;
      
      const data = JSON.parse(stored);
      return isValidEncryptedData(data);
    } catch {
      return false;
    }
  }, [getStorageKey]);

  const storeApiKey = useCallback(async (apiKey: string): Promise<boolean> => {
    if (!apiKey || apiKey.trim().length === 0) {
      handleError('API key cannot be empty');
      return false;
    }

    updateState({ isLoading: true, error: null });

    try {
      const encryptedData = await encryptApiKey(apiKey.trim());
      
      localStorage.setItem(getStorageKey(), JSON.stringify(encryptedData));
      
      updateState({
        isLoading: false,
        hasKey: true,
        maskedKey: maskApiKey(apiKey),
      });

      secureWipe();

      return true;
    } catch (error) {
      handleError(error instanceof Error ? error.message : 'Failed to store API key');
      return false;
    }
  }, [getStorageKey, handleError, updateState]);

  const retrieveApiKey = useCallback(async (): Promise<string | null> => {
    if (!hasStoredKey()) {
      return null;
    }

    updateState({ isLoading: true, error: null });

    try {
      const stored = localStorage.getItem(getStorageKey());
      if (!stored) {
        updateState({ isLoading: false });
        return null;
      }

      const encryptedData: EncryptedData = JSON.parse(stored);
      
      if (!isValidEncryptedData(encryptedData)) {
        throw new Error('Invalid encrypted data format');
      }

      // Decrypt the API key
      const decryptedKey = await decryptApiKey(encryptedData);
      
      updateState({ isLoading: false });
      return decryptedKey;
    } catch (error) {
      handleError(error instanceof Error ? error.message : 'Failed to retrieve API key');
      return null;
    }
  }, [hasStoredKey, getStorageKey, handleError, updateState]);

  // Remove API key from storage
  const removeApiKey = useCallback(async (): Promise<boolean> => {
    updateState({ isLoading: true, error: null });

    try {
      localStorage.removeItem(getStorageKey());
      
      updateState({
        isLoading: false,
        hasKey: false,
        maskedKey: '',
      });

      // Clear any cached crypto keys
      secureWipe();

      return true;
    } catch (error) {
      handleError(error instanceof Error ? error.message : 'Failed to remove API key');
      return false;
    }
  }, [getStorageKey, handleError, updateState]);

  const updateApiKey = useCallback(async (newApiKey: string): Promise<boolean> => {
    const removed = await removeApiKey();
    if (!removed) return false;
    
    return storeApiKey(newApiKey);
  }, [removeApiKey, storeApiKey]);

  const getMaskedKey = useCallback((): string => {
    return state.maskedKey || (state.hasKey ? '••••••••••••' : '');
  }, [state.maskedKey, state.hasKey]);

  const isKeySet = useCallback((): boolean => {
    return state.hasKey || hasStoredKey();
  }, [state.hasKey, hasStoredKey]);

  useEffect(() => {
    if (!autoLoad) return;

    const loadInitialState = async () => {
      try {
        const keyName = `secure-api-key-${storageKey}`;
        const stored = localStorage.getItem(keyName);
        
        if (!stored) {
          setState(prev => ({
            ...prev,
            hasKey: false,
            maskedKey: '',
            isLoading: false,
          }));
          return;
        }

        let encryptedData: EncryptedData;
        try {
          encryptedData = JSON.parse(stored);
        } catch {
          // Invalid JSON in storage, clear it
          localStorage.removeItem(keyName);
          setState(prev => ({
            ...prev,
            hasKey: false,
            maskedKey: '',
            isLoading: false,
          }));
          return;
        }

        if (!isValidEncryptedData(encryptedData)) {
          // Invalid encrypted data format, clear it
          localStorage.removeItem(keyName);
          setState(prev => ({
            ...prev,
            hasKey: false,
            maskedKey: '',
            isLoading: false,
          }));
          return;
        }

        try {
          const key = await decryptApiKey(encryptedData);
          if (key) {
            setState(prev => ({
              ...prev,
              hasKey: true,
              maskedKey: maskApiKey(key),
              isLoading: false,
            }));
            secureWipe();
          } else {
            setState(prev => ({
              ...prev,
              hasKey: false,
              maskedKey: '',
              isLoading: false,
            }));
          }
        } catch {
          setState(prev => ({
            ...prev,
            error: 'Failed to decrypt stored API key',
            isLoading: false,
          }));
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to load initial state',
          isLoading: false,
        }));
      }
    };

    loadInitialState();
  }, [autoLoad, storageKey]); // Only depend on stable values

  useEffect(() => {
    return () => {
      secureWipe();
    };
  }, []);

  return {
    state,
    storeApiKey,
    retrieveApiKey,
    updateApiKey,
    removeApiKey,
    getMaskedKey,
    clearError,
    isKeySet,
  };
}

export function useAlphaVantageApiKey() {
  return useSecureApiKey({
    storageKey: 'alpha-vantage',
    autoLoad: true,
  });
}

export function useCustomApiKey(serviceName: string) {
  return useSecureApiKey({
    storageKey: `custom-${serviceName}`,
    autoLoad: true,
  });
}

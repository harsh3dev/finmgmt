import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface ApiKey {
  id: string;
  name: string;
  service: string;
  key: string;
  description?: string;
  isEncrypted: boolean;
  createdAt: Date;
  lastUsed?: Date;
  isDefault?: boolean;
}

interface ApiKeyState {
  keys: ApiKey[];
  loading: boolean;
  error: string | null;
}

const initialState: ApiKeyState = {
  keys: [],
  loading: false,
  error: null,
};

// Async thunks for API key operations
export const loadApiKeys = createAsyncThunk(
  'apiKeys/loadApiKeys',
  async () => {
    try {
      // Load from localStorage for now - we'll extend secure storage later
      const localKeys = JSON.parse(localStorage.getItem('finance-dashboard-api-keys') || '[]');
      return localKeys;
    } catch (error) {
      console.error('Error loading API keys:', error);
      return [];
    }
  }
);

export const saveApiKeys = createAsyncThunk(
  'apiKeys/saveApiKeys',
  async (keys: ApiKey[]) => {
    try {
      // Save to localStorage for persistence
      localStorage.setItem('finance-dashboard-api-keys', JSON.stringify(keys));
      return keys;
    } catch (error) {
      console.error('Error saving API keys:', error);
      throw error;
    }
  }
);

export const addApiKey = createAsyncThunk(
  'apiKeys/addApiKey',
  async (apiKey: Omit<ApiKey, 'id' | 'createdAt'>) => {
    const newApiKey: ApiKey = {
      ...apiKey,
      id: `api-key-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };
    
    return newApiKey;
  }
);

export const updateApiKey = createAsyncThunk(
  'apiKeys/updateApiKey',
  async ({ id, updates }: { id: string; updates: Partial<ApiKey> }) => {
    return { id, updates };
  }
);

export const deleteApiKey = createAsyncThunk(
  'apiKeys/deleteApiKey',
  async (id: string) => {
    return id;
  }
);

export const setDefaultApiKey = createAsyncThunk(
  'apiKeys/setDefaultApiKey',
  async ({ id, service }: { id: string; service: string }) => {
    return { id, service };
  }
);

const apiKeySlice = createSlice({
  name: 'apiKeys',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateLastUsed: (state, action: PayloadAction<string>) => {
      const apiKey = state.keys.find(key => key.id === action.payload);
      if (apiKey) {
        apiKey.lastUsed = new Date();
      }
    },
    // Initialize from localStorage for immediate loading
    initializeFromStorage: (state) => {
      try {

        const saved = localStorage.getItem('finance-dashboard-api-keys');
        if (saved) {
          const keys = JSON.parse(saved).map((key: ApiKey) => ({
            ...key,
            createdAt: new Date(key.createdAt),
            lastUsed: key.lastUsed ? new Date(key.lastUsed) : undefined,
          }));

          state.keys = keys;
        } else {

        }
      } catch (error) {
        console.error('❌ API Keys: Error loading API keys from localStorage:', error);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Load API keys
      .addCase(loadApiKeys.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadApiKeys.fulfilled, (state, action) => {
        state.loading = false;
        state.keys = action.payload;
      })
      .addCase(loadApiKeys.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load API keys';
      })
      
      // Save API keys
      .addCase(saveApiKeys.pending, (state) => {
        state.loading = true;
      })
      .addCase(saveApiKeys.fulfilled, (state, action) => {
        state.loading = false;
        state.keys = action.payload;
      })
      .addCase(saveApiKeys.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to save API keys';
      })
      
      // Add API key
      .addCase(addApiKey.fulfilled, (state, action) => {
        state.keys.push(action.payload);
        // Auto-save will be handled by persistence middleware
      })
      
      // Update API key
      .addCase(updateApiKey.fulfilled, (state, action) => {
        const { id, updates } = action.payload;
        const apiKeyIndex = state.keys.findIndex(key => key.id === id);
        if (apiKeyIndex !== -1) {
          state.keys[apiKeyIndex] = { ...state.keys[apiKeyIndex], ...updates };
        }
        // Auto-save will be handled by persistence middleware
      })
      
      // Delete API key
      .addCase(deleteApiKey.fulfilled, (state, action) => {
        state.keys = state.keys.filter(key => key.id !== action.payload);
        // Auto-save will be handled by persistence middleware
      })
      
      // Set default API key
      .addCase(setDefaultApiKey.fulfilled, (state, action) => {
        const { id, service } = action.payload;
        // Remove default flag from other keys of the same service
        state.keys.forEach(key => {
          if (key.service === service) {
            key.isDefault = key.id === id;
          }
        });
        // Auto-save will be handled by persistence middleware
      });
  },
});

// Selectors
export const selectApiKeys = (state: { apiKeys: ApiKeyState }) => state.apiKeys.keys;
export const selectApiKeysLoading = (state: { apiKeys: ApiKeyState }) => state.apiKeys.loading;
export const selectApiKeysError = (state: { apiKeys: ApiKeyState }) => state.apiKeys.error;

export const selectApiKeysByService = (service: string) => 
  (state: { apiKeys: ApiKeyState }) => 
    state.apiKeys.keys.filter(key => key.service === service);

export const selectDefaultApiKey = (service: string) => 
  (state: { apiKeys: ApiKeyState }) => 
    state.apiKeys.keys.find(key => key.service === service && key.isDefault);

export const selectApiKeyById = (id: string) => 
  (state: { apiKeys: ApiKeyState }) => 
    state.apiKeys.keys.find(key => key.id === id);

export const { clearError, updateLastUsed, initializeFromStorage } = apiKeySlice.actions;
export default apiKeySlice.reducer;

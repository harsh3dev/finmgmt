import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ApiEndpoint, ApiCategory } from '@/types/widget';
import { dashboardStorage } from '@/lib/dashboard-storage';

interface ApiEndpointsState {
  endpoints: ApiEndpoint[];
  userEndpoints: ApiEndpoint[];
  importedEndpoints: ApiEndpoint[];
  loading: boolean;
  error: string | null;
  selectedEndpoint: ApiEndpoint | null;
}

const initialState: ApiEndpointsState = {
  endpoints: [],
  userEndpoints: [],
  importedEndpoints: [],
  loading: false,
  error: null,
  selectedEndpoint: null,
};

// Async thunks for API endpoint operations
export const loadApiEndpoints = createAsyncThunk(
  'apiEndpoints/loadApiEndpoints',
  async () => {
    try {

      const endpoints = await dashboardStorage.getApiEndpoints();

      return endpoints;
    } catch (error) {
      console.error('APIs: Error loading API endpoints:', error);
      throw error;
    }
  }
);

export const saveApiEndpoints = createAsyncThunk(
  'apiEndpoints/saveApiEndpoints',
  async (endpoints: ApiEndpoint[]) => {
    try {
      await dashboardStorage.saveApiEndpoints(endpoints);
      return endpoints;
    } catch (error) {
      console.error('Error saving API endpoints:', error);
      throw error;
    }
  }
);

export const addApiEndpoint = createAsyncThunk(
  'apiEndpoints/addApiEndpoint',
  async (endpoint: ApiEndpoint) => {
    try {
      await dashboardStorage.addApiEndpoint(endpoint);
      return endpoint;
    } catch (error) {
      console.error('Error adding API endpoint:', error);
      throw error;
    }
  }
);

export const updateApiEndpoint = createAsyncThunk(
  'apiEndpoints/updateApiEndpoint',
  async ({ apiId, updates }: { apiId: string; updates: Partial<ApiEndpoint> }) => {
    try {
      await dashboardStorage.updateApiEndpoint(apiId, updates);
      return { apiId, updates };
    } catch (error) {
      console.error('Error updating API endpoint:', error);
      throw error;
    }
  }
);

export const removeApiEndpoint = createAsyncThunk(
  'apiEndpoints/removeApiEndpoint',
  async (apiId: string) => {
    try {
      await dashboardStorage.removeApiEndpoint(apiId);
      return apiId;
    } catch (error) {
      console.error('Error removing API endpoint:', error);
      throw error;
    }
  }
);

export const testApiEndpoint = createAsyncThunk(
  'apiEndpoints/testApiEndpoint',
  async (endpoint: ApiEndpoint) => {
    try {
      const response = await fetch(endpoint.url, {
        headers: endpoint.headers || {},
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return { endpointId: endpoint.id, data, success: true };
    } catch (error) {
      console.error('Error testing API endpoint:', error);
      return { 
        endpointId: endpoint.id, 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      };
    }
  }
);

const apiEndpointsSlice = createSlice({
  name: 'apiEndpoints',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedEndpoint: (state, action: PayloadAction<ApiEndpoint | null>) => {
      state.selectedEndpoint = action.payload;
    },
    updateEndpointSampleResponse: (state, action: PayloadAction<{ endpointId: string; sampleResponse: Record<string, unknown> | unknown[] | null }>) => {
      const { endpointId, sampleResponse } = action.payload;
      const endpoint = state.endpoints.find(e => e.id === endpointId);
      if (endpoint) {
        endpoint.sampleResponse = sampleResponse;
        endpoint.updatedAt = new Date();
      }
    },
    // Local state updates that will be persisted later
    updateEndpointLocal: (state, action: PayloadAction<{ apiId: string; updates: Partial<ApiEndpoint> }>) => {
      const { apiId, updates } = action.payload;
      const endpointIndex = state.endpoints.findIndex(e => e.id === apiId);
      if (endpointIndex !== -1) {
        state.endpoints[endpointIndex] = { 
          ...state.endpoints[endpointIndex], 
          ...updates, 
          updatedAt: new Date() 
        };
        // Update filtered arrays
        state.userEndpoints = state.endpoints.filter(e => !e.isImported);
        state.importedEndpoints = state.endpoints.filter(e => e.isImported);
      }
    },
    // Initialize from localStorage for immediate loading
    initializeFromStorage: (state) => {
      try {

        const saved = localStorage.getItem('finance-dashboard-apis');
        if (saved) {
          const endpoints = JSON.parse(saved).map((endpoint: ApiEndpoint) => ({
            ...endpoint,
            isImported: endpoint.isImported ?? false,
            createdAt: new Date(endpoint.createdAt),
            updatedAt: new Date(endpoint.updatedAt),
          }));

          state.endpoints = endpoints;
          state.userEndpoints = endpoints.filter((e: ApiEndpoint) => !e.isImported);
          state.importedEndpoints = endpoints.filter((e: ApiEndpoint) => e.isImported);
        } else {

        }
      } catch (error) {
        console.error('APIs: Error loading API endpoints from localStorage:', error);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Load API endpoints
      .addCase(loadApiEndpoints.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadApiEndpoints.fulfilled, (state, action) => {

        state.loading = false;
        state.endpoints = action.payload;
        state.userEndpoints = action.payload.filter(e => !e.isImported);
        state.importedEndpoints = action.payload.filter(e => e.isImported);
      })
      .addCase(loadApiEndpoints.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load API endpoints';
      })
      
      // Save API endpoints
      .addCase(saveApiEndpoints.fulfilled, (state, action) => {
        state.endpoints = action.payload;
        state.userEndpoints = action.payload.filter(e => !e.isImported);
        state.importedEndpoints = action.payload.filter(e => e.isImported);
      })
      .addCase(saveApiEndpoints.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to save API endpoints';
      })
      
      // Add API endpoint
      .addCase(addApiEndpoint.fulfilled, (state, action) => {
        state.endpoints.push(action.payload);
        if (action.payload.isImported) {
          state.importedEndpoints.push(action.payload);
        } else {
          state.userEndpoints.push(action.payload);
        }
      })
      .addCase(addApiEndpoint.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to add API endpoint';
      })
      
      // Update API endpoint
      .addCase(updateApiEndpoint.fulfilled, (state, action) => {
        const { apiId, updates } = action.payload;
        const endpointIndex = state.endpoints.findIndex(e => e.id === apiId);
        if (endpointIndex !== -1) {
          state.endpoints[endpointIndex] = { ...state.endpoints[endpointIndex], ...updates };
          // Update filtered arrays
          state.userEndpoints = state.endpoints.filter(e => !e.isImported);
          state.importedEndpoints = state.endpoints.filter(e => e.isImported);
        }
      })
      .addCase(updateApiEndpoint.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update API endpoint';
      })
      
      // Remove API endpoint
      .addCase(removeApiEndpoint.fulfilled, (state, action) => {
        const apiId = action.payload;
        state.endpoints = state.endpoints.filter(e => e.id !== apiId);
        state.userEndpoints = state.userEndpoints.filter(e => e.id !== apiId);
        state.importedEndpoints = state.importedEndpoints.filter(e => e.id !== apiId);
        if (state.selectedEndpoint?.id === apiId) {
          state.selectedEndpoint = null;
        }
      })
      .addCase(removeApiEndpoint.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to remove API endpoint';
      })
      
      // Test API endpoint
      .addCase(testApiEndpoint.fulfilled, (state, action) => {
        const { endpointId, data, success } = action.payload;
        if (success && data) {
          const endpoint = state.endpoints.find(e => e.id === endpointId);
          if (endpoint) {
            endpoint.sampleResponse = data;
            endpoint.updatedAt = new Date();
          }
        }
      });
  },
});

// Selectors
export const selectApiEndpoints = (state: { apiEndpoints: ApiEndpointsState }) => state.apiEndpoints.endpoints;
export const selectUserApiEndpoints = (state: { apiEndpoints: ApiEndpointsState }) => state.apiEndpoints.userEndpoints;
export const selectImportedApiEndpoints = (state: { apiEndpoints: ApiEndpointsState }) => state.apiEndpoints.importedEndpoints;
export const selectApiEndpointsLoading = (state: { apiEndpoints: ApiEndpointsState }) => state.apiEndpoints.loading;
export const selectApiEndpointsError = (state: { apiEndpoints: ApiEndpointsState }) => state.apiEndpoints.error;
export const selectSelectedEndpoint = (state: { apiEndpoints: ApiEndpointsState }) => state.apiEndpoints.selectedEndpoint;

export const selectApiEndpointById = (endpointId: string) => 
  (state: { apiEndpoints: ApiEndpointsState }) => 
    state.apiEndpoints.endpoints.find(e => e.id === endpointId);

export const selectApiEndpointsByCategory = (category: ApiCategory) => 
  (state: { apiEndpoints: ApiEndpointsState }) => 
    state.apiEndpoints.endpoints.filter(e => e.category === category);

export const selectApiEndpointsWithSampleData = (state: { apiEndpoints: ApiEndpointsState }) => 
  state.apiEndpoints.endpoints.filter(e => e.sampleResponse);

export const selectApiEndpointCount = (state: { apiEndpoints: ApiEndpointsState }) => state.apiEndpoints.endpoints.length;
export const selectUserApiEndpointCount = (state: { apiEndpoints: ApiEndpointsState }) => state.apiEndpoints.userEndpoints.length;
export const selectImportedApiEndpointCount = (state: { apiEndpoints: ApiEndpointsState }) => state.apiEndpoints.importedEndpoints.length;

export const {
  clearError,
  setSelectedEndpoint,
  updateEndpointSampleResponse,
  updateEndpointLocal,
  initializeFromStorage,
} = apiEndpointsSlice.actions;

export default apiEndpointsSlice.reducer;

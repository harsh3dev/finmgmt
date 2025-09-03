import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import {
  loadApiEndpoints,
  addApiEndpoint as addApiEndpointAction,
  updateApiEndpoint as updateApiEndpointAction,
  removeApiEndpoint as removeApiEndpointAction,
  testApiEndpoint,
  clearError,
  selectApiEndpoints,
  selectUserApiEndpoints,
  selectImportedApiEndpoints,
  selectApiEndpointsLoading,
  selectApiEndpointsError,
  selectSelectedEndpoint,
  selectApiEndpointById,
  selectApiEndpointsByCategory,
} from '@/store/slices/apiEndpointsSlice';
import type { ApiEndpoint, ApiCategory } from '@/types/widget';

/**
 * Redux-based API endpoints hook that replaces the old useDashboardData hook
 * Provides the same interface but uses Redux for state management with localStorage persistence
 */
export function useReduxApiEndpoints() {
  const dispatch = useAppDispatch();
  
  // Selectors
  const apiEndpoints = useAppSelector(selectApiEndpoints);
  const userApiEndpoints = useAppSelector(selectUserApiEndpoints);
  const importedApiEndpoints = useAppSelector(selectImportedApiEndpoints);
  const loading = useAppSelector(selectApiEndpointsLoading);
  const error = useAppSelector(selectApiEndpointsError);
  const selectedEndpoint = useAppSelector(selectSelectedEndpoint);

  // Load API endpoints on mount
  useEffect(() => {
    dispatch(loadApiEndpoints());
  }, [dispatch]);

  // Actions
  const addApiEndpoint = useCallback(async (endpoint: ApiEndpoint) => {
    try {
      await dispatch(addApiEndpointAction(endpoint)).unwrap();
    } catch (error) {
      console.error('Error adding API endpoint:', error);
      throw error;
    }
  }, [dispatch]);

  const updateApiEndpoint = useCallback(async (apiId: string, updates: Partial<ApiEndpoint>) => {
    try {
      await dispatch(updateApiEndpointAction({ apiId, updates })).unwrap();
    } catch (error) {
      console.error('Error updating API endpoint:', error);
      throw error;
    }
  }, [dispatch]);

  const removeApiEndpoint = useCallback(async (apiId: string) => {
    try {
      await dispatch(removeApiEndpointAction(apiId)).unwrap();
    } catch (error) {
      console.error('Error removing API endpoint:', error);
      throw error;
    }
  }, [dispatch]);

  const testEndpoint = useCallback(async (endpoint: ApiEndpoint) => {
    try {
      const result = await dispatch(testApiEndpoint(endpoint)).unwrap();
      return result;
    } catch (error) {
      console.error('Error testing API endpoint:', error);
      throw error;
    }
  }, [dispatch]);

  const refreshApiEndpoints = useCallback(() => {
    dispatch(loadApiEndpoints());
  }, [dispatch]);

  const clearErrorState = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Utility functions
  const getApiEndpointById = useCallback((endpointId: string) => {
    return selectApiEndpointById(endpointId);
  }, []);

  const getApiEndpointsByCategory = useCallback((category: ApiCategory) => {
    return selectApiEndpointsByCategory(category);
  }, []);

  return {
    // State
    apiEndpoints,
    userApiEndpoints,
    importedApiEndpoints,
    loading,
    error,
    selectedEndpoint,
    
    // Actions
    addApiEndpoint,
    updateApiEndpoint,
    removeApiEndpoint,
    testEndpoint,
    refresh: refreshApiEndpoints,
    clearError: clearErrorState,
    
    // Utilities
    getApiEndpointById,
    getApiEndpointsByCategory,
  };
}

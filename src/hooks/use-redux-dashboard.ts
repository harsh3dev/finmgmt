import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { 
  loadWidgets,
  saveWidgets,
  addWidget as addWidgetAction,
  updateWidget as updateWidgetAction,
  removeWidget as removeWidgetAction,
  reorderWidgets,
  selectWidgets,
  selectUserWidgets,
  selectImportedWidgets,
  selectWidgetsLoading,
  selectWidgetsError,
} from '@/store/slices/widgetsSlice';
import {
  loadApiEndpoints,
  saveApiEndpoints,
  addApiEndpoint as addApiEndpointAction,
  updateApiEndpoint as updateApiEndpointAction,
  removeApiEndpoint as removeApiEndpointAction,
  selectApiEndpoints,
  selectUserApiEndpoints,
  selectImportedApiEndpoints,
  selectApiEndpointsLoading,
  selectApiEndpointsError,
} from '@/store/slices/apiEndpointsSlice';
import { useImportedContent } from '@/hooks/use-dashboard-data';
import { Widget, ApiEndpoint } from '@/types/widget';

/**
 * Redux-based hook for managing widgets with localStorage persistence
 * This replaces the old useWidgets hook from use-dashboard-data.ts
 */
export function useReduxWidgets() {
  const dispatch = useAppDispatch();
  const hasLoadedRef = useRef(false);
  
  // Get state from Redux store
  const widgets = useAppSelector(selectWidgets);
  const userWidgets = useAppSelector(selectUserWidgets);
  const importedWidgets = useAppSelector(selectImportedWidgets);
  const loading = useAppSelector(selectWidgetsLoading);
  const error = useAppSelector(selectWidgetsError);

  // Load widgets only once when component mounts
  useEffect(() => {
    if (!hasLoadedRef.current && !loading) {
      hasLoadedRef.current = true;
      dispatch(loadWidgets());
    }
  }, [dispatch, loading]);

  // Wrapped actions that dispatch to Redux and persist to localStorage
  const addWidget = useCallback(async (widget: Widget) => {
    try {
      await dispatch(addWidgetAction(widget)).unwrap();
    } catch (error) {
      console.error('Error adding widget:', error);
      throw error;
    }
  }, [dispatch]);

  const updateWidget = useCallback(async (widgetId: string, updates: Partial<Widget>) => {
    try {
      await dispatch(updateWidgetAction({ widgetId, updates })).unwrap();
    } catch (error) {
      console.error('Error updating widget:', error);
      throw error;
    }
  }, [dispatch]);

  const removeWidget = useCallback(async (widgetId: string) => {
    try {
      await dispatch(removeWidgetAction(widgetId)).unwrap();
    } catch (error) {
      console.error('Error removing widget:', error);
      throw error;
    }
  }, [dispatch]);

  const saveAllWidgets = useCallback(async (updatedWidgets: Widget[]) => {
    try {
      await dispatch(saveWidgets(updatedWidgets)).unwrap();
    } catch (error) {
      console.error('Error saving widgets:', error);
      throw error;
    }
  }, [dispatch]);

  const reorderAllWidgets = useCallback(async (reorderedWidgets: Widget[]) => {
    try {
      await dispatch(reorderWidgets(reorderedWidgets)).unwrap();
    } catch (error) {
      console.error('Error reordering widgets:', error);
      throw error;
    }
  }, [dispatch]);

  const refresh = useCallback(() => {

    dispatch(loadWidgets());
  }, [dispatch]);

  return {
    // Data
    widgets,
    userWidgets,
    importedWidgets,
    loading,
    error,
    // Actions
    addWidget,
    updateWidget,
    removeWidget,
    saveWidgets: saveAllWidgets,
    reorderWidgets: reorderAllWidgets,
    refresh,
  };
}

/**
 * Hook for user-created widgets only (excludes imported widgets)
 */
export function useReduxUserWidgets() {
  const dispatch = useAppDispatch();
  const userWidgets = useAppSelector(selectUserWidgets);
  const loading = useAppSelector(selectWidgetsLoading);
  const hasLoadedRef = useRef(false);

  // Load widgets only once when component mounts
  useEffect(() => {
    if (!hasLoadedRef.current && !loading) {
      hasLoadedRef.current = true;
      dispatch(loadWidgets());
    }
  }, [dispatch, loading]);

  const refresh = useCallback(() => {
    dispatch(loadWidgets());
  }, [dispatch]);

  return {
    widgets: userWidgets,
    loading,
    refresh,
  };
}

/**
 * Redux-based hook for managing API endpoints with localStorage persistence
 * This replaces the old useApiEndpoints hook from use-dashboard-data.ts
 */
export function useReduxApiEndpoints() {
  const dispatch = useAppDispatch();
  const hasLoadedRef = useRef(false);
  
  // Get state from Redux store
  const apiEndpoints = useAppSelector(selectApiEndpoints);
  const userApiEndpoints = useAppSelector(selectUserApiEndpoints);
  const importedApiEndpoints = useAppSelector(selectImportedApiEndpoints);
  const loading = useAppSelector(selectApiEndpointsLoading);
  const error = useAppSelector(selectApiEndpointsError);

  // Load API endpoints only once when component mounts
  useEffect(() => {
    if (!hasLoadedRef.current && !loading) {

      hasLoadedRef.current = true;
      dispatch(loadApiEndpoints());
    }
  }, [dispatch, loading]);

  // Wrapped actions that dispatch to Redux and persist to localStorage
  const addApiEndpoint = useCallback(async (apiEndpoint: ApiEndpoint) => {
    try {
      await dispatch(addApiEndpointAction(apiEndpoint)).unwrap();
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

  const saveAllApiEndpoints = useCallback(async (updatedEndpoints: ApiEndpoint[]) => {
    try {
      await dispatch(saveApiEndpoints(updatedEndpoints)).unwrap();
    } catch (error) {
      console.error('Error saving API endpoints:', error);
      throw error;
    }
  }, [dispatch]);

  const refresh = useCallback(() => {

    dispatch(loadApiEndpoints());
  }, [dispatch]);

  return {
    // Data
    apiEndpoints,
    userApiEndpoints,
    importedApiEndpoints,
    loading,
    error,
    // Actions
    addApiEndpoint,
    updateApiEndpoint,
    removeApiEndpoint,
    saveApiEndpoints: saveAllApiEndpoints,
    refresh,
  };
}

/**
 * Hook for user-created API endpoints only (excludes imported endpoints)
 */
export function useReduxUserApiEndpoints() {
  const dispatch = useAppDispatch();
  const userApiEndpoints = useAppSelector(selectUserApiEndpoints);
  const loading = useAppSelector(selectApiEndpointsLoading);
  const hasLoadedRef = useRef(false);

  // Load API endpoints only once when component mounts
  useEffect(() => {
    if (!hasLoadedRef.current && !loading) {
      hasLoadedRef.current = true;
      dispatch(loadApiEndpoints());
    }
  }, [dispatch, loading]);

  const refresh = useCallback(() => {
    dispatch(loadApiEndpoints());
  }, [dispatch]);

  return {
    apiEndpoints: userApiEndpoints,
    loading,
    refresh,
  };
}

/**
 * Combined hook for all dashboard data (widgets + API endpoints)
 * This replaces the old useDashboardData hook from use-dashboard-data.ts
 */
export function useReduxDashboardData() {
  const widgets = useReduxWidgets();
  const apiEndpoints = useReduxApiEndpoints();
  const { importedContent, loading: importedLoading } = useImportedContent();

  const loading = widgets.loading || apiEndpoints.loading || importedLoading;

  const refresh = useCallback(() => {
    widgets.refresh();
    apiEndpoints.refresh();
  }, [widgets, apiEndpoints]);

  return {
    // Widgets
    widgets: widgets.widgets,
    userWidgets: widgets.userWidgets,
    importedWidgets: widgets.importedWidgets,
    // API Endpoints
    apiEndpoints: apiEndpoints.apiEndpoints,
    userApiEndpoints: apiEndpoints.userApiEndpoints,
    importedApiEndpoints: apiEndpoints.importedApiEndpoints,
    // Imported Content
    importedContent,
    // State
    loading,
    // Actions
    addWidget: widgets.addWidget,
    updateWidget: widgets.updateWidget,
    removeWidget: widgets.removeWidget,
    saveWidgets: widgets.saveWidgets,
    reorderWidgets: widgets.reorderWidgets,
    addApiEndpoint: apiEndpoints.addApiEndpoint,
    updateApiEndpoint: apiEndpoints.updateApiEndpoint,
    removeApiEndpoint: apiEndpoints.removeApiEndpoint,
    saveApiEndpoints: apiEndpoints.saveApiEndpoints,
    refresh,
  };
}

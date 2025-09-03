"use client";

import { useState, useEffect, useCallback } from 'react';
import { dashboardStorage } from '@/lib/dashboard-storage';
import type { Widget, ApiEndpoint } from '@/types/widget';
import type { ImportedContent } from '@/types/imported-content';

// Hook for widgets with automatic synchronization
export function useWidgets() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWidgets = useCallback(async () => {
    try {
      const loadedWidgets = await dashboardStorage.getWidgets();
      setWidgets(loadedWidgets);
    } catch (error) {
      console.error('Error loading widgets:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWidgets();

    // Subscribe to changes from other pages/tabs
    const unsubscribe = dashboardStorage.subscribe(
      'dashboard-widgets-changed',
      loadWidgets
    );

    return unsubscribe;
  }, [loadWidgets]);

  const addWidget = useCallback(async (widget: Widget) => {
    try {
      await dashboardStorage.addWidget(widget);
      // State will be updated automatically via the subscription
    } catch (error) {
      console.error('Error adding widget:', error);
      throw error;
    }
  }, []);

  const updateWidget = useCallback(async (widgetId: string, updates: Partial<Widget>) => {
    try {
      await dashboardStorage.updateWidget(widgetId, updates);
      // State will be updated automatically via the subscription
    } catch (error) {
      console.error('Error updating widget:', error);
      throw error;
    }
  }, []);

  const removeWidget = useCallback(async (widgetId: string) => {
    try {
      await dashboardStorage.removeWidget(widgetId);
      // State will be updated automatically via the subscription
    } catch (error) {
      console.error('Error removing widget:', error);
      throw error;
    }
  }, []);

  const saveWidgets = useCallback(async (updatedWidgets: Widget[]) => {
    try {
      await dashboardStorage.saveWidgets(updatedWidgets);
      // State will be updated automatically via the subscription
    } catch (error) {
      console.error('Error saving widgets:', error);
      throw error;
    }
  }, []);

  return {
    widgets,
    loading,
    addWidget,
    updateWidget,
    removeWidget,
    saveWidgets,
    refresh: loadWidgets
  };
}

// Hook for user-created widgets only
export function useUserWidgets() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWidgets = useCallback(async () => {
    try {
      const loadedWidgets = await dashboardStorage.getUserWidgets();
      setWidgets(loadedWidgets);
    } catch (error) {
      console.error('Error loading user widgets:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWidgets();

    const unsubscribe = dashboardStorage.subscribe(
      'dashboard-widgets-changed',
      loadWidgets
    );

    return unsubscribe;
  }, [loadWidgets]);

  return {
    widgets,
    loading,
    refresh: loadWidgets
  };
}

// Hook for API endpoints with automatic synchronization
export function useApiEndpoints() {
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([]);
  const [loading, setLoading] = useState(true);

  const loadApiEndpoints = useCallback(async () => {
    try {
      const loadedEndpoints = await dashboardStorage.getApiEndpoints();
      setApiEndpoints(loadedEndpoints);
    } catch (error) {
      console.error('Error loading API endpoints:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApiEndpoints();

    const unsubscribe = dashboardStorage.subscribe(
      'dashboard-apis-changed',
      loadApiEndpoints
    );

    return unsubscribe;
  }, [loadApiEndpoints]);

  const addApiEndpoint = useCallback(async (apiEndpoint: ApiEndpoint) => {
    try {
      await dashboardStorage.addApiEndpoint(apiEndpoint);
      // State will be updated automatically via the subscription
    } catch (error) {
      console.error('Error adding API endpoint:', error);
      throw error;
    }
  }, []);

  const updateApiEndpoint = useCallback(async (apiId: string, updates: Partial<ApiEndpoint>) => {
    try {
      await dashboardStorage.updateApiEndpoint(apiId, updates);
      // State will be updated automatically via the subscription
    } catch (error) {
      console.error('Error updating API endpoint:', error);
      throw error;
    }
  }, []);

  const removeApiEndpoint = useCallback(async (apiId: string) => {
    try {
      await dashboardStorage.removeApiEndpoint(apiId);
      // State will be updated automatically via the subscription
    } catch (error) {
      console.error('Error removing API endpoint:', error);
      throw error;
    }
  }, []);

  const saveApiEndpoints = useCallback(async (updatedEndpoints: ApiEndpoint[]) => {
    try {
      await dashboardStorage.saveApiEndpoints(updatedEndpoints);
      // State will be updated automatically via the subscription
    } catch (error) {
      console.error('Error saving API endpoints:', error);
      throw error;
    }
  }, []);

  return {
    apiEndpoints,
    loading,
    addApiEndpoint,
    updateApiEndpoint,
    removeApiEndpoint,
    saveApiEndpoints,
    refresh: loadApiEndpoints
  };
}

// Hook for user-created API endpoints only
export function useUserApiEndpoints() {
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([]);
  const [loading, setLoading] = useState(true);

  const loadApiEndpoints = useCallback(async () => {
    try {
      const loadedEndpoints = await dashboardStorage.getUserApiEndpoints();
      setApiEndpoints(loadedEndpoints);
    } catch (error) {
      console.error('Error loading user API endpoints:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApiEndpoints();

    const unsubscribe = dashboardStorage.subscribe(
      'dashboard-apis-changed',
      loadApiEndpoints
    );

    return unsubscribe;
  }, [loadApiEndpoints]);

  return {
    apiEndpoints,
    loading,
    refresh: loadApiEndpoints
  };
}

// Hook for imported content
export function useImportedContent() {
  const [importedContent, setImportedContent] = useState<ImportedContent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadImportedContent = useCallback(async () => {
    try {
      const loadedContent = await dashboardStorage.getImportedContent();
      setImportedContent(loadedContent);
    } catch (error) {
      console.error('Error loading imported content:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadImportedContent();

    const unsubscribe = dashboardStorage.subscribe(
      'dashboard-imports-changed',
      loadImportedContent
    );

    return unsubscribe;
  }, [loadImportedContent]);

  const addImportedContent = useCallback(async (content: ImportedContent) => {
    try {
      await dashboardStorage.addImportedContent(content);
      // State will be updated automatically via the subscription
    } catch (error) {
      console.error('Error adding imported content:', error);
      throw error;
    }
  }, []);

  const removeImportedContent = useCallback(async (contentId: string) => {
    try {
      await dashboardStorage.removeImportedContent(contentId);
      // State will be updated automatically via the subscription
    } catch (error) {
      console.error('Error removing imported content:', error);
      throw error;
    }
  }, []);

  return {
    importedContent,
    loading,
    addImportedContent,
    removeImportedContent,
    refresh: loadImportedContent
  };
}

// Hook for all dashboard data
export function useDashboardData() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([]);
  const [importedContent, setImportedContent] = useState<ImportedContent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAllData = useCallback(async () => {
    try {
      const data = await dashboardStorage.getAllData();
      setWidgets(data.widgets);
      setApiEndpoints(data.apiEndpoints);
      setImportedContent(data.importedContent);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();

    // Subscribe to all changes
    const unsubscribeWidgets = dashboardStorage.subscribe(
      'dashboard-widgets-changed',
      loadAllData
    );
    const unsubscribeApis = dashboardStorage.subscribe(
      'dashboard-apis-changed',
      loadAllData
    );
    const unsubscribeImports = dashboardStorage.subscribe(
      'dashboard-imports-changed',
      loadAllData
    );

    return () => {
      unsubscribeWidgets();
      unsubscribeApis();
      unsubscribeImports();
    };
  }, [loadAllData]);

  return {
    widgets,
    apiEndpoints,
    importedContent,
    loading,
    refresh: loadAllData,
    userWidgets: widgets.filter(w => !w.isImported),
    importedWidgets: widgets.filter(w => w.isImported),
    userApiEndpoints: apiEndpoints.filter(a => !a.isImported),
    importedApiEndpoints: apiEndpoints.filter(a => a.isImported)
  };
}

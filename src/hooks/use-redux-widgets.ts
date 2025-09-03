import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import {
  loadWidgets,
  addWidget as addWidgetAction,
  updateWidget as updateWidgetAction,
  removeWidget as removeWidgetAction,
  reorderWidgets,
  clearError,
  selectWidgets,
  selectUserWidgets,
  selectImportedWidgets,
  selectWidgetsLoading,
  selectWidgetsError,
  selectSelectedWidget,
  selectWidgetById,
} from '@/store/slices/widgetsSlice';
import type { Widget } from '@/types/widget';

/**
 * Redux-based widgets hook that replaces the old useDashboardData hook
 * Provides the same interface but uses Redux for state management with localStorage persistence
 */
export function useReduxWidgets() {
  const dispatch = useAppDispatch();
  
  // Selectors
  const widgets = useAppSelector(selectWidgets);
  const userWidgets = useAppSelector(selectUserWidgets);
  const importedWidgets = useAppSelector(selectImportedWidgets);
  const loading = useAppSelector(selectWidgetsLoading);
  const error = useAppSelector(selectWidgetsError);
  const selectedWidget = useAppSelector(selectSelectedWidget);

  // Load widgets on mount
  useEffect(() => {
    dispatch(loadWidgets());
  }, [dispatch]);

  // Actions
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

  const saveWidgetsOrder = useCallback(async (updatedWidgets: Widget[]) => {
    try {
      await dispatch(reorderWidgets(updatedWidgets)).unwrap();
    } catch (error) {
      console.error('Error saving widget order:', error);
      throw error;
    }
  }, [dispatch]);

  const refreshWidgets = useCallback(() => {
    dispatch(loadWidgets());
  }, [dispatch]);

  const clearErrorState = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Utility functions
  const getWidgetById = useCallback((widgetId: string) => {
    return selectWidgetById(widgetId);
  }, []);

  return {
    // State
    widgets,
    userWidgets,
    importedWidgets,
    loading,
    error,
    selectedWidget,
    
    // Actions
    addWidget,
    updateWidget,
    removeWidget,
    saveWidgets: saveWidgetsOrder, // Keep same interface
    refresh: refreshWidgets,
    clearError: clearErrorState,
    
    // Utilities
    getWidgetById,
  };
}

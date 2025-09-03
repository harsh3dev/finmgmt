import { Middleware } from '@reduxjs/toolkit';

/**
 * Persistence middleware that automatically saves Redux state to localStorage
 * This ensures that all state changes are persisted and can be restored on app startup
 */
export const persistenceMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // Get current state after action is processed
  const state = store.getState();
  
  // Type guard to check if action has a type property
  const hasType = (act: unknown): act is { type: string } => {
    return typeof act === 'object' && act !== null && 'type' in act && typeof (act as { type: unknown }).type === 'string';
  };
  
  if (!hasType(action)) {
    return result;
  }
  
  try {
    // Skip persistence for initialization actions to avoid overwriting localStorage
    if (action.type.includes('initializeFromStorage')) {
      return result;
    }
    
    // Persist widgets state to localStorage
    if (action.type.startsWith('widgets/')) {
      localStorage.setItem('finance-dashboard-widgets', JSON.stringify(state.widgets.widgets));
    }
    
    // Persist API endpoints state to localStorage
    if (action.type.startsWith('apiEndpoints/')) {
      localStorage.setItem('finance-dashboard-apis', JSON.stringify(state.apiEndpoints.endpoints));
    }
    
    // Persist API keys state to localStorage
    if (action.type.startsWith('apiKeys/')) {
      localStorage.setItem('finance-dashboard-api-keys', JSON.stringify(state.apiKeys.keys));
    }
    
    // Persist navigation state (only sidebar collapsed state)
    if (action.type.startsWith('navigation/')) {
      localStorage.setItem('finance-dashboard-sidebar-collapsed', JSON.stringify(state.navigation.sidebarCollapsed));
    }
    
    // Persist UI state (only theme)
    if (action.type.startsWith('ui/')) {
      localStorage.setItem('finance-dashboard-theme', state.ui.theme);
    }
    
    // Dispatch storage events for cross-tab synchronization
    if (action.type.startsWith('widgets/')) {
      window.dispatchEvent(new CustomEvent('dashboard-widgets-changed'));
    }
    
    if (action.type.startsWith('apiEndpoints/')) {
      window.dispatchEvent(new CustomEvent('dashboard-apis-changed'));
    }
    
  } catch (error) {
    console.error('Error persisting state to localStorage:', error);
  }
  
  return result;
};

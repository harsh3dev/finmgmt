import { Middleware } from '@reduxjs/toolkit';

let hasHydrated = false;

// Lightweight Date -> ISO replacer so persisted JSON never contains Date instances
const toSerializable = (value: unknown): unknown => {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(toSerializable);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = toSerializable(v);
    }
    return out;
  }
  return value;
};

const safeStringify = (data: unknown) => {
  try { return JSON.stringify(toSerializable(data)); } catch { return '[]'; }
};

export const persistenceMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  const state = store.getState();

  const hasType = (act: unknown): act is { type: string } =>
    typeof act === 'object' && act !== null && 'type' in act && typeof (act as { type: unknown }).type === 'string';

  if (!hasType(action)) return result;

  try {
    if (action.type.endsWith('/initializeFromStorage')) {
      hasHydrated = true;
      return result;
    }

    if (!hasHydrated) return result;

    if (action.type.startsWith('widgets/')) {
      localStorage.setItem('finance-dashboard-widgets', safeStringify(state.widgets.widgets));
      window.dispatchEvent(new CustomEvent('dashboard-widgets-changed'));
    }

    if (action.type.startsWith('apiEndpoints/')) {
      localStorage.setItem('finance-dashboard-apis', safeStringify(state.apiEndpoints.endpoints));
      window.dispatchEvent(new CustomEvent('dashboard-apis-changed'));
    }

    if (action.type.startsWith('apiKeys/')) {
      localStorage.setItem('finance-dashboard-api-keys', safeStringify(state.apiKeys.keys));
    }

    if (action.type.startsWith('navigation/')) {
      localStorage.setItem('finance-dashboard-sidebar-collapsed', safeStringify(state.navigation.sidebarCollapsed));
    }

    if (action.type.startsWith('ui/')) {
      localStorage.setItem('finance-dashboard-theme', state.ui.theme);
    }
  } catch (error) {
    console.error('Error persisting state to localStorage:', error);
  }

  return result;
};

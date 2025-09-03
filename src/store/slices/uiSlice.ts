import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  theme: 'light' | 'dark' | 'system';
  loading: {
    global: boolean;
    widgets: boolean;
    apis: boolean;
    imports: boolean;
  };
  modals: {
    addWidget: boolean;
    addApi: boolean;
    configureWidget: boolean;
    export: boolean;
    import: boolean;
    templateDetails: boolean;
    templateApply: boolean;
  };
  breakpoint: 'mobile' | 'tablet' | 'desktop';
  errors: {
    message: string;
    timestamp: number;
  }[];
  notifications: {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    timestamp: number;
    duration?: number;
  }[];
}

const initialState: UIState = {
  theme: 'system',
  loading: {
    global: false,
    widgets: false,
    apis: false,
    imports: false,
  },
  modals: {
    addWidget: false,
    addApi: false,
    configureWidget: false,
    export: false,
    import: false,
    templateDetails: false,
    templateApply: false,
  },
  breakpoint: 'desktop',
  errors: [],
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
      localStorage.setItem('finance-dashboard-theme', action.payload);
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload;
    },
    setWidgetsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.widgets = action.payload;
    },
    setApisLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.apis = action.payload;
    },
    setImportsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.imports = action.payload;
    },
    openModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = true;
    },
    closeModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = false;
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(modal => {
        state.modals[modal as keyof UIState['modals']] = false;
      });
    },
    setBreakpoint: (state, action: PayloadAction<'mobile' | 'tablet' | 'desktop'>) => {
      state.breakpoint = action.payload;
    },
    addError: (state, action: PayloadAction<string>) => {
      state.errors.push({
        message: action.payload,
        timestamp: Date.now(),
      });
      // Keep only last 10 errors
      if (state.errors.length > 10) {
        state.errors = state.errors.slice(-10);
      }
    },
    clearErrors: (state) => {
      state.errors = [];
    },
    removeError: (state, action: PayloadAction<number>) => {
      state.errors = state.errors.filter(error => error.timestamp !== action.payload);
    },
    addNotification: (state, action: PayloadAction<{
      type: 'success' | 'error' | 'info' | 'warning';
      message: string;
      duration?: number;
    }>) => {
      const notification = {
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        ...action.payload,
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(notification => notification.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    initializeFromStorage: (state) => {
      try {
        const savedTheme = localStorage.getItem('finance-dashboard-theme');
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          state.theme = savedTheme as 'light' | 'dark' | 'system';
        }
      } catch (error) {
        console.error('Error loading UI state from localStorage:', error);
      }
    },
  },
});

// Selectors
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectLoading = (state: { ui: UIState }) => state.ui.loading;
export const selectGlobalLoading = (state: { ui: UIState }) => state.ui.loading.global;
export const selectWidgetsLoading = (state: { ui: UIState }) => state.ui.loading.widgets;
export const selectApisLoading = (state: { ui: UIState }) => state.ui.loading.apis;
export const selectImportsLoading = (state: { ui: UIState }) => state.ui.loading.imports;
export const selectModals = (state: { ui: UIState }) => state.ui.modals;
export const selectModal = (modalName: keyof UIState['modals']) => 
  (state: { ui: UIState }) => state.ui.modals[modalName];
export const selectBreakpoint = (state: { ui: UIState }) => state.ui.breakpoint;
export const selectErrors = (state: { ui: UIState }) => state.ui.errors;
export const selectNotifications = (state: { ui: UIState }) => state.ui.notifications;

export const {
  setTheme,
  setGlobalLoading,
  setWidgetsLoading,
  setApisLoading,
  setImportsLoading,
  openModal,
  closeModal,
  closeAllModals,
  setBreakpoint,
  addError,
  clearErrors,
  removeError,
  addNotification,
  removeNotification,
  clearNotifications,
  initializeFromStorage,
} = uiSlice.actions;

export default uiSlice.reducer;

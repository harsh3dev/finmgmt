import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NavigationState {
  sidebarCollapsed: boolean;
  activeRoute: string;
  navigationHistory: string[];
  isMobile: boolean;
  mobileNavOpen: boolean;
}

const initialState: NavigationState = {
  sidebarCollapsed: false,
  activeRoute: '/dashboard',
  navigationHistory: ['/dashboard'],
  isMobile: false,
  mobileNavOpen: false,
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      // Save to localStorage for persistence
      localStorage.setItem('finance-dashboard-sidebar-collapsed', JSON.stringify(state.sidebarCollapsed));
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
      localStorage.setItem('finance-dashboard-sidebar-collapsed', JSON.stringify(state.sidebarCollapsed));
    },
    setActiveRoute: (state, action: PayloadAction<string>) => {
      const newRoute = action.payload;
      if (state.activeRoute !== newRoute) {
        state.activeRoute = newRoute;
        // Add to history if not already the last item
        if (state.navigationHistory[state.navigationHistory.length - 1] !== newRoute) {
          state.navigationHistory.push(newRoute);
          // Keep only last 10 routes
          if (state.navigationHistory.length > 10) {
            state.navigationHistory = state.navigationHistory.slice(-10);
          }
        }
      }
    },
    setIsMobile: (state, action: PayloadAction<boolean>) => {
      state.isMobile = action.payload;
      // Auto-close mobile nav when switching to desktop
      if (!action.payload) {
        state.mobileNavOpen = false;
      }
    },
    toggleMobileNav: (state) => {
      state.mobileNavOpen = !state.mobileNavOpen;
    },
    setMobileNavOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileNavOpen = action.payload;
    },
    clearNavigationHistory: (state) => {
      state.navigationHistory = [state.activeRoute];
    },
    goBack: (state) => {
      if (state.navigationHistory.length > 1) {
        state.navigationHistory.pop();
        state.activeRoute = state.navigationHistory[state.navigationHistory.length - 1];
      }
    },
    initializeFromStorage: (state) => {
      try {
        const savedCollapsed = localStorage.getItem('finance-dashboard-sidebar-collapsed');
        if (savedCollapsed !== null) {
          state.sidebarCollapsed = JSON.parse(savedCollapsed);
        }
      } catch (error) {
        console.error('Error loading navigation state from localStorage:', error);
      }
    },
  },
});

// Selectors
export const selectSidebarCollapsed = (state: { navigation: NavigationState }) => state.navigation.sidebarCollapsed;
export const selectActiveRoute = (state: { navigation: NavigationState }) => state.navigation.activeRoute;
export const selectNavigationHistory = (state: { navigation: NavigationState }) => state.navigation.navigationHistory;
export const selectIsMobile = (state: { navigation: NavigationState }) => state.navigation.isMobile;
export const selectMobileNavOpen = (state: { navigation: NavigationState }) => state.navigation.mobileNavOpen;

export const {
  toggleSidebar,
  setSidebarCollapsed,
  setActiveRoute,
  setIsMobile,
  toggleMobileNav,
  setMobileNavOpen,
  clearNavigationHistory,
  goBack,
  initializeFromStorage,
} = navigationSlice.actions;

export default navigationSlice.reducer;

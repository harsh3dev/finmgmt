import { configureStore } from '@reduxjs/toolkit';
import { persistenceMiddleware } from './middleware/persistenceMiddleware';
import { apiKeyMiddleware } from './middleware/apiKeyMiddleware';
import rootReducer from './rootReducer';

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for non-serializable values
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    })
      .concat(persistenceMiddleware)
      .concat(apiKeyMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

let isStoreInitialized = false;
let initializationPromise: Promise<void> | null = null;

// Initialize store with data from localStorage
export const initializeStore = async (): Promise<void> => {
  // Prevent multiple initializations
  if (isStoreInitialized || initializationPromise) {
    return initializationPromise || Promise.resolve();
  }

  initializationPromise = (async () => {
    try {
      console.log('🚀 Initializing Redux store from localStorage...');
      
      // Import actions directly - simpler approach
      const { initializeFromStorage: initWidgets } = await import('./slices/widgetsSlice');
      const { initializeFromStorage: initApis } = await import('./slices/apiEndpointsSlice');
      const { initializeFromStorage: initNav } = await import('./slices/navigationSlice');
      const { initializeFromStorage: initUI } = await import('./slices/uiSlice');
      const { loadApiKeys } = await import('./slices/apiKeySlice');
      
      // Initialize all slices synchronously from localStorage
      console.log('📦 Dispatching initialization actions...');
      store.dispatch(initWidgets());
      store.dispatch(initApis());
      store.dispatch(initNav());
      store.dispatch(initUI());
      store.dispatch(loadApiKeys());
      
      isStoreInitialized = true;
      console.log('✅ Redux store initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Redux store:', error);
      isStoreInitialized = true; // Mark as initialized even on error to prevent retry loops
    }
  })();

  return initializationPromise;
};

// Export function to check if store is initialized
export const isStoreReady = () => isStoreInitialized;

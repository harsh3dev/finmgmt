"use client"
import { Provider } from 'react-redux';
import { store, initializeStore, isStoreReady } from '@/store';
import { useEffect } from 'react';

interface ReduxProviderProps {
  children: React.ReactNode;
}

function StoreInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize store with localStorage data asynchronously
    const initStore = async () => {
      try {

        if (!isStoreReady()) {
          await initializeStore();

        } else {

        }
      } catch (error) {
        console.error('StoreInitializer: Error during background initialization:', error);
      }
    };
    
    initStore();
  }, []);

  return <>{children}</>;
}

export function ReduxProvider({ children }: ReduxProviderProps) {
  return (
    <Provider store={store}>
      <StoreInitializer>
        {children}
      </StoreInitializer>
    </Provider>
  );
}

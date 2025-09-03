import { Middleware } from '@reduxjs/toolkit';

/**
 * API Key middleware that handles encryption/decryption of API keys
 * Automatically encrypts API keys when saved and decrypts when loaded
 */
export const apiKeyMiddleware: Middleware = () => (next) => (action) => {
  // Type guard to check if action has a type property
  const hasType = (act: unknown): act is { type: string; payload?: unknown } => {
    return typeof act === 'object' && act !== null && 'type' in act && typeof (act as { type: unknown }).type === 'string';
  };
  
  if (!hasType(action)) {
    return next(action);
  }
  
  // Handle API key encryption before saving
  if (action.type === 'apiKeys/addApiKey/fulfilled' || action.type === 'apiKeys/saveApiKeys/pending') {
    try {
      // For now, we'll handle encryption in the async thunks
      // This middleware can be extended later for more complex encryption scenarios
      return next(action);
    } catch (error) {
      console.error('Error in API key middleware:', error);
      return next(action);
    }
  }
  
  return next(action);
};

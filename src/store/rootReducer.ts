import { combineReducers } from '@reduxjs/toolkit';
import apiKeySlice from './slices/apiKeySlice';
import navigationSlice from './slices/navigationSlice';
import uiSlice from './slices/uiSlice';
import widgetsSlice from './slices/widgetsSlice';
import apiEndpointsSlice from './slices/apiEndpointsSlice';

const rootReducer = combineReducers({
  apiKeys: apiKeySlice,
  navigation: navigationSlice,
  ui: uiSlice,
  widgets: widgetsSlice,
  apiEndpoints: apiEndpointsSlice,
});

export default rootReducer;
export type RootState = ReturnType<typeof rootReducer>;

import { combineReducers } from '@reduxjs/toolkit';
import apiKeySlice from './slices/apiKeySlice';
import navigationSlice from './slices/navigationSlice';
import uiSlice from './slices/uiSlice';
import widgetsSlice from './slices/widgetsSlice';
import apiEndpointsSlice from './slices/apiEndpointsSlice';
import liveTradesSlice from './slices/liveTradesSlice';

const rootReducer = combineReducers({
  apiKeys: apiKeySlice,
  navigation: navigationSlice,
  ui: uiSlice,
  widgets: widgetsSlice,
  apiEndpoints: apiEndpointsSlice,
  liveTrades: liveTradesSlice,
});

export default rootReducer;
export type RootState = ReturnType<typeof rootReducer>;

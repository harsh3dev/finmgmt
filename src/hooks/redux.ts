import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';

// Typed hooks for Redux
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

export const useApiKeys = () => useAppSelector((state) => state.apiKeys);
export const useNavigation = () => useAppSelector((state) => state.navigation);
export const useUI = () => useAppSelector((state) => state.ui);
export const useWidgets = () => useAppSelector((state) => state.widgets);
export const useApiEndpoints = () => useAppSelector((state) => state.apiEndpoints);

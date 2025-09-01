import type { ApiCategory, DisplayType } from '@/types/widget';
import { 
  FileText, 
  Hash, 
  CheckCircle, 
  Calendar, 
  Package, 
  List 
} from 'lucide-react';

// Common API categories for dropdowns
export const API_CATEGORIES: { value: ApiCategory; label: string; description?: string }[] = [
  { value: 'stocks', label: 'Stocks', description: 'Stock market data and quotes' },
  { value: 'crypto', label: 'Cryptocurrency', description: 'Digital currency prices and data' },
  { value: 'forex', label: 'Foreign Exchange', description: 'Currency exchange rates' },
  { value: 'commodities', label: 'Commodities', description: 'Raw materials and primary products' },
  { value: 'bonds', label: 'Bonds', description: 'Fixed income securities' },
  { value: 'indices', label: 'Market Indices', description: 'Stock market indices and benchmarks' },
  { value: 'economic', label: 'Economic Data', description: 'Economic indicators and statistics' },
  { value: 'custom', label: 'Custom', description: 'Custom or other financial data' },
];

// Common display types for widgets
export const DISPLAY_TYPES: { value: DisplayType; label: string; description: string }[] = [
  { value: 'card', label: 'Card', description: 'Simple key-value display with clean layout' },
  { value: 'table', label: 'Table', description: 'Tabular data display with rows and columns' },
  { value: 'chart', label: 'Chart', description: 'Visual data representation with graphs' },
];

// Refresh interval presets
export const REFRESH_INTERVALS = [
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 300, label: '5 minutes' },
  { value: 900, label: '15 minutes' },
  { value: 1800, label: '30 minutes' },
  { value: 3600, label: '1 hour' },
  { value: 21600, label: '6 hours' },
  { value: 86400, label: '24 hours' },
];

// Input method types
export const INPUT_METHODS = [
  { value: 'form' as const, label: 'Manual Configuration', description: 'Fill out the form manually' },
  { value: 'curl' as const, label: 'cURL Command', description: 'Paste a cURL command to auto-populate' },
];

// Common field types for field selection
export const FIELD_TYPES = [
  { value: 'string', label: 'Text', icon: FileText },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'boolean', label: 'Boolean', icon: CheckCircle },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'object', label: 'Object', icon: Package },
  { value: 'array', label: 'Array', icon: List },
];

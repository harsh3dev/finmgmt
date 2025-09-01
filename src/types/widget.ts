// Widget Management Types

export interface Widget {
  id: string;
  name: string;
  apiUrl: string; // Legacy property for backwards compatibility
  apiEndpointId?: string; // New property to reference API endpoints
  refreshInterval: number; // in seconds
  displayType: DisplayType;
  position: WidgetPosition;
  config: WidgetConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WidgetConfig {
  selectedFields: string[];
  fieldMappings: Record<string, string>; // original_field_name -> display_name
  formatSettings: FormatSettings;
  styling: WidgetStyling;
}

export interface FormatSettings {
  currency?: string;
  decimalPlaces?: number;
  dateFormat?: string;
  numberFormat?: 'default' | 'compact' | 'scientific';
}

export interface WidgetStyling {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: number;
  shadow?: boolean;
}

export type DisplayType = 'card' | 'table' | 'chart';

export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter';

// API Management Types
export interface ApiEndpoint {
  id: string;
  name: string;
  url: string;
  headers?: Record<string, string>;
  apiKey?: string;
  description?: string;
  category: ApiCategory;
  rateLimit?: RateLimit;
  createdAt: Date;
  updatedAt: Date;
}

export interface RateLimit {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
}

export type ApiCategory = 'stocks' | 'crypto' | 'forex' | 'commodities' | 'bonds' | 'indices' | 'economic' | 'custom';

// API Response Types
export interface ApiResponse {
  data: Record<string, unknown> | unknown[] | null;
  status: 'success' | 'error' | 'loading';
  error?: string;
  lastUpdated?: Date;
  nextUpdate?: Date;
}

// Widget Form Types
export interface CreateWidgetForm {
  name: string;
  apiEndpointId: string;
  displayType: DisplayType;
  refreshInterval: number;
  position?: Partial<WidgetPosition>;
}

export interface ConfigureWidgetForm {
  selectedFields: string[];
  fieldMappings: Record<string, string>;
  formatSettings: Partial<FormatSettings>;
  styling: Partial<WidgetStyling>;
}

export interface CreateApiEndpointForm {
  name: string;
  url: string;
  headers?: Record<string, string>;
  apiKey?: string;
  description?: string;
  category: ApiCategory;
}

// Dashboard Types
export interface Dashboard {
  id: string;
  name: string;
  widgets: Widget[];
  layout: DashboardLayout;
  settings: DashboardSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  gap: number;
  padding: number;
}

export interface DashboardSettings {
  autoRefresh: boolean;
  globalRefreshInterval: number;
  theme: 'light' | 'dark' | 'auto';
  compactMode: boolean;
}

// Storage Types
export interface StorageData {
  widgets: Widget[];
  apiEndpoints: ApiEndpoint[];
  dashboards: Dashboard[];
  settings: AppSettings;
}

export interface AppSettings {
  defaultRefreshInterval: number;
  maxWidgetsPerDashboard: number;
  enableNotifications: boolean;
  autoSave: boolean;
}

// UI State Types
export interface WidgetState {
  widgets: Widget[];
  selectedWidget: Widget | null;
  isLoading: boolean;
  error: string | null;
}

export interface ApiState {
  endpoints: ApiEndpoint[];
  selectedEndpoint: ApiEndpoint | null;
  isLoading: boolean;
  error: string | null;
}

// Component Props Types
export interface WidgetCardProps {
  widget: Widget;
  data: ApiResponse;
  onConfigure: (widget: Widget) => void;
  onDelete: (widgetId: string) => void;
  isEditing?: boolean;
}

export interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (widget: CreateWidgetForm, newApiEndpoint?: CreateApiEndpointForm) => void;
  apiEndpoints: ApiEndpoint[];
}

export interface ConfigureWidgetModalProps {
  isOpen: boolean;
  widget: Widget | null;
  onClose: () => void;
  onSubmit: (config: ConfigureWidgetForm) => void;
  apiData?: Record<string, unknown> | unknown[] | null;
}

export interface AddApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (api: CreateApiEndpointForm) => void;
}

// Error Types
export interface WidgetError {
  widgetId: string;
  error: string;
  timestamp: Date;
  retryCount: number;
}

export interface ApiError {
  endpointId: string;
  error: string;
  statusCode?: number;
  timestamp: Date;
}

// Utility Types
export type WidgetEventType = 'create' | 'update' | 'delete' | 'configure' | 'refresh';

export interface WidgetEvent {
  type: WidgetEventType;
  widgetId: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

// Field Explorer Types
export interface FieldInfo {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date';
  path: string;
  sampleValue?: string | number | boolean | Record<string, unknown> | unknown[] | null;
  isSelected: boolean;
}

export interface JsonExplorerData {
  fields: FieldInfo[];
  rawData: Record<string, unknown> | unknown[] | null;
  selectedFields: string[];
}

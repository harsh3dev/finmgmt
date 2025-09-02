// Dashboard Import/Export Configuration Types

import { Widget, ApiEndpoint, DashboardSettings } from './widget';

export interface DashboardExport {
  version: string;
  exportDate: string;
  appVersion: string;
  metadata: ExportMetadata;
  data: ExportData;
}

export interface ExportMetadata {
  totalWidgets: number;
  totalApiEndpoints: number;
  exportName: string;
  description?: string;
  tags?: string[];
}

export interface ExportData {
  widgets: Widget[];
  apiEndpoints: ApiEndpoint[];
  settings: DashboardSettings;
}

// Version and compatibility types
export interface ExportVersion {
  major: number;
  minor: number;
  patch: number;
}

export interface CompatibilityInfo {
  supportedVersions: string[];
  minimumVersion: string;
  deprecatedFeatures?: string[];
  migrationRequired?: boolean;
}

// Export format validation
export interface ExportValidationResult {
  isValid: boolean;
  errors: ExportValidationError[];
  warnings: ExportValidationWarning[];
}

export interface ExportValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'error' | 'warning';
}

export interface ExportValidationWarning {
  code: string;
  message: string;
  field?: string;
  suggestion?: string;
}

// Export configuration options
export interface ExportOptions {
  exportName?: string;
  includeApiKeys: boolean; // Always true for simplified export
  includeSettings: boolean;
  includeSampleData?: boolean;
  compression?: boolean;
}

// Export file metadata
export interface ExportFileInfo {
  filename: string;
  size: number;
  checksum?: string;
  exportDate: Date;
  exportOptions: ExportOptions;
}

// Export status and progress
export interface ExportProgress {
  stage: ExportStage;
  progress: number; // 0-100
  message: string;
  startTime: Date;
  estimatedTimeRemaining?: number;
}

export type ExportStage = 
  | 'preparing'
  | 'gathering-widgets'
  | 'gathering-apis'
  | 'gathering-settings'
  | 'generating-metadata'
  | 'creating-file'
  | 'complete'
  | 'error';

// Import preview types
export interface ImportPreview {
  metadata: ExportMetadata;
  widgets: ImportPreviewWidget[];
  apiEndpoints: ImportPreviewApiEndpoint[];
  settings: DashboardSettings;
  conflicts: ImportConflict[];
  recommendations: ImportRecommendation[];
}

export interface ImportPreviewWidget {
  id: string;
  name: string;
  type: string;
  apiEndpointName: string;
  position: { x: number; y: number; width: number; height: number };
  hasConflict: boolean;
  conflictReason?: string;
}

export interface ImportPreviewApiEndpoint {
  id: string;
  name: string;
  url: string;
  category: string;
  hasApiKey: boolean;
  hasConflict: boolean;
  conflictReason?: string;
}

export interface ImportConflict {
  type: 'widget' | 'api' | 'setting';
  itemId: string;
  itemName: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  autoResolvable: boolean;
}

export interface ImportRecommendation {
  type: 'optimization' | 'configuration' | 'security';
  message: string;
  action?: string;
  priority: 'low' | 'medium' | 'high';
}

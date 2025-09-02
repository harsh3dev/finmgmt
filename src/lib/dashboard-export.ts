import { Widget, ApiEndpoint, DashboardSettings } from '@/types/widget';
import { 
  DashboardExport, 
  ExportMetadata, 
  ExportData, 
  ExportOptions,
  ExportFileInfo,
  ExportProgress,
  ExportStage
} from '@/types/dashboard-config';

const APP_VERSION = '1.0.0';
const EXPORT_FORMAT_VERSION = '1.0.0';

/**
 * Export the entire dashboard configuration including all widgets and API endpoints
 * Simplified implementation that exports everything with API keys included by default
 */
export async function exportDashboard(
  widgets: Widget[],
  apiEndpoints: ApiEndpoint[],
  settings?: DashboardSettings,
  options: Partial<ExportOptions> = {}
): Promise<DashboardExport> {
  const exportOptions: ExportOptions = {
    exportName: options.exportName || 'Dashboard Export',
    includeApiKeys: true,
    includeSettings: options.includeSettings ?? true,
    includeSampleData: options.includeSampleData ?? false,
    compression: options.compression ?? false
  };

  // Generate export metadata
  const metadata: ExportMetadata = {
    totalWidgets: widgets.length,
    totalApiEndpoints: apiEndpoints.length,
    exportName: exportOptions.exportName || 'Dashboard Export',
    description: `Dashboard export containing ${widgets.length} widgets and ${apiEndpoints.length} API endpoints`,
    tags: ['dashboard', 'finance', 'widgets', 'apis']
  };

  const defaultSettings: DashboardSettings = {
    autoRefresh: true,
    globalRefreshInterval: 300, // 5 minutes
    theme: 'auto',
    compactMode: false
  };

  // Prepare export data
  const exportData: ExportData = {
    widgets: widgets.map(widget => ({
      ...widget,
      createdAt: widget.createdAt,
      updatedAt: widget.updatedAt
    })),
    apiEndpoints: apiEndpoints.map(endpoint => ({
      ...endpoint,
      apiKey: endpoint.apiKey,
      createdAt: endpoint.createdAt,
      updatedAt: endpoint.updatedAt
    })),
    settings: settings || defaultSettings
  };

  const dashboardExport: DashboardExport = {
    version: EXPORT_FORMAT_VERSION,
    exportDate: new Date().toISOString(),
    appVersion: APP_VERSION,
    metadata,
    data: exportData
  };

  return dashboardExport;
}

/**
 * Generate a filename for the export based on export name and timestamp
 */
export function generateExportFilename(exportName?: string): string {
  const name = exportName || 'dashboard-export';
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const sanitizedName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  
  return `${sanitizedName}-${timestamp}.json`;
}

/**
 * Download the export file to the user's device
 */
export function downloadExportFile(
  exportData: DashboardExport,
  filename?: string
): void {
  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || generateExportFilename(exportData.metadata.exportName);
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Get export file information
 */
export function getExportFileInfo(
  exportData: DashboardExport,
  filename?: string
): ExportFileInfo {
  const jsonString = JSON.stringify(exportData);
  
  return {
    filename: filename || generateExportFilename(exportData.metadata.exportName),
    size: new Blob([jsonString]).size,
    exportDate: new Date(exportData.exportDate),
    exportOptions: {
      exportName: exportData.metadata.exportName,
      includeApiKeys: true,
      includeSettings: true,
      includeSampleData: false,
      compression: false
    }
  };
}

/**
 * Validate export data before download
 */
export function validateExportData(
  widgets: Widget[],
  apiEndpoints: ApiEndpoint[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check if there's anything to export
  if (widgets.length === 0 && apiEndpoints.length === 0) {
    errors.push('No widgets or API endpoints to export');
  }
  
  // Validate widget data
  widgets.forEach((widget, index) => {
    if (!widget.id) {
      errors.push(`Widget ${index + 1} is missing an ID`);
    }
    if (!widget.name) {
      errors.push(`Widget ${index + 1} is missing a name`);
    }
    if (!widget.apiUrl && !widget.apiEndpointId) {
      errors.push(`Widget "${widget.name}" is missing API configuration`);
    }
  });
  
  // Validate API endpoint data
  apiEndpoints.forEach((endpoint, index) => {
    if (!endpoint.id) {
      errors.push(`API endpoint ${index + 1} is missing an ID`);
    }
    if (!endpoint.name) {
      errors.push(`API endpoint ${index + 1} is missing a name`);
    }
    if (!endpoint.url) {
      errors.push(`API endpoint "${endpoint.name}" is missing a URL`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create export progress tracker
 */
export function createExportProgress(): {
  progress: ExportProgress;
  updateProgress: (stage: ExportStage, progress: number, message: string) => void;
} {
  const startTime = new Date();
  
  let progress: ExportProgress = {
    stage: 'preparing',
    progress: 0,
    message: 'Preparing export...',
    startTime,
    estimatedTimeRemaining: undefined
  };
  
  const updateProgress = (stage: ExportStage, progressPercent: number, message: string) => {
    const now = new Date();
    const elapsed = now.getTime() - startTime.getTime();
    const estimatedTotal = progressPercent > 0 ? (elapsed / progressPercent) * 100 : undefined;
    const estimatedTimeRemaining = estimatedTotal ? Math.max(0, estimatedTotal - elapsed) : undefined;
    
    progress = {
      stage,
      progress: progressPercent,
      message,
      startTime,
      estimatedTimeRemaining
    };
  };
  
  return { progress, updateProgress };
}

/**
 * Perform complete dashboard export with progress tracking
 */
export async function exportDashboardWithProgress(
  widgets: Widget[],
  apiEndpoints: ApiEndpoint[],
  settings?: DashboardSettings,
  options: Partial<ExportOptions> = {},
  onProgress?: (progress: ExportProgress) => void
): Promise<DashboardExport> {
  const { progress, updateProgress } = createExportProgress();
  
  try {
    // Step 1: Validation
    updateProgress('preparing', 10, 'Validating export data...');
    onProgress?.(progress);
    
    const validation = validateExportData(widgets, apiEndpoints);
    if (!validation.isValid) {
      throw new Error(`Export validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Step 2: Gathering widgets
    updateProgress('gathering-widgets', 30, 'Gathering widget configurations...');
    onProgress?.(progress);
    
    // Add small delay to show progress
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Step 3: Gathering APIs
    updateProgress('gathering-apis', 50, 'Gathering API endpoint configurations...');
    onProgress?.(progress);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Step 4: Gathering settings
    updateProgress('gathering-settings', 70, 'Gathering dashboard settings...');
    onProgress?.(progress);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Step 5: Creating export
    updateProgress('creating-file', 90, 'Creating export file...');
    onProgress?.(progress);
    
    const exportData = await exportDashboard(widgets, apiEndpoints, settings, options);
    
    // Step 6: Complete
    updateProgress('complete', 100, 'Export completed successfully!');
    onProgress?.(progress);
    
    return exportData;
    
  } catch (error) {
    updateProgress('error', 0, `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    onProgress?.(progress);
    throw error;
  }
}

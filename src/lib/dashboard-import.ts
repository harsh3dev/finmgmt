import { v4 as uuidv4 } from 'uuid';
import { DashboardExport } from '@/types/dashboard-config';
import { Widget, ApiEndpoint } from '@/types/widget';
import { ImportedContent, ImportMetadata } from '@/types/imported-content';
import { validateDashboardExport } from '@/lib/dashboard-validation';
import { secureStorageService } from '@/lib/secure-storage';

export interface ImportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data?: DashboardExport;
}

export interface ImportResult {
  success: boolean;
  importId: string;
  widgets: Widget[];
  apiEndpoints: ApiEndpoint[];
  error?: string;
}

/**
 * Validates an import file and returns validation results
 */
export async function validateImportFile(file: File): Promise<ImportValidationResult> {
  try {
    // Check file type
    if (!file.name.endsWith('.json')) {
      return {
        isValid: false,
        errors: ['Invalid file format. Please select a JSON file.'],
        warnings: []
      };
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return {
        isValid: false,
        errors: ['File size too large. Maximum size is 10MB.'],
        warnings: []
      };
    }

    // Parse JSON
    const fileContent = await file.text();
    let data: unknown;
    
    try {
      data = JSON.parse(fileContent);
    } catch {
      return {
        isValid: false,
        errors: ['Invalid JSON format. Please check the file content.'],
        warnings: []
      };
    }

    // Validate export format using Zod schema
    const validationResult = validateDashboardExport(data);
    
    if (!validationResult.success) {
      return {
        isValid: false,
        errors: validationResult.errors,
        warnings: validationResult.warnings
      };
    }

    // Additional validation checks
    const exportData = validationResult.data;
    if (!exportData) {
      return {
        isValid: false,
        errors: ['Validation failed - no data returned'],
        warnings: []
      };
    }

    const warnings: string[] = [...validationResult.warnings];
    const errors: string[] = [];

    // Check for required fields
    if (!exportData.data.widgets || !Array.isArray(exportData.data.widgets)) {
      errors.push('Missing or invalid widgets data');
    }

    if (!exportData.data.apiEndpoints || !Array.isArray(exportData.data.apiEndpoints)) {
      errors.push('Missing or invalid API endpoints data');
    }

    // Check version compatibility
    if (exportData.version !== '1.0.0') {
      warnings.push(`Export version ${exportData.version} may not be fully compatible. Current version: 1.0.0`);
    }

    // Check for empty export
    if (exportData.data.widgets.length === 0 && exportData.data.apiEndpoints.length === 0) {
      warnings.push('Import file contains no widgets or API endpoints');
    }

    // Check for missing API endpoints referenced by widgets
    const apiEndpointIds = new Set(exportData.data.apiEndpoints.map(api => api.id));
    const missingApis = exportData.data.widgets
      .filter(widget => widget.apiEndpointId && !apiEndpointIds.has(widget.apiEndpointId))
      .map(widget => widget.name);

    if (missingApis.length > 0) {
      warnings.push(`Some widgets reference missing API endpoints: ${missingApis.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      data: exportData
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: []
    };
  }
}

/**
 * Generates new UUIDs for all widgets and API endpoints to avoid conflicts
 */
export function generateNewIds(
  widgets: Widget[], 
  apiEndpoints: ApiEndpoint[]
): { widgets: Widget[]; apiEndpoints: ApiEndpoint[]; idMapping: Record<string, string> } {
  const idMapping: Record<string, string> = {};
  
  // Generate new IDs for API endpoints first
  const newApiEndpoints = apiEndpoints.map(api => {
    const newId = uuidv4();
    idMapping[api.id] = newId;
    return {
      ...api,
      id: newId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  // Generate new IDs for widgets and update API endpoint references
  const newWidgets = widgets.map(widget => {
    const newId = uuidv4();
    idMapping[widget.id] = newId;
    
    return {
      ...widget,
      id: newId,
      // Update API endpoint reference if it exists
      apiEndpointId: widget.apiEndpointId && idMapping[widget.apiEndpointId] 
        ? idMapping[widget.apiEndpointId] 
        : widget.apiEndpointId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  return {
    widgets: newWidgets,
    apiEndpoints: newApiEndpoints,
    idMapping
  };
}

/**
 * Marks items as imported with metadata
 */
export function markAsImported(
  widgets: Widget[], 
  apiEndpoints: ApiEndpoint[], 
  importId: string, 
  sourceName: string
): { widgets: Widget[]; apiEndpoints: ApiEndpoint[] } {
  const importDate = new Date();
  
  const markedWidgets = widgets.map(widget => ({
    ...widget,
    isImported: true,
    importId,
    importSource: sourceName,
    importDate
  }));

  const markedApiEndpoints = apiEndpoints.map(api => ({
    ...api,
    isImported: true,
    importId,
    importSource: sourceName,
    importDate
  }));

  return {
    widgets: markedWidgets,
    apiEndpoints: markedApiEndpoints
  };
}

/**
 * Imports dashboard content and saves to localStorage
 */
export async function importDashboardContent(
  exportData: DashboardExport,
  sourceName?: string
): Promise<ImportResult> {
  try {
    const importId = uuidv4();
    const finalSourceName = sourceName || exportData.metadata.exportName || 'Unknown Source';

    // Generate new IDs to avoid conflicts
    const { widgets: newWidgets, apiEndpoints: newApiEndpoints } = generateNewIds(
      exportData.data.widgets,
      exportData.data.apiEndpoints
    );

    // Mark items as imported
    const { widgets: markedWidgets, apiEndpoints: markedApiEndpoints } = markAsImported(
      newWidgets,
      newApiEndpoints,
      importId,
      finalSourceName
    );

    // Load existing data from localStorage
    const existingWidgets: Widget[] = JSON.parse(
      localStorage.getItem('finance-dashboard-widgets') || '[]'
    );
    const existingApiEndpoints: ApiEndpoint[] = JSON.parse(
      localStorage.getItem('finance-dashboard-apis') || '[]'
    );
    const existingImports: ImportedContent[] = JSON.parse(
      localStorage.getItem('finance-dashboard-imports') || '[]'
    );

    // Combine with existing data
    const allWidgets = [...existingWidgets, ...markedWidgets];
    const allApiEndpoints = [...existingApiEndpoints, ...markedApiEndpoints];

    // Create import session record
    const importMetadata: ImportMetadata = {
      originalExportDate: exportData.exportDate,
      originalAppVersion: exportData.appVersion,
      importSource: 'file-upload',
      totalItems: markedWidgets.length + markedApiEndpoints.length,
      successfulItems: markedWidgets.length + markedApiEndpoints.length,
      failedItems: 0
    };

    const importSession: ImportedContent = {
      importId,
      importDate: new Date(),
      sourceName: finalSourceName,
      widgets: markedWidgets.map(w => w.id),
      apiEndpoints: markedApiEndpoints.map(a => a.id),
      isTemplate: false,
      importMetadata
    };

    const allImports = [...existingImports, importSession];

    // Save to localStorage
    localStorage.setItem('finance-dashboard-widgets', JSON.stringify(allWidgets));
    secureStorageService.saveApiEndpoints(allApiEndpoints).catch(error => {
      console.error('Error saving API endpoints during import:', error);
    });
    localStorage.setItem('finance-dashboard-imports', JSON.stringify(allImports));

    return {
      success: true,
      importId,
      widgets: markedWidgets,
      apiEndpoints: markedApiEndpoints
    };
  } catch (error) {
    return {
      success: false,
      importId: '',
      widgets: [],
      apiEndpoints: [],
      error: error instanceof Error ? error.message : 'Unknown import error'
    };
  }
}

/**
 * Gets import preview information without actually importing
 */
export function getImportPreview(exportData: DashboardExport): {
  widgetCount: number;
  apiEndpointCount: number;
  sourceName: string;
  exportDate: string;
  widgets: Array<{ name: string; type: string; apiEndpoint?: string }>;
  apiEndpoints: Array<{ name: string; category: string; url: string }>;
} {
  const widgets = exportData.data.widgets.map(widget => {
    const relatedApi = exportData.data.apiEndpoints.find(
      api => api.id === widget.apiEndpointId
    );
    
    return {
      name: widget.name,
      type: widget.displayType || 'auto',
      apiEndpoint: relatedApi?.name
    };
  });

  const apiEndpoints = exportData.data.apiEndpoints.map(api => ({
    name: api.name,
    category: api.category,
    url: api.url
  }));

  return {
    widgetCount: exportData.data.widgets.length,
    apiEndpointCount: exportData.data.apiEndpoints.length,
    sourceName: exportData.metadata.exportName,
    exportDate: exportData.exportDate,
    widgets,
    apiEndpoints
  };
}

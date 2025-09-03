import { z } from 'zod';
import { DashboardExport } from '@/types/dashboard-config';

// Zod schemas for validation

// Widget validation schema
const WidgetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Widget name is required'),
  apiUrl: z.string().url(), // Required for backwards compatibility
  apiEndpointId: z.string().uuid().optional(),
  refreshInterval: z.number().min(5, 'Refresh interval must be at least 5 seconds'),
  displayType: z.enum(['card', 'table', 'chart']),
  position: z.object({
    x: z.number().min(0),
    y: z.number().min(0),
    width: z.number().min(1),
    height: z.number().min(1)
  }),
  config: z.object({
    selectedFields: z.array(z.string()),
    fieldMappings: z.record(z.string(), z.string()),
    formatSettings: z.object({
      currency: z.string().optional(),
      decimalPlaces: z.number().min(0).max(10).optional(),
      dateFormat: z.string().optional(),
      numberFormat: z.enum(['default', 'compact', 'scientific']).optional()
    }),
    styling: z.object({
      backgroundColor: z.string().optional(),
      textColor: z.string().optional(),
      borderColor: z.string().optional(),
      borderRadius: z.number().min(0).optional(),
      shadow: z.boolean().optional()
    })
  }),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // Import tracking fields (optional as they're added during import)
  isImported: z.boolean().optional(),
  importId: z.string().uuid().optional(),
  importSource: z.string().optional(),
  importDate: z.coerce.date().optional()
});

// API Endpoint validation schema
const ApiEndpointSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'API endpoint name is required'),
  url: z.string().url('Invalid URL format'),
  headers: z.record(z.string(), z.string()).optional(),
  apiKey: z.string().optional(),
  description: z.string().optional(),
  category: z.enum(['stocks', 'crypto', 'forex', 'commodities', 'bonds', 'indices', 'economic', 'custom']),
  rateLimit: z.object({
    requestsPerMinute: z.number().min(0),
    requestsPerHour: z.number().min(0),
    requestsPerDay: z.number().min(0)
  }).optional(),
  sampleResponse: z.any().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  isImported: z.boolean().optional(),
  importId: z.string().uuid().optional(),
  importSource: z.string().optional(),
  importDate: z.coerce.date().optional()
});

// Dashboard settings validation schema
const DashboardSettingsSchema = z.object({
  autoRefresh: z.boolean(),
  globalRefreshInterval: z.number().min(5),
  theme: z.enum(['light', 'dark', 'auto']),
  compactMode: z.boolean()
});

// Export metadata validation schema
const ExportMetadataSchema = z.object({
  totalWidgets: z.number().min(0),
  totalApiEndpoints: z.number().min(0),
  exportName: z.string().min(1, 'Export name is required'),
  exportDescription: z.string().optional(),
  tags: z.array(z.string()).optional()
});

// Main dashboard export validation schema
const DashboardExportSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Invalid version format'),
  exportDate: z.string().datetime('Invalid export date format'),
  appVersion: z.string().min(1, 'App version is required'),
  metadata: ExportMetadataSchema,
  data: z.object({
    widgets: z.array(WidgetSchema),
    apiEndpoints: z.array(ApiEndpointSchema),
    settings: DashboardSettingsSchema
  })
});

// Validation result interface
export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors: string[];
  warnings: string[];
}

// Version compatibility definitions
const SUPPORTED_VERSIONS = ['1.0.0'];
const CURRENT_VERSION = '1.0.0';

/**
 * Validates a dashboard export object against the schema
 */
export function validateDashboardExport(data: unknown): ValidationResult<DashboardExport> {
  try {
    // Basic type check
    if (typeof data !== 'object' || data === null) {
      return {
        success: false,
        errors: ['Invalid data format. Expected an object.'],
        warnings: []
      };
    }

    // Validate against schema
    const result = DashboardExportSchema.safeParse(data);
    
    if (!result.success) {
      const errors = result.error.issues.map(issue => {
        const path = issue.path.length > 0 ? ` at ${issue.path.join('.')}` : '';
        return `${issue.message}${path}`;
      });

      return {
        success: false,
        errors,
        warnings: []
      };
    }

    const validatedData = result.data;
    const warnings: string[] = [];

    // Version compatibility check
    if (!SUPPORTED_VERSIONS.includes(validatedData.version)) {
      if (isVersionNewer(validatedData.version, CURRENT_VERSION)) {
        return {
          success: false,
          errors: [`Export version ${validatedData.version} is newer than supported version ${CURRENT_VERSION}. Please update the application.`],
          warnings: []
        };
      } else {
        warnings.push(`Export version ${validatedData.version} is older than current version ${CURRENT_VERSION}. Some features may not be available.`);
      }
    }

    // Additional validation checks
    const additionalChecks = performAdditionalValidation(validatedData);
    warnings.push(...additionalChecks.warnings);

    if (additionalChecks.errors.length > 0) {
      return {
        success: false,
        errors: additionalChecks.errors,
        warnings
      };
    }

    return {
      success: true,
      data: validatedData,
      errors: [],
      warnings
    };
  } catch (error) {
    return {
      success: false,
      errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: []
    };
  }
}

/**
 * Validates individual widget configuration
 */
export function validateWidget(widget: unknown): ValidationResult {
  try {
    const result = WidgetSchema.safeParse(widget);
    
    if (!result.success) {
      const errors = result.error.issues.map(issue => {
        const path = issue.path.length > 0 ? ` at ${issue.path.join('.')}` : '';
        return `${issue.message}${path}`;
      });

      return {
        success: false,
        errors,
        warnings: []
      };
    }

    return {
      success: true,
      data: result.data,
      errors: [],
      warnings: []
    };
  } catch (error) {
    return {
      success: false,
      errors: [`Widget validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: []
    };
  }
}

/**
 * Validates individual API endpoint configuration
 */
export function validateApiEndpoint(apiEndpoint: unknown): ValidationResult {
  try {
    const result = ApiEndpointSchema.safeParse(apiEndpoint);
    
    if (!result.success) {
      const errors = result.error.issues.map(issue => {
        const path = issue.path.length > 0 ? ` at ${issue.path.join('.')}` : '';
        return `${issue.message}${path}`;
      });

      return {
        success: false,
        errors,
        warnings: []
      };
    }

    return {
      success: true,
      data: result.data,
      errors: [],
      warnings: []
    };
  } catch (error) {
    return {
      success: false,
      errors: [`API endpoint validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: []
    };
  }
}

/**
 * Performs additional validation checks beyond schema validation
 */
function performAdditionalValidation(data: z.infer<typeof DashboardExportSchema>): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for empty export
  if (data.data.widgets.length === 0 && data.data.apiEndpoints.length === 0) {
    warnings.push('Export contains no widgets or API endpoints');
  }

  // Check widget-API relationships
  const apiEndpointIds = new Set(data.data.apiEndpoints.map(api => api.id));
  const orphanedWidgets = data.data.widgets.filter(widget => 
    widget.apiEndpointId && !apiEndpointIds.has(widget.apiEndpointId)
  );

  if (orphanedWidgets.length > 0) {
    warnings.push(`${orphanedWidgets.length} widget(s) reference missing API endpoints`);
  }

  // Check for duplicate IDs
  const widgetIds = data.data.widgets.map(w => w.id);
  const apiIds = data.data.apiEndpoints.map(a => a.id);
  
  if (new Set(widgetIds).size !== widgetIds.length) {
    errors.push('Duplicate widget IDs found');
  }
  
  if (new Set(apiIds).size !== apiIds.length) {
    errors.push('Duplicate API endpoint IDs found');
  }

  // Check for ID conflicts between widgets and APIs
  const allIds = [...widgetIds, ...apiIds];
  if (new Set(allIds).size !== allIds.length) {
    errors.push('ID conflicts found between widgets and API endpoints');
  }

  // Validate export metadata consistency
  if (data.metadata.totalWidgets !== data.data.widgets.length) {
    warnings.push('Metadata widget count does not match actual widget count');
  }
  
  if (data.metadata.totalApiEndpoints !== data.data.apiEndpoints.length) {
    warnings.push('Metadata API endpoint count does not match actual API endpoint count');
  }

  // Check for potentially sensitive data in API keys
  const apisWithKeys = data.data.apiEndpoints.filter(api => api.apiKey);
  if (apisWithKeys.length > 0) {
    warnings.push(`Export contains ${apisWithKeys.length} API endpoint(s) with API keys`);
  }

  return { errors, warnings };
}

/**
 * Checks if a version is newer than another version
 */
function isVersionNewer(version1: string, version2: string): boolean {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;

    if (v1Part > v2Part) return true;
    if (v1Part < v2Part) return false;
  }

  return false;
}

/**
 * Migrates older export formats to current version
 */
export function migrateExportFormat(data: Record<string, unknown>): { success: boolean; data?: Record<string, unknown>; error?: string } {
  try {
    
    if (!data.version) {
      data.version = '1.0.0';
      data.appVersion = data.appVersion || '1.0.0';
      data.exportDate = data.exportDate || new Date().toISOString();
    }

    // Add missing required fields if they don't exist
    if (!data.metadata) {
      const widgets = Array.isArray((data.data as Record<string, unknown>)?.widgets) 
        ? (data.data as Record<string, unknown>).widgets as unknown[] 
        : [];
      const apiEndpoints = Array.isArray((data.data as Record<string, unknown>)?.apiEndpoints) 
        ? (data.data as Record<string, unknown>).apiEndpoints as unknown[] 
        : [];
        
      data.metadata = {
        totalWidgets: widgets.length,
        totalApiEndpoints: apiEndpoints.length,
        exportName: 'Migrated Export'
      };
    }

    if (!data.data) {
      data.data = {
        widgets: [],
        apiEndpoints: [],
        settings: {
          autoRefresh: true,
          globalRefreshInterval: 300,
          theme: 'auto',
          compactMode: false
        }
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Migration failed'
    };
  }
}

/**
 * Gets validation schema for external use
 */
export function getValidationSchemas() {
  return {
    DashboardExportSchema,
    WidgetSchema,
    ApiEndpointSchema,
    DashboardSettingsSchema,
    ExportMetadataSchema
  };
}

import { ImportedContent, ImportMetadata } from '@/types/imported-content';
import { Widget, ApiEndpoint } from '@/types/widget';
import { secureStorageService } from '@/lib/secure-storage';

/**
 * Tracks a new import session by creating a record and linking widgets/APIs
 */
export function trackImport(
  importId: string,
  sourceName: string,
  widgetIds: string[],
  apiEndpointIds: string[],
  isTemplate: boolean = false,
  templateId?: string,
  originalExportDate?: string,
  originalAppVersion?: string
): ImportedContent {

  const importMetadata: ImportMetadata = {
    originalExportDate,
    originalAppVersion,
    importSource: 'file-upload',
    totalItems: widgetIds.length + apiEndpointIds.length,
    successfulItems: widgetIds.length + apiEndpointIds.length,
    failedItems: 0
  };

  const importSession: ImportedContent = {
    importId,
    importDate: new Date(),
    sourceName,
    widgets: widgetIds,
    apiEndpoints: apiEndpointIds,
    isTemplate,
    templateId,
    importMetadata
  };

  const existingImports: ImportedContent[] = JSON.parse(
    localStorage.getItem('finance-dashboard-imports') || '[]'
  );

  const updatedImports = [...existingImports, importSession];

  // Save to localStorage
  localStorage.setItem('finance-dashboard-imports', JSON.stringify(updatedImports));

  return importSession;
}

/**
 * Retrieves an import session by ID
 */
export function getImportSession(importId: string): ImportedContent | null {
  try {
    const imports: ImportedContent[] = JSON.parse(
      localStorage.getItem('finance-dashboard-imports') || '[]'
    );

    return imports.find(session => session.importId === importId) || null;
  } catch (error) {
    console.error('Failed to get import session:', error);
    return null;
  }
}

/**
 * Gets import metadata for a specific item (widget or API endpoint)
 */
export function getImportMetadata(itemId: string): ImportedContent | null {
  try {
    const imports: ImportedContent[] = JSON.parse(
      localStorage.getItem('finance-dashboard-imports') || '[]'
    );

    return imports.find(session => 
      session.widgets.includes(itemId) || session.apiEndpoints.includes(itemId)
    ) || null;
  } catch (error) {
    console.error('Failed to get import metadata:', error);
    return null;
  }
}

/**
 * Removes an entire import group (all widgets and APIs from a specific import session)
 */
export function removeImportGroup(importId: string): {
  success: boolean;
  removedWidgets: string[];
  removedApiEndpoints: string[];
  error?: string;
} {
  try {
    const importSession = getImportSession(importId);
    if (!importSession) {
      return {
        success: false,
        removedWidgets: [],
        removedApiEndpoints: [],
        error: 'Import session not found'
      };
    }

    // Load current data
    const widgets: Widget[] = JSON.parse(
      localStorage.getItem('finance-dashboard-widgets') || '[]'
    );
    const apiEndpoints: ApiEndpoint[] = JSON.parse(
      localStorage.getItem('finance-dashboard-apis') || '[]'
    );
    const imports: ImportedContent[] = JSON.parse(
      localStorage.getItem('finance-dashboard-imports') || '[]'
    );

    const filteredWidgets = widgets.filter(
      widget => !importSession.widgets.includes(widget.id)
    );

    const filteredApiEndpoints = apiEndpoints.filter(
      api => !importSession.apiEndpoints.includes(api.id)
    );

    const filteredImports = imports.filter(
      session => session.importId !== importId
    );

    // Save updated data
    localStorage.setItem('finance-dashboard-widgets', JSON.stringify(filteredWidgets));
    secureStorageService.saveApiEndpoints(filteredApiEndpoints).catch(error => {
      console.error('Error saving API endpoints after import removal:', error);
    });
    localStorage.setItem('finance-dashboard-imports', JSON.stringify(filteredImports));

    return {
      success: true,
      removedWidgets: importSession.widgets,
      removedApiEndpoints: importSession.apiEndpoints
    };
  } catch (error) {
    return {
      success: false,
      removedWidgets: [],
      removedApiEndpoints: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Removes a specific item from an import session
 */
export function removeImportedItem(itemId: string, itemType: 'widget' | 'api'): {
  success: boolean;
  importId?: string;
  error?: string;
} {
  try {
    // Find the import session containing this item
    const imports: ImportedContent[] = JSON.parse(
      localStorage.getItem('finance-dashboard-imports') || '[]'
    );

    const importSession = imports.find(session => 
      itemType === 'widget' 
        ? session.widgets.includes(itemId)
        : session.apiEndpoints.includes(itemId)
    );

    if (!importSession) {
      return {
        success: false,
        error: 'Import session not found for this item'
      };
    }

    // Remove item from widgets/API endpoints
    if (itemType === 'widget') {
      const widgets: Widget[] = JSON.parse(
        localStorage.getItem('finance-dashboard-widgets') || '[]'
      );
      const filteredWidgets = widgets.filter(widget => widget.id !== itemId);
      localStorage.setItem('finance-dashboard-widgets', JSON.stringify(filteredWidgets));
    } else {
      const apiEndpoints: ApiEndpoint[] = JSON.parse(
        localStorage.getItem('finance-dashboard-apis') || '[]'
      );
      const filteredApiEndpoints = apiEndpoints.filter(api => api.id !== itemId);
      secureStorageService.saveApiEndpoints(filteredApiEndpoints).catch(error => {
        console.error('Error saving API endpoints after item removal:', error);
      });
    }

    // Update import session to remove item reference
    const updatedImportSession = {
      ...importSession,
      widgets: itemType === 'widget' 
        ? importSession.widgets.filter(id => id !== itemId)
        : importSession.widgets,
      apiEndpoints: itemType === 'api'
        ? importSession.apiEndpoints.filter(id => id !== itemId)
        : importSession.apiEndpoints
    };

    // If import session becomes empty, remove it entirely
    if (updatedImportSession.widgets.length === 0 && updatedImportSession.apiEndpoints.length === 0) {
      const filteredImports = imports.filter(session => session.importId !== importSession.importId);
      localStorage.setItem('finance-dashboard-imports', JSON.stringify(filteredImports));
    } else {
      // Update import session
      const updatedImports = imports.map(session => 
        session.importId === importSession.importId ? updatedImportSession : session
      );
      localStorage.setItem('finance-dashboard-imports', JSON.stringify(updatedImports));
    }

    return {
      success: true,
      importId: importSession.importId
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Checks if an item (widget or API endpoint) is imported
 */
export function isImported(item: Widget | ApiEndpoint): boolean {
  return Boolean(item.isImported);
}

/**
 * Gets all import sessions
 */
export function getAllImportSessions(): ImportedContent[] {
  try {
    return JSON.parse(localStorage.getItem('finance-dashboard-imports') || '[]');
  } catch (error) {
    console.error('Failed to get import sessions:', error);
    return [];
  }
}

/**
 * Gets imported widgets from a specific import session
 */
export function getImportedWidgets(importId?: string): Widget[] {
  try {
    const widgets: Widget[] = JSON.parse(
      localStorage.getItem('finance-dashboard-widgets') || '[]'
    );

    if (importId) {
      const importSession = getImportSession(importId);
      if (!importSession) return [];
      
      return widgets.filter(widget => importSession.widgets.includes(widget.id));
    }

    // Return all imported widgets
    return widgets.filter(widget => widget.isImported);
  } catch (error) {
    console.error('Failed to get imported widgets:', error);
    return [];
  }
}

/**
 * Gets imported API endpoints from a specific import session
 */
export function getImportedApiEndpoints(importId?: string): ApiEndpoint[] {
  try {
    const apiEndpoints: ApiEndpoint[] = JSON.parse(
      localStorage.getItem('finance-dashboard-apis') || '[]'
    );

    if (importId) {
      const importSession = getImportSession(importId);
      if (!importSession) return [];
      
      return apiEndpoints.filter(api => importSession.apiEndpoints.includes(api.id));
    }

    // Return all imported API endpoints
    return apiEndpoints.filter(api => api.isImported);
  } catch (error) {
    console.error('Failed to get imported API endpoints:', error);
    return [];
  }
}

/**
 * Gets import statistics
 */
export function getImportStats(): {
  totalImports: number;
  totalImportedWidgets: number;
  totalImportedApiEndpoints: number;
  recentImports: ImportedContent[];
} {
  try {
    const imports = getAllImportSessions();
    const importedWidgets = getImportedWidgets();
    const importedApiEndpoints = getImportedApiEndpoints();

    // Get recent imports (last 5)
    const recentImports = imports
      .sort((a, b) => new Date(b.importDate).getTime() - new Date(a.importDate).getTime())
      .slice(0, 5);

    return {
      totalImports: imports.length,
      totalImportedWidgets: importedWidgets.length,
      totalImportedApiEndpoints: importedApiEndpoints.length,
      recentImports
    };
  } catch (error) {
    console.error('Failed to get import stats:', error);
    return {
      totalImports: 0,
      totalImportedWidgets: 0,
      totalImportedApiEndpoints: 0,
      recentImports: []
    };
  }
}

/**
 * Searches import sessions by source name
 */
export function searchImportSessions(query: string): ImportedContent[] {
  try {
    const imports = getAllImportSessions();
    const searchTerm = query.toLowerCase();

    return imports.filter(session => 
      session.sourceName.toLowerCase().includes(searchTerm) ||
      session.importId.toLowerCase().includes(searchTerm)
    );
  } catch (error) {
    console.error('Failed to search import sessions:', error);
    return [];
  }
}

/**
 * Cleans up orphaned import sessions (sessions with no associated widgets/APIs)
 */
export function cleanupOrphanedImportSessions(): {
  success: boolean;
  removedSessions: number;
  error?: string;
} {
  try {
    const imports = getAllImportSessions();
    const widgets: Widget[] = JSON.parse(
      localStorage.getItem('finance-dashboard-widgets') || '[]'
    );
    const apiEndpoints: ApiEndpoint[] = JSON.parse(
      localStorage.getItem('finance-dashboard-apis') || '[]'
    );

    const validImports = imports.filter(session => {
      // Check if session has any existing widgets or API endpoints
      const hasWidgets = session.widgets.some(widgetId => 
        widgets.find(w => w.id === widgetId)
      );
      const hasApiEndpoints = session.apiEndpoints.some(apiId => 
        apiEndpoints.find(a => a.id === apiId)
      );

      return hasWidgets || hasApiEndpoints;
    });

    const removedCount = imports.length - validImports.length;

    if (removedCount > 0) {
      localStorage.setItem('finance-dashboard-imports', JSON.stringify(validImports));
    }

    return {
      success: true,
      removedSessions: removedCount
    };
  } catch (error) {
    return {
      success: false,
      removedSessions: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

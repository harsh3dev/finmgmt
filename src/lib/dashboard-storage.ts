"use client";

import type { Widget, ApiEndpoint } from "@/types/widget";
import type { ImportedContent } from "@/types/imported-content";
import { secureStorageService } from "./secure-storage";

// Storage keys
const STORAGE_KEYS = {
  widgets: 'finance-dashboard-widgets',
  apis: 'finance-dashboard-apis',
  imports: 'finance-dashboard-imports'
} as const;

// Custom events for cross-page communication
const STORAGE_EVENTS = {
  widgetsChanged: 'dashboard-widgets-changed',
  apisChanged: 'dashboard-apis-changed',
  importsChanged: 'dashboard-imports-changed'
} as const;

export interface DashboardData {
  widgets: Widget[];
  apiEndpoints: ApiEndpoint[];
  importedContent: ImportedContent[];
}

class DashboardStorageService {
  private listeners: Map<string, Set<() => void>> = new Map();

  constructor() {
    // Listen for storage events from other tabs/windows
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageEvent.bind(this));
    }
  }

  private handleStorageEvent(e: StorageEvent) {
    if (!e.key) return;

    switch (e.key) {
      case STORAGE_KEYS.widgets:
        this.emit(STORAGE_EVENTS.widgetsChanged);
        break;
      case STORAGE_KEYS.apis:
        this.emit(STORAGE_EVENTS.apisChanged);
        break;
      case STORAGE_KEYS.imports:
        this.emit(STORAGE_EVENTS.importsChanged);
        break;
    }
  }

  private emit(eventType: string) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => listener());
    }
    
    // Also dispatch custom event for same-tab communication
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventType));
    }
  }

  // Subscription methods
  subscribe(eventType: string, callback: () => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Also listen for custom events
    if (typeof window !== 'undefined') {
      window.addEventListener(eventType, callback);
    }

    return () => {
      this.listeners.get(eventType)?.delete(callback);
      if (typeof window !== 'undefined') {
        window.removeEventListener(eventType, callback);
      }
    };
  }

  // Widget operations
  async getWidgets(): Promise<Widget[]> {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.widgets);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((widget: Widget) => ({
          ...widget,
          isImported: widget.isImported ?? false
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading widgets:', error);
      return [];
    }
  }

  async saveWidgets(widgets: Widget[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.widgets, JSON.stringify(widgets));
      this.emit(STORAGE_EVENTS.widgetsChanged);
    } catch (error) {
      console.error('Error saving widgets:', error);
      throw error;
    }
  }

  async addWidget(widget: Widget): Promise<void> {
    const widgets = await this.getWidgets();
    const newWidgets = [...widgets, widget];
    await this.saveWidgets(newWidgets);
  }

  async updateWidget(widgetId: string, updates: Partial<Widget>): Promise<void> {
    const widgets = await this.getWidgets();
    const updatedWidgets = widgets.map(widget => 
      widget.id === widgetId 
        ? { ...widget, ...updates, updatedAt: new Date() }
        : widget
    );
    await this.saveWidgets(updatedWidgets);
  }

  async removeWidget(widgetId: string): Promise<void> {
    const widgets = await this.getWidgets();
    const filteredWidgets = widgets.filter(widget => widget.id !== widgetId);
    await this.saveWidgets(filteredWidgets);
  }

  async getUserWidgets(): Promise<Widget[]> {
    const widgets = await this.getWidgets();
    return widgets.filter(w => !w.isImported);
  }

  async getImportedWidgets(): Promise<Widget[]> {
    const widgets = await this.getWidgets();
    return widgets.filter(w => w.isImported);
  }

  // API endpoint operations
  async getApiEndpoints(): Promise<ApiEndpoint[]> {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.apis);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((api: ApiEndpoint) => ({
          ...api,
          isImported: api.isImported ?? false
        }));
      } else {
        // Fallback to secure storage for backwards compatibility
        const secureEndpoints = await secureStorageService.getApiEndpoints();
        if (secureEndpoints.length > 0) {
          await this.saveApiEndpoints(secureEndpoints);
          return secureEndpoints;
        }
      }
      return [];
    } catch (error) {
      console.error('Error loading API endpoints:', error);
      return [];
    }
  }

  async saveApiEndpoints(apiEndpoints: ApiEndpoint[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.apis, JSON.stringify(apiEndpoints));
      // Also save to secure storage for backwards compatibility
      await secureStorageService.saveApiEndpoints(apiEndpoints);
      this.emit(STORAGE_EVENTS.apisChanged);
    } catch (error) {
      console.error('Error saving API endpoints:', error);
      throw error;
    }
  }

  async addApiEndpoint(apiEndpoint: ApiEndpoint): Promise<void> {
    const apiEndpoints = await this.getApiEndpoints();
    const newApiEndpoints = [...apiEndpoints, apiEndpoint];
    await this.saveApiEndpoints(newApiEndpoints);
  }

  async updateApiEndpoint(apiId: string, updates: Partial<ApiEndpoint>): Promise<void> {
    const apiEndpoints = await this.getApiEndpoints();
    const updatedApiEndpoints = apiEndpoints.map(api => 
      api.id === apiId 
        ? { ...api, ...updates, updatedAt: new Date() }
        : api
    );
    await this.saveApiEndpoints(updatedApiEndpoints);
  }

  async removeApiEndpoint(apiId: string): Promise<void> {
    const apiEndpoints = await this.getApiEndpoints();
    const filteredApiEndpoints = apiEndpoints.filter(api => api.id !== apiId);
    await this.saveApiEndpoints(filteredApiEndpoints);
  }

  async getUserApiEndpoints(): Promise<ApiEndpoint[]> {
    const apiEndpoints = await this.getApiEndpoints();
    return apiEndpoints.filter(a => !a.isImported);
  }

  async getImportedApiEndpoints(): Promise<ApiEndpoint[]> {
    const apiEndpoints = await this.getApiEndpoints();
    return apiEndpoints.filter(a => a.isImported);
  }

  // Import operations
  async getImportedContent(): Promise<ImportedContent[]> {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.imports);
      if (saved) {
        return JSON.parse(saved);
      }
      return [];
    } catch (error) {
      console.error('Error loading imported content:', error);
      return [];
    }
  }

  async saveImportedContent(importedContent: ImportedContent[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.imports, JSON.stringify(importedContent));
      this.emit(STORAGE_EVENTS.importsChanged);
    } catch (error) {
      console.error('Error saving imported content:', error);
      throw error;
    }
  }

  async addImportedContent(content: ImportedContent): Promise<void> {
    const importedContent = await this.getImportedContent();
    const newContent = [...importedContent, content];
    await this.saveImportedContent(newContent);
  }

  async removeImportedContent(contentId: string): Promise<void> {
    const importedContent = await this.getImportedContent();
    const filteredContent = importedContent.filter(content => content.importId !== contentId);
    await this.saveImportedContent(filteredContent);
  }

  // Bulk operations
  async getAllData(): Promise<DashboardData> {
    const [widgets, apiEndpoints, importedContent] = await Promise.all([
      this.getWidgets(),
      this.getApiEndpoints(),
      this.getImportedContent()
    ]);

    return {
      widgets,
      apiEndpoints,
      importedContent
    };
  }

  async saveAllData(data: DashboardData): Promise<void> {
    await Promise.all([
      this.saveWidgets(data.widgets),
      this.saveApiEndpoints(data.apiEndpoints),
      this.saveImportedContent(data.importedContent)
    ]);
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.widgets);
    localStorage.removeItem(STORAGE_KEYS.apis);
    localStorage.removeItem(STORAGE_KEYS.imports);
    
    this.emit(STORAGE_EVENTS.widgetsChanged);
    this.emit(STORAGE_EVENTS.apisChanged);
    this.emit(STORAGE_EVENTS.importsChanged);
  }

  // Event constants for external use
  static readonly events = STORAGE_EVENTS;
}

// Export singleton instance
export const dashboardStorage = new DashboardStorageService();

// Helper hook for React components
export function useDashboardStorage() {
  return dashboardStorage;
}

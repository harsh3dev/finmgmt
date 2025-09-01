"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Settings, RefreshCw, Clock, Trash2, AlertTriangle } from "lucide-react";
import { apiService } from "@/lib/api-service";
import { CurrencyValue } from "./currency-value";
import type { Widget, ApiResponse, ApiEndpoint } from "@/types/widget";

interface WidgetGridProps {
  widgets: Widget[];
  apiEndpoints: ApiEndpoint[];
  onConfigureWidget: (widget: Widget) => void;
  onRemoveWidget: (widgetId: string) => void;
}

export function WidgetGrid({ widgets, apiEndpoints, onConfigureWidget, onRemoveWidget }: WidgetGridProps) {
  const [widgetData, setWidgetData] = useState<Record<string, ApiResponse>>({});
  const [refreshTimers, setRefreshTimers] = useState<Record<string, NodeJS.Timeout>>({});
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    widget: Widget | null;
  }>({
    isOpen: false,
    widget: null
  });

  // Fetch data for a specific widget
  const fetchWidgetData = async (widget: Widget) => {
    setWidgetData(prev => ({
      ...prev,
      [widget.id]: { ...prev[widget.id], status: 'loading' }
    }));

    try {
      // Find the API endpoint for this widget
      // First try to find by apiEndpointId (new architecture)
      let endpoint = apiEndpoints.find(api => api.id === widget.apiEndpointId);
      
      if (!endpoint) {
        // Fallback: try to find by URL for backwards compatibility
        endpoint = apiEndpoints.find(api => api.url === widget.apiUrl);
      }
      
      if (!endpoint) {
        throw new Error('API endpoint not found for widget');
      }

      // Use the API service to fetch data
      const response = await apiService.fetchData(endpoint);

      setWidgetData(prev => ({
        ...prev,
        [widget.id]: {
          ...response,
          nextUpdate: response.status === 'success' 
            ? new Date(Date.now() + widget.refreshInterval * 1000)
            : undefined
        }
      }));
    } catch (error) {
      setWidgetData(prev => ({
        ...prev,
        [widget.id]: {
          data: null,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          lastUpdated: new Date()
        }
      }));
    }
  };

  // Set up auto-refresh for widgets
  useEffect(() => {
    // Clear existing timers
    Object.values(refreshTimers).forEach(timer => clearInterval(timer));

    // Set up new timers
    const newTimers: Record<string, NodeJS.Timeout> = {};
    
    widgets.forEach(widget => {
      // Initial fetch
      fetchWidgetData(widget);
      
      // Set up recurring fetch
      const timer = setInterval(() => {
        fetchWidgetData(widget);
      }, widget.refreshInterval * 1000);
      
      newTimers[widget.id] = timer;
    });

    setRefreshTimers(newTimers);

    // Cleanup on unmount or widgets change
    return () => {
      Object.values(newTimers).forEach(timer => clearInterval(timer));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgets]);

  // Manual refresh
  const handleManualRefresh = (widget: Widget) => {
    fetchWidgetData(widget);
  };

  // Handle widget removal with confirmation
  const handleRemoveWidget = (widget: Widget) => {
    setDeleteDialog({
      isOpen: true,
      widget: widget
    });
  };

  const confirmDelete = () => {
    if (deleteDialog.widget) {
      onRemoveWidget(deleteDialog.widget.id);
    }
    setDeleteDialog({
      isOpen: false,
      widget: null
    });
  };

  const cancelDelete = () => {
    setDeleteDialog({
      isOpen: false,
      widget: null
    });
  };

  // Format field value based on widget config
  const formatValue = (value: unknown, widget: Widget, apiData?: unknown): React.ReactNode => {
    // Use CurrencyValue component for currency formatting with real conversion
    if (widget.config.formatSettings.currency) {
      return <CurrencyValue value={value} widget={widget} apiData={apiData} />;
    }
    
    // Simple formatting for non-currency values
    if (value === null || value === undefined || value === '') return 'N/A';
    
    const { formatSettings } = widget.config;
    
    if (typeof value === 'number') {
      let formatted = value;
      
      // Apply decimal places
      if (formatSettings.decimalPlaces !== undefined) {
        formatted = parseFloat(formatted.toFixed(formatSettings.decimalPlaces));
      }
      
      return formatted.toString();
    }
    
    if (typeof value === 'string') {
      // Try to parse string as number for decimal formatting
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue) && formatSettings.decimalPlaces !== undefined) {
        return numericValue.toFixed(formatSettings.decimalPlaces);
      }
      return value;
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    // For objects or arrays, try to extract meaningful values
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        if (value.length === 0) return 'Empty array';
        
        // If array contains primitives, show them as comma-separated
        if (value.every(item => typeof item !== 'object')) {
          return value.slice(0, 3).join(', ') + (value.length > 3 ? '...' : '');
        }
        
        // If array contains objects, try to show first item's meaningful data
        const firstItem = value[0];
        if (firstItem && typeof firstItem === 'object') {
          const keys = Object.keys(firstItem as Record<string, unknown>);
          const firstKey = keys[0];
          if (firstKey) {
            const firstValue = (firstItem as Record<string, unknown>)[firstKey];
            return `${firstValue} (${value.length} items)`;
          }
        }
        
        return `Array (${value.length} items)`;
      }
      
      // For objects, try to show meaningful key-value pairs
      const obj = value as Record<string, unknown>;
      const keys = Object.keys(obj);
      
      if (keys.length === 0) return 'Empty object';
      
      // Show first few key-value pairs
      const pairs = keys.slice(0, 2).map(key => {
        const val = obj[key];
        if (typeof val === 'object') {
          return `${key}: ${Array.isArray(val) ? `Array(${val.length})` : 'Object'}`;
        }
        return `${key}: ${val}`;
      });
      
      return pairs.join(', ') + (keys.length > 2 ? '...' : '');
    }
    
    return String(value);
  };

  // Get field display name
  const getFieldDisplayName = (fieldName: string, widget: Widget): string => {
    return widget.config.fieldMappings[fieldName] || fieldName;
  };

  // Render widget content based on display type
  const renderWidgetContent = (widget: Widget, data: ApiResponse) => {
    if (data.status === 'loading') {
      return (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading...</span>
        </div>
      );
    }

    if (data.status === 'error') {
      return (
        <div className="text-center py-8 text-destructive">
          <p>Error loading data</p>
          <p className="text-sm text-muted-foreground">{data.error}</p>
        </div>
      );
    }

    if (!data.data) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>No data available</p>
        </div>
      );
    }

    // If no fields are selected, show raw data preview
    if (!widget.config || !widget.config.selectedFields || widget.config.selectedFields.length === 0) {
      return (
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">
            This widget needs to be configured to select fields
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onConfigureWidget(widget)}
              className="text-xs"
            >
              Configure Widget
            </Button>
          </div>
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Show raw data preview ({Object.keys(data.data || {}).length} fields)
            </summary>
            <pre className="mt-2 bg-muted p-2 rounded overflow-hidden max-h-32">
              {JSON.stringify(data.data, null, 2).slice(0, 500)}...
            </pre>
          </details>
        </div>
      );
    }

    // Render based on display type
    switch (widget.displayType) {
      case 'card':
        return (
          <div className="space-y-3">
            {widget.config.selectedFields.map(field => {
              const value = getNestedValue(data.data, field);
              const formattedValue = formatValue(value, widget, data.data);
              return (
                <div key={field} className="flex justify-between items-center">
                  <span className="font-medium text-sm">
                    {getFieldDisplayName(field, widget)}:
                  </span>
                  <span className="text-sm">
                    {formattedValue}
                  </span>
                </div>
              );
            })}
          </div>
        );

      case 'table':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Field</th>
                  <th className="text-left p-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {widget.config.selectedFields.map(field => {
                  const value = getNestedValue(data.data, field);
                  const formattedValue = formatValue(value, widget, data.data);
                  return (
                    <tr key={field} className="border-b">
                      <td className="p-2 font-medium">
                        {getFieldDisplayName(field, widget)}
                      </td>
                      <td className="p-2">
                        {formattedValue}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );

      case 'chart':
        return (
          <div className="text-center py-8 text-muted-foreground">
            <p>Chart visualization coming soon</p>
            <p className="text-sm">Selected fields: {widget.config.selectedFields.join(', ')}</p>
          </div>
        );

      default:
        return <div>Unknown display type</div>;
    }
  };

  // Helper function to get nested object value by dot notation
  const getNestedValue = (obj: unknown, path: string): unknown => {
    if (!obj || typeof obj !== 'object') return null;
    
    return path.split('.').reduce((current: unknown, key: string) => {
      if (current === null || current === undefined) return null;
      
      if (typeof current === 'object') {
        if (Array.isArray(current)) {
          // If it's an array, try to get the field from the first item
          if (current.length > 0) {
            const firstItem = current[0];
            if (firstItem && typeof firstItem === 'object') {
              return (firstItem as Record<string, unknown>)[key];
            }
          }
          return null;
        } else {
          // Regular object access
          return (current as Record<string, unknown>)[key];
        }
      }
      
      return null;
    }, obj);
  };

  if (widgets.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {widgets.map(widget => {
        const data = widgetData[widget.id] || { data: null, status: 'loading' };
        
        return (
          <Card key={widget.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{widget.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {widget.displayType} • {widget.refreshInterval}s refresh
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleManualRefresh(widget)}
                    disabled={data.status === 'loading'}
                    title="Refresh widget data"
                  >
                    <RefreshCw className={`h-4 w-4 ${data.status === 'loading' ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onConfigureWidget(widget)}
                    title="Configure widget"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveWidget(widget)}
                    title="Remove widget"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {data.lastUpdated && (
                <div className="flex items-center text-xs text-muted-foreground mt-2">
                  <Clock className="h-3 w-3 mr-1" />
                  Last updated: {data.lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {renderWidgetContent(widget, data)}
            </CardContent>
          </Card>
        );
      })}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.isOpen} onOpenChange={(open) => !open && cancelDelete()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Remove Widget
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the widget &quot;{deleteDialog.widget?.name}&quot;? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, RefreshCw, Clock } from "lucide-react";
import { apiService } from "@/lib/api-service";
import type { Widget, ApiResponse, ApiEndpoint } from "@/types/widget";

interface WidgetGridProps {
  widgets: Widget[];
  apiEndpoints: ApiEndpoint[];
  onConfigureWidget: (widget: Widget) => void;
}

export function WidgetGrid({ widgets, apiEndpoints, onConfigureWidget }: WidgetGridProps) {
  const [widgetData, setWidgetData] = useState<Record<string, ApiResponse>>({});
  const [refreshTimers, setRefreshTimers] = useState<Record<string, NodeJS.Timeout>>({});

  // Fetch data for a specific widget
  const fetchWidgetData = async (widget: Widget) => {
    setWidgetData(prev => ({
      ...prev,
      [widget.id]: { ...prev[widget.id], status: 'loading' }
    }));

    try {
      // Find the API endpoint for this widget
      const endpoint = apiEndpoints.find(api => api.url === widget.apiUrl);
      
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

  // Format field value based on widget config
  const formatValue = (value: unknown, widget: Widget): string => {
    if (value === null || value === undefined) return 'N/A';
    
    const { formatSettings } = widget.config;
    
    if (typeof value === 'number') {
      let formatted = value;
      
      // Apply decimal places
      if (formatSettings.decimalPlaces !== undefined) {
        formatted = parseFloat(formatted.toFixed(formatSettings.decimalPlaces));
      }
      
      // Apply percentage
      if (formatSettings.showPercentage) {
        return `${formatted}%`;
      }
      
      // Apply currency
      if (formatSettings.currency) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: formatSettings.currency,
        }).format(formatted);
      }
      
      return formatted.toString();
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
    if (widget.config.selectedFields.length === 0) {
      return (
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">Configure this widget to select fields</p>
          <pre className="text-xs bg-muted p-2 rounded overflow-hidden">
            {JSON.stringify(data.data, null, 2).slice(0, 200)}...
          </pre>
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
              return (
                <div key={field} className="flex justify-between items-center">
                  <span className="font-medium text-sm">
                    {getFieldDisplayName(field, widget)}:
                  </span>
                  <span className="text-sm">
                    {formatValue(value, widget)}
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
                  return (
                    <tr key={field} className="border-b">
                      <td className="p-2 font-medium">
                        {getFieldDisplayName(field, widget)}
                      </td>
                      <td className="p-2">
                        {formatValue(value, widget)}
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
      if (current && typeof current === 'object' && !Array.isArray(current)) {
        return (current as Record<string, unknown>)[key];
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
                  >
                    <RefreshCw className={`h-4 w-4 ${data.status === 'loading' ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onConfigureWidget(widget)}
                  >
                    <Settings className="h-4 w-4" />
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
    </div>
  );
}

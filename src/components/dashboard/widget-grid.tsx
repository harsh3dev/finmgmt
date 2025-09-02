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
import { SmartWidgetRenderer } from "./smart-widget-renderer";
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
  const [manualRefreshStates, setManualRefreshStates] = useState<Record<string, boolean>>({});
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    widget: Widget | null;
  }>({
    isOpen: false,
    widget: null
  });

  // Fetch data for a specific widget
  const fetchWidgetData = async (widget: Widget, options: { bypassCache?: boolean } = {}) => {
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

      // Use the API service to fetch data with appropriate options
      const response = await apiService.fetchData(endpoint, {
        bypassCache: options.bypassCache,
        timeout: 30000
      });

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
      // Initial fetch (with cache)
      fetchWidgetData(widget, { bypassCache: false });
      
      // Set up recurring fetch (with cache)
      const timer = setInterval(() => {
        fetchWidgetData(widget, { bypassCache: false });
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

  // Manual refresh with cache bypass
  const handleManualRefresh = async (widget: Widget) => {
    // Set manual refresh state
    setManualRefreshStates(prev => ({ ...prev, [widget.id]: true }));
    
    // Set loading state immediately for better UX
    setWidgetData(prev => ({
      ...prev,
      [widget.id]: { ...prev[widget.id], status: 'loading' }
    }));
    
    try {
      // Find the API endpoint for this widget
      let endpoint = apiEndpoints.find(api => api.id === widget.apiEndpointId);
      
      if (!endpoint) {
        // Fallback: try to find by URL for backwards compatibility
        endpoint = apiEndpoints.find(api => api.url === widget.apiUrl);
      }
      
      if (!endpoint) {
        throw new Error('API endpoint not found for widget');
      }

      // Use force refresh to bypass cache and request deduplication
      const response = await apiService.forceRefresh(endpoint);

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
          error: error instanceof Error ? error.message : 'Manual refresh failed',
          lastUpdated: new Date()
        }
      }));
    } finally {
      // Clear manual refresh state after a brief delay to show success
      setTimeout(() => {
        setManualRefreshStates(prev => ({ ...prev, [widget.id]: false }));
      }, 500);
    }
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

  // Render widget content using the smart renderer
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

    // Use the smart widget renderer for all widget content
    return <SmartWidgetRenderer widget={widget} data={data} onConfigureWidget={onConfigureWidget} />;
  };

  if (widgets.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {widgets.map(widget => {
        const data = widgetData[widget.id] || { data: null, status: 'loading' };
        const isManualRefreshing = manualRefreshStates[widget.id] || false;
        const isRefreshing = data.status === 'loading' || isManualRefreshing;
        
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
                    disabled={isRefreshing}
                    title="Refresh widget data"
                    className={isManualRefreshing ? "text-blue-600" : ""}
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
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
                  {isManualRefreshing && (
                    <span className="ml-2 text-blue-600 font-medium">Manual refresh...</span>
                  )}
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

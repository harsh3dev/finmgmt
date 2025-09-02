"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { Settings, RefreshCw, Clock, Trash2, AlertTriangle, Expand, Minimize2, GripVertical } from "lucide-react";
import { apiService } from "@/lib/api-service";
import { SmartWidgetRenderer } from "./smart-widget-renderer";
import type { Widget, ApiResponse, ApiEndpoint } from "@/types/widget";
import { cn } from "@/lib/utils";

function hasMoreContent(widget: Widget, data: ApiResponse): boolean {
  if (!data.data || data.status !== 'success') return false;
  
  if (!widget.config?.selectedFields || widget.config.selectedFields.length === 0) {
    return false;
  }

  if (Array.isArray(data.data)) {
    return data.data.length > 4;
  }

  if (widget.config.selectedFields.length > 4) {
    return true;
  }

  for (const field of widget.config.selectedFields) {
    const value = getNestedValue(data.data, field);
    if (Array.isArray(value) && value.length > 3) {
      return true;
    }
    if (typeof value === 'string' && value.length > 100) {
      return true;
    }
  }

  return false;
}

function getNestedValue(obj: unknown, path: string): unknown {
  if (!obj || !path) return null;
  
  const pathParts = path.split('.');
  let current: unknown = obj;
  
  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i];
    
    if (current === null || current === undefined) return null;
    
    if (Array.isArray(current)) {
      if (part === '[]' || part === '*') {
        continue;
      } else {
        const remainingPath = pathParts.slice(i).join('.');
        const results = current.map(item => {
          if (item && typeof item === 'object') {
            return getNestedValue(item, remainingPath);
          }
          return null;
        }).filter(v => v !== null && v !== undefined);
        
        if (results.length > 0) {
          const firstResult = results[0];
          if (typeof firstResult !== 'object' && results.every(r => r === firstResult)) {
            return firstResult;
          }
          return results;
        }
        return null;
      }
    } else if (typeof current === 'object' && current !== null) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }
  
  return current;
}

interface BentoGridProps {
  widgets: Widget[];
  apiEndpoints: ApiEndpoint[];
  onConfigureWidget: (widget: Widget) => void;
  onRemoveWidget: (widgetId: string) => void;
  onUpdateWidgetOrder: (widgets: Widget[]) => void;
}

interface BentoWidgetProps {
  widget: Widget;
  data: ApiResponse;
  isExpanded: boolean;
  isManualRefreshing: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onManualRefresh: () => void;
  onConfigureWidget: (widget: Widget) => void;
  onRemoveWidget: (widget: Widget) => void;
  isDragging?: boolean;
}

function SortableWidget({
  widget,
  data,
  isExpanded,
  isManualRefreshing,
  onExpand,
  onCollapse,
  onManualRefresh,
  onConfigureWidget,
  onRemoveWidget,
}: BentoWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isRefreshing = data.status === 'loading' || isManualRefreshing;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group transition-all duration-300 ease-in-out",
        "min-w-[350px] w-full h-fit",
        isDragging && "z-50 opacity-50"
      )}
    >
      <Card className={cn(
        "transition-all duration-300 border-2 flex flex-col",
        "border-border hover:border-primary/30",
        "hover:shadow-md min-h-[320px]",
        "h-fit",
        isExpanded && "border-primary/20 shadow-lg"
      )}>
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
            <GripVertical className="h-3 w-3" />
          </Button>
        </div>

        <CardHeader className="pb-3 px-4 pt-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 ml-8">
              <CardTitle className="text-lg truncate flex items-center gap-2">
                {widget.name}
                {widget.isImported && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Imported
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-sm">
                {widget.displayType} • {widget.refreshInterval}s refresh
              </CardDescription>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={onManualRefresh}
                disabled={isRefreshing}
                title="Refresh widget data"
                className={cn(
                  "h-8 w-8 p-0",
                  isManualRefreshing && "text-blue-600"
                )}
              >
                <RefreshCw className={cn(
                  "h-4 w-4",
                  isRefreshing && "animate-spin"
                )} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onConfigureWidget(widget)}
                title="Configure widget"
                className="h-8 w-8 p-0"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemoveWidget(widget)}
                title="Remove widget"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
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
        
        <CardContent className="px-4 pb-4 flex-1 flex flex-col overflow-hidden">
          <div className={cn(
            "flex-1 transition-all duration-300",
            isExpanded ? "overflow-auto" : "overflow-hidden"
          )}>
            <div className={cn(
              "transition-all duration-300",
              isExpanded ? "max-h-none" : "max-h-[200px] overflow-hidden"
            )}>
              {renderWidgetContent(widget, data, onConfigureWidget, !isExpanded)}
            </div>
          </div>
          
          {/* View More / View Less Button */}
          {!isExpanded && hasMoreContent(widget, data) && (
            <div className="flex-shrink-0 pt-3 border-t border-border/30 mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onExpand}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                <Expand className="h-3 w-3 mr-1" />
                View More
              </Button>
            </div>
          )}
          
          {isExpanded && (
            <div className="flex-shrink-0 pt-3 border-t border-border/30 mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onCollapse}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                <Minimize2 className="h-3 w-3 mr-1" />
                View Less
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function renderWidgetContent(
  widget: Widget, 
  data: ApiResponse, 
  onConfigureWidget: (widget: Widget) => void,
  compact: boolean
) {
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

  return (
    <div className={cn(
      "h-full",
      !compact ? "overflow-auto" : "overflow-hidden"
    )}>
      <SmartWidgetRenderer 
        widget={widget} 
        data={data} 
        onConfigureWidget={onConfigureWidget}
        compact={compact}
      />
    </div>
  );
}

export function BentoGrid({ 
  widgets, 
  apiEndpoints, 
  onConfigureWidget, 
  onRemoveWidget, 
  onUpdateWidgetOrder 
}: BentoGridProps) {
  const [widgetData, setWidgetData] = useState<Record<string, ApiResponse>>({});
  const [refreshTimers, setRefreshTimers] = useState<Record<string, NodeJS.Timeout>>({});
  const [manualRefreshStates, setManualRefreshStates] = useState<Record<string, boolean>>({});
  const [expandedWidget, setExpandedWidget] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    widget: Widget | null;
  }>({
    isOpen: false,
    widget: null
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const widgetIds = useMemo(() => widgets.map(widget => widget.id), [widgets]);

  const fetchWidgetData = async (widget: Widget, options: { bypassCache?: boolean } = {}) => {
    setWidgetData(prev => ({
      ...prev,
      [widget.id]: { ...prev[widget.id], status: 'loading' }
    }));

    try {
      let endpoint = apiEndpoints.find(api => api.id === widget.apiEndpointId);
      
      if (!endpoint) {
        endpoint = apiEndpoints.find(api => api.url === widget.apiUrl);
      }
      
      if (!endpoint) {
        throw new Error('API endpoint not found for widget');
      }

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

  useEffect(() => {
    Object.values(refreshTimers).forEach(timer => clearInterval(timer));

    const newTimers: Record<string, NodeJS.Timeout> = {};
    
    widgets.forEach(widget => {
      fetchWidgetData(widget, { bypassCache: false });
      
      const timer = setInterval(() => {
        fetchWidgetData(widget, { bypassCache: false });
      }, widget.refreshInterval * 1000);
      
      newTimers[widget.id] = timer;
    });

    setRefreshTimers(newTimers);

    return () => {
      Object.values(newTimers).forEach(timer => clearInterval(timer));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgets]);

  const handleManualRefresh = async (widget: Widget) => {
    setManualRefreshStates(prev => ({ ...prev, [widget.id]: true }));
    
    setWidgetData(prev => ({
      ...prev,
      [widget.id]: { ...prev[widget.id], status: 'loading' }
    }));
    
    try {
      let endpoint = apiEndpoints.find(api => api.id === widget.apiEndpointId);
      
      if (!endpoint) {
        endpoint = apiEndpoints.find(api => api.url === widget.apiUrl);
      }
      
      if (!endpoint) {
        throw new Error('API endpoint not found for widget');
      }

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
      setTimeout(() => {
        setManualRefreshStates(prev => ({ ...prev, [widget.id]: false }));
      }, 500);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = widgets.findIndex(widget => widget.id === active.id);
      const newIndex = widgets.findIndex(widget => widget.id === over?.id);

      const newWidgets = arrayMove(widgets, oldIndex, newIndex);
      onUpdateWidgetOrder(newWidgets);
    }

    setActiveId(null);
  };

  const handleExpand = (widgetId: string) => {
    setExpandedWidget(widgetId);
  };

  const handleCollapse = () => {
    setExpandedWidget(null);
  };

  const handleRemoveWidget = (widget: Widget) => {
    setDeleteDialog({
      isOpen: true,
      widget: widget
    });
  };

  const confirmDelete = () => {
    if (deleteDialog.widget) {
      onRemoveWidget(deleteDialog.widget.id);
      if (expandedWidget === deleteDialog.widget.id) {
        setExpandedWidget(null);
      }
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

  if (widgets.length === 0) {
    return null;
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={widgetIds} strategy={rectSortingStrategy}>
          <div className={cn(
            "grid gap-4 transition-all duration-300 items-start",
            "grid-cols-1", // Mobile
            "sm:grid-cols-1", // Small
            "md:grid-cols-2", // Medium
            "lg:grid-cols-2", // Large
            "xl:grid-cols-3", // Extra large
            "2xl:grid-cols-4", // 2XL
          )}
          style={{ gridAutoRows: 'min-content' }}>
            {widgets.map(widget => {
              const data = widgetData[widget.id] || { data: null, status: 'loading' };
              const isManualRefreshing = manualRefreshStates[widget.id] || false;
              const isExpanded = expandedWidget === widget.id;
              
              return (
                <SortableWidget
                  key={widget.id}
                  widget={widget}
                  data={data}
                  isExpanded={isExpanded}
                  isManualRefreshing={isManualRefreshing}
                  onExpand={() => handleExpand(widget.id)}
                  onCollapse={handleCollapse}
                  onManualRefresh={() => handleManualRefresh(widget)}
                  onConfigureWidget={onConfigureWidget}
                  onRemoveWidget={handleRemoveWidget}
                />
              );
            })}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId ? (
            <div className="opacity-80">
              {(() => {
                const widget = widgets.find(w => w.id === activeId);
                const data = widgetData[activeId] || { data: null, status: 'loading' };
                
                if (!widget) return null;
                
                return (
                  <Card className="border-2 border-primary/50 shadow-xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{widget.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {widget.displayType} • {widget.refreshInterval}s refresh
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px] overflow-hidden opacity-50">
                        {renderWidgetContent(widget, data, onConfigureWidget, true)}
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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
    </>
  );
}

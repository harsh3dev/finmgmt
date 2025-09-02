import React from "react";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock, GripVertical } from "lucide-react";
import { Widget, ApiResponse } from "@/types/widget";
import { WidgetActions } from "./widget-actions";

interface WidgetHeaderProps {
  widget: Widget;
  data: ApiResponse;
  isRefreshing: boolean;
  isManualRefreshing: boolean;
  onRefresh: () => void;
  onConfigure: () => void;
  onRemove: () => void;
  dragHandleProps?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    attributes: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listeners: any;
  };
}

export function WidgetHeader({
  widget,
  data,
  isRefreshing,
  isManualRefreshing,
  onRefresh,
  onConfigure,
  onRemove,
  dragHandleProps
}: WidgetHeaderProps) {
  return (
    <>
      {/* Drag Handle */}
      {dragHandleProps && (
        <div
          {...dragHandleProps.attributes}
          {...dragHandleProps.listeners}
          className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
            <GripVertical className="h-3 w-3" />
          </Button>
        </div>
      )}

      <CardHeader className="pb-3 px-4 pt-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className={`flex-1 min-w-0 ${dragHandleProps ? 'ml-8' : ''}`}>
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
          <WidgetActions
            isRefreshing={isRefreshing}
            isManualRefreshing={isManualRefreshing}
            onRefresh={onRefresh}
            onConfigure={onConfigure}
            onRemove={onRemove}
          />
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
    </>
  );
}

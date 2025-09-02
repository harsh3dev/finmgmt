import React from "react";
import { Button } from "@/components/ui/button";
import { Settings, RefreshCw, Trash2 } from "lucide-react";
import { Widget } from "@/types/widget";
import { cn } from "@/lib/utils";

interface WidgetActionsProps {
  widget: Widget;
  isRefreshing: boolean;
  isManualRefreshing: boolean;
  onRefresh: () => void;
  onConfigure: () => void;
  onRemove: () => void;
}

export function WidgetActions({
  isRefreshing,
  isManualRefreshing,
  onRefresh,
  onConfigure,
  onRemove
}: Omit<WidgetActionsProps, 'widget'>) {
  return (
    <div className="flex items-center space-x-1">
      <Button
        size="sm"
        variant="ghost"
        onClick={onRefresh}
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
        onClick={onConfigure}
        title="Configure widget"
        className="h-8 w-8 p-0"
      >
        <Settings className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onRemove}
        title="Remove widget"
        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

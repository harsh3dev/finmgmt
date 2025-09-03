import React from "react";
import { Button } from "@/components/ui/button";
import { Settings, RefreshCw, Trash2, ArrowRight } from "lucide-react";
import { Widget } from "@/types/widget";
import { cn } from "@/lib/utils";

interface WidgetActionsProps {
  widget: Widget;
  isRefreshing: boolean;
  isManualRefreshing: boolean;
  onRefresh: () => void;
  onConfigure: () => void;
  onRemove: () => void;
  /** Optional: promote imported widget to regular widget */
  onPromote?: () => void;
}

export function WidgetActions({
  widget,
  isRefreshing,
  isManualRefreshing,
  onRefresh,
  onConfigure,
  onRemove,
  onPromote
}: WidgetActionsProps) {
  return (
    <div className="flex items-center space-x-1">
      {widget.isImported && onPromote && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onPromote}
          title="Move to My Widgets"
          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-500/10"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
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

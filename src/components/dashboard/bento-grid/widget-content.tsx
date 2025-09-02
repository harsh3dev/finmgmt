import React from "react";
import { RefreshCw } from "lucide-react";
import { SmartWidgetRenderer } from "@/components/dashboard/smart-widget-renderer";
import { Widget, ApiResponse } from "@/types/widget";
import { cn } from "@/lib/utils";

interface WidgetContentProps {
  widget: Widget;
  data: ApiResponse;
  onConfigureWidget: (widget: Widget) => void;
  compact?: boolean;
}

export function WidgetContent({
  widget,
  data,
  onConfigureWidget,
  compact = false
}: WidgetContentProps) {
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

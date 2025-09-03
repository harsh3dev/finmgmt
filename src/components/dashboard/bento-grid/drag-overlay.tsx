import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Widget, ApiResponse } from "@/types/widget";
import { formatRefreshInterval } from "@/lib/utils";
import { WidgetContent } from "./widget-content";

interface DragOverlayProps {
  widget: Widget | null;
  data: ApiResponse;
  onConfigureWidget: (widget: Widget) => void;
}

export function DragOverlay({ widget, data, onConfigureWidget }: DragOverlayProps) {
  if (!widget) return null;

  return (
    <div className="opacity-80">
      <Card className="border-2 border-primary/50 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{widget.name}</CardTitle>
          <CardDescription className="text-sm">
            {widget.displayType} • {formatRefreshInterval(widget.refreshInterval)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] overflow-hidden opacity-50">
            <WidgetContent
              widget={widget}
              data={data}
              onConfigureWidget={onConfigureWidget}
              compact={true}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

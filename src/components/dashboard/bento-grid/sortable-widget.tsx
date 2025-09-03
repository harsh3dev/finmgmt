import React from "react";
import { Card } from "@/components/ui/card";
import { Widget, ApiResponse } from "@/types/widget";
import { SortableWrapper } from "./sortable-wrapper";
import { WidgetHeader } from "./widget-header";
import { WidgetContentWrapper } from "./widget-content-wrapper";
import { cn } from "@/lib/utils";

interface SortableWidgetProps {
  widget: Widget;
  data: ApiResponse;
  isExpanded: boolean;
  isManualRefreshing: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onManualRefresh: () => void;
  onConfigureWidget: (widget: Widget) => void;
  onRemoveWidget: (widget: Widget) => void;
  onPromoteWidget?: (widget: Widget) => void;
  wrapperClassName?: string;
}

export function SortableWidget({
  widget,
  data,
  isExpanded,
  isManualRefreshing,
  onExpand,
  onCollapse,
  onManualRefresh,
  onConfigureWidget,
  onRemoveWidget,
  onPromoteWidget,
  wrapperClassName,
}: SortableWidgetProps) {
  const isRefreshing = data.status === 'loading' || isManualRefreshing;

  return (
    <SortableWrapper
      id={widget.id}
      className={cn("min-w-[350px] w-full h-fit", wrapperClassName)}
    >
      {({ dragHandleProps, isDragging }) => (
        <Card className={cn(
          "transition-all duration-300 border-2 flex flex-col",
          "border-border hover:border-primary/30",
          "hover:shadow-md min-h-[320px]",
          "h-fit",
          isExpanded && "border-primary/20 shadow-lg",
          isDragging && "opacity-50"
        )}>
          <WidgetHeader
            widget={widget}
            data={data}
            isRefreshing={isRefreshing}
            isManualRefreshing={isManualRefreshing}
            onRefresh={() => onManualRefresh()}
            onConfigure={() => onConfigureWidget(widget)}
            onRemove={() => onRemoveWidget(widget)}
            onPromote={onPromoteWidget ? () => onPromoteWidget(widget) : undefined}
            dragHandleProps={dragHandleProps}
          />
          
          <WidgetContentWrapper
            widget={widget}
            data={data}
            isExpanded={isExpanded}
            onExpand={onExpand}
            onCollapse={onCollapse}
            onConfigureWidget={onConfigureWidget}
          />
        </Card>
      )}
    </SortableWrapper>
  );
}

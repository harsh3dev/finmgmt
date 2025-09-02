import React from "react";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Expand, Minimize2 } from "lucide-react";
import { Widget, ApiResponse } from "@/types/widget";
import { hasMoreContent } from "@/lib/widget-utils";
import { WidgetContent } from "./widget-content";
import { cn } from "@/lib/utils";

interface WidgetContentWrapperProps {
  widget: Widget;
  data: ApiResponse;
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onConfigureWidget: (widget: Widget) => void;
}

export function WidgetContentWrapper({
  widget,
  data,
  isExpanded,
  onExpand,
  onCollapse,
  onConfigureWidget
}: WidgetContentWrapperProps) {
  const showExpandButton = !isExpanded && hasMoreContent(widget, data);
  
  return (
    <CardContent className="px-4 pb-4 flex-1 flex flex-col overflow-hidden">
      <div className={cn(
        "flex-1 transition-all duration-300",
        isExpanded ? "overflow-auto" : "overflow-hidden"
      )}>
        <div className={cn(
          "transition-all duration-300",
          isExpanded ? "max-h-none" : "max-h-[200px] overflow-hidden"
        )}>
          <WidgetContent
            widget={widget}
            data={data}
            onConfigureWidget={onConfigureWidget}
            compact={!isExpanded}
          />
        </div>
      </div>
      
      {/* View More / View Less Button */}
      {showExpandButton && (
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
  );
}

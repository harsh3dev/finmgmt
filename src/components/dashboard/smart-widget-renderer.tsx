"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { detectDataStructure } from "@/lib/field-analyzer";
import { 
  renderCardView, 
  renderTableView, 
  renderListView, 
  renderChartView 
} from "@/lib/widget-renderer-helpers";
import type { Widget, ApiResponse } from "@/types/widget";

interface SmartWidgetRendererProps {
  widget: Widget;
  data: ApiResponse;
  onConfigureWidget: (widget: Widget) => void;
  compact?: boolean;
}

export function SmartWidgetRenderer({ widget, data, onConfigureWidget, compact = false }: SmartWidgetRendererProps) {
  if (!data.data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No data available</p>
      </div>
    );
  }

  // Detect data structure
  const dataStructure = detectDataStructure(data.data);
  
  // Auto-determine best display type if not configured
  const displayType = widget.displayType || dataStructure.recommendedDisplayType;
  
  // If no fields are selected, show configuration prompt
  if (!widget.config?.selectedFields || widget.config.selectedFields.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">
            This widget needs field configuration
          </p>
          <Badge variant="outline" className="mb-3">
            Detected: {dataStructure.type.replace(/_/g, ' ')}
          </Badge>
          <div className="text-xs text-muted-foreground mb-4">
            Auto-selected display: <strong>{dataStructure.recommendedDisplayType}</strong> view
          </div>
          <button
            onClick={() => onConfigureWidget(widget)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
          >
            Configure Fields
          </button>
        </div>
        
        {/* Show data preview */}
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Preview data structure
          </summary>
          <pre className="mt-2 bg-muted p-2 rounded overflow-auto max-h-32 text-xs">
            {JSON.stringify(data.data, null, 2).slice(0, 500)}...
          </pre>
        </details>
      </div>
    );
  }

  // Render based on display type
  switch (displayType) {
    case 'table':
      return renderTableView(widget, data.data, compact);
    
    case 'list':
      return renderListView(widget, data.data, compact);
    
    case 'chart':
      return renderChartView(widget, data.data, compact);
    
    case 'card':
    default:
      return renderCardView(widget, data.data, compact);
  }
}

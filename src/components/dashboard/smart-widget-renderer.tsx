"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { detectDataStructure } from '@/lib/field-analyzer';
import { 
  renderCardView, 
  renderTableView, 
  renderChartView 
} from '@/lib/widget-renderer-helpers';
import type { Widget, ApiResponse } from '@/types/widget';

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

  // If no fields are selected, show configuration prompt
  if (!widget.config?.selectedFields || widget.config.selectedFields.length === 0) {
    const dataStructure = detectDataStructure(data.data);
    
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
            Widget type: {widget.displayType} view
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
          <summary className="cursor-pointer text-muted-foreground mb-2">
            Preview data structure
          </summary>
          <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-32">
            {JSON.stringify(data.data, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  // Render based on the user-selected display type
  switch (widget.displayType) {
    case 'card':
      // Card: Show simple data like block wise show the data normally whatever user selected
      return renderCardView(widget, data.data, compact);
    
    case 'table':
      // Table: Show array of data in a paginated table with search
      return renderTableView(widget, data.data, compact);
    
    case 'chart':
      // Chart: Show all the numeric data
      // If there is variable data of the numeric then show line chart, else bar chart
      return renderChartView(widget, data.data, compact);
    
    default:
      return renderCardView(widget, data.data, compact);
  }
}

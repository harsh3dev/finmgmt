"use client";

import React from 'react';
import { useTheme } from 'next-themes';
import { LineChartComponent } from './line-chart';
import { BarChartComponent } from './bar-chart';
import { PieChartComponent } from './pie-chart';
import { AreaChartComponent } from './area-chart';
import { ScatterChartComponent } from './scatter-chart';
import { extractNumericData, getChartColors } from '@/lib/chart-utils';
import type { ChartComponentProps, ChartConfig, ChartType } from '@/types/chart';
import type { Widget } from '@/types/widget';

interface ChartContainerProps {
  widget: Widget;
  data: unknown;
  compact?: boolean;
  chartType?: ChartType;
  className?: string;
  // Future: explicit toggle; current minimal heuristic implementation
}

function hasVariableNumericData(data: unknown, fields: string[]): boolean {
  // Extract numeric data for the selected fields
  const numericData = extractNumericData(data, fields);
  
  if (numericData.length < 2) return false;
  
  // Check if values are variable (not all the same)
  const values = numericData.map(item => item.value);
  const firstValue = values[0];
  const hasVariation = values.some(value => Math.abs(value - firstValue) > 0.001);
  
  return hasVariation;
}

export function ChartContainer({ 
  widget, 
  data, 
  compact = false, 
  chartType,
  className = "" 
}: ChartContainerProps) {
  const { theme } = useTheme();
  
  const selected = widget.config?.selectedFields || [];
  let numericData = extractNumericData(data, selected);

  // Heuristic: if only one field selected pointing to an array root (array of objects) without explicit child numeric extraction,
  // attempt to expand first up to 25 numeric keys from objects as series (per-item mode)
  if (numericData.length === 0 && selected.length === 1) {
    const rootVal = selected[0];
    const raw = ((): unknown => {
      // remove [] for probing
      return (rootVal ? (function get(o: unknown, p: string) {
        if (!o) return null;
        const parts = p.replace(/\[\]/g,'').split('.').filter(Boolean);
        let cur: any = o; // eslint-disable-line @typescript-eslint/no-explicit-any
        for (const part of parts) { if (cur == null) return null; cur = cur[part]; }
        return cur;
      })(data, rootVal) : null);
    })();
    if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'object' && raw[0] !== null) {
      const firstObj = raw.find(r => r && typeof r === 'object') as Record<string, unknown> | undefined;
      if (firstObj) {
        const candidateKeys = Object.keys(firstObj).filter(k => {
          const v = firstObj[k];
            if (typeof v === 'number') return true;
            if (typeof v === 'string') return !isNaN(parseFloat(v.replace(/,/g, '')));
            return false;
        }).slice(0, 5); // limit series count
        if (candidateKeys.length) {
          // Build per-key average or just first snapshot? We'll map each item for one key; treat each item as data point with name index
          numericData = candidateKeys.flatMap(key => {
            return raw.map((obj, idx) => {
              if (obj && typeof obj === 'object') {
                const rawVal = (obj as Record<string, unknown>)[key];
                let num: number | null = null;
                if (typeof rawVal === 'number') num = rawVal;
                else if (typeof rawVal === 'string') {
                  const parsed = parseFloat(rawVal.replace(/,/g, ''));
                  if (!isNaN(parsed)) num = parsed;
                }
                if (num !== null) {
                  return { name: `${key} #${idx+1}`, value: num, field: `${rootVal}[].${key}` };
                }
              }
              return null;
            }).filter(Boolean) as { name:string; value:number; field:string }[];
          });
        }
      }
    }
  }
  
  console.log('Chart Debug:', {
    data,
    selectedFields: widget.config?.selectedFields,
    numericData,
    dataType: typeof data,
    isArray: Array.isArray(data)
  });
  
  // If no numeric data, show error
  if (numericData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <h3 className="font-medium mb-2">No Numeric Data</h3>
        <p className="text-sm mb-4">Charts require numeric data fields to display.</p>
        <div className="text-xs bg-muted p-3 rounded">
          <p><strong>Selected fields:</strong> {widget.config?.selectedFields?.join(', ') || 'None'}</p>
          <p className="mt-1"><strong>Tip:</strong> Select fields containing numbers to enable chart visualization.</p>
        </div>
      </div>
    );
  }
  
  // Determine chart type based on your requirements:
  // If there is variable data of the numeric then show line chart, else bar chart
  let finalChartType: ChartType = chartType || 'bar'; // Default to bar chart
  
  if (!chartType) {
    const hasVariation = hasVariableNumericData(data, widget.config?.selectedFields || []);
    finalChartType = hasVariation ? 'line' : 'bar';
  }
  
  // Use simple chart data format
  const simpleChartData = numericData.map(item => ({
    name: item.name,
    value: item.value
  }));
  
  // Create chart configuration
  const chartConfig: ChartConfig = {
    xAxis: 'name',
    yAxis: 'value',
    theme: theme === 'dark' ? 'dark' : 'light',
    showLegend: !compact && numericData.length > 1,
    animations: true,
    colors: getChartColors(theme === 'dark' ? 'dark' : 'light')
  };

  const commonProps: ChartComponentProps = {
    data: simpleChartData,
    config: chartConfig,
    compact,
    className
  };

  // Render appropriate chart component based on determined type
  switch (finalChartType) {
    case 'line':
      return <LineChartComponent {...commonProps} />;

    case 'bar':
      return <BarChartComponent {...commonProps} />;

    case 'pie':
      return <PieChartComponent {...commonProps} />;

    case 'area':
      return <AreaChartComponent {...commonProps} />;

    case 'scatter':
      return <ScatterChartComponent {...commonProps} />;

    default:
      return <BarChartComponent {...commonProps} />;
  }
}

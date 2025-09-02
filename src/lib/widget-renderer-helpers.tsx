import React from "react";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  CheckCircle, 
  XCircle,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Hash,
  Type,
  List
} from "lucide-react";
import type { Widget } from "@/types/widget";

/**
 * Helper function to get nested object value by dot notation with array support
 */
export const getNestedValue = (obj: unknown, path: string): unknown => {
  if (!obj || !path) return null;
  
  const pathParts = path.split('.');
  let current: unknown = obj;
  
  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i];
    
    if (current === null || current === undefined) return null;
    
    if (Array.isArray(current)) {
      // Handle array access patterns
      if (part === '[]' || part === '*') {
        // Skip this part and continue with the array
        continue;
      } else {
        // We're accessing a property from array items
        // Get the remaining path after this part
        const remainingPath = pathParts.slice(i).join('.');
        
        // Map over array items and recursively get the value
        const results = current.map(item => {
          if (item && typeof item === 'object') {
            return getNestedValue(item, remainingPath);
          }
          return null;
        }).filter(v => v !== null && v !== undefined);
        
        // If all results are the same primitive value, return the first one
        // Otherwise return the array of results
        if (results.length > 0) {
          const firstResult = results[0];
          if (typeof firstResult !== 'object' && results.every(r => r === firstResult)) {
            return firstResult;
          }
          return results;
        }
        return null;
      }
    } else if (typeof current === 'object' && current !== null) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }
  
  return current;
};

/**
 * Format values with smart type detection
 */
export const formatSmartValue = (value: unknown): React.ReactNode => {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground italic">N/A</span>;
  }

  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground italic">Empty array</span>;
    }

    // Show array summary based on content type
    const firstItem = value[0];
    
    if (typeof firstItem === 'number') {
      const numbers = value.filter(v => typeof v === 'number') as number[];
      const sum = numbers.reduce((a, b) => a + b, 0);
      const avg = sum / numbers.length;
      const max = Math.max(...numbers);
      const min = Math.min(...numbers);
      
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Hash className="h-3 w-3 text-blue-500" />
            <span className="text-xs text-muted-foreground">{numbers.length} values</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>Avg: <strong>{avg.toFixed(2)}</strong></div>
            <div>Sum: <strong>{sum.toFixed(2)}</strong></div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <strong>{max}</strong>
            </div>
            <div className="flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-500" />
              <strong>{min}</strong>
            </div>
          </div>
        </div>
      );
    }

    if (typeof firstItem === 'string') {
      const preview = value.slice(0, 3).join(', ');
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Type className="h-3 w-3 text-gray-500" />
            <span className="text-xs text-muted-foreground">{value.length} items</span>
          </div>
          <div className="text-sm">
            {preview}{value.length > 3 ? '...' : ''}
          </div>
        </div>
      );
    }

    // Array of objects
    if (typeof firstItem === 'object' && firstItem !== null) {
      const keys = Object.keys(firstItem as Record<string, unknown>);
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <List className="h-3 w-3 text-purple-500" />
            <span className="text-xs text-muted-foreground">{value.length} objects</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Fields: {keys.slice(0, 3).join(', ')}{keys.length > 3 ? '...' : ''}
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <List className="h-3 w-3" />
        <span>{value.length} items</span>
      </div>
    );
  }

  // Handle different data types
  if (typeof value === 'number') {
    // Auto-detect financial data patterns
    const isFinancial = value > 0 && (value < 1 || value > 100 || value.toString().includes('.'));
    const isPercentage = value >= 0 && value <= 1;
    
    if (isPercentage && value < 1) {
      return (
        <div className="flex items-center gap-2">
          <BarChart3 className="h-3 w-3 text-blue-500" />
          <strong>{(value * 100).toFixed(2)}%</strong>
        </div>
      );
    }

    if (isFinancial) {
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
      
      return (
        <div className="flex items-center gap-2">
          <Hash className="h-3 w-3 text-green-500" />
          <strong>{formatted}</strong>
        </div>
      );
    }

    // Regular number formatting
    const formatted = value.toLocaleString();
    return (
      <div className="flex items-center gap-2">
        <Hash className="h-3 w-3 text-blue-500" />
        <strong>{formatted}</strong>
      </div>
    );
  }

  if (typeof value === 'boolean') {
    return (
      <div className="flex items-center gap-2">
        {value ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-green-700 dark:text-green-400">True</span>
          </>
        ) : (
          <>
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-red-700 dark:text-red-400">False</span>
          </>
        )}
      </div>
    );
  }

  if (typeof value === 'string') {
    // Auto-detect date strings
    const dateRegex = /^\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4}/;
    if (dateRegex.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-blue-500" />
            <span>{date.toLocaleDateString()}</span>
          </div>
        );
      }
    }

    // Auto-detect URLs
    const urlRegex = /^https?:\/\//;
    if (urlRegex.test(value)) {
      return (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline truncate max-w-xs"
        >
          {value}
        </a>
      );
    }

    // Regular string
    return <span className="break-words">{value}</span>;
  }

  // Handle objects
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    
    if (keys.length === 0) {
      return <span className="text-muted-foreground italic">Empty object</span>;
    }

    // Show first few key-value pairs
    const pairs = keys.slice(0, 3).map(key => {
      const val = obj[key];
      let displayVal: string;
      
      if (Array.isArray(val)) {
        displayVal = `Array(${val.length})`;
      } else if (typeof val === 'object' && val !== null) {
        displayVal = 'Object';
      } else {
        displayVal = String(val);
      }
      
      return `${key}: ${displayVal}`;
    });

    return (
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">{keys.length} properties</div>
        <div className="text-sm space-y-1">
          {pairs.map((pair, idx) => (
            <div key={idx} className="truncate">{pair}</div>
          ))}
          {keys.length > 3 && (
            <div className="text-xs text-muted-foreground">...</div>
          )}
        </div>
      </div>
    );
  }

  return <span>{String(value)}</span>;
};

/**
 * Render single object as card view
 */
export const renderCardView = (
  widget: Widget, 
  data: unknown,
  compact = false
): React.ReactNode => {
  if (!widget.config?.selectedFields || widget.config.selectedFields.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <p className="text-sm">No fields selected</p>
      </div>
    );
  }

  const fieldsToShow = compact ? widget.config.selectedFields.slice(0, 4) : widget.config.selectedFields;

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {!compact && widget.config.selectedFields.length > 4 && (
        <div className="text-xs text-muted-foreground mb-3 pb-2 border-b border-border/20">
          Showing all {widget.config.selectedFields.length} fields
        </div>
      )}
      {fieldsToShow.map(field => {
        const value = getNestedValue(data, field);
        const displayName = widget.config.fieldMappings[field] || field.split('.').pop() || field;
        
        return (
          <div key={field} className={compact ? "space-y-1" : "space-y-2"}>
            <div className="flex items-center justify-between">
              <label className={`font-medium text-muted-foreground ${compact ? "text-xs" : "text-sm"}`}>
                {displayName}
              </label>
            </div>
            <div className="pl-1">
              <div className={compact ? "text-sm" : ""}>
                {formatSmartValue(value)}
              </div>
            </div>
          </div>
        );
      })}
      {compact && widget.config.selectedFields.length > 4 && (
        <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border/20">
          +{widget.config.selectedFields.length - 4} more fields
        </div>
      )}
    </div>
  );
};

/**
 * Render array of objects as table view
 */
export const renderTableView = (
  widget: Widget, 
  data: unknown,
  compact = false
): React.ReactNode => {
  if (!Array.isArray(data)) {
    return renderCardView(widget, data, compact);
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No data available</p>
      </div>
    );
  }

  const firstItem = data[0];
  if (typeof firstItem !== 'object' || firstItem === null) {
    // Array of primitives - render as list
    return renderListView(widget, data, compact);
  }

  const headers = Object.keys(firstItem as Record<string, unknown>);
  const displayHeaders = headers.slice(0, compact ? 4 : 6); // Limit columns for readability
  const maxRows = compact ? 4 : 10; // Limit rows for performance

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">
          Table View • {data.length} rows
        </Badge>
        {data.length > maxRows && (
          <span className="text-xs text-muted-foreground">
            Showing {maxRows} of {data.length} rows
          </span>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {displayHeaders.map(header => (
                <th key={header} className={`text-left p-2 font-medium tracking-wide ${compact ? "text-xs px-1" : "text-xs uppercase px-2"}`}>
                  {header.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, maxRows).map((item, index) => {
              const obj = item as Record<string, unknown>;
              return (
                <tr key={index} className="border-b border-border/50 hover:bg-accent/50">
                  {displayHeaders.map(header => (
                    <td key={header} className={`${compact ? "p-1 max-w-16" : "p-2 max-w-20"}`}>
                      <div className="truncate text-xs">
                        {formatSmartValue(obj[header])}
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {compact && (headers.length > 4 || data.length > maxRows) && (
        <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border/20">
          {headers.length > 4 && `+${headers.length - 4} more columns`}
          {headers.length > 4 && data.length > maxRows && " • "}
          {data.length > maxRows && `+${data.length - maxRows} more rows`}
        </div>
      )}
    </div>
  );
};

/**
 * Render array of primitives as list view
 */
export const renderListView = (
  widget: Widget, 
  data: unknown,
  compact = false
): React.ReactNode => {
  if (!Array.isArray(data)) {
    return renderCardView(widget, data, compact);
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No items available</p>
      </div>
    );
  }

  const maxItems = compact ? 4 : 12;
  const itemType = typeof data[0];
  
  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">
          List View • {data.length} items ({itemType})
        </Badge>
        {data.length > maxItems && (
          <span className="text-xs text-muted-foreground">
            Showing {maxItems} of {data.length} items
          </span>
        )}
      </div>
      
      <div className={`space-y-1 overflow-y-auto ${compact ? "max-h-32" : "max-h-48"}`}>
        {data.slice(0, maxItems).map((item, index) => (
          <div 
            key={index} 
            className={`p-2 rounded border border-border/50 bg-accent/20 ${compact ? "text-xs p-1" : "text-sm p-2"}`}
          >
            <div className="truncate">
              {formatSmartValue(item)}
            </div>
          </div>
        ))}
      </div>
      {compact && data.length > maxItems && (
        <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border/20">
          +{data.length - maxItems} more items
        </div>
      )}
    </div>
  );
};

/**
 * Render chart placeholder with detected numeric fields
 */
export const renderChartView = (
  widget: Widget, 
  data: unknown,
  compact = false
): React.ReactNode => {
  const numericFields: Array<{ field: string; values: number[]; }> = [];
  
  if (widget.config?.selectedFields) {
    widget.config.selectedFields.forEach(field => {
      const value = getNestedValue(data, field);
      
      if (Array.isArray(value)) {
        const numbers = value.filter(v => typeof v === 'number') as number[];
        if (numbers.length > 0) {
          numericFields.push({ field, values: numbers });
        }
      } else if (typeof value === 'number') {
        numericFields.push({ field, values: [value] });
      }
    });
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-4"}>
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">
          Chart View • {numericFields.length} numeric fields detected
        </Badge>
      </div>
      
      {numericFields.length > 0 ? (
        <div className={compact ? "space-y-2" : "space-y-4"}>
          {(compact ? numericFields.slice(0, 2) : numericFields).map(({ field, values }) => {
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            const max = Math.max(...values);
            const min = Math.min(...values);
            
            return (
              <div key={field} className={compact ? "space-y-1" : "space-y-2"}>
                <h4 className={`font-medium ${compact ? "text-xs" : "text-sm"}`}>
                  {widget.config.fieldMappings[field] || field}
                </h4>
                <div className={`grid grid-cols-3 gap-2 text-center ${compact ? "text-xs" : ""}`}>
                  <div className={`p-2 rounded bg-blue-50 dark:bg-blue-900/20 ${compact ? "p-1" : "p-3"}`}>
                    <div className={`font-bold text-blue-600 ${compact ? "text-sm" : "text-2xl"}`}>{avg.toFixed(2)}</div>
                    <div className="text-xs text-blue-600/70">Average</div>
                  </div>
                  <div className={`p-2 rounded bg-green-50 dark:bg-green-900/20 ${compact ? "p-1" : "p-3"}`}>
                    <div className={`font-bold text-green-600 ${compact ? "text-sm" : "text-2xl"}`}>{max}</div>
                    <div className="text-xs text-green-600/70">Maximum</div>
                  </div>
                  <div className={`p-2 rounded bg-red-50 dark:bg-red-900/20 ${compact ? "p-1" : "p-3"}`}>
                    <div className={`font-bold text-red-600 ${compact ? "text-sm" : "text-2xl"}`}>{min}</div>
                    <div className="text-xs text-red-600/70">Minimum</div>
                  </div>
                </div>
                {values.length > 1 && (
                  <div className="text-xs text-muted-foreground text-center">
                    Based on {values.length} values
                  </div>
                )}
              </div>
            );
          })}
          
          {compact && numericFields.length > 2 && (
            <div className="text-xs text-muted-foreground text-center">
              +{numericFields.length - 2} more fields
            </div>
          )}
          
          {!compact && (
            <div className="mt-4 p-3 bg-accent/20 rounded-lg text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Interactive charts coming soon
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <BarChart3 className={`mx-auto mb-2 ${compact ? "h-6 w-6" : "h-8 w-8"}`} />
          <p className="text-sm">No numeric fields available for charting</p>
          <p className="text-xs mt-1">Select numeric fields to enable chart view</p>
        </div>
      )}
    </div>
  );
};

import React from "react";
import { Badge } from "@/components/ui/badge";
import { ChartContainer } from "@/components/ui/charts";
import { DataTable } from "@/components/ui/data-table";
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

export const getNestedValue = (obj: unknown, path: string): unknown => {
  if (!obj || !path) return null;
  
  let current: unknown = obj;
  const pathParts = path.split('.');
  
  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i];
    
    if (current === null || current === undefined) return null;
    
    if (Array.isArray(current)) {
      if (/^\d+$/.test(part)) {
        const index = parseInt(part, 10);
        if (index >= 0 && index < current.length) {
          current = current[index];
          continue;
        } else {
          return null;
        }
      }
      
      if (part === '[]' || part === '*') {
        continue;
      } 
      
      const remainingPath = pathParts.slice(i).join('.');
      const results = current.map(item => {
        if (item && typeof item === 'object') {
          return getNestedValue(item, remainingPath);
        }
        return null;
      }).filter(v => v !== null && v !== undefined);
      
      if (results.length > 0) {
        const firstResult = results[0];
        if (typeof firstResult !== 'object' && results.every(r => r === firstResult)) {
          return firstResult;
        }
        return results;
      }
      return null;
    } else if (typeof current === 'object' && current !== null) {
      const currentObj = current as Record<string, unknown>;
      
      if (part in currentObj) {
        current = currentObj[part];
      } else {
        let found = false;
        for (let j = i; j < pathParts.length; j++) {
          const compoundKey = pathParts.slice(i, j + 1).join('.');
          if (compoundKey in currentObj) {
            current = currentObj[compoundKey];
            i = j;
            found = true;
            break;
          }
        }
        
        if (!found) {
          return null;
        }
      }
    } else {
      return null;
    }
  }
  
  return current;
};

export const formatSmartValue = (value: unknown): React.ReactNode => {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground italic">N/A</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground italic">Empty array</span>;
    }

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

  if (typeof value === 'number') {
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

    return <span className="break-words">{value}</span>;
  }

  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    
    if (keys.length === 0) {
      return <span className="text-muted-foreground italic">Empty object</span>;
    }

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

export const renderTableView = (
  widget: Widget, 
  data: unknown,
  compact = false
): React.ReactNode => {
  const selectedFields = widget.config?.selectedFields || [];

  const headerLabel = (field: string): string => {
    // Remove array markers and take last meaningful segment
    const cleaned = field.replace(/\[\]/g, '');
    const parts = cleaned.split('.')
      .filter(p => p && p !== 'root');
    return (widget.config.fieldMappings[field] || parts[parts.length - 1] || field)
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  };

  const normalizePathForLookup = (path: string): string => path.replace(/\[\]/g, '');

  // If user has explicitly selected fields, build a table from those fields regardless of raw shape
  if (selectedFields.length > 0) {
    const buildSingleRow = (): Record<string, unknown> => {
      const row: Record<string, unknown> = {};
      selectedFields.forEach(field => {
        const normalized = normalizePathForLookup(field);
        row[field] = getNestedValue(data, normalized);
      });
      return row;
    };

    // Detect if selected fields all point into (the same) array within an object response
    if (!Array.isArray(data) && selectedFields.every(f => f.includes('[].'))) {
      const groups: Record<string, string[]> = {};
      selectedFields.forEach(f => {
        const base = f.split('[].')[0];
        groups[base] = groups[base] || [];
        groups[base].push(f);
      });
      // Pick the largest group (most fields referencing same array)
      const basePath = Object.keys(groups).sort((a,b) => groups[b].length - groups[a].length)[0];
      const arrayValue = getNestedValue(data, normalizePathForLookup(basePath));
      if (Array.isArray(arrayValue) && arrayValue.length > 0) {
        const fieldsInGroup = groups[basePath];
        const rows = arrayValue.map(item => {
          const row: Record<string, unknown> = {};
            fieldsInGroup.forEach(f => {
              const relative = f.split('[].').slice(1).join('[].');
              const relPath = normalizePathForLookup(relative);
              row[f] = getNestedValue(item, relPath);
            });
          return row;
        });
        const columns = fieldsInGroup.map(field => ({
          key: field,
          header: headerLabel(field),
          sortable: true
        }));
        return (
          <DataTable
            data={rows}
            columns={columns}
            searchable={!compact}
            sortable={true}
            paginated={!compact}
            pageSize={compact ? 5 : 10}
            exportable={!compact && rows.length > 0}
            compact={compact}
          />
        );
      }
    }

    // Case A: data is an array & all selected fields reference array items via '[].'
  if (Array.isArray(data) && data.length > 0 && selectedFields.every(f => f.includes('[].'))) {
      // Derive per-element rows by stripping the prefix up to and including the first '[].'
      const rows = (data as unknown[]).map(item => {
        const row: Record<string, unknown> = {};
        selectedFields.forEach(field => {
          const relative = field.split('[].').slice(1).join('[].'); // support nested multiple '[].'
      const relPath = normalizePathForLookup(relative || field);
      row[field] = getNestedValue(item, relPath);
        });
        return row;
      });

      // Provide custom columns so headers are user friendly
      const columns = selectedFields.map(field => ({
        key: field,
        header: headerLabel(field),
        sortable: true
      }));

      return (
        <DataTable
          data={rows}
          columns={columns}
          searchable={!compact}
          sortable={true}
          paginated={!compact}
          pageSize={compact ? 5 : 10}
          exportable={!compact && rows.length > 0}
          compact={compact}
        />
      );
    }

    // Case B: Show a single synthetic row with selected field values (works for any structure)
    const singleRow = buildSingleRow();
    const dataRows = [singleRow];
    const columns = selectedFields.map(field => ({
      key: field,
      header: headerLabel(field),
      sortable: true
    }));

    return (
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">
          Showing selected fields as a single row (no iterable array detected). Select an array field (with [] markers) for multi-row tables.
        </div>
        <DataTable
          data={dataRows}
          columns={columns}
          searchable={false}
          sortable={true}
          paginated={false}
          pageSize={1}
          exportable={false}
          compact={compact}
        />
      </div>
    );
  }

  // Legacy path: no selected fields -> behave as before (only works if raw data is an array)
  if (!Array.isArray(data)) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        <p>Select fields to visualize this data as a table.</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <DataTable
      data={data}
  searchable={!compact}
      sortable={true}
  paginated={!compact}
      pageSize={compact ? 5 : 10}
      exportable={!compact && data.length > 0}
      compact={compact}
    />
  );
};

export const renderListView = (
  widget: Widget, 
  data: unknown,
  compact = false
): React.ReactNode => {
  // List view is no longer used - redirecting to table view for arrays
  return renderTableView(widget, data, compact);
};

export const renderChartView = (
  widget: Widget, 
  data: unknown,
  compact = false
): React.ReactNode => {
  // Use the new ChartContainer component
  return (
    <div className={compact ? "space-y-2" : "space-y-4"}>
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">
          Chart View • Interactive visualization
        </Badge>
      </div>
      
      <ChartContainer 
        widget={widget}
        data={data}
        compact={compact}
      />
    </div>
  );
};

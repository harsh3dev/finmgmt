import { Widget, ApiResponse } from "@/types/widget";

/**
 * Utility functions for widget operations
 */

export function hasMoreContent(widget: Widget, data: ApiResponse): boolean {
  if (!data.data || data.status !== 'success') return false;
  
  if (!widget.config?.selectedFields || widget.config.selectedFields.length === 0) {
    return false;
  }

  if (Array.isArray(data.data)) {
    return data.data.length > 4;
  }

  if (widget.config.selectedFields.length > 4) {
    return true;
  }

  for (const field of widget.config.selectedFields) {
    const value = getNestedValue(data.data, field);
    if (Array.isArray(value) && value.length > 3) {
      return true;
    }
    if (typeof value === 'string' && value.length > 100) {
      return true;
    }
  }

  return false;
}

export function getNestedValue(obj: unknown, path: string): unknown {
  if (!obj || !path) return null;
  
  const pathParts = path.split('.');
  let current: unknown = obj;
  
  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i];
    
    if (current === null || current === undefined) return null;
    
    if (Array.isArray(current)) {
      if (part === '[]' || part === '*') {
        continue;
      } else {
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
      }
    } else if (typeof current === 'object' && current !== null) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }
  
  return current;
}

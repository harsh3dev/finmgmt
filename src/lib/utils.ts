import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract field paths from API response data for field selection
 */
export function extractFieldsFromData(data: Record<string, unknown> | unknown[] | null): string[] {
  if (!data) return [];
  
  const fields: string[] = [];
  
  const extractFields = (obj: unknown, prefix = ""): void => {
    if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
      const record = obj as Record<string, unknown>;
      Object.keys(record).forEach(key => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        fields.push(fullKey);
        
        // Don't go too deep into nested objects (max 2 levels)
        if (typeof record[key] === "object" && record[key] !== null && !Array.isArray(record[key]) && !prefix.includes('.')) {
          extractFields(record[key], fullKey);
        }
      });
    } else if (Array.isArray(obj) && obj.length > 0) {
      extractFields(obj[0], prefix);
    }
  };
  
  extractFields(data);
  return fields;
}

/**
 * Get field value from data using dot notation path
 */
export function getFieldValue(data: Record<string, unknown> | unknown[] | null, fieldPath: string): unknown {
  if (!data) return null;
  
  const pathParts = fieldPath.split('.');
  let current: unknown = data;
  
  for (const part of pathParts) {
    if (typeof current === 'object' && current !== null && !Array.isArray(current)) {
      current = (current as Record<string, unknown>)[part];
    } else if (Array.isArray(current) && current.length > 0) {
      current = current[0];
      if (typeof current === 'object' && current !== null) {
        current = (current as Record<string, unknown>)[part];
      }
    } else {
      return null;
    }
  }
  
  return current;
}

/**
 * Format field value for display in UI
 */
export function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value.toString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Auto-generate display name from field name
 */
export function generateDisplayName(fieldName: string): string {
  return fieldName
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get meaningful fields by filtering out common system fields
 */
export function getMeaningfulFields(fields: string[], limit = 3): string[] {
  return fields
    .filter(field => 
      !field.includes('.') && 
      !['id', 'timestamp', 'updated_at', 'created_at', '_id', '__v'].includes(field.toLowerCase())
    )
    .slice(0, limit);
}

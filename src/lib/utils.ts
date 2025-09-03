import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { analyzeApiResponse, generateFieldOptions, processFieldSelection } from "./field-analyzer"
import type { FieldMetadata, FieldOption } from "@/types/field-metadata"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractFieldsFromData(data: Record<string, unknown> | unknown[] | null): string[] {
  if (!data) return [];
  
  const metadata = analyzeApiResponse(data);
  return metadata
    .filter(meta => meta.type === 'simple' || meta.type === 'array')
    .map(meta => meta.path);
}

export function getFieldOptions(data: Record<string, unknown> | unknown[] | null): FieldOption[] {
  if (!data) return [];
  
  const metadata = analyzeApiResponse(data);
  return generateFieldOptions(metadata);
}

export function getFieldMetadata(data: Record<string, unknown> | unknown[] | null, fieldPath: string): FieldMetadata | null {
  if (!data) return null;
  
  const metadata = analyzeApiResponse(data);
  return metadata.find(meta => meta.path === fieldPath) || null;
}

export function getFieldValue(data: Record<string, unknown> | unknown[] | null, fieldPath: string): unknown {
  if (!data) return null;
  
  const pathParts = fieldPath.split('.');
  let current: unknown = data;
  
  for (const part of pathParts) {
    if (typeof current === 'object' && current !== null && !Array.isArray(current)) {
      current = (current as Record<string, unknown>)[part];
    } else if (Array.isArray(current) && current.length > 0) {
      const firstItem = current[0];
      if (typeof firstItem === 'object' && firstItem !== null) {
        current = (firstItem as Record<string, unknown>)[part];
      } else {
        return null;
      }
    } else {
      return null;
    }
  }
  
  return current;
}

export function formatFieldValue(value: unknown, aggregationType?: string): string {
  if (value === null || value === undefined) return 'N/A';
  
  if (Array.isArray(value)) {
    if (value.length === 0) return 'Empty array';
    
    if (aggregationType) {
      const processed = processFieldSelection(value, '', aggregationType);
      return processed.displayValue;
    }
    
    if (value.every(item => typeof item !== 'object')) {
      const preview = value.slice(0, 3).map(item => String(item));
      return preview.join(', ') + (value.length > 3 ? `... (${value.length} total)` : '');
    } else {
      return `Array of ${value.length} objects`;
    }
  }
  
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value.toString();
  
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    
    if (keys.length === 0) return 'Empty object';
    
    const pairs = keys.slice(0, 2).map(key => {
      const val = obj[key];
      if (typeof val === 'object') {
        return `${key}: ${Array.isArray(val) ? `Array(${val.length})` : 'Object'}`;
      }
      return `${key}: ${val}`;
    });
    
    return pairs.join(', ') + (keys.length > 2 ? '...' : '');
  }
  
  return String(value);
}

export function formatValueForWidget(
  value: unknown, 
  fieldPath: string, 
  aggregationType?: string
): string {
  const processed = processFieldSelection(value, fieldPath, aggregationType);
  return processed.displayValue;
}

export function generateDisplayName(fieldName: string): string {
  return fieldName
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getMeaningfulFields(fields: string[], limit = 8): string[] {
  return fields
    .filter(field => {
      const fieldLower = field.toLowerCase();
      const isSystemField = ['_id', '__v', 'updated_at', 'created_at'].some(sys => 
        fieldLower.includes(sys)
      );
      const isTimestampField = (fieldLower.includes('timestamp') || fieldLower.includes('date') || fieldLower.includes('time')) 
        && !field.includes('[]');
      
      return !isSystemField && !isTimestampField;
    })
    .slice(0, limit);
}

export function formatRefreshInterval(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s refresh`;
  } else if (seconds < 3600) {
    const minutes = Math.round(seconds / 60);
    return `${minutes}min refresh`;
  } else {
    const hours = Math.round(seconds / 3600);
    return `${hours}h refresh`;
  }
}

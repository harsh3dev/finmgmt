import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { analyzeApiResponse, generateFieldOptions, processFieldSelection } from "./field-analyzer"
import type { FieldMetadata, FieldOption } from "@/types/field-metadata"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract field paths from API response data for field selection
 * Enhanced version that supports complex nested structures
 */
export function extractFieldsFromData(data: Record<string, unknown> | unknown[] | null): string[] {
  if (!data) return [];
  
  const metadata = analyzeApiResponse(data);
  return metadata
    .filter(meta => meta.type === 'simple' || meta.type === 'array')
    .map(meta => meta.path);
}

/**
 * Get enhanced field options with metadata for advanced field selection
 */
export function getFieldOptions(data: Record<string, unknown> | unknown[] | null): FieldOption[] {
  if (!data) return [];
  
  const metadata = analyzeApiResponse(data);
  return generateFieldOptions(metadata);
}

/**
 * Get field metadata for a specific path
 */
export function getFieldMetadata(data: Record<string, unknown> | unknown[] | null, fieldPath: string): FieldMetadata | null {
  if (!data) return null;
  
  const metadata = analyzeApiResponse(data);
  return metadata.find(meta => meta.path === fieldPath) || null;
}

/**
 * Get field value from data using dot notation path
 * Enhanced version with array support
 */
export function getFieldValue(data: Record<string, unknown> | unknown[] | null, fieldPath: string): unknown {
  if (!data) return null;
  
  const pathParts = fieldPath.split('.');
  let current: unknown = data;
  
  for (const part of pathParts) {
    if (typeof current === 'object' && current !== null && !Array.isArray(current)) {
      current = (current as Record<string, unknown>)[part];
    } else if (Array.isArray(current) && current.length > 0) {
      // For arrays, try to get the field from the first item for preview
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

/**
 * Format field value for display in UI
 * Enhanced version with better array and object handling
 */
export function formatFieldValue(value: unknown, aggregationType?: string): string {
  if (value === null || value === undefined) return 'N/A';
  
  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) return 'Empty array';
    
    // If aggregation is specified, apply it
    if (aggregationType) {
      const processed = processFieldSelection(value, '', aggregationType);
      return processed.displayValue;
    }
    
    // Default array formatting
    if (value.every(item => typeof item !== 'object')) {
      // Array of primitives
      const preview = value.slice(0, 3).map(item => String(item));
      return preview.join(', ') + (value.length > 3 ? `... (${value.length} total)` : '');
    } else {
      // Array of objects
      return `Array of ${value.length} objects`;
    }
  }
  
  // Handle simple values
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value.toString();
  
  // Handle objects
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    
    if (keys.length === 0) return 'Empty object';
    
    // Show first few key-value pairs
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

/**
 * Enhanced value formatting for widgets with aggregation support
 */
export function formatValueForWidget(
  value: unknown, 
  fieldPath: string, 
  aggregationType?: string
): string {
  const processed = processFieldSelection(value, fieldPath, aggregationType);
  return processed.displayValue;
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
 * Updated to support nested fields from the new tree-based system
 */
export function getMeaningfulFields(fields: string[], limit = 8): string[] {
  return fields
    .filter(field => {
      const fieldLower = field.toLowerCase();
      // Filter out system fields but allow nested fields
      const isSystemField = ['_id', '__v', 'updated_at', 'created_at'].some(sys => 
        fieldLower.includes(sys)
      );
      // Also filter out timestamp fields that are not in arrays
      const isTimestampField = (fieldLower.includes('timestamp') || fieldLower.includes('date') || fieldLower.includes('time')) 
        && !field.includes('[]'); // Allow array timestamps
      
      return !isSystemField && !isTimestampField;
    })
    .slice(0, limit);
}

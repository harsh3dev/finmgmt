import { extractFieldsFromData, getFieldValue, formatFieldValue } from '@/lib/utils';

/**
 * Get detailed field information from API response data
 */
export function getFieldInfo(data: Record<string, unknown> | unknown[] | null, fieldPath: string) {
  const value = getFieldValue(data, fieldPath);
  const type = getFieldType(value);
  const formattedValue = formatFieldValue(value);
  
  return {
    name: fieldPath,
    type,
    path: fieldPath,
    sampleValue: value,
    formattedValue,
    isNested: fieldPath.includes('.'),
    depth: fieldPath.split('.').length
  };
}

/**
 * Determine the type of a field value
 */
export function getFieldType(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') {
    // Check if it's a date string
    if (isDateString(value)) return 'date';
    return 'string';
  }
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return 'unknown';
}

/**
 * Check if a string value represents a date
 */
export function isDateString(value: string): boolean {
  if (!value) return false;
  
  // Common date patterns
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}/, // MM-DD-YYYY
    /^\d{4}\/\d{2}\/\d{2}/, // YYYY/MM/DD
  ];
  
  // Check if it matches common date patterns
  if (datePatterns.some(pattern => pattern.test(value))) {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
  
  // Check if it's a valid ISO date string
  if (value.includes('T') && value.includes('Z')) {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
  
  return false;
}

/**
 * Get sample data for field preview
 */
export function getFieldSampleData(
  data: Record<string, unknown> | unknown[] | null,
  fieldPath: string,
  maxSamples = 3
): unknown[] {
  if (!data) return [];
  
  if (Array.isArray(data)) {
    return data
      .slice(0, maxSamples)
      .map(item => getFieldValue(item as Record<string, unknown> | unknown[] | null, fieldPath))
      .filter(value => value !== null && value !== undefined);
  }
  
  const value = getFieldValue(data, fieldPath);
  return value !== null && value !== undefined ? [value] : [];
}

/**
 * Validate if field selection is meaningful
 */
export function validateFieldSelection(selectedFields: string[], responseData: Record<string, unknown> | unknown[] | null): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  if (selectedFields.length === 0) {
    return {
      isValid: false,
      warnings: ['No fields selected'],
      suggestions: ['Select at least one field to display in your widget']
    };
  }
  
  if (!responseData) {
    return {
      isValid: false,
      warnings: ['No response data available'],
      suggestions: ['Test the API endpoint first to get response data']
    };
  }
  
  // Check if selected fields exist in response data
  const availableFields = extractFieldsFromData(responseData);
  const missingFields = selectedFields.filter(field => !availableFields.includes(field));
  
  if (missingFields.length > 0) {
    warnings.push(`Selected fields not found in response: ${missingFields.join(', ')}`);
    suggestions.push('Remove missing fields or test the API again');
  }
  
  // Check for nested fields warning
  const nestedFields = selectedFields.filter(field => field.includes('.'));
  if (nestedFields.length > 0) {
    warnings.push('Nested fields selected - ensure they are always available');
  }
  
  if (selectedFields.length === 0) {
    const meaningfulFields = availableFields.filter(field => 
      !field.includes('.') && 
      !['id', 'timestamp', 'updated_at', 'created_at'].includes(field.toLowerCase())
    ).slice(0, 3);
    
    if (meaningfulFields.length > 0) {
      suggestions.push(`Consider selecting: ${meaningfulFields.join(', ')}`);
    }
  }
  
  return {
    isValid: missingFields.length === 0 && selectedFields.length > 0,
    warnings,
    suggestions
  };
}

/**
 * Group fields by their hierarchy for better organization
 */
export function groupFieldsByHierarchy(fields: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {
    'root': [],
    'nested': []
  };
  
  fields.forEach(field => {
    if (field.includes('.')) {
      const rootField = field.split('.')[0];
      if (!groups[rootField]) {
        groups[rootField] = [];
      }
      groups[rootField].push(field);
    } else {
      groups.root.push(field);
    }
  });
  
  Object.keys(groups).forEach(key => {
    if (groups[key].length === 0) {
      delete groups[key];
    }
  });
  
  return groups;
}

import { FieldMetadata, FieldOption, ProcessedFieldData } from "@/types/field-metadata";

/**
 * Analyze API response data and generate detailed field metadata
 */
export function analyzeApiResponse(data: unknown, maxDepth = 3): FieldMetadata[] {
  const metadata: FieldMetadata[] = [];
  
  const analyzeValue = (value: unknown, path: string, depth = 0, parentPath?: string): void => {
    if (depth > maxDepth) return;
    
    const baseMetadata: Omit<FieldMetadata, 'type' | 'dataType' | 'aggregationOptions'> = {
      path,
      sampleValue: value,
      depth,
      parentPath,
      isFinancialData: detectFinancialData(path, value)
    };

    if (value === null || value === undefined) {
      metadata.push({
        ...baseMetadata,
        type: 'simple',
        dataType: 'object',
        aggregationOptions: []
      });
      return;
    }

    if (Array.isArray(value)) {
      const arrayLength = value.length;
      
      if (arrayLength === 0) {
        metadata.push({
          ...baseMetadata,
          type: 'array',
          dataType: 'object',
          arrayLength: 0,
          aggregationOptions: ['count']
        });
        return;
      }

      // Analyze array contents
      const firstItem = value[0];
      
      if (typeof firstItem === 'object' && firstItem !== null && !Array.isArray(firstItem)) {
        // Array of objects
        const arrayItemSchema: Record<string, FieldMetadata> = {};
        
        // Analyze the structure of array items
        const sampleItem = firstItem as Record<string, unknown>;
        Object.keys(sampleItem).forEach(key => {
          const itemValue = sampleItem[key];
          const itemPath = `${path}[].${key}`;
          
          analyzeValue(itemValue, itemPath, depth + 1, path);
          
          // Store schema for this array item property
          const itemMetadata = metadata.find(m => m.path === itemPath);
          if (itemMetadata) {
            arrayItemSchema[key] = itemMetadata;
          }
        });
        
        metadata.push({
          ...baseMetadata,
          type: 'array_of_objects',
          dataType: 'object',
          arrayLength,
          arrayItemSchema,
          aggregationOptions: ['count', 'first', 'last']
        });
        
        // Also add individual accessible paths for array properties
        Object.keys(sampleItem).forEach(key => {
          const arrayPropPath = `${path}.${key}`;
          const propValue = sampleItem[key];
          const propType = getDataType(propValue);
          const aggregationOptions = propType === 'number' 
            ? ['first', 'last', 'avg', 'max', 'min', 'count']
            : ['first', 'last', 'count'];
            
          metadata.push({
            path: arrayPropPath,
            type: 'simple',
            dataType: propType,
            sampleValue: propValue,
            depth: depth + 1,
            parentPath: path,
            arrayLength,
            aggregationOptions,
            isFinancialData: detectFinancialData(arrayPropPath, propValue)
          });
        });
        
      } else {
        // Array of primitives
        const dataType = getDataType(firstItem);
        const aggregationOptions = dataType === 'number' 
          ? ['count', 'avg', 'max', 'min', 'first', 'last']
          : ['count', 'first', 'last'];
          
        metadata.push({
          ...baseMetadata,
          type: 'array',
          dataType,
          arrayLength,
          aggregationOptions
        });
      }
    } else if (typeof value === 'object' && value !== null) {
      // Regular object
      metadata.push({
        ...baseMetadata,
        type: 'object',
        dataType: 'object',
        aggregationOptions: []
      });
      
      // Analyze object properties
      const obj = value as Record<string, unknown>;
      Object.keys(obj).forEach(key => {
        const propPath = path ? `${path}.${key}` : key;
        analyzeValue(obj[key], propPath, depth + 1, path);
      });
    } else {
      // Simple value
      const dataType = getDataType(value);
      const aggregationOptions = dataType === 'number' ? ['avg', 'max', 'min'] : [];
      
      metadata.push({
        ...baseMetadata,
        type: 'simple',
        dataType,
        aggregationOptions
      });
    }
  };

  analyzeValue(data, '');
  return metadata.filter(m => m.path !== ''); // Remove root entry
}

/**
 * Generate field options from metadata for UI selection
 */
export function generateFieldOptions(metadata: FieldMetadata[]): FieldOption[] {
  return metadata.map(meta => ({
    value: meta.path,
    label: generateFieldLabel(meta),
    type: meta.type,
    dataType: meta.dataType,
    sampleValue: meta.sampleValue,
    metadata: meta
  }));
}

/**
 * Process field selection and return formatted data
 */
export function processFieldSelection(
  data: unknown, 
  fieldPath: string, 
  aggregationType?: string
): ProcessedFieldData {
  const value = getFieldValue(data, fieldPath);
  
  if (Array.isArray(value)) {
    const arrayLength = value.length;
    let aggregatedValue: unknown = value;
    let displayValue = `Array (${arrayLength} items)`;
    
    if (aggregationType && arrayLength > 0) {
      const result = applyAggregation(value, aggregationType);
      aggregatedValue = result.value;
      displayValue = result.displayValue;
    } else if (arrayLength > 0) {
      // Default: show first few items
      const preview = value.slice(0, 3);
      if (preview.every(item => typeof item !== 'object')) {
        displayValue = preview.join(', ') + (arrayLength > 3 ? '...' : '');
      } else {
        displayValue = `${arrayLength} items (${typeof value[0]})`;
      }
    }
    
    return {
      value,
      displayValue,
      isArray: true,
      arrayLength,
      aggregatedValue
    };
  }
  
  return {
    value,
    displayValue: formatSimpleValue(value),
    isArray: false
  };
}

/**
 * Get field value using dot notation with array support
 */
export function getFieldValue(data: unknown, fieldPath: string): unknown {
  if (!data || !fieldPath) return null;
  
  const pathParts = fieldPath.split('.');
  let current: unknown = data;
  
  for (const part of pathParts) {
    if (current === null || current === undefined) return null;
    
    if (Array.isArray(current)) {
      // Handle array access patterns
      if (part === '[]' || part === '*') {
        // Return the array itself for further processing
        continue;
      } else {
        // Try to access property from array items
        return current.map(item => {
          if (item && typeof item === 'object') {
            return (item as Record<string, unknown>)[part];
          }
          return null;
        });
      }
    } else if (typeof current === 'object' && current !== null) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }
  
  return current;
}

/**
 * Apply aggregation to array data
 */
function applyAggregation(array: unknown[], type: string): { value: unknown; displayValue: string } {
  const numericValues = array
    .map(item => typeof item === 'number' ? item : parseFloat(String(item)))
    .filter(val => !isNaN(val));
    
  switch (type) {
    case 'count':
      return {
        value: array.length,
        displayValue: `${array.length} items`
      };
      
    case 'avg':
      if (numericValues.length === 0) return { value: null, displayValue: 'N/A' };
      const avg = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
      return {
        value: avg,
        displayValue: `Avg: ${avg.toFixed(2)}`
      };
      
    case 'max':
      if (numericValues.length === 0) return { value: null, displayValue: 'N/A' };
      const max = Math.max(...numericValues);
      return {
        value: max,
        displayValue: `Max: ${max}`
      };
      
    case 'min':
      if (numericValues.length === 0) return { value: null, displayValue: 'N/A' };
      const min = Math.min(...numericValues);
      return {
        value: min,
        displayValue: `Min: ${min}`
      };
      
    case 'first':
      return {
        value: array[0],
        displayValue: `First: ${formatSimpleValue(array[0])}`
      };
      
    case 'last':
      return {
        value: array[array.length - 1],
        displayValue: `Last: ${formatSimpleValue(array[array.length - 1])}`
      };
      
    default:
      return {
        value: array,
        displayValue: `Array (${array.length} items)`
      };
  }
}

/**
 * Detect if a field contains financial data
 */
function detectFinancialData(path: string, value: unknown): boolean {
  const financialKeywords = [
    'price', 'cost', 'value', 'amount', 'rate', 'yield', 'return',
    'high', 'low', 'open', 'close', 'volume', 'market', 'cap',
    'dividend', 'earning', 'revenue', 'profit', 'loss',
    'currency', 'exchange', 'stock', 'share', 'ticker',
    'portfolio', 'investment', 'fund', 'etf', 'bond'
  ];
  
  const pathLower = path.toLowerCase();
  const hasFinancialKeyword = financialKeywords.some(keyword => 
    pathLower.includes(keyword)
  );
  
  // Also check if it's a numeric value that could be financial
  const isNumericValue = typeof value === 'number' && value > 0;
  
  return hasFinancialKeyword || (isNumericValue && hasFinancialKeyword);
}

/**
 * Get data type of a value
 */
function getDataType(value: unknown): FieldMetadata['dataType'] {
  if (value === null || value === undefined) return 'object';
  if (typeof value === 'string') {
    // Check if it's a date string
    if (isDateString(value)) return 'date';
    return 'string';
  }
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'object';
}

/**
 * Check if string is a date
 */
function isDateString(str: string): boolean {
  const date = new Date(str);
  return !isNaN(date.getTime()) && str.length > 8;
}

/**
 * Generate a user-friendly label for a field
 */
function generateFieldLabel(metadata: FieldMetadata): string {
  let label = metadata.path
    .replace(/\[\]/g, '')
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' > ');
    
  // Add type indicator
  if (metadata.type === 'array' || metadata.type === 'array_of_objects') {
    label += ` (${metadata.arrayLength || 0} items)`;
  }
  
  return label;
}

/**
 * Format simple values for display
 */
function formatSimpleValue(value: unknown): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return `Array (${value.length} items)`;
    }
    return 'Object';
  }
  return String(value);
}

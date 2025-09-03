import { 
  FieldMetadata, 
  FieldOption, 
  ProcessedFieldData, 
  FieldTreeNode, 
  DataStructureType, 
  DataStructureInfo,
  FieldTreeConfig 
} from "@/types/field-metadata";

/**
 * Detect the overall structure type of the API response data
 */
export function detectDataStructure(data: unknown): DataStructureInfo {
  if (!data) {
    return {
      type: 'single_object',
      isArray: false,
      hasNestedObjects: false,
      maxDepth: 0,
      hasFinancialFields: false,
      recommendedDisplayType: 'card'
    };
  }

  const analysis = analyzeStructure(data, 0);
  
  return {
    type: analysis.structureType,
    isArray: Array.isArray(data),
    arrayLength: Array.isArray(data) ? data.length : undefined,
    hasNestedObjects: analysis.hasNestedObjects,
    maxDepth: analysis.maxDepth,
    hasFinancialFields: analysis.hasFinancialFields,
    recommendedDisplayType: getRecommendedDisplayType(analysis)
  };
}

/**
 * Build a hierarchical tree structure from API response data
 */
export function buildFieldTree(
  data: unknown, 
  config: FieldTreeConfig = {
    maxDepth: 4,
    includeArrayItems: true,
    autoExpandArrays: false,
    showSampleValues: true,
    groupByDataType: false
  }
): FieldTreeNode[] {
  const rootNodes: FieldTreeNode[] = [];
  
  const buildNode = (
    value: unknown,
    key: string,
    path: string,
    depth: number,
    parent?: FieldTreeNode
  ): FieldTreeNode => {
    if (depth > config.maxDepth) {
      return createLeafNode(key, path, value, depth, parent);
    }

    const node: FieldTreeNode = {
      key,
      path,
      type: getFieldType(value),
      dataType: getDataType(value),
      sampleValue: config.showSampleValues ? value : undefined,
      children: [],
      parent,
      depth,
      aggregationOptions: getAggregationOptions(value),
      isFinancialData: detectFinancialData(path, value),
      displayLabel: generateDisplayLabel(key, value, path),
      isExpanded: depth <= 1 || (config.autoExpandArrays && Array.isArray(value))
    };

    // Handle different value types
    if (Array.isArray(value)) {
      node.arrayLength = value.length;
      
      if (value.length > 0 && config.includeArrayItems) {
        const firstItem = value[0];
        
        if (typeof firstItem === 'object' && firstItem !== null) {
          // Array of objects - create child nodes for object properties
          Object.keys(firstItem as Record<string, unknown>).forEach(objKey => {
            const objValue = (firstItem as Record<string, unknown>)[objKey];
            const childPath = `${path}[].${objKey}`;
            const childNode = buildNode(objValue, objKey, childPath, depth + 1, node);
            node.children.push(childNode);
          });
        } else {
          // Array of primitives - create a representative child node
          const childNode = createLeafNode(
            '[items]', 
            `${path}[]`, 
            firstItem, 
            depth + 1, 
            node
          );
          node.children.push(childNode);
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      // Regular object - create child nodes for properties
      Object.keys(value as Record<string, unknown>).forEach(objKey => {
        const objValue = (value as Record<string, unknown>)[objKey];
        const childPath = path ? `${path}.${objKey}` : objKey;
        const childNode = buildNode(objValue, objKey, childPath, depth + 1, node);
        node.children.push(childNode);
      });
    }

    return node;
  };

  // Start building from root level
  if (Array.isArray(data)) {
    if (data.length > 0) {
      const rootNode = buildNode(data, 'root', '', 0);
      rootNodes.push(rootNode);
    }
  } else if (typeof data === 'object' && data !== null) {
    Object.keys(data as Record<string, unknown>).forEach(key => {
      const value = (data as Record<string, unknown>)[key];
      const node = buildNode(value, key, key, 0);
      rootNodes.push(node);
    });
  } else {
    // Single primitive value
    const rootNode = buildNode(data, 'value', 'value', 0);
    rootNodes.push(rootNode);
  }

  return rootNodes;
}

/**
 * Convert field tree back to flat field metadata for backward compatibility
 */
export function flattenFieldTree(tree: FieldTreeNode[]): FieldMetadata[] {
  const flattened: FieldMetadata[] = [];
  
  const traverse = (node: FieldTreeNode) => {
    if (node.path) {
      flattened.push({
        path: node.path,
        type: node.type,
        dataType: node.dataType,
        sampleValue: node.sampleValue,
        arrayLength: node.arrayLength,
        aggregationOptions: node.aggregationOptions,
        isFinancialData: node.isFinancialData,
        depth: node.depth,
        parentPath: node.parent?.path,
        displayLabel: node.displayLabel
      });
    }
    
    node.children.forEach(traverse);
  };
  
  tree.forEach(traverse);
  return flattened;
}

/**
 * Internal helper to analyze data structure
 */
function analyzeStructure(data: unknown, depth: number): {
  structureType: DataStructureType;
  hasNestedObjects: boolean;
  maxDepth: number;
  hasFinancialFields: boolean;
} {
  let hasNestedObjects = false;
  let maxDepth = depth;
  let hasFinancialFields = false;
  let structureType: DataStructureType = 'single_object';

  if (Array.isArray(data)) {
    if (data.length === 0) {
      structureType = 'array_of_primitives';
    } else {
      const firstItem = data[0];
      const itemTypes = data.map(item => typeof item);
      const uniqueTypes = [...new Set(itemTypes)];
      
      if (uniqueTypes.length > 1) {
        structureType = 'mixed_array';
      } else if (typeof firstItem === 'object' && firstItem !== null) {
        structureType = 'array_of_objects';
        hasNestedObjects = true;
        
        // Analyze nested structure
        const analysis = analyzeStructure(firstItem, depth + 1);
        hasNestedObjects = hasNestedObjects || analysis.hasNestedObjects;
        maxDepth = Math.max(maxDepth, analysis.maxDepth);
        hasFinancialFields = hasFinancialFields || analysis.hasFinancialFields;
      } else {
        structureType = 'array_of_primitives';
      }
    }
  } else if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    const hasNestedObj = Object.values(obj).some(
      value => typeof value === 'object' && value !== null
    );
    
    if (hasNestedObj) {
      structureType = 'nested_object';
      hasNestedObjects = true;
    } else {
      structureType = 'single_object';
    }
    
    // Check for financial fields
    Object.keys(obj).forEach(key => {
      if (detectFinancialData(key, obj[key])) {
        hasFinancialFields = true;
      }
      
      // Recursively analyze nested objects
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        const analysis = analyzeStructure(obj[key], depth + 1);
        hasNestedObjects = hasNestedObjects || analysis.hasNestedObjects;
        maxDepth = Math.max(maxDepth, analysis.maxDepth);
        hasFinancialFields = hasFinancialFields || analysis.hasFinancialFields;
      }
    });
  }

  return {
    structureType,
    hasNestedObjects,
    maxDepth: Math.max(maxDepth, depth),
    hasFinancialFields
  };
}

/**
 * Get recommended display type based on data structure
 */
function getRecommendedDisplayType(analysis: {
  structureType: DataStructureType;
  hasNestedObjects: boolean;
  hasFinancialFields: boolean;
}): 'card' | 'table' | 'list' | 'chart' {
  // Priority 1: Financial data should be visualized as charts
  if (analysis.hasFinancialFields) {
    return 'chart';
  }
  
  // Priority 2: Array structures
  if (analysis.structureType === 'array_of_objects') {
    return 'table'; // Tables are best for structured arrays
  }
  
  if (analysis.structureType === 'array_of_primitives') {
    return 'list'; // Simple lists for primitive arrays
  }
  
  // Priority 3: Object structures
  if (analysis.structureType === 'single_object' || analysis.structureType === 'nested_object') {
    return 'card'; // Cards for object display
  }
  
  // Default fallback
  return 'card';
}

/**
 * Create a leaf node for the tree
 */
function createLeafNode(
  key: string,
  path: string,
  value: unknown,
  depth: number,
  parent?: FieldTreeNode
): FieldTreeNode {
  return {
    key,
    path,
    type: getFieldType(value),
    dataType: getDataType(value),
    sampleValue: value,
    children: [],
    parent,
    depth,
    aggregationOptions: getAggregationOptions(value),
    isFinancialData: detectFinancialData(path, value),
    displayLabel: generateDisplayLabel(key, value, path)
  };
}

/**
 * Get field type based on value
 */
function getFieldType(value: unknown): FieldTreeNode['type'] {
  if (Array.isArray(value)) {
    if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
      return 'array_of_objects';
    }
    return 'array';
  }
  
  if (typeof value === 'object' && value !== null) {
    return 'object';
  }
  
  return 'simple';
}

/**
 * Get aggregation options based on value type
 */
function getAggregationOptions(value: unknown): string[] {
  if (Array.isArray(value)) {
    if (value.length === 0) return ['count'];
    
    const firstItem = value[0];
    if (typeof firstItem === 'number') {
      return ['count', 'avg', 'max', 'min', 'first', 'last'];
    }
    return ['count', 'first', 'last'];
  }
  
  if (typeof value === 'number') {
    return ['avg', 'max', 'min'];
  }
  
  return [];
}

/**
 * Generate user-friendly display label with hierarchy
 */
function generateDisplayLabel(key: string, value: unknown, path?: string): string {
  let label = key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
  
  // If this is a nested field (has a path with multiple parts), show hierarchy
  if (path && path.includes('.')) {
    const pathParts = path
      .replace(/\[\]/g, '') // Remove array notation
      .split('.')
      .map(part => part
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .trim()
      );
    
    // Only show hierarchy if there are multiple meaningful parts
    if (pathParts.length > 1 && pathParts[0] !== pathParts[pathParts.length - 1]) {
      label = pathParts.join(' > ');
    }
  }
  
  if (Array.isArray(value)) {
    label += ` (${value.length} items)`;
  } else if (typeof value === 'object' && value !== null) {
    const objKeys = Object.keys(value as Record<string, unknown>);
    label += ` (${objKeys.length} properties)`;
  }
  
  return label;
}
/**
 * Legacy function: Analyze API response data and generate detailed field metadata
 * @deprecated Use buildFieldTree() for new implementations
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
      isFinancialData: detectFinancialData(path, value),
      displayLabel: generateLegacyFieldLabel(path, value)
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
            isFinancialData: detectFinancialData(arrayPropPath, propValue),
            displayLabel: generateLegacyFieldLabel(arrayPropPath, propValue)
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
 * Generate a user-friendly label for legacy field metadata
 */
function generateLegacyFieldLabel(path: string, value: unknown): string {
  let label = path
    .replace(/\[\]/g, '')
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' > ');
    
  // Add type indicator
  if (Array.isArray(value)) {
    label += ` (${value.length || 0} items)`;
  } else if (typeof value === 'object' && value !== null) {
    const objKeys = Object.keys(value as Record<string, unknown>);
    label += ` (${objKeys.length} properties)`;
  }
  
  return label || 'Root';
}

/**
 * Generate field options from metadata for UI selection
 */
export function generateFieldOptions(metadata: FieldMetadata[]): FieldOption[] {
  return metadata.map(meta => ({
    value: meta.path,
    label: meta.displayLabel,
    type: meta.type,
    dataType: meta.dataType,
    sampleValue: meta.sampleValue,
    metadata: meta
  }));
}

/**
 * Generate field options from field tree
 */
export function generateFieldOptionsFromTree(tree: FieldTreeNode[]): FieldOption[] {
  const options: FieldOption[] = [];
  
  const traverse = (node: FieldTreeNode) => {
    if (node.path && node.type === 'simple') {
      options.push({
        value: node.path,
        label: node.displayLabel,
        type: node.type,
        dataType: node.dataType,
        sampleValue: node.sampleValue,
        metadata: {
          path: node.path,
          type: node.type,
          dataType: node.dataType,
          sampleValue: node.sampleValue,
          arrayLength: node.arrayLength,
          aggregationOptions: node.aggregationOptions,
          isFinancialData: node.isFinancialData,
          depth: node.depth,
          parentPath: node.parent?.path,
          displayLabel: node.displayLabel
        }
      });
    }
    
    node.children.forEach(traverse);
  };
  
  tree.forEach(traverse);
  return options;
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

export interface FieldMetadata {
  path: string;
  type: 'simple' | 'object' | 'array' | 'array_of_objects';
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'object';
  sampleValue: unknown;
  arrayItemSchema?: Record<string, FieldMetadata>; // For arrays of objects
  arrayLength?: number; // For arrays
  aggregationOptions: string[]; // ['count', 'avg', 'max', 'min', 'first', 'last']
  isFinancialData?: boolean; // Detect stock/price patterns
  depth: number; // Field nesting depth
  parentPath?: string; // Parent field path
}

export interface ArrayFieldConfig {
  displayMode: 'list' | 'table' | 'chart' | 'summary';
  selectedProperties: string[]; // Which properties from array objects to show
  aggregationType: 'none' | 'count' | 'avg' | 'max' | 'min' | 'first' | 'last';
  limit?: number; // Show only top N items
  sortBy?: string; // Sort by which property
  sortOrder?: 'asc' | 'desc';
}

export interface FieldOption {
  value: string;
  label: string;
  type: FieldMetadata['type'];
  dataType: FieldMetadata['dataType'];
  sampleValue: unknown;
  metadata: FieldMetadata;
}

export interface ProcessedFieldData {
  value: unknown;
  displayValue: string;
  isArray: boolean;
  arrayLength?: number;
  aggregatedValue?: unknown;
}

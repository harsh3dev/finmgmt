// Tree node structure for hierarchical field representation
export interface FieldTreeNode {
  key: string; // The field key (last part of path)
  path: string; // Full dot notation path
  type: 'simple' | 'object' | 'array' | 'array_of_objects';
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'object';
  sampleValue: unknown;
  children: FieldTreeNode[]; // Child nodes for nested structures
  parent?: FieldTreeNode; // Reference to parent node
  isExpanded?: boolean; // UI state for tree expansion
  isSelected?: boolean; // UI state for field selection
  arrayLength?: number; // For arrays
  aggregationOptions: string[]; // Available aggregation functions
  isFinancialData?: boolean; // Auto-detected financial data
  depth: number; // Nesting level
  displayLabel: string; // User-friendly label
}

// Enhanced field metadata with tree support
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
  displayLabel: string; // User-friendly display name
}

// Data structure detection types
export type DataStructureType = 
  | 'single_object'      // { name: "John", age: 30 }
  | 'array_of_objects'   // [{ name: "John" }, { name: "Jane" }]
  | 'array_of_primitives' // [1, 2, 3] or ["a", "b", "c"]
  | 'mixed_array'        // [1, "text", { obj: true }]
  | 'nested_object'      // { user: { profile: { name: "John" } } }
  | 'complex_mixed';     // Complex combination of above

export interface DataStructureInfo {
  type: DataStructureType;
  isArray: boolean;
  arrayLength?: number;
  hasNestedObjects: boolean;
  maxDepth: number;
  hasFinancialFields: boolean;
  recommendedDisplayType: 'card' | 'table' | 'list' | 'chart';
}

// Enhanced field tree building and management
export interface FieldTreeConfig {
  maxDepth: number;
  includeArrayItems: boolean;
  autoExpandArrays: boolean;
  showSampleValues: boolean;
  groupByDataType: boolean;
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

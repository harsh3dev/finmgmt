import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ChevronRight, 
  ChevronDown, 
  Database, 
  Type, 
  BarChart3, 
  Calculator, 
  List,
  Hash,
  Calendar,
  ToggleLeft,
  Eye,
  Settings
} from "lucide-react";
import { buildFieldTree, detectDataStructure } from "@/lib/field-analyzer";
import type { FieldTreeNode, DataStructureInfo } from "@/types/field-metadata";

// Helper function to format simple values
const formatSimpleValue = (value: unknown): string => {
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
};

import type { useFieldSelection } from "@/hooks/use-field-selection";

interface TreeFieldSelectionProps {
  fieldSelection: ReturnType<typeof useFieldSelection>;
  onArrayConfigChange?: (field: string, config: ArrayConfigType) => void;
}

interface ArrayConfigType {
  displayMode: 'list' | 'table' | 'chart' | 'summary';
  selectedProperties?: string[];
  aggregationType?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface TreeNodeProps {
  node: FieldTreeNode;
  selectedFields: string[];
  fieldMappings: Record<string, string>;
  onFieldToggle: (field: string, displayName?: string) => void;
  onFieldMappingChange: (field: string, displayName: string) => void;
  onPreviewField?: (field: string | null) => void;
  onToggleExpanded: (path: string) => void;
  onArrayConfigChange?: (field: string, config: ArrayConfigType) => void;
  arrayConfigs: Record<string, ArrayConfigType>;
}

function TreeNode({
  node,
  selectedFields,
  fieldMappings,
  onFieldToggle,
  onFieldMappingChange,
  onPreviewField,
  onToggleExpanded,
  onArrayConfigChange,
  arrayConfigs
}: TreeNodeProps) {
  const isSelected = selectedFields.includes(node.path);
  const displayName = fieldMappings[node.path] || node.displayLabel;
  const hasChildren = node.children.length > 0;
  const isSelectable = node.type === 'simple' || node.type === 'array';
  const arrayConfig = arrayConfigs[node.path];

  const getFieldIcon = () => {
    switch (node.dataType) {
      case 'number':
        return <Hash className="h-3 w-3 text-green-600" />;
      case 'date':
        return <Calendar className="h-3 w-3 text-blue-600" />;
      case 'boolean':
        return <ToggleLeft className="h-3 w-3 text-purple-600" />;
      case 'string':
        return <Type className="h-3 w-3 text-gray-600" />;
      default:
        if (node.type === 'array' || node.type === 'array_of_objects') {
          return <List className="h-3 w-3 text-blue-600" />;
        }
        return <Database className="h-3 w-3 text-gray-600" />;
    }
  };

  const getTypeColor = () => {
    switch (node.type) {
      case 'array':
      case 'array_of_objects':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'object':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'simple':
        if (node.dataType === 'number') {
          return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        }
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className={`${node.depth > 0 ? 'ml-4 sm:ml-6' : ''}`}>
      <div className={`p-2 sm:p-3 border rounded-lg transition-colors ${
        isSelected 
          ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20' 
          : 'border-border/50 bg-background hover:bg-accent/50'
      }`}>
        <div className="flex items-start gap-2 sm:gap-3">
          {/* Expand/Collapse button */}
          {hasChildren && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpanded(node.path)}
              className="h-5 w-5 sm:h-6 sm:w-6 p-0 shrink-0"
            >
              {node.isExpanded ? 
                <ChevronDown className="h-3 w-3" /> : 
                <ChevronRight className="h-3 w-3" />
              }
            </Button>
          )}
          
          {/* Selection checkbox (only for selectable fields) */}
          {isSelectable && (
            <input
              type="checkbox"
              id={`field-${node.path}`}
              checked={isSelected}
              onChange={() => onFieldToggle(node.path, node.displayLabel)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary shrink-0"
            />
          )}
          
          {/* Field info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 sm:gap-2 mb-1 flex-wrap">
              <Label 
                htmlFor={isSelectable ? `field-${node.path}` : undefined}
                className={`font-medium text-sm flex items-center gap-1 ${
                  isSelectable ? 'cursor-pointer' : ''
                } truncate max-w-[200px] sm:max-w-none`}
              >
                {getFieldIcon()}
                <span className="truncate">{node.key}</span>
                {node.depth > 0 && (
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    ({node.path})
                  </span>
                )}
              </Label>
              
              <Badge variant="secondary" className={`text-xs shrink-0 ${getTypeColor()}`}>
                {node.type === 'array_of_objects' ? 'array[obj]' : node.dataType}
                {node.arrayLength !== undefined && ` (${node.arrayLength})`}
              </Badge>
              
              {node.isFinancialData && (
                <Badge variant="outline" className="text-xs shrink-0 hidden sm:flex">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Financial
                </Badge>
              )}
              
              {node.aggregationOptions.length > 0 && (
                <Badge variant="outline" className="text-xs shrink-0 hidden sm:flex">
                  <Calculator className="h-3 w-3 mr-1" />
                  Aggregatable
                </Badge>
              )}
              
              {onPreviewField && isSelectable && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onPreviewField(node.path)}
                  className="h-5 w-5 sm:h-6 sm:w-6 p-0 shrink-0"
                >
                  <Eye className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {/* Sample value */}
            {node.sampleValue !== undefined && (
              <p className="text-xs text-muted-foreground mb-2 truncate">
                Sample: {formatSimpleValue(node.sampleValue)}
              </p>
            )}
            
            {/* Aggregation options - hide on mobile */}
            {node.aggregationOptions.length > 0 && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-2 hidden sm:block">
                Aggregation: {node.aggregationOptions.join(', ')}
              </p>
            )}
            
            {/* Field mapping input for selected fields */}
            {isSelected && (
              <div className="space-y-2">
                <Label htmlFor={`mapping-${node.path}`} className="text-xs">
                  Display Name
                </Label>
                <Input
                  id={`mapping-${node.path}`}
                  value={displayName}
                  onChange={(e) => onFieldMappingChange(node.path, e.target.value)}
                  placeholder={node.displayLabel}
                  className="h-7 sm:h-8 text-xs"
                />
              </div>
            )}
            
            {/* Array configuration for array fields */}
            {isSelected && node.type === 'array_of_objects' && onArrayConfigChange && (
              <div className="mt-2 space-y-2 border-t pt-2">
                <div className="flex items-center gap-2">
                  <Settings className="h-3 w-3" />
                  <Label className="text-xs font-medium">Array Display Options</Label>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Display Mode</Label>
                    <Select
                      value={arrayConfig?.displayMode || 'table'}
                      onValueChange={(value: ArrayConfigType['displayMode']) => onArrayConfigChange(node.path, {
                        ...arrayConfig,
                        displayMode: value
                      })}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="table">Table</SelectItem>
                        <SelectItem value="list">List</SelectItem>
                        <SelectItem value="chart">Chart</SelectItem>
                        <SelectItem value="summary">Summary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {node.aggregationOptions.length > 0 && (
                    <div>
                      <Label className="text-xs">Aggregation</Label>
                      <Select
                        value={arrayConfig?.aggregationType || 'none'}
                        onValueChange={(value) => onArrayConfigChange(node.path, {
                          ...arrayConfig,
                          aggregationType: value
                        })}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {node.aggregationOptions.map(option => (
                            <SelectItem key={option} value={option}>
                              {option.charAt(0).toUpperCase() + option.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                {arrayConfig?.displayMode === 'table' && (
                  <div>
                    <Label className="text-xs">Show Properties</Label>
                    <div className="mt-1 space-y-1">
                      {node.children.map(child => (
                        <label key={child.path} className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={arrayConfig?.selectedProperties?.includes(child.key) || false}
                            onChange={(e) => {
                              const current = arrayConfig?.selectedProperties || [];
                              const updated = e.target.checked
                                ? [...current, child.key]
                                : current.filter((p: string) => p !== child.key);
                              onArrayConfigChange(node.path, {
                                ...arrayConfig,
                                selectedProperties: updated
                              });
                            }}
                            className="h-3 w-3"
                          />
                          {child.displayLabel}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Child nodes */}
      {hasChildren && node.isExpanded && (
        <div className="mt-2 space-y-2">
          {node.children.map(child => (
            <TreeNode
              key={child.path}
              node={child}
              selectedFields={selectedFields}
              fieldMappings={fieldMappings}
              onFieldToggle={onFieldToggle}
              onFieldMappingChange={onFieldMappingChange}
              onPreviewField={onPreviewField}
              onToggleExpanded={onToggleExpanded}
              onArrayConfigChange={onArrayConfigChange}
              arrayConfigs={arrayConfigs}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TreeFieldSelection({
  fieldSelection,
  onArrayConfigChange
}: TreeFieldSelectionProps) {
  // Destructure fieldSelection hook return value
  const { 
    fieldSelection: fieldSelectionData, 
    toggleFieldSelection, 
    updateFieldMapping, 
    setPreviewField 
  } = fieldSelection;
  
  // Destructure the actual field selection data
  const { responseData, selectedFields, fieldMappings } = fieldSelectionData;
  
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [arrayConfigs, setArrayConfigs] = useState<Record<string, ArrayConfigType>>({});

  if (!responseData) return null;

  const dataStructure = detectDataStructure(responseData);
  const fieldTree = buildFieldTree(responseData, {
    maxDepth: 4,
    includeArrayItems: true,
    autoExpandArrays: false,
    showSampleValues: true,
    groupByDataType: false
  });

  // Auto-expand first level nodes
  if (expandedNodes.size === 0 && fieldTree.length > 0) {
    const firstLevelPaths = fieldTree.map(node => node.path);
    setExpandedNodes(new Set(firstLevelPaths));
  }

  const handleToggleExpanded = (path: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
    
    // Update node expansion state
    const updateNodeExpansion = (nodes: FieldTreeNode[]) => {
      nodes.forEach(node => {
        node.isExpanded = newExpanded.has(node.path);
        updateNodeExpansion(node.children);
      });
    };
    updateNodeExpansion(fieldTree);
  };

  const handleArrayConfigChange = (field: string, config: ArrayConfigType) => {
    setArrayConfigs(prev => ({
      ...prev,
      [field]: config
    }));
    onArrayConfigChange?.(field, config);
  };

  const selectableFieldsCount = fieldTree.reduce((count, node) => {
    const countInNode = (n: FieldTreeNode): number => {
      const total = (n.type === 'simple' || n.type === 'array') ? 1 : 0;
      return total + n.children.reduce((sum, child) => sum + countInNode(child), 0);
    };
    return count + countInNode(node);
  }, 0);

  const getRecommendationBadge = (dataStructure: DataStructureInfo) => {
    switch (dataStructure.recommendedDisplayType) {
      case 'table':
        return <Badge variant="outline" className="text-xs bg-blue-50">📊 Recommended: Table View</Badge>;
      case 'chart':
        return <Badge variant="outline" className="text-xs bg-green-50">📈 Recommended: Chart View</Badge>;
      case 'list':
        return <Badge variant="outline" className="text-xs bg-purple-50">📋 Recommended: List View</Badge>;
      default:
        return <Badge variant="outline" className="text-xs bg-gray-50">🏷️ Recommended: Card View</Badge>;
    }
  };

  return (
    <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10  w-fit">
      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2 flex-wrap">
          <Database className="h-4 w-4 shrink-0" />
          <span className="truncate">Select Fields to Display</span>
          {getRecommendationBadge(dataStructure)}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Choose fields from the API response using the hierarchical tree structure below.
          Selected {selectedFields.length} of {selectableFieldsCount} available fields.
        </CardDescription>
        
        {/* Data structure info */}
        <div className="flex items-center gap-1 sm:gap-2 text-xs text-muted-foreground flex-wrap">
          <span className="shrink-0">Data Structure:</span>
          <Badge variant="outline" className="text-xs">
            {dataStructure.type.replace(/_/g, ' ')}
          </Badge>
          {dataStructure.isArray && (
            <Badge variant="outline" className="text-xs">
              Array ({dataStructure.arrayLength} items)
            </Badge>
          )}
          {dataStructure.hasNestedObjects && (
            <Badge variant="outline" className="text-xs hidden sm:inline-flex">
              Nested (depth: {dataStructure.maxDepth})
            </Badge>
          )}
          {dataStructure.hasFinancialFields && (
            <Badge variant="outline" className="text-xs hidden sm:inline-flex">
              <BarChart3 className="h-3 w-3 mr-1" />
              Financial Data
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 p-3 sm:p-6">
        <div className="max-h-[40vh] sm:max-h-80 overflow-y-auto space-y-2 pr-2">
          {fieldTree.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              selectedFields={selectedFields}
              fieldMappings={fieldMappings}
              onFieldToggle={toggleFieldSelection}
              onFieldMappingChange={updateFieldMapping}
              onPreviewField={setPreviewField}
              onToggleExpanded={handleToggleExpanded}
              onArrayConfigChange={handleArrayConfigChange}
              arrayConfigs={arrayConfigs}
            />
          ))}
        </div>
        
        {fieldTree.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No fields found in API response</p>
            <p className="text-xs mt-1">
              Try testing your API with different parameters or endpoints
            </p>
          </div>
        )}
        
        {selectedFields.length === 0 && selectableFieldsCount > 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Select at least one field to continue
            </p>
          </div>
        )}
        
        {/* Show recommendations based on data structure */}
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 mb-1">
            <BarChart3 className="h-4 w-4" />
            <span className="text-sm font-medium">Smart Recommendations</span>
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            {dataStructure.type === 'array_of_objects' && (
              <p>• Array of objects detected - Table view recommended for better data organization</p>
            )}
            {dataStructure.hasFinancialFields && (
              <p>• Financial data found - Consider using Chart view for numeric fields to visualize trends</p>
            )}
            {dataStructure.hasNestedObjects && (
              <p>• Nested structure detected - Use the tree view to select specific nested properties</p>
            )}
            {dataStructure.type === 'single_object' && (
              <p>• Single object structure - Card view works best for key-value display</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

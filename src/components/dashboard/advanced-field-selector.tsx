import React, { useState } from "react";
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
  Eye, 
  BarChart3,
  Calculator,
  List,
  Hash
} from "lucide-react";
import { getFieldOptions, formatFieldValue } from "@/lib/utils";
import type { FieldOption, ArrayFieldConfig } from "@/types/field-metadata";

interface AdvancedFieldSelectorProps {
  responseData: Record<string, unknown> | unknown[] | null;
  selectedFields: string[];
  fieldMappings: Record<string, string>;
  fieldConfigs?: Record<string, ArrayFieldConfig>;
  onFieldToggle: (field: string, displayName?: string) => void;
  onFieldMappingChange: (field: string, displayName: string) => void;
  onFieldConfigChange?: (field: string, config: ArrayFieldConfig) => void;
  onPreviewField?: (field: string | null) => void;
}

export function AdvancedFieldSelector({
  responseData,
  selectedFields,
  fieldMappings,
  fieldConfigs = {},
  onFieldToggle,
  onFieldMappingChange,
  onFieldConfigChange,
  onPreviewField
}: AdvancedFieldSelectorProps) {
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  const [previewField, setPreviewField] = useState<string | null>(null);

  if (!responseData) return null;

  const fieldOptions = getFieldOptions(responseData);
  
  // Group fields by hierarchy for tree display
  const groupedFields = groupFieldsByHierarchy(fieldOptions);

  const toggleExpanded = (fieldPath: string) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(fieldPath)) {
      newExpanded.delete(fieldPath);
    } else {
      newExpanded.add(fieldPath);
    }
    setExpandedFields(newExpanded);
  };

  const getFieldIcon = (option: FieldOption) => {
    switch (option.type) {
      case 'array':
      case 'array_of_objects':
        return <List className="h-3 w-3" />;
      case 'object':
        return <Database className="h-3 w-3" />;
      default:
        return <Type className="h-3 w-3" />;
    }
  };

  const getTypeColor = (option: FieldOption) => {
    switch (option.type) {
      case 'array':
      case 'array_of_objects':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'object':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'simple':
        if (option.dataType === 'number') {
          return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        }
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const renderFieldRow = (option: FieldOption, depth = 0) => {
    const isSelected = selectedFields.includes(option.value);
    const isExpandable = option.type === 'object' || option.type === 'array_of_objects';
    const isExpanded = expandedFields.has(option.value);
    const displayName = fieldMappings[option.value] || option.label;
    const config = fieldConfigs[option.value];

    return (
      <div key={option.value} className="space-y-2">
        <div 
          className={`p-3 border rounded-lg transition-colors ${
            isSelected 
              ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20' 
              : 'border-border bg-background'
          }`}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          <div className="flex items-start gap-3">
            {/* Expand/collapse button for complex fields */}
            {isExpandable && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => toggleExpanded(option.value)}
                className="h-6 w-6 p-0 mt-0.5"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            )}
            
            {/* Checkbox for selectable fields */}
            {(option.type === 'simple' || option.type === 'array') && (
              <input
                type="checkbox"
                id={`field-${option.value}`}
                checked={isSelected}
                onChange={() => onFieldToggle(option.value, option.label)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Label 
                  htmlFor={`field-${option.value}`}
                  className="font-medium text-sm cursor-pointer flex items-center gap-1"
                >
                  {getFieldIcon(option)}
                  {option.label}
                </Label>
                
                <Badge variant="secondary" className={`text-xs ${getTypeColor(option)}`}>
                  {option.type === 'array_of_objects' ? 'array[obj]' : option.type}
                  {option.metadata.arrayLength !== undefined && ` (${option.metadata.arrayLength})`}
                </Badge>
                
                {option.metadata.isFinancialData && (
                  <Badge variant="outline" className="text-xs">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Financial
                  </Badge>
                )}
                
                {onPreviewField && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPreviewField(option.value);
                      onPreviewField(option.value);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground mb-2">
                Sample: {formatFieldValue(option.sampleValue)}
              </p>
              
              {/* Configuration for selected fields */}
              {isSelected && (
                <div className="space-y-3 mt-3 p-3 bg-muted/50 rounded border">
                  <div className="space-y-2">
                    <Label htmlFor={`mapping-${option.value}`} className="text-xs font-medium">
                      Display Name
                    </Label>
                    <Input
                      id={`mapping-${option.value}`}
                      value={displayName}
                      onChange={(e) => onFieldMappingChange(option.value, e.target.value)}
                      placeholder={option.label}
                      className="h-8 text-xs"
                    />
                  </div>
                  
                  {/* Array-specific configuration */}
                  {(option.type === 'array' || option.type === 'array_of_objects') && 
                   option.metadata.aggregationOptions.length > 0 && onFieldConfigChange && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calculator className="h-3 w-3" />
                        <Label className="text-xs font-medium">Aggregation</Label>
                      </div>
                      
                      <Select
                        value={config?.aggregationType || 'none'}
                        onValueChange={(value) => {
                          const newConfig: ArrayFieldConfig = {
                            ...config,
                            aggregationType: value as ArrayFieldConfig['aggregationType'],
                            displayMode: config?.displayMode || 'summary'
                          };
                          onFieldConfigChange(option.value, newConfig);
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select aggregation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No aggregation</SelectItem>
                          {option.metadata.aggregationOptions.map(agg => (
                            <SelectItem key={agg} value={agg}>
                              {agg.charAt(0).toUpperCase() + agg.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {config?.aggregationType && config.aggregationType !== 'none' && (
                        <div className="text-xs text-muted-foreground">
                          <Hash className="h-3 w-3 inline mr-1" />
                          This will show the {config.aggregationType} value of the array data
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Render nested fields if expanded */}
        {isExpanded && option.metadata.arrayItemSchema && (
          <div className="ml-4 space-y-2">
            {Object.entries(option.metadata.arrayItemSchema).map(([key, metadata]) => {
              const nestedOption: FieldOption = {
                value: `${option.value}.${key}`,
                label: key,
                type: metadata.type,
                dataType: metadata.dataType,
                sampleValue: metadata.sampleValue,
                metadata
              };
              return renderFieldRow(nestedOption, depth + 1);
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="h-4 w-4" />
          Select Fields to Display
        </CardTitle>
        <CardDescription>
          Choose fields from the API response. Arrays can be aggregated for meaningful display.
          Selected {selectedFields.length} of {fieldOptions.filter(f => f.type === 'simple' || f.type === 'array').length} available fields.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {groupedFields.map(option => renderFieldRow(option))}
        </div>
        
        {fieldOptions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No fields found in API response</p>
          </div>
        )}
        
        {selectedFields.length === 0 && fieldOptions.length > 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Select at least one field to continue
            </p>
          </div>
        )}
        
        {/* Preview section */}
        {previewField && (
          <Card className="mt-4 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Field Preview: {previewField}</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(
                  fieldOptions.find(f => f.value === previewField)?.sampleValue, 
                  null, 
                  2
                )}
              </pre>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Group fields by hierarchy for tree display
 */
function groupFieldsByHierarchy(fieldOptions: FieldOption[]): FieldOption[] {
  // Sort by depth and path to create logical hierarchy
  return fieldOptions
    .filter(option => option.metadata.depth === 0 || !option.value.includes('.'))
    .sort((a, b) => {
      // Financial fields first
      if (a.metadata.isFinancialData && !b.metadata.isFinancialData) return -1;
      if (!a.metadata.isFinancialData && b.metadata.isFinancialData) return 1;
      
      // Simple fields before complex ones
      if (a.type === 'simple' && b.type !== 'simple') return -1;
      if (a.type !== 'simple' && b.type === 'simple') return 1;
      
      // Arrays before objects
      if ((a.type === 'array' || a.type === 'array_of_objects') && b.type === 'object') return -1;
      if (a.type === 'object' && (b.type === 'array' || b.type === 'array_of_objects')) return 1;
      
      // Alphabetical
      return a.label.localeCompare(b.label);
    });
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, Database, Type, BarChart3, Calculator, List } from "lucide-react";
import { getFieldOptions, formatFieldValue } from "@/lib/utils";
import type { FieldOption } from "@/types/field-metadata";

interface FieldSelectionProps {
  responseData: Record<string, unknown> | unknown[] | null;
  selectedFields: string[];
  fieldMappings: Record<string, string>;
  onFieldToggle: (field: string, displayName?: string) => void;
  onFieldMappingChange: (field: string, displayName: string) => void;
  onPreviewField?: (field: string | null) => void;
}

export function FieldSelection({
  responseData,
  selectedFields,
  fieldMappings,
  onFieldToggle,
  onFieldMappingChange,
  onPreviewField
}: FieldSelectionProps) {
  if (!responseData) return null;

  const fieldOptions = getFieldOptions(responseData);
  
  // Filter to selectable fields
  const selectableFields = fieldOptions.filter(option => 
    option.type === 'simple' || option.type === 'array'
  );

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

  return (
    <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="h-4 w-4" />
          Select Fields to Display
        </CardTitle>
        <CardDescription>
          Choose which fields from the API response to show in your widget. 
          Selected {selectedFields.length} of {selectableFields.length} available fields.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 max-h-60 overflow-y-auto">
          {selectableFields.map((option) => {
            const isSelected = selectedFields.includes(option.value);
            const displayName = fieldMappings[option.value] || option.label;

            return (
              <div 
                key={option.value} 
                className={`p-3 border rounded-lg transition-colors ${
                  isSelected 
                    ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20' 
                    : 'border-border bg-background'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id={`field-${option.value}`}
                    checked={isSelected}
                    onChange={() => onFieldToggle(option.value, option.label)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  
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
                      
                      {option.metadata.aggregationOptions.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Calculator className="h-3 w-3 mr-1" />
                          Aggregatable
                        </Badge>
                      )}
                      
                      {onPreviewField && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onPreviewField(option.value)}
                          className="h-6 w-6 p-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2">
                      Sample: {formatFieldValue(option.sampleValue)}
                      {option.type === 'array' && option.metadata.arrayLength && 
                        ` (${option.metadata.arrayLength} items)`}
                    </p>
                    
                    {option.metadata.aggregationOptions.length > 0 && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                        Aggregation options: {option.metadata.aggregationOptions.join(', ')}
                      </p>
                    )}
                    
                    {isSelected && (
                      <div className="space-y-2">
                        <Label htmlFor={`mapping-${option.value}`} className="text-xs">
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
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {selectableFields.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No selectable fields found in API response</p>
            <p className="text-xs mt-1">
              Try testing your API with different parameters or endpoints
            </p>
          </div>
        )}
        
        {selectedFields.length === 0 && selectableFields.length > 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Select at least one field to continue
            </p>
          </div>
        )}
        
        {/* Show financial data help if detected */}
        {selectableFields.some(f => f.metadata.isFinancialData) && (
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 mb-1">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm font-medium">Financial Data Detected</span>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Some fields appear to contain financial data. Consider using aggregation 
              for arrays to show meaningful summaries like averages, totals, or ranges.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

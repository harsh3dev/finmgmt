import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, Database, Type } from "lucide-react";
import { extractFieldsFromData, getFieldValue, formatFieldValue } from "@/lib/utils";
import { getFieldType } from "@/lib/widget-modal/field-utils";

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

  const availableFields = extractFieldsFromData(responseData);

  const getFieldPreview = (field: string) => {
    const value = getFieldValue(responseData, field);
    const type = getFieldType(value);
    const formattedValue = formatFieldValue(value);
    
    return { value, type, formattedValue };
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
          Selected {selectedFields.length} of {availableFields.length} available fields.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 max-h-60 overflow-y-auto">
          {availableFields.map((field) => {
            const isSelected = selectedFields.includes(field);
            const preview = getFieldPreview(field);
            const displayName = fieldMappings[field] || field;

            return (
              <div 
                key={field} 
                className={`p-3 border rounded-lg transition-colors ${
                  isSelected 
                    ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20' 
                    : 'border-border bg-background'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id={`field-${field}`}
                    checked={isSelected}
                    onChange={() => onFieldToggle(field, field)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Label 
                        htmlFor={`field-${field}`}
                        className="font-medium text-sm cursor-pointer"
                      >
                        {field}
                      </Label>
                      <Badge variant="secondary" className="text-xs">
                        <Type className="h-3 w-3 mr-1" />
                        {preview.type}
                      </Badge>
                      {onPreviewField && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onPreviewField(field)}
                          className="h-6 w-6 p-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2">
                      Sample: {preview.formattedValue}
                    </p>
                    
                    {isSelected && (
                      <div className="space-y-2">
                        <Label htmlFor={`mapping-${field}`} className="text-xs">
                          Display Name
                        </Label>
                        <Input
                          id={`mapping-${field}`}
                          value={displayName}
                          onChange={(e) => onFieldMappingChange(field, e.target.value)}
                          placeholder={field}
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
        
        {availableFields.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No fields found in API response</p>
          </div>
        )}
        
        {selectedFields.length === 0 && availableFields.length > 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Select at least one field to continue
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

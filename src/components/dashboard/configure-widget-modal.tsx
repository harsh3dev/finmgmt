"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  configureWidgetSchema, 
  validateFormData,
  type ConfigureWidgetInput
} from "@/lib/validation";
import type { ConfigureWidgetModalProps } from "@/types/widget";

// Common currency codes
const COMMON_CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'SGD', name: 'Singapore Dollar' }
];

export function ConfigureWidgetModal({ 
  isOpen, 
  widget, 
  onClose, 
  onSubmit,
  apiData 
}: ConfigureWidgetModalProps) {
  const [formData, setFormData] = useState<ConfigureWidgetInput>({
    selectedFields: [],
    fieldMappings: {},
    formatSettings: {},
    styling: {}
  });

  const [availableFields, setAvailableFields] = useState<string[]>([]);

  // Initialize form data when widget changes
  useEffect(() => {
    if (widget) {
      setFormData({
        selectedFields: widget.config.selectedFields,
        fieldMappings: widget.config.fieldMappings,
        formatSettings: widget.config.formatSettings,
        styling: widget.config.styling
      });
    }
  }, [widget]);

  // Extract available fields from API data
  useEffect(() => {
    if (apiData) {
      const fields = extractFieldsFromData(apiData);
      setAvailableFields(fields);
    }
  }, [apiData]);

  const extractFieldsFromData = (data: Record<string, unknown> | unknown[] | null): string[] => {
    if (!data) return [];
    
    const fields: string[] = [];
    
    const extractFields = (obj: unknown, prefix = ""): void => {
      if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
        const record = obj as Record<string, unknown>;
        Object.keys(record).forEach(key => {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          fields.push(fullKey);
          
          if (typeof record[key] === "object" && record[key] !== null && !Array.isArray(record[key])) {
            extractFields(record[key], fullKey);
          }
        });
      } else if (Array.isArray(obj) && obj.length > 0) {
        extractFields(obj[0], prefix);
      }
    };
    
    extractFields(data);
    return fields;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateFormData(configureWidgetSchema, formData);
    
    if (!validation.success) {
      // For now, log validation errors - could be displayed in UI later
      console.warn('Widget configuration validation errors:', validation.errors);
      return;
    }

    onSubmit(validation.data);
  };

  const handleClose = () => {
    onClose();
  };

  const toggleField = (field: string) => {
    setFormData((prev: ConfigureWidgetInput) => ({
      ...prev,
      selectedFields: prev.selectedFields.includes(field)
        ? prev.selectedFields.filter((f: string) => f !== field)
        : [...prev.selectedFields, field]
    }));
  };

  const updateFieldMapping = (field: string, displayName: string) => {
    setFormData((prev: ConfigureWidgetInput) => ({
      ...prev,
      fieldMappings: {
        ...prev.fieldMappings,
        [field]: displayName
      }
    }));
  };

  if (!widget) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Widget: {widget.name}</DialogTitle>
          <DialogDescription>
            Customize how your widget displays data from the API endpoint.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 py-4">
            {/* Field Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Field Selection</CardTitle>
                <CardDescription>
                  Choose which fields from the API response to display in your widget.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {availableFields.length > 0 ? (
                  <div className="grid gap-2 max-h-60 overflow-y-auto">
                    {availableFields.map((field: string) => (
                      <div key={field} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={`field-${field}`}
                          checked={formData.selectedFields.includes(field)}
                          onChange={() => toggleField(field)}
                          className="rounded border"
                        />
                        <Label 
                          htmlFor={`field-${field}`}
                          className="flex-1 cursor-pointer"
                        >
                          {field}
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No API data available for field selection.</p>
                    <p className="text-sm">Make sure the API endpoint is accessible and returns data.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Field Mappings */}
            {formData.selectedFields.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Field Display Names</CardTitle>
                  <CardDescription>
                    Customize how field names appear in your widget.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.selectedFields.map((field: string) => (
                    <div key={field} className="grid gap-2">
                      <Label htmlFor={`mapping-${field}`}>
                        {field}
                      </Label>
                      <Input
                        id={`mapping-${field}`}
                        placeholder={`Display name for ${field}`}
                        value={formData.fieldMappings[field] || ""}
                        onChange={(e) => updateFieldMapping(field, e.target.value)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Format Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Format Settings</CardTitle>
                <CardDescription>
                  Configure how numbers, dates, and other data types are displayed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={formData.formatSettings.currency || ""}
                      onValueChange={(value) => setFormData((prev: ConfigureWidgetInput) => ({
                        ...prev,
                        formatSettings: {
                          ...prev.formatSettings,
                          currency: value
                        }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_CURRENCIES.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.code} - {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Format numeric values as currency (applies to numbers and numeric strings)
                    </p>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="decimalPlaces">Decimal Places</Label>
                    <Input
                      id="decimalPlaces"
                      type="number"
                      min="0"
                      max="8"
                      placeholder="2"
                      value={formData.formatSettings.decimalPlaces ?? ""}
                      onChange={(e) => setFormData((prev: ConfigureWidgetInput) => ({
                        ...prev,
                        formatSettings: {
                          ...prev.formatSettings,
                          decimalPlaces: e.target.value ? parseInt(e.target.value) : undefined
                        }
                      }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Number of decimal places to show (default: 2 for currency)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Save Configuration</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

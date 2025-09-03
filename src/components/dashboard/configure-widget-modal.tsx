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
import { useFieldSelection } from "@/hooks/use-field-selection";
import { TreeFieldSelection } from "./add-widget-modal/tree-field-selection";

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
  name: '',
    selectedFields: [],
    fieldMappings: {},
    formatSettings: {},
    styling: {}
  });

  // Legacy simple field list retained if needed for fallback (currently not displayed when tree available)
  // Removed state since tree handles selection; can reintroduce if fallback UI needed.
  const fieldSelection = useFieldSelection();

  // Initialize form data when widget changes
  useEffect(() => {
    if (widget) {
      const initial = {
        name: widget.name,
        selectedFields: widget.config.selectedFields,
        fieldMappings: widget.config.fieldMappings,
        formatSettings: widget.config.formatSettings,
        styling: widget.config.styling
      };
      setFormData(initial);
      // Initialize field selection tree state
      fieldSelection.updateFieldSelection({
        responseData: apiData || null,
        selectedFields: widget.config.selectedFields,
        fieldMappings: widget.config.fieldMappings,
      });
    }
  // fieldSelection stable from hook; intentionally not adding to deps to avoid reset loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widget, apiData]);

  // Initialize response data for field tree if not already set
  useEffect(() => {
    if (apiData && !fieldSelection.fieldSelection.responseData) {
      fieldSelection.updateFieldSelection({ responseData: apiData });
    }
  }, [apiData, fieldSelection.fieldSelection.responseData, fieldSelection]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Merge tree-selected fields/mappings back into form data before validation
    const mergedFormData: ConfigureWidgetInput = {
      ...formData,
      selectedFields: fieldSelection.fieldSelection.selectedFields,
      fieldMappings: fieldSelection.fieldSelection.fieldMappings
    };

    const validation = validateFormData(configureWidgetSchema, mergedFormData);
    
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

  // Legacy update mapping through fieldSelection hook
  const updateFieldMapping = (field: string, displayName: string) => {
    fieldSelection.updateFieldMapping(field, displayName);
  };

  if (!widget) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Widget: {widget.name}</DialogTitle>
          <DialogDescription>
            Customize how your widget displays data from the API endpoint.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 py-4">
            {/* Widget Title */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Widget Title</CardTitle>
                <CardDescription>Update the display title for this widget.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <Label htmlFor="widget-name">Title</Label>
                  <Input
                    id="widget-name"
                    value={formData.name || ''}
                    placeholder="Enter widget title"
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>
            {/* Field Selection (Tree) */}
            {apiData ? (
              <TreeFieldSelection fieldSelection={fieldSelection} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Field Selection</CardTitle>
                  <CardDescription>
                    API data unavailable. Once data is loaded you can select fields.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">No API data to build field tree.</p>
                </CardContent>
              </Card>
            )}

            {/* Field Mappings */}
    {fieldSelection.fieldSelection.selectedFields.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Field Display Names</CardTitle>
                  <CardDescription>
                    Customize how field names appear in your widget.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
      {fieldSelection.fieldSelection.selectedFields.map((field: string) => (
                    <div key={field} className="grid gap-2">
                      <Label htmlFor={`mapping-${field}`}>
                        {field}
                      </Label>
                      <Input
                        id={`mapping-${field}`}
                        placeholder={`Display name for ${field}`}
        value={fieldSelection.fieldSelection.fieldMappings[field] || ""}
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

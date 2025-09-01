import { useState } from 'react';

export interface FieldSelection {
  responseData: Record<string, unknown> | unknown[] | null;
  selectedFields: string[];
  fieldMappings: Record<string, string>;
  previewField: string | null;
}

export function useFieldSelection() {
  const [fieldSelection, setFieldSelection] = useState<FieldSelection>({
    responseData: null,
    selectedFields: [],
    fieldMappings: {},
    previewField: null,
  });

  const updateFieldSelection = (updates: Partial<FieldSelection>) => {
    setFieldSelection(prev => ({ ...prev, ...updates }));
  };

  const toggleFieldSelection = (field: string, displayName?: string) => {
    setFieldSelection(prev => {
      const isSelected = prev.selectedFields.includes(field);
      
      if (isSelected) {
        // Remove field
        const newSelectedFields = prev.selectedFields.filter(f => f !== field);
        const newFieldMappings = { ...prev.fieldMappings };
        delete newFieldMappings[field];
        
        return {
          ...prev,
          selectedFields: newSelectedFields,
          fieldMappings: newFieldMappings
        };
      } else {
        // Add field
        const newSelectedFields = [...prev.selectedFields, field];
        const newFieldMappings = {
          ...prev.fieldMappings,
          [field]: displayName || field
        };
        
        return {
          ...prev,
          selectedFields: newSelectedFields,
          fieldMappings: newFieldMappings
        };
      }
    });
  };

  const updateFieldMapping = (field: string, displayName: string) => {
    setFieldSelection(prev => ({
      ...prev,
      fieldMappings: {
        ...prev.fieldMappings,
        [field]: displayName
      }
    }));
  };

  const setPreviewField = (field: string | null) => {
    setFieldSelection(prev => ({ ...prev, previewField: field }));
  };

  const reset = () => {
    setFieldSelection({
      responseData: null,
      selectedFields: [],
      fieldMappings: {},
      previewField: null,
    });
  };

  const hasSelections = fieldSelection.selectedFields.length > 0;
  const hasResponseData = fieldSelection.responseData !== null;

  return {
    fieldSelection,
    updateFieldSelection,
    toggleFieldSelection,
    updateFieldMapping,
    setPreviewField,
    reset,
    hasSelections,
    hasResponseData
  };
}

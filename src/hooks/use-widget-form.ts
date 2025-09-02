import { useState } from 'react';
import { createWidgetSchema, createWidgetWithoutApiSchema, validateFormData, type CreateWidgetInput } from '@/lib/validation';

export function useWidgetForm() {
  const [widgetData, setWidgetData] = useState<CreateWidgetInput>({
    name: "",
    apiEndpointId: "",
    refreshInterval: 300,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearFieldError = (fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const updateField = <K extends keyof CreateWidgetInput>(
    field: K, 
    value: CreateWidgetInput[K]
  ) => {
    setWidgetData(prev => ({ ...prev, [field]: value }));
    clearFieldError(field);
  };

  const validateForm = () => {
    setErrors({});
    
    const hasApiEndpoint = widgetData.apiEndpointId && widgetData.apiEndpointId !== 'new';
    
    let validation;
    if (hasApiEndpoint) {
      validation = validateFormData(createWidgetSchema, widgetData);
    } else if (widgetData.apiEndpointId === 'new') {
      validation = validateFormData(createWidgetWithoutApiSchema, widgetData);
    } else {
      setErrors({ apiEndpointId: 'Please select an API endpoint or create a new one' });
      return { success: false, data: null };
    }
    
    if (!validation.success) {
      setErrors(validation.errors);
      return { success: false, data: null };
    }

    return { success: true, data: validation.data as CreateWidgetInput };
  };

  const reset = () => {
    setWidgetData({
      name: "",
      apiEndpointId: "",
      refreshInterval: 300,
    });
    setErrors({});
  };

  return {
    widgetData,
    errors,
    updateField,
    validateForm,
    clearFieldError,
    reset,
    isValid: Object.keys(errors).length === 0 && widgetData.name && widgetData.apiEndpointId
  };
}

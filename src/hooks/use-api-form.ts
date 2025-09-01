import { useState } from 'react';
import { createApiEndpointSchema, validateFormData, type CreateApiEndpointInput } from '@/lib/validation';

export function useApiForm() {
  const [apiData, setApiData] = useState<CreateApiEndpointInput>({
    name: "",
    url: "",
    category: "stocks",
    description: "",
    apiKey: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearFieldError = (fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const updateField = <K extends keyof CreateApiEndpointInput>(
    field: K, 
    value: CreateApiEndpointInput[K]
  ) => {
    setApiData(prev => ({ ...prev, [field]: value }));
    clearFieldError(field);
  };

  const updateApiData = (newData: Partial<CreateApiEndpointInput>) => {
    setApiData(prev => ({ ...prev, ...newData }));
    // Clear related errors
    Object.keys(newData).forEach(key => {
      clearFieldError(key);
    });
  };

  const validateForm = (additionalData?: Partial<CreateApiEndpointInput>) => {
    setErrors({});
    
    const dataToValidate = { ...apiData, ...additionalData };

    // Add API key to headers if provided
    if (dataToValidate.apiKey) {
      dataToValidate.headers = {
        ...dataToValidate.headers,
        'Authorization': `Bearer ${dataToValidate.apiKey}`
      };
    }

    const validation = validateFormData(createApiEndpointSchema, dataToValidate);
    
    if (!validation.success) {
      setErrors(validation.errors);
      return { success: false, data: null };
    }

    return { success: true, data: validation.data };
  };

  const reset = () => {
    setApiData({
      name: "",
      url: "",
      category: "stocks",
      description: "",
      apiKey: "",
    });
    setErrors({});
  };

  return {
    apiData,
    errors,
    updateField,
    updateApiData,
    validateForm,
    clearFieldError,
    reset,
    isValid: Object.keys(errors).length === 0 && apiData.name && apiData.url
  };
}

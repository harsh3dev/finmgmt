import { useState } from 'react';
import { apiService } from '@/lib/api-service';
import { extractFieldsFromData, getMeaningfulFields, generateDisplayName } from '@/lib/utils';
import type { CreateApiEndpointInput } from '@/lib/validation';
import type { FieldSelection } from './use-field-selection';

export function useApiTesting() {
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const testApi = async (
    apiData: CreateApiEndpointInput,
    onSuccess?: (responseData: Record<string, unknown> | unknown[]) => void
  ) => {
    if (!apiData.url) {
      setApiTestResult({ success: false, message: 'URL is required' });
      return;
    }

    setIsTestingApi(true);
    setApiTestResult(null);

    try {
      const result = await apiService.testEndpoint(apiData);
      
      if (result.status === 'success') {
        setApiTestResult({ success: true, message: 'API endpoint is working correctly!' });
        
        if (result.data && onSuccess) {
          onSuccess(result.data);
        }
      } else {
        setApiTestResult({ success: false, message: result.error || 'API test failed' });
      }
    } catch (error) {
      setApiTestResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Test failed' 
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  const generateAutoFieldSelection = (responseData: Record<string, unknown> | unknown[]): FieldSelection => {
    const fields = extractFieldsFromData(responseData);
    const autoSelectedFields = getMeaningfulFields(fields);
    
    const mappings: Record<string, string> = {};
    autoSelectedFields.forEach(field => {
      mappings[field] = generateDisplayName(field);
    });
    
    return {
      responseData,
      selectedFields: autoSelectedFields,
      fieldMappings: mappings,
      previewField: null,
    };
  };

  const reset = () => {
    setIsTestingApi(false);
    setApiTestResult(null);
  };

  return {
    isTestingApi,
    apiTestResult,
    testApi,
    generateAutoFieldSelection,
    reset,
    hasTestResult: apiTestResult !== null,
    isTestSuccessful: apiTestResult?.success === true
  };
}

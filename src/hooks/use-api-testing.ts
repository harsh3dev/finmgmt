import { useState } from 'react';
import { apiService } from '@/lib/api-service';
import { extractFieldsFromData, getMeaningfulFields, generateDisplayName } from '@/lib/utils';
import type { CreateApiEndpointInput } from '@/lib/validation';
import type { ApiEndpoint } from '@/types/widget';
import type { FieldSelection } from './use-field-selection';

export function useApiTesting() {
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const testApi = async (
    apiData: CreateApiEndpointInput | Omit<ApiEndpoint, 'id' | 'createdAt' | 'updatedAt'>,
    onSuccess?: (responseData: Record<string, unknown> | unknown[]) => void
  ) => {
    if (!apiData.url) {
      setApiTestResult({ success: false, message: 'URL is required' });
      return;
    }

    setIsTestingApi(true);
    setApiTestResult(null);

    try {
      // Create a clean API data object for testing
      const apiDataForTesting = {
        name: apiData.name,
        url: apiData.url,
        category: apiData.category,
        headers: apiData.headers,
        apiKey: apiData.apiKey,
        description: apiData.description,
      };

      const result = await apiService.testEndpoint(apiDataForTesting);
      
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

  const setTestResult = (result: { success: boolean; message: string }) => {
    setApiTestResult(result);
  };

  return {
    isTestingApi,
    apiTestResult,
    testApi,
    generateAutoFieldSelection,
    reset,
    setTestResult,
    hasTestResult: apiTestResult !== null,
    isTestSuccessful: apiTestResult?.success === true
  };
}

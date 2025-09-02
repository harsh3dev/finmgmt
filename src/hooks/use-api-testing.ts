import { useState } from 'react';
import { apiService } from '@/lib/api-service';
import { buildFieldTree, flattenFieldTree } from '@/lib/field-analyzer';
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
    // Use the new tree-based field analysis
    const fieldTree = buildFieldTree(responseData, {
      maxDepth: 4,
      includeArrayItems: true,
      autoExpandArrays: false,
      showSampleValues: true,
      groupByDataType: false
    });
    
    // Flatten tree to get all selectable fields
    const allFields = flattenFieldTree(fieldTree);
    
    // Filter for selectable fields (simple values and arrays)
    const selectableFields = allFields.filter(field => 
      field.type === 'simple' || field.type === 'array'
    );
    
    // Auto-select meaningful fields (prioritize financial fields and non-system fields)
    const autoSelectedFields = selectableFields
      .filter(field => {
        const path = field.path.toLowerCase();
        // Exclude system/meta fields
        const isSystemField = ['id', '_id', '__v', 'timestamp', 'created_at', 'updated_at', 'date', 'time'].some(sys => 
          path.includes(sys) && !field.isFinancialData
        );
        return !isSystemField;
      })
      // Sort by priority: financial fields first, then by path simplicity
      .sort((a, b) => {
        if (a.isFinancialData && !b.isFinancialData) return -1;
        if (!a.isFinancialData && b.isFinancialData) return 1;
        return a.path.split('.').length - b.path.split('.').length;
      })
      // Take up to 8 fields to avoid overwhelming the UI
      .slice(0, 8)
      .map(field => field.path);
    
    // Generate field mappings using the display labels
    const mappings: Record<string, string> = {};
    selectableFields.forEach(field => {
      if (autoSelectedFields.includes(field.path)) {
        mappings[field.path] = field.displayLabel;
      }
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

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  type CreateWidgetInput,
  type CreateApiEndpointInput
} from "@/lib/validation";
import type { ApiEndpoint } from "@/types/widget";
import { useWidgetForm } from "@/hooks/use-widget-form";
import { useApiForm } from "@/hooks/use-api-form";
import { useApiTesting } from "@/hooks/use-api-testing";
import { useFieldSelection } from "@/hooks/use-field-selection";

// Add array configuration state
interface ArrayConfigType {
  displayMode: 'list' | 'table' | 'chart' | 'summary';
  selectedProperties?: string[];
  aggregationType?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ArrayConfigState {
  [fieldPath: string]: ArrayConfigType;
}
import { WidgetForm } from "./add-widget-modal/widget-form";
import { ApiForm } from "./add-widget-modal/api-form";
import { ApiTesting } from "./add-widget-modal/api-testing";
import { TreeFieldSelection } from "./add-widget-modal/tree-field-selection";
import { Button } from "@/components/ui/button";

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (widget: CreateWidgetInput, newApiEndpoint?: CreateApiEndpointInput) => void;
  apiEndpoints: ApiEndpoint[];
}

type ModalStep = 'widget' | 'field-selection' | 'api';

export function AddWidgetModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  apiEndpoints 
}: AddWidgetModalProps) {
  const [currentStep, setCurrentStep] = useState<ModalStep>('widget');
  const [selectedApiEndpoint, setSelectedApiEndpoint] = useState<ApiEndpoint | null>(null);
  const [arrayConfigs, setArrayConfigs] = useState<ArrayConfigState>({});
  
  const widgetForm = useWidgetForm();
  const apiForm = useApiForm();
  const apiTesting = useApiTesting();
  const fieldSelection = useFieldSelection();

  const handleWidgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = widgetForm.validateForm();
    if (!validation.success || !validation.data) return;

    // If using existing API, proceed to field selection
    const hasApiEndpoint = widgetForm.widgetData.apiEndpointId && 
                          widgetForm.widgetData.apiEndpointId !== 'new';
    
    if (hasApiEndpoint) {
      const selectedEndpoint = apiEndpoints.find(api => api.id === widgetForm.widgetData.apiEndpointId);
      if (selectedEndpoint) {
        setSelectedApiEndpoint(selectedEndpoint);
        setCurrentStep('field-selection');
        
        // If we have cached sample response, load it immediately
        if (selectedEndpoint.sampleResponse) {
          const autoFieldSelection = apiTesting.generateAutoFieldSelection(selectedEndpoint.sampleResponse);
          fieldSelection.updateFieldSelection(autoFieldSelection);
          apiTesting.setTestResult({ success: true, message: 'Using cached API response' });
        }
      }
    } else if (widgetForm.widgetData.apiEndpointId === 'new') {
      setCurrentStep('api');
    }
  };

  const handleArrayConfigChange = (field: string, config: ArrayConfigState[string]) => {
    setArrayConfigs(prev => ({
      ...prev,
      [field]: config
    }));
  };

  const handleFieldSelectionSubmit = () => {
    // Submit widget with selected fields from existing API
    const enhancedWidgetData = {
      ...widgetForm.widgetData,
      config: {
        selectedFields: fieldSelection.fieldSelection.selectedFields,
        fieldMappings: fieldSelection.fieldSelection.fieldMappings,
        formatSettings: {},
        styling: {},
        arrayConfigs: arrayConfigs // Include array configurations
      }
    };
    
    onSubmit(enhancedWidgetData);
    handleClose();
  };

  const handleTestExistingApi = async () => {
    console.log(selectedApiEndpoint);
    if (!selectedApiEndpoint) {
      console.warn('No selected API endpoint available for testing');
      apiTesting.setTestResult({ 
        success: false, 
        message: 'No API endpoint selected. Please go back and select an API endpoint.' 
      });
      return;
    }
    
    // If we have cached sample response, use it instead of making a new API call
    if (selectedApiEndpoint.sampleResponse) {
      const autoFieldSelection = apiTesting.generateAutoFieldSelection(selectedApiEndpoint.sampleResponse);
      fieldSelection.updateFieldSelection(autoFieldSelection);
      // Set the test result as successful
      apiTesting.setTestResult({ success: true, message: 'Using cached API response' });
      return;
    }
    
    // Otherwise, make a real API call
    await apiTesting.testApi(selectedApiEndpoint, (responseData) => {
      const autoFieldSelection = apiTesting.generateAutoFieldSelection(responseData);
      fieldSelection.updateFieldSelection(autoFieldSelection);
    });
  };

  const handleApiSubmit = (apiData: CreateApiEndpointInput, selectedFields: string[], fieldMappings: Record<string, string>) => {
    const enhancedWidgetData = {
      ...widgetForm.widgetData,
      config: {
        selectedFields,
        fieldMappings,
        formatSettings: {},
        styling: {}
      }
    };
    
    onSubmit(enhancedWidgetData, apiData);
    handleClose();
  };

  const handleClose = () => {
    setCurrentStep('widget');
    setSelectedApiEndpoint(null);
    widgetForm.reset();
    apiForm.reset();
    apiTesting.reset();
    fieldSelection.reset();
    onClose();
  };

  return (
    <div className="grid place-items-center max-w-8xl mx-auto">
      <Dialog open={isOpen} onOpenChange={handleClose}>
          {currentStep === 'widget' && (
            <DialogContent className="max-w-8xl w-full max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Widget</DialogTitle>
                <DialogDescription>
                  Create a new widget to display data from your API endpoints.
                </DialogDescription>
              </DialogHeader>
      
              <WidgetForm
                widgetData={widgetForm.widgetData}
                errors={widgetForm.errors}
                apiEndpoints={apiEndpoints}
                onFieldChange={widgetForm.updateField}
                onSubmit={handleWidgetSubmit}
                onCancel={handleClose}
              />
            </DialogContent>
          )}
          {currentStep === 'field-selection' && selectedApiEndpoint && (
            <DialogContent className="max-w-8xl w-full max-h-[90vh] overflow-y-auto">
              <DialogHeader className="w-fit">
                <DialogTitle>Configure Fields for {widgetForm.widgetData.name}</DialogTitle>
                <DialogDescription>
                  Test the API connection and select which fields to display in your widget.
                </DialogDescription>
              </DialogHeader>
      
              <div className="space-y-4 w-fit">
                {/* API Testing Section */}
                <ApiTesting
                  isTestingApi={apiTesting.isTestingApi}
                  apiTestResult={apiTesting.apiTestResult}
                  onTest={handleTestExistingApi}
                  disabled={false}
                />
                {/* Show info about cached response */}
                {selectedApiEndpoint?.sampleResponse && apiTesting.apiTestResult?.success && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 w-fit">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Using cached API response from when this endpoint was created. Click &quot;Test API&quot; above to fetch fresh data if needed.
                    </p>
                  </div>
                )}
                {/* Field Selection Section */}
                {fieldSelection.hasResponseData && apiTesting.isTestSuccessful && (
                  <TreeFieldSelection
                    fieldSelection={fieldSelection}
                    onArrayConfigChange={handleArrayConfigChange}
                  />
                )}
                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep('widget')}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleFieldSelectionSubmit}
                    disabled={
                      !apiTesting.apiTestResult?.success ||
                      (fieldSelection.hasResponseData && fieldSelection.fieldSelection.selectedFields.length === 0)
                    }
                  >
                    {!apiTesting.apiTestResult?.success
                      ? 'Test API Connection First'
                      : fieldSelection.hasResponseData
                        ? fieldSelection.fieldSelection.selectedFields.length === 0
                          ? 'Select Fields to Continue'
                          : `Create Widget with ${fieldSelection.fieldSelection.selectedFields.length} Field${fieldSelection.fieldSelection.selectedFields.length !== 1 ? 's' : ''}`
                        : 'Create Widget'
                    }
                  </Button>
                </div>
              </div>
            </DialogContent>
          )}
          {/* Error state for field-selection without selected API endpoint */}
          {currentStep === 'field-selection' && !selectedApiEndpoint && (
            <DialogContent className="max-w-8xl w-full max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Configuration Error</DialogTitle>
                <DialogDescription>
                  Unable to configure fields without a selected API endpoint.
                </DialogDescription>
              </DialogHeader>
      
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    <strong>Error:</strong> No API endpoint was selected. This shouldn&apos;t happen in normal flow.
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                    Please go back and select an API endpoint, or create a new one.
                  </p>
                </div>
      
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep('widget')}
                  >
                    Back to Widget Form
                  </Button>
                </div>
              </div>
            </DialogContent>
          )}
          {currentStep === 'api' && (
            <DialogContent className="max-w-8xl w-full max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add API Endpoint</DialogTitle>
                <DialogDescription>
                  Configure the API endpoint for your widget. You can paste a cURL command or fill the form manually.
                </DialogDescription>
              </DialogHeader>
      
              <ApiForm
                onSubmit={handleApiSubmit}
                onBack={() => setCurrentStep('widget')}
              />
            </DialogContent>
          )}
      </Dialog>
    </div>
  );
}

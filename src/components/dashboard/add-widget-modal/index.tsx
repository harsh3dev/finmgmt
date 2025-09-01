"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from ".";
import { 
  type CreateWidgetInput,
  type CreateApiEndpointInput
} from ".";
import { useWidgetForm } from ".";
import type { ApiEndpoint } from ".";
import { WidgetForm } from "./widget-form";
import { ApiForm } from "./api-form";

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (widget: CreateWidgetInput, newApiEndpoint?: CreateApiEndpointInput) => void;
  apiEndpoints: ApiEndpoint[];
}

type ModalStep = 'widget' | 'api';

export function AddWidgetModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  apiEndpoints 
}: AddWidgetModalProps) {
  const [currentStep, setCurrentStep] = useState<ModalStep>('widget');
  
  const widgetForm = useWidgetForm();

  const handleWidgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = widgetForm.validateForm();
    if (!validation.success || !validation.data) return;

    // If using existing API, submit directly
    const hasApiEndpoint = widgetForm.widgetData.apiEndpointId && 
                          widgetForm.widgetData.apiEndpointId !== 'new';
    
    if (hasApiEndpoint) {
      onSubmit(validation.data);
      handleClose();
    } else if (widgetForm.widgetData.apiEndpointId === 'new') {
      setCurrentStep('api');
    }
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
    widgetForm.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {currentStep === 'widget' && (
          <>
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
          </>
        )}

        {currentStep === 'api' && (
          <>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

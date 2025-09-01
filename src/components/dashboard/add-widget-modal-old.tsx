"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ExternalLink, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { 
  createWidgetSchema, 
  createWidgetWithoutApiSchema,
  createApiEndpointSchema, 
  validateFormData,
  DISPLAY_TYPES,
  API_CATEGORIES,
  REFRESH_INTERVALS,
  type CreateWidgetInput,
  type CreateApiEndpointInput
} from "@/lib/validation";
import { apiService } from "@/lib/api-service";
import { 
  extractFieldsFromData, 
  getFieldValue, 
  formatFieldValue, 
  generateDisplayName, 
  getMeaningfulFields 
} from "@/lib/utils";
import type { ApiEndpoint } from "@/types/widget";

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
  const [widgetData, setWidgetData] = useState<CreateWidgetInput>({
    name: "",
    apiEndpointId: "",
    displayType: "card",
    refreshInterval: 300,
  });
  
  const [apiData, setApiData] = useState<CreateApiEndpointInput>({
    name: "",
    url: "",
    category: "stocks",
    description: "",
    apiKey: "",
  });

  const [curlCommand, setCurlCommand] = useState("");
  const [inputMethod, setInputMethod] = useState<'form' | 'curl'>('form');
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Simplified field selection state
  const [fieldSelection, setFieldSelection] = useState<{
    responseData: Record<string, unknown> | unknown[] | null;
    selectedFields: string[];
    fieldMappings: Record<string, string>;
    previewField: string | null;
  }>({
    responseData: null,
    selectedFields: [],
    fieldMappings: {},
    previewField: null,
  });

  const [widgetErrors, setWidgetErrors] = useState<Record<string, string>>({});
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({});

  // Clear specific field errors when the field is changed
  const clearWidgetFieldError = (fieldName: string) => {
    setWidgetErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const clearApiFieldError = (fieldName: string) => {
    setApiErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  // Computed values for field selection
  const availableFields = fieldSelection.responseData ? extractFieldsFromData(fieldSelection.responseData) : [];
  const showFieldSelection = fieldSelection.responseData !== null && apiTestResult?.success;

  const handleWidgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setWidgetErrors({});
    
    // Determine which schema to use based on whether we have an API endpoint
    const hasApiEndpoint = widgetData.apiEndpointId && 
                          widgetData.apiEndpointId !== 'new';
    
    let validation;
    if (hasApiEndpoint) {
      validation = validateFormData(createWidgetSchema, widgetData);
    } else if (widgetData.apiEndpointId === 'new') {
      validation = validateFormData(createWidgetWithoutApiSchema, widgetData);
    } else {
      setWidgetErrors({ apiEndpointId: 'Please select an API endpoint or create a new one' });
      return;
    }
    
    if (!validation.success) {
      setWidgetErrors(validation.errors);
      return;
    }

    // If using existing API, submit directly
    if (hasApiEndpoint) {
      onSubmit(validation.data as CreateWidgetInput);
      handleClose();
    } else if (widgetData.apiEndpointId === 'new') {
      // Need to create new API endpoint
      setCurrentStep('api');
    }
  };

  const handleApiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let apiDataToValidate = { ...apiData };

    // Clear previous errors
    setApiErrors({});

    // Check if API has been tested successfully
    if (!apiTestResult?.success) {
      setApiErrors({ general: 'Please test the API connection successfully before creating the widget' });
      return;
    }

    // If cURL command is being used and provided, parse it and update apiData
    if (inputMethod === 'curl' && curlCommand.trim()) {
      try {
        const parsed = apiService.parseCurlCommand(curlCommand);
        if (!parsed.url) {
          setApiErrors({ curlCommand: 'No valid URL found in cURL command' });
          return;
        }
        apiDataToValidate = {
          ...apiDataToValidate,
          url: parsed.url,
          headers: { ...apiDataToValidate.headers, ...parsed.headers },
        };
      } catch (error) {
        setApiErrors({ 
          curlCommand: error instanceof Error ? error.message : 'Invalid cURL command format' 
        });
        return;
      }
    }

    // Add API key to headers if provided
    if (apiDataToValidate.apiKey) {
      apiDataToValidate.headers = {
        ...apiDataToValidate.headers,
        'Authorization': `Bearer ${apiDataToValidate.apiKey}`
      };
    }

    const validation = validateFormData(createApiEndpointSchema, apiDataToValidate);
    
    if (!validation.success) {
      setApiErrors(validation.errors);
      return;
    }

    // Check if fields are selected
    if (fieldSelection.selectedFields.length === 0) {
      setApiErrors({ general: 'Please select at least one field to display in your widget' });
      return;
    }
    
    // Create widget config with selected fields
    const enhancedWidgetData = {
      ...widgetData,
      config: {
        selectedFields: fieldSelection.selectedFields,
        fieldMappings: fieldSelection.fieldMappings,
        formatSettings: {},
        styling: {}
      }
    };
    
    // Submit both widget and API data
    onSubmit(enhancedWidgetData, validation.data);
    handleClose();
  };

  const handleTestApi = async () => {
    let apiDataToTest = { ...apiData };

    // If cURL command is being used and provided, parse it
    if (inputMethod === 'curl' && curlCommand.trim()) {
      try {
        const parsed = apiService.parseCurlCommand(curlCommand);
        apiDataToTest = {
          ...apiDataToTest,
          url: parsed.url || apiDataToTest.url,
          headers: { ...apiDataToTest.headers, ...parsed.headers },
        };
      } catch (error) {
        setApiTestResult({ 
          success: false, 
          message: error instanceof Error ? error.message : 'Invalid cURL command format' 
        });
        return;
      }
    }

    if (!apiDataToTest.url) {
      setApiTestResult({ success: false, message: 'URL is required' });
      return;
    }

    // Add API key to headers if provided
    if (apiDataToTest.apiKey) {
      apiDataToTest.headers = {
        ...apiDataToTest.headers,
        'Authorization': `Bearer ${apiDataToTest.apiKey}`
      };
    }

    setIsTestingApi(true);
    setApiTestResult(null);
    setFieldSelection({
      responseData: null,
      selectedFields: [],
      fieldMappings: {},
      previewField: null,
    });

    try {
      const result = await apiService.testEndpoint(apiDataToTest);
      
      if (result.status === 'success') {
        setApiTestResult({ success: true, message: 'API endpoint is working correctly!' });
        
        // Store the response data and extract fields
        if (result.data) {
          const fields = extractFieldsFromData(result.data);
          
          // Auto-select first few meaningful fields (non-nested, meaningful names)
          const autoSelectedFields = getMeaningfulFields(fields);
          
          // Auto-generate field mappings
          const mappings: Record<string, string> = {};
          autoSelectedFields.forEach(field => {
            mappings[field] = generateDisplayName(field);
          });
          
          setFieldSelection({
            responseData: result.data,
            selectedFields: autoSelectedFields,
            fieldMappings: mappings,
            previewField: null,
          });
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

  const handleClose = () => {
    setCurrentStep('widget');
    setWidgetData({
      name: "",
      apiEndpointId: "",
      displayType: "card",
      refreshInterval: 300,
    });
    setApiData({
      name: "",
      url: "",
      category: "stocks",
      description: "",
      apiKey: "",
    });
    setCurlCommand("");
    setInputMethod('form');
    setWidgetErrors({});
    setApiErrors({});
    setApiTestResult(null);
    setFieldSelection({
      responseData: null,
      selectedFields: [],
      fieldMappings: {},
      previewField: null,
    });
    onClose();
  };

  const parseCurlToForm = async () => {
    if (!curlCommand.trim()) {
      setApiErrors(prev => ({ ...prev, curlCommand: 'Please enter a cURL command' }));
      return;
    }

    setIsParsing(true);
    setApiErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.curlCommand;
      return newErrors;
    });

    try {
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const parsed = apiService.parseCurlCommand(curlCommand);
      
      if (!parsed.url) {
        setApiErrors(prev => ({ ...prev, curlCommand: 'No valid URL found in cURL command' }));
        return;
      }
      
      setApiData(prev => ({
        ...prev,
        url: parsed.url,
        headers: { ...prev.headers, ...parsed.headers },
      }));
      
      // Auto-populate name if not set
      if (!apiData.name && parsed.url) {
        try {
          const urlObj = new URL(parsed.url);
          const hostname = urlObj.hostname.replace('www.', '');
          setApiData(prev => ({
            ...prev,
            name: prev.name || `API from ${hostname}`,
          }));
        } catch {
          // Ignore URL parsing errors for name generation
        }
      }
      
      // Clear any previous test results since the URL has changed
      setApiTestResult(null);
      setFieldSelection({
        responseData: null,
        selectedFields: [],
        fieldMappings: {},
        previewField: null,
      });
      
    } catch (error) {
      setApiErrors(prev => ({ 
        ...prev, 
        curlCommand: error instanceof Error ? error.message : 'Invalid cURL command format' 
      }));
    } finally {
      setIsParsing(false);
    }
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
            
            <form onSubmit={handleWidgetSubmit} className="space-y-4">
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Widget Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Stock Prices, Portfolio Value"
                    value={widgetData.name}
                    onChange={(e) => {
                      setWidgetData(prev => ({ ...prev, name: e.target.value }));
                      clearWidgetFieldError('name');
                    }}
                    className={widgetErrors.name ? "border-destructive" : ""}
                  />
                  {widgetErrors.name && (
                    <p className="text-sm text-destructive">{widgetErrors.name}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="apiEndpoint">API Endpoint</Label>
                  <Select
                    value={widgetData.apiEndpointId}
                    onValueChange={(value) => {
                      setWidgetData(prev => ({ ...prev, apiEndpointId: value }));
                      clearWidgetFieldError('apiEndpointId');
                    }}
                  >
                    <SelectTrigger className={widgetErrors.apiEndpointId ? "border-destructive" : ""}>
                      <SelectValue placeholder={apiEndpoints.length === 0 ? "Create a new API endpoint" : "Select an API endpoint"} />
                    </SelectTrigger>
                    <SelectContent>
                      {apiEndpoints.length === 0 ? (
                        <SelectItem value="new">
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            <div className="flex flex-col">
                              <span className="font-medium">Create New API Endpoint</span>
                              <span className="text-sm text-muted-foreground">
                                No API endpoints found - create your first one
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ) : (
                        <>
                          {apiEndpoints.map((endpoint) => (
                            <SelectItem key={endpoint.id} value={endpoint.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{endpoint.name}</span>
                                <span className="text-sm text-muted-foreground">
                                  {endpoint.category} • {endpoint.url}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                          <SelectItem value="new">
                            <div className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              <span>Add New API Endpoint</span>
                            </div>
                          </SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {widgetErrors.apiEndpointId && (
                    <p className="text-sm text-destructive">{widgetErrors.apiEndpointId}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="displayType">Display Type</Label>
                  <Select
                    value={widgetData.displayType}
                    onValueChange={(value: "card" | "table" | "chart") => {
                      setWidgetData(prev => ({ ...prev, displayType: value }));
                      clearWidgetFieldError('displayType');
                    }}
                  >
                    <SelectTrigger className={widgetErrors.displayType ? "border-destructive" : ""}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DISPLAY_TYPES.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-sm text-muted-foreground">
                              {option.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {widgetErrors.displayType && (
                    <p className="text-sm text-destructive">{widgetErrors.displayType}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="refreshInterval">Refresh Interval</Label>
                  <Select
                    value={widgetData.refreshInterval.toString()}
                    onValueChange={(value) => {
                      setWidgetData(prev => ({ ...prev, refreshInterval: parseInt(value) }));
                      clearWidgetFieldError('refreshInterval');
                    }}
                  >
                    <SelectTrigger className={widgetErrors.refreshInterval ? "border-destructive" : ""}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REFRESH_INTERVALS.map((interval) => (
                        <SelectItem key={interval.value} value={interval.value.toString()}>
                          {interval.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {widgetErrors.refreshInterval && (
                    <p className="text-sm text-destructive">{widgetErrors.refreshInterval}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Minimum 30 seconds to avoid rate limiting
                  </p>
                </div>

                {/* Widget Validation Errors */}
                {Object.keys(widgetErrors).length > 0 && (
                  <Card className="border-destructive">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-destructive">Please fix the following errors:</h4>
                          <ul className="text-sm text-destructive space-y-1">
                            {Object.entries(widgetErrors).map(([field, message]) => (
                              <li key={field} className="flex items-start gap-1">
                                <span className="font-medium capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                <span>{message}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={!widgetData.name || !widgetData.apiEndpointId}
                >
                  {widgetData.apiEndpointId === 'new' 
                    ? 'Next: Configure API' 
                    : 'Add Widget'}
                </Button>
              </DialogFooter>
            </form>
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
            
            <form onSubmit={handleApiSubmit} className="space-y-4">
              <div className="grid gap-4 py-4">
                {/* Input Method Selection */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Configuration Method</CardTitle>
                    <CardDescription>
                      Choose how you want to add your API endpoint
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={inputMethod === 'form' ? 'default' : 'outline'}
                        onClick={() => setInputMethod('form')}
                        className="justify-start"
                      >
                        Manual Configuration
                      </Button>
                      <Button
                        type="button"
                        variant={inputMethod === 'curl' ? 'default' : 'outline'}
                        onClick={() => setInputMethod('curl')}
                        className="justify-start"
                      >
                        cURL Command
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* cURL Command Section */}
                {inputMethod === 'curl' && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        cURL Command
                      </CardTitle>
                      <CardDescription>
                        Paste a cURL command to automatically populate the form
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Textarea
                        placeholder="curl -X GET 'https://api.example.com/data' -H 'Authorization: Bearer token'"
                        value={curlCommand}
                        onChange={(e) => {
                          setCurlCommand(e.target.value);
                          clearApiFieldError('curlCommand');
                        }}
                        className={apiErrors.curlCommand ? "border-destructive" : ""}
                        rows={3}
                      />
                      {apiErrors.curlCommand && (
                        <p className="text-sm text-destructive">{apiErrors.curlCommand}</p>
                      )}
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={parseCurlToForm}
                        disabled={!curlCommand.trim() || isParsing}
                      >
                        {isParsing ? 'Parsing...' : 'Parse cURL to Form'}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Manual Form Section */}
                {inputMethod === 'form' && (
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="apiName">API Name</Label>
                      <Input
                        id="apiName"
                        placeholder="e.g., Alpha Vantage Stocks, Yahoo Finance"
                        value={apiData.name}
                        onChange={(e) => {
                          setApiData(prev => ({ ...prev, name: e.target.value }));
                          clearApiFieldError('name');
                        }}
                        className={apiErrors.name ? "border-destructive" : ""}
                      />
                      {apiErrors.name && (
                        <p className="text-sm text-destructive">{apiErrors.name}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="apiUrl">API URL</Label>
                      <Input
                        id="apiUrl"
                        placeholder="https://api.example.com/data"
                        value={apiData.url}
                        onChange={(e) => {
                          setApiData(prev => ({ ...prev, url: e.target.value }));
                          clearApiFieldError('url');
                        }}
                        className={apiErrors.url ? "border-destructive" : ""}
                      />
                      {apiErrors.url && (
                        <p className="text-sm text-destructive">{apiErrors.url}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="apiKey">API Key (Optional)</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        placeholder="Enter your API key if required"
                        value={apiData.apiKey || ""}
                        onChange={(e) => {
                          setApiData(prev => ({ ...prev, apiKey: e.target.value }));
                          clearApiFieldError('apiKey');
                        }}
                        className={apiErrors.apiKey ? "border-destructive" : ""}
                      />
                      {apiErrors.apiKey && (
                        <p className="text-sm text-destructive">{apiErrors.apiKey}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Will be added as Authorization: Bearer header
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="apiCategory">Category</Label>
                      <Select
                        value={apiData.category}
                        onValueChange={(value: "stocks" | "crypto" | "forex" | "commodities" | "bonds" | "indices" | "economic" | "custom") => {
                          setApiData(prev => ({ ...prev, category: value }));
                          clearApiFieldError('category');
                        }}
                      >
                        <SelectTrigger className={apiErrors.category ? "border-destructive" : ""}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {API_CATEGORIES.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              <div className="flex flex-col">
                                <span className="font-medium">{category.label}</span>
                                {category.description && (
                                  <span className="text-sm text-muted-foreground">
                                    {category.description}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {apiErrors.category && (
                        <p className="text-sm text-destructive">{apiErrors.category}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="apiDescription">Description (Optional)</Label>
                      <Textarea
                        id="apiDescription"
                        placeholder="Brief description of this API endpoint"
                        value={apiData.description || ""}
                        onChange={(e) => {
                          setApiData(prev => ({ ...prev, description: e.target.value }));
                          clearApiFieldError('description');
                        }}
                        className={apiErrors.description ? "border-destructive" : ""}
                        rows={2}
                      />
                      {apiErrors.description && (
                        <p className="text-sm text-destructive">{apiErrors.description}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Parsed Configuration for cURL method */}
                {inputMethod === 'curl' && Object.keys(apiData).some(key => apiData[key as keyof CreateApiEndpointInput] && key !== 'category') && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Parsed Configuration</CardTitle>
                      <CardDescription>
                        Review the parsed details from your cURL command
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="parsedApiName">API Name</Label>
                          <Input
                            id="parsedApiName"
                            placeholder="e.g., Alpha Vantage Stocks, Yahoo Finance"
                            value={apiData.name}
                            onChange={(e) => {
                              setApiData(prev => ({ ...prev, name: e.target.value }));
                              clearApiFieldError('name');
                            }}
                            className={apiErrors.name ? "border-destructive" : ""}
                          />
                          {apiErrors.name && (
                            <p className="text-sm text-destructive">{apiErrors.name}</p>
                          )}
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="parsedApiUrl">API URL</Label>
                          <Input
                            id="parsedApiUrl"
                            value={apiData.url}
                            onChange={(e) => {
                              setApiData(prev => ({ ...prev, url: e.target.value }));
                              clearApiFieldError('url');
                            }}
                            className={apiErrors.url ? "border-destructive" : ""}
                          />
                          {apiErrors.url && (
                            <p className="text-sm text-destructive">{apiErrors.url}</p>
                          )}
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="parsedApiCategory">Category</Label>
                          <Select
                            value={apiData.category}
                            onValueChange={(value: "stocks" | "crypto" | "forex" | "commodities" | "bonds" | "indices" | "economic" | "custom") => {
                              setApiData(prev => ({ ...prev, category: value }));
                              clearApiFieldError('category');
                            }}
                          >
                            <SelectTrigger className={apiErrors.category ? "border-destructive" : ""}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {API_CATEGORIES.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{category.label}</span>
                                    {category.description && (
                                      <span className="text-sm text-muted-foreground">
                                        {category.description}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {apiErrors.category && (
                            <p className="text-sm text-destructive">{apiErrors.category}</p>
                          )}
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="parsedApiDescription">Description (Optional)</Label>
                          <Textarea
                            id="parsedApiDescription"
                            placeholder="Brief description of this API endpoint"
                            value={apiData.description || ""}
                            onChange={(e) => {
                              setApiData(prev => ({ ...prev, description: e.target.value }));
                              clearApiFieldError('description');
                            }}
                            className={apiErrors.description ? "border-destructive" : ""}
                            rows={2}
                          />
                          {apiErrors.description && (
                            <p className="text-sm text-destructive">{apiErrors.description}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Test API Section */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Test API Connection</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleTestApi}
                        disabled={isTestingApi || !apiData.url}
                      >
                        {isTestingApi ? 'Testing...' : 'Test API'}
                      </Button>
                    </div>
                    {apiTestResult && (
                      <div className={`mt-3 p-3 rounded-md ${
                        apiTestResult.success 
                          ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' 
                          : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                      }`}>
                        <p className="text-sm">{apiTestResult.message}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Field Selection Section - Shows after successful API test */}
                {showFieldSelection && apiTestResult?.success && (
                  <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Select Fields to Display
                      </CardTitle>
                      <CardDescription>
                        Choose which data fields you want to show in your widget. Preview the data to see what each field contains.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {availableFields.length > 0 ? (
                        <>
                          <div className="grid gap-2 max-h-60 overflow-y-auto border rounded-md p-3 bg-background">
                            {availableFields.map((field: string) => (
                              <div key={field} className="flex items-center justify-between space-x-3 p-2 rounded-md hover:bg-muted/50">
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                  <input
                                    type="checkbox"
                                    id={`field-${field}`}
                                    checked={fieldSelection.selectedFields.includes(field)}
                                    onChange={() => {
                                      setFieldSelection(prev => {
                                        if (prev.selectedFields.includes(field)) {
                                          const newMappings = { ...prev.fieldMappings };
                                          delete newMappings[field];
                                          return {
                                            ...prev,
                                            selectedFields: prev.selectedFields.filter(f => f !== field),
                                            fieldMappings: newMappings,
                                          };
                                        } else {
                                          return {
                                            ...prev,
                                            selectedFields: [...prev.selectedFields, field],
                                            fieldMappings: {
                                              ...prev.fieldMappings,
                                              [field]: generateDisplayName(field)
                                            },
                                          };
                                        }
                                      });
                                    }}
                                    className="rounded border-2"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <Label 
                                      htmlFor={`field-${field}`}
                                      className="cursor-pointer text-sm font-medium truncate block"
                                    >
                                      {field}
                                    </Label>
                                    {fieldSelection.selectedFields.includes(field) && (
                                      <Input
                                        placeholder={`Display name for ${field}`}
                                        value={fieldSelection.fieldMappings[field] || ""}
                                        onChange={(e) => setFieldSelection(prev => ({
                                          ...prev,
                                          fieldMappings: {
                                            ...prev.fieldMappings,
                                            [field]: e.target.value
                                          }
                                        }))}
                                        className="mt-1 text-xs h-7"
                                      />
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFieldSelection(prev => ({
                                      ...prev,
                                      previewField: prev.previewField === field ? null : field
                                    }))}
                                    className="h-7 w-7 p-0"
                                  >
                                    {fieldSelection.previewField === field ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                  </Button>
                                  <Badge variant={fieldSelection.selectedFields.includes(field) ? "default" : "secondary"} className="text-xs">
                                    {typeof getFieldValue(fieldSelection.responseData, field) === 'number' ? 'Number' :
                                     typeof getFieldValue(fieldSelection.responseData, field) === 'string' ? 'Text' :
                                     typeof getFieldValue(fieldSelection.responseData, field) === 'boolean' ? 'Boolean' : 'Object'}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {fieldSelection.previewField && (
                            <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm">Preview: {fieldSelection.previewField}</CardTitle>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <div className="bg-background rounded-md p-3 font-mono text-sm">
                                  <strong>Sample Value:</strong> {formatFieldValue(getFieldValue(fieldSelection.responseData, fieldSelection.previewField))}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                          
                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="text-sm text-muted-foreground">
                              {fieldSelection.selectedFields.length} field{fieldSelection.selectedFields.length !== 1 ? 's' : ''} selected
                            </div>
                            {fieldSelection.selectedFields.length === 0 && (
                              <div className="text-sm text-orange-600 dark:text-orange-400">
                                Select at least one field to display in your widget
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No fields found in the API response.</p>
                          <p className="text-sm">The API might be returning empty data or an unexpected format.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* API Validation Errors */}
                {Object.keys(apiErrors).length > 0 && (
                  <Card className="border-destructive">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-destructive">Please fix the following errors:</h4>
                          <ul className="text-sm text-destructive space-y-1">
                            {Object.entries(apiErrors).map(([field, message]) => (
                              <li key={field} className="flex items-start gap-1">
                                {field !== 'general' && (
                                  <span className="font-medium capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                )}
                                <span>{message}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCurrentStep('widget')}
                >
                  Back
                </Button>
                <Button 
                  type="submit"
                  disabled={
                    (inputMethod === 'curl' ? !curlCommand.trim() && !apiData.url : !apiData.name || !apiData.url) ||
                    !apiTestResult?.success ||
                    (showFieldSelection && fieldSelection.selectedFields.length === 0)
                  }
                >
                  {!apiTestResult?.success
                    ? 'Test API Connection First'
                    : showFieldSelection 
                      ? fieldSelection.selectedFields.length === 0 
                        ? 'Select Fields to Continue'
                        : `Create Widget with ${fieldSelection.selectedFields.length} Field${fieldSelection.selectedFields.length !== 1 ? 's' : ''}`
                      : 'Create Widget & API'
                  }
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

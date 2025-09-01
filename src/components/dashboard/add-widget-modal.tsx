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
import { Plus, ExternalLink, AlertCircle } from "lucide-react";
import { 
  createWidgetSchema, 
  createApiEndpointSchema, 
  validateFormData,
  DISPLAY_TYPES,
  API_CATEGORIES,
  REFRESH_INTERVALS,
  type CreateWidgetInput,
  type CreateApiEndpointInput
} from "@/lib/validation";
import { apiService } from "@/lib/api-service";
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
  });

  const [curlCommand, setCurlCommand] = useState("");
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [widgetErrors, setWidgetErrors] = useState<Record<string, string>>({});
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({});

  const handleWidgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateFormData(createWidgetSchema, widgetData);
    
    if (!validation.success) {
      setWidgetErrors(validation.errors);
      return;
    }

    setWidgetErrors({});

    // If using existing API or creating new one
    if (widgetData.apiEndpointId === 'new' || widgetData.apiEndpointId === '') {
      setCurrentStep('api');
    } else {
      onSubmit(validation.data);
      handleClose();
    }
  };

  const handleApiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let apiDataToValidate = { ...apiData };

    // If cURL command is provided, parse it and update apiData
    if (curlCommand.trim()) {
      try {
        const parsed = apiService.parseCurlCommand(curlCommand);
        apiDataToValidate = {
          ...apiDataToValidate,
          url: parsed.url || apiDataToValidate.url,
          headers: { ...apiDataToValidate.headers, ...parsed.headers },
        };
      } catch {
        setApiErrors({ curlCommand: 'Invalid cURL command format' });
        return;
      }
    }

    const validation = validateFormData(createApiEndpointSchema, apiDataToValidate);
    
    if (!validation.success) {
      setApiErrors(validation.errors);
      return;
    }

    setApiErrors({});
    
    // Submit both widget and API data
    onSubmit(widgetData, validation.data);
    handleClose();
  };

  const handleTestApi = async () => {
    let apiDataToTest = { ...apiData };

    // If cURL command is provided, parse it
    if (curlCommand.trim()) {
      try {
        const parsed = apiService.parseCurlCommand(curlCommand);
        apiDataToTest = {
          ...apiDataToTest,
          url: parsed.url || apiDataToTest.url,
          headers: { ...apiDataToTest.headers, ...parsed.headers },
        };
      } catch {
        setApiTestResult({ success: false, message: 'Invalid cURL command format' });
        return;
      }
    }

    if (!apiDataToTest.url) {
      setApiTestResult({ success: false, message: 'URL is required' });
      return;
    }

    setIsTestingApi(true);
    setApiTestResult(null);

    try {
      const result = await apiService.testEndpoint(apiDataToTest);
      
      if (result.status === 'success') {
        setApiTestResult({ success: true, message: 'API endpoint is working correctly!' });
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
    });
    setCurlCommand("");
    setWidgetErrors({});
    setApiErrors({});
    setApiTestResult(null);
    onClose();
  };

  const parseCurlToForm = () => {
    if (!curlCommand.trim()) return;

    try {
      const parsed = apiService.parseCurlCommand(curlCommand);
      setApiData(prev => ({
        ...prev,
        url: parsed.url || prev.url,
        headers: { ...prev.headers, ...parsed.headers },
      }));
    } catch {
      setApiErrors({ curlCommand: 'Invalid cURL command format' });
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
                    onChange={(e) => setWidgetData(prev => ({ ...prev, name: e.target.value }))}
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
                    onValueChange={(value) => setWidgetData(prev => ({ ...prev, apiEndpointId: value }))}
                  >
                    <SelectTrigger className={widgetErrors.apiEndpointId ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select an API endpoint" />
                    </SelectTrigger>
                    <SelectContent>
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
                    onValueChange={(value: "card" | "table" | "chart") => 
                      setWidgetData(prev => ({ ...prev, displayType: value }))
                    }
                  >
                    <SelectTrigger>
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
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="refreshInterval">Refresh Interval</Label>
                  <Select
                    value={widgetData.refreshInterval.toString()}
                    onValueChange={(value) => 
                      setWidgetData(prev => ({ ...prev, refreshInterval: parseInt(value) }))
                    }
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
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {widgetData.apiEndpointId === 'new' || widgetData.apiEndpointId === '' ? 'Next: Configure API' : 'Add Widget'}
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
                {/* cURL Command Section */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      cURL Command (Optional)
                    </CardTitle>
                    <CardDescription>
                      Paste a cURL command to automatically populate the form
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      placeholder="curl -X GET 'https://api.example.com/data' -H 'Authorization: Bearer token'"
                      value={curlCommand}
                      onChange={(e) => setCurlCommand(e.target.value)}
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
                      disabled={!curlCommand.trim()}
                    >
                      Parse cURL to Form
                    </Button>
                  </CardContent>
                </Card>

                {/* Manual Form Section */}
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="apiName">API Name</Label>
                    <Input
                      id="apiName"
                      placeholder="e.g., Alpha Vantage Stocks, Yahoo Finance"
                      value={apiData.name}
                      onChange={(e) => setApiData(prev => ({ ...prev, name: e.target.value }))}
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
                      onChange={(e) => setApiData(prev => ({ ...prev, url: e.target.value }))}
                      className={apiErrors.url ? "border-destructive" : ""}
                    />
                    {apiErrors.url && (
                      <p className="text-sm text-destructive">{apiErrors.url}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="apiCategory">Category</Label>
                    <Select
                      value={apiData.category}
                      onValueChange={(value: "stocks" | "crypto" | "forex" | "commodities" | "bonds" | "indices" | "economic" | "custom") => 
                        setApiData(prev => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
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
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="apiDescription">Description (Optional)</Label>
                    <Textarea
                      id="apiDescription"
                      placeholder="Brief description of this API endpoint"
                      value={apiData.description || ""}
                      onChange={(e) => setApiData(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                    />
                  </div>

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
                </div>
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCurrentStep('widget')}
                >
                  Back
                </Button>
                <Button type="submit">
                  Create Widget & API
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

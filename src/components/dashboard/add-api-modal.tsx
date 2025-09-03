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
import { ExternalLink, AlertCircle } from "lucide-react";
import { SecureApiKeyInput } from "@/components/ui/secure-api-key-input";
import { 
  createApiEndpointSchema, 
  validateFormData,
  API_CATEGORIES,
  type CreateApiEndpointInput
} from "@/lib/validation";
import { apiService } from "@/lib/api-service";

interface AddApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (api: CreateApiEndpointInput) => void;
}

export function AddApiModal({ 
  isOpen, 
  onClose, 
  onSubmit 
}: AddApiModalProps) {
  const [formData, setFormData] = useState<CreateApiEndpointInput>({
    name: "",
    url: "",
    category: "stocks",
    description: "",
    apiKey: "",
  });

  const [curlCommand, setCurlCommand] = useState("");
  const [inputMethod, setInputMethod] = useState<'form' | 'curl'>('form');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Clear specific field errors when the field is changed
  const clearFieldError = (fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let dataToValidate = { ...formData };

    // Clear previous errors
    setErrors({});

    // Check if API has been tested successfully
    if (!apiTestResult?.success) {
      setErrors({ general: 'Please test the API connection successfully before adding the endpoint' });
      return;
    }

    // If cURL command is being used and provided, parse it and merge with form data
    if (inputMethod === 'curl' && curlCommand.trim()) {
      try {
        const parsed = apiService.parseCurlCommand(curlCommand);
        if (!parsed.url) {
          setErrors({ curlCommand: 'No valid URL found in cURL command' });
          return;
        }
        dataToValidate = {
          ...dataToValidate,
          url: parsed.url,
          headers: { ...dataToValidate.headers, ...parsed.headers },
        };
      } catch (error) {
        setErrors({ 
          curlCommand: error instanceof Error ? error.message : 'Invalid cURL command format' 
        });
        return;
      }
    }

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
      return;
    }

    onSubmit(validation.data);
    handleClose();
  };

  const handleTestApi = async () => {
    let dataToTest: Omit<CreateApiEndpointInput, 'sampleResponse'> & {
      sampleResponse?: Record<string, unknown> | unknown[] | null;
    } = { ...formData };

    // Clear previous test results
    setApiTestResult(null);

    // If cURL command is being used and provided, parse it
    if (inputMethod === 'curl' && curlCommand.trim()) {
      try {
        const parsed = apiService.parseCurlCommand(curlCommand);
        if (!parsed.url) {
          setApiTestResult({ success: false, message: 'No valid URL found in cURL command' });
          return;
        }
        dataToTest = {
          ...dataToTest,
          url: parsed.url,
          headers: { ...dataToTest.headers, ...parsed.headers },
        };
      } catch (error) {
        setApiTestResult({ 
          success: false, 
          message: error instanceof Error ? error.message : 'Invalid cURL command format' 
        });
        return;
      }
    }

    if (!dataToTest.url) {
      setApiTestResult({ success: false, message: 'URL is required' });
      return;
    }

    // Add API key to headers if provided
    if (dataToTest.apiKey) {
      dataToTest.headers = {
        ...dataToTest.headers,
        'Authorization': `Bearer ${dataToTest.apiKey}`
      };
    }

    setIsTestingApi(true);

    try {
      const result = await apiService.testEndpoint(dataToTest);
      
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

  const parseCurlToForm = async () => {
    if (!curlCommand.trim()) {
      setErrors(prev => ({ ...prev, curlCommand: 'Please enter a cURL command' }));
      return;
    }

    setIsParsing(true);
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.curlCommand;
      return newErrors;
    });

    try {
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const parsed = apiService.parseCurlCommand(curlCommand);
      
      if (!parsed.url) {
        setErrors(prev => ({ ...prev, curlCommand: 'No valid URL found in cURL command' }));
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        url: parsed.url,
        headers: { ...prev.headers, ...parsed.headers },
      }));
      
      // Auto-populate name if not set
      if (!formData.name && parsed.url) {
        try {
          const urlObj = new URL(parsed.url);
          const hostname = urlObj.hostname.replace('www.', '');
          setFormData(prev => ({
            ...prev,
            name: prev.name || `API from ${hostname}`,
          }));
        } catch {
          // Ignore URL parsing errors for name generation
        }
      }
      
      setApiTestResult(null);
      
    } catch (error) {
      setErrors(prev => ({ 
        ...prev, 
        curlCommand: error instanceof Error ? error.message : 'Invalid cURL command format' 
      }));
    } finally {
      setIsParsing(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      url: "",
      category: "stocks",
      description: "",
      apiKey: "",
    });
    setCurlCommand("");
    setInputMethod('form');
    setErrors({});
    setApiTestResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add API Endpoint</DialogTitle>
          <DialogDescription>
            Configure a new API endpoint to fetch financial data for your widgets.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
                      clearFieldError('curlCommand');
                    }}
                    className={errors.curlCommand ? "border-destructive" : ""}
                    rows={3}
                  />
                  {errors.curlCommand && (
                    <p className="text-sm text-destructive">{errors.curlCommand}</p>
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
                  <Label htmlFor="name">API Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Alpha Vantage Stocks, Yahoo Finance"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, name: e.target.value }));
                      clearFieldError('name');
                    }}
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="url">API URL</Label>
                  <Input
                    id="url"
                    placeholder="https://api.example.com/data"
                    value={formData.url}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, url: e.target.value }));
                      clearFieldError('url');
                    }}
                    className={errors.url ? "border-destructive" : ""}
                  />
                  {errors.url && (
                    <p className="text-sm text-destructive">{errors.url}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <SecureApiKeyInput
                    label="API Key (Optional)"
                    placeholder="Enter your API key if required"
                    value={formData.apiKey || ""}
                    onChange={(value) => {
                      setFormData(prev => ({ ...prev, apiKey: value }));
                      clearFieldError('apiKey');
                    }}
                    storageKey={`api-endpoint-${formData.name.toLowerCase().replace(/\s+/g, '-')}`}
                    error={errors.apiKey}
                    helperText="Will be added as Authorization: Bearer header"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: "stocks" | "crypto" | "forex" | "commodities" | "bonds" | "indices" | "economic" | "custom") => {
                      setFormData(prev => ({ ...prev, category: value }));
                      clearFieldError('category');
                    }}
                  >
                    <SelectTrigger className={errors.category ? "border-destructive" : ""}>
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
                  {errors.category && (
                    <p className="text-sm text-destructive">{errors.category}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of this API endpoint"
                    value={formData.description || ""}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, description: e.target.value }));
                      clearFieldError('description');
                    }}
                    className={errors.description ? "border-destructive" : ""}
                    rows={2}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description}</p>
                  )}
                </div>
              </div>
            )}

            {/* Common fields that show regardless of method */}
            {inputMethod === 'curl' && Object.keys(formData).some(key => formData[key as keyof CreateApiEndpointInput] && key !== 'category') && (
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
                      <Label htmlFor="parsedName">API Name</Label>
                      <Input
                        id="parsedName"
                        placeholder="e.g., Alpha Vantage Stocks, Yahoo Finance"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, name: e.target.value }));
                          clearFieldError('name');
                        }}
                        className={errors.name ? "border-destructive" : ""}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">{errors.name}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="parsedUrl">API URL</Label>
                      <Input
                        id="parsedUrl"
                        value={formData.url}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, url: e.target.value }));
                          clearFieldError('url');
                        }}
                        className={errors.url ? "border-destructive" : ""}
                      />
                      {errors.url && (
                        <p className="text-sm text-destructive">{errors.url}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="parsedCategory">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value: "stocks" | "crypto" | "forex" | "commodities" | "bonds" | "indices" | "economic" | "custom") => {
                          setFormData(prev => ({ ...prev, category: value }));
                          clearFieldError('category');
                        }}
                      >
                        <SelectTrigger className={errors.category ? "border-destructive" : ""}>
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
                      {errors.category && (
                        <p className="text-sm text-destructive">{errors.category}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="parsedDescription">Description (Optional)</Label>
                      <Textarea
                        id="parsedDescription"
                        placeholder="Brief description of this API endpoint"
                        value={formData.description || ""}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, description: e.target.value }));
                          clearFieldError('description');
                        }}
                        className={errors.description ? "border-destructive" : ""}
                        rows={2}
                      />
                      {errors.description && (
                        <p className="text-sm text-destructive">{errors.description}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Test API Section */}
            <Card>
              <CardContent className="pt-6 max-w-3xl">
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
                    disabled={isTestingApi || (!formData.url && !curlCommand)}
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

            {/* Global Validation Errors */}
            {Object.keys(errors).length > 0 && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-destructive">Please fix the following errors:</h4>
                      <ul className="text-sm text-destructive space-y-1">
                        {Object.entries(errors).map(([field, message]) => (
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
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={
                (inputMethod === 'curl' ? !curlCommand.trim() && !formData.url : !formData.name || !formData.url) ||
                !apiTestResult?.success
              }
            >
              {!apiTestResult?.success ? 'Test API Connection First' : 'Add API Endpoint'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

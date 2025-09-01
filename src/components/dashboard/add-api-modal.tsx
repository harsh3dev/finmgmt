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
  });

  const [curlCommand, setCurlCommand] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let dataToValidate = { ...formData };

    // If cURL command is provided, parse it and merge with form data
    if (curlCommand.trim()) {
      try {
        const parsed = apiService.parseCurlCommand(curlCommand);
        dataToValidate = {
          ...dataToValidate,
          url: parsed.url || dataToValidate.url,
          headers: { ...dataToValidate.headers, ...parsed.headers },
        };
      } catch {
        setErrors({ curlCommand: 'Invalid cURL command format' });
        return;
      }
    }

    const validation = validateFormData(createApiEndpointSchema, dataToValidate);
    
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    onSubmit(validation.data);
    handleClose();
  };

  const handleTestApi = async () => {
    let dataToTest = { ...formData };

    // If cURL command is provided, parse it
    if (curlCommand.trim()) {
      try {
        const parsed = apiService.parseCurlCommand(curlCommand);
        dataToTest = {
          ...dataToTest,
          url: parsed.url || dataToTest.url,
          headers: { ...dataToTest.headers, ...parsed.headers },
        };
      } catch {
        setApiTestResult({ success: false, message: 'Invalid cURL command format' });
        return;
      }
    }

    if (!dataToTest.url) {
      setApiTestResult({ success: false, message: 'URL is required' });
      return;
    }

    setIsTestingApi(true);
    setApiTestResult(null);

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

  const parseCurlToForm = () => {
    if (!curlCommand.trim()) return;

    try {
      const parsed = apiService.parseCurlCommand(curlCommand);
      setFormData(prev => ({
        ...prev,
        url: parsed.url || prev.url,
        headers: { ...prev.headers, ...parsed.headers },
      }));
      setErrors({});
    } catch {
      setErrors({ curlCommand: 'Invalid cURL command format' });
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      url: "",
      category: "stocks",
      description: "",
    });
    setCurlCommand("");
    setErrors({});
    setApiTestResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add API Endpoint</DialogTitle>
          <DialogDescription>
            Configure a new API endpoint to fetch financial data for your widgets.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
                  disabled={!curlCommand.trim()}
                >
                  Parse cURL to Form
                </Button>
              </CardContent>
            </Card>

            {/* Manual Form Section */}
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">API Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Alpha Vantage Stocks, Yahoo Finance"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  className={errors.url ? "border-destructive" : ""}
                />
                {errors.url && (
                  <p className="text-sm text-destructive">{errors.url}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: "stocks" | "crypto" | "forex" | "commodities" | "bonds" | "indices" | "economic" | "custom") => 
                    setFormData(prev => ({ ...prev, category: value }))
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
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this API endpoint"
                  value={formData.description || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className={errors.description ? "border-destructive" : ""}
                  rows={2}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description}</p>
                )}
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
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Add API Endpoint</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

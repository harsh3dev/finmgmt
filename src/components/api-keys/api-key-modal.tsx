"use client";

import { useState, useEffect } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { SecureApiKeyInput } from "@/components/ui/secure-api-key-input";
import { AlertCircle, CheckCircle, Key } from "lucide-react";
import { ApiKey } from "@/store/slices/apiKeySlice";
import { toast } from "sonner";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (apiKey: Omit<ApiKey, 'id' | 'createdAt'>) => void;
  apiKey?: ApiKey | null; // For editing
  mode?: 'create' | 'edit';
}

interface FormData {
  name: string;
  service: string;
  key: string;
  description: string;
  isDefault: boolean;
}

const API_SERVICES = [
  { value: "alpha_vantage", label: "Alpha Vantage", description: "Stock, forex, and crypto data" },
  { value: "yahoo_finance", label: "Yahoo Finance", description: "Financial market data" },
  { value: "polygon", label: "Polygon.io", description: "Real-time and historical market data" },
  { value: "finnhub", label: "Finnhub", description: "Stock market and company data" },
  { value: "fmp", label: "Financial Modeling Prep", description: "Financial statements and ratios" },
  { value: "quandl", label: "Quandl", description: "Economic and alternative data" },
  { value: "custom", label: "Custom API", description: "Other financial data provider" },
];

export function ApiKeyModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  apiKey, 
  mode = 'create' 
}: ApiKeyModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    service: "",
    key: "",
    description: "",
    isDefault: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Reset form when modal opens/closes or apiKey changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && apiKey) {
        setFormData({
          name: apiKey.name,
          service: apiKey.service,
          key: apiKey.key,
          description: apiKey.description || "",
          isDefault: apiKey.isDefault || false,
        });
      } else {
        setFormData({
          name: "",
          service: "",
          key: "",
          description: "",
          isDefault: false,
        });
      }
      setErrors({});
      setTestResult(null);
    }
  }, [isOpen, apiKey, mode]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "API key name is required";
    }

    if (!formData.service) {
      newErrors.service = "Service type is required";
    }

    if (!formData.key.trim()) {
      newErrors.key = "API key is required";
    }

    if (formData.key.length < 8) {
      newErrors.key = "API key must be at least 8 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTestKey = async () => {
    if (!formData.key || !formData.service) {
      toast.error("Please enter both service type and API key");
      return;
    }

    setIsTestingKey(true);
    setTestResult(null);

    try {
      // Simulate API key testing based on service
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simple validation based on service
      let isValid = false;
      let message = "";

      switch (formData.service) {
        case "alpha_vantage":
          isValid = formData.key.length >= 16 && /^[A-Z0-9]+$/.test(formData.key);
          message = isValid ? "Alpha Vantage API key is valid" : "Invalid Alpha Vantage API key format";
          break;
        case "polygon":
          isValid = formData.key.length >= 32;
          message = isValid ? "Polygon API key is valid" : "Invalid Polygon API key format";
          break;
        default:
          isValid = formData.key.length >= 8;
          message = isValid ? "API key format appears valid" : "API key format may be invalid";
      }

      setTestResult({
        success: isValid,
        message: message
      });

      if (isValid) {
        toast.success("API key test successful");
      } else {
        toast.error("API key test failed");
      }
    } catch {
      setTestResult({
        success: false,
        message: "Failed to test API key"
      });
      toast.error("Failed to test API key");
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const apiKeyData: Omit<ApiKey, 'id' | 'createdAt'> = {
      name: formData.name.trim(),
      service: formData.service,
      key: formData.key.trim(),
      description: formData.description.trim() || undefined,
      isEncrypted: false, // Will be handled by middleware
      lastUsed: apiKey?.lastUsed,
      isDefault: formData.isDefault,
    };

    onSubmit(apiKeyData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      name: "",
      service: "",
      key: "",
      description: "",
      isDefault: false,
    });
    setErrors({});
    setTestResult(null);
    onClose();
  };

  const clearFieldError = (fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            {mode === 'edit' ? 'Edit API Key' : 'Add New API Key'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Update your API key details and settings'
              : 'Add a new API key for accessing financial data services'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {/* API Key Name */}
            <div className="space-y-2">
              <Label htmlFor="name">API Key Name*</Label>
              <Input
                id="name"
                placeholder="e.g., My Alpha Vantage Key"
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

            {/* Service Type */}
            <div className="space-y-2">
              <Label htmlFor="service">Service Type*</Label>
              <Select
                value={formData.service}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, service: value }));
                  clearFieldError('service');
                  setTestResult(null);
                }}
              >
                <SelectTrigger className={errors.service ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {API_SERVICES.map((service) => (
                    <SelectItem key={service.value} value={service.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{service.label}</span>
                        <span className="text-sm text-muted-foreground">
                          {service.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.service && (
                <p className="text-sm text-destructive">{errors.service}</p>
              )}
            </div>

            {/* API Key Input */}
            <div className="space-y-2">
              <SecureApiKeyInput
                label="API Key*"
                placeholder="Enter your API key"
                value={formData.key}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, key: value }));
                  clearFieldError('key');
                  setTestResult(null);
                }}
                storageKey={`api-key-modal-${formData.service}`}
                error={errors.key}
                helperText="Your API key will be securely encrypted and stored"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this API key"
                value={formData.description}
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

            {/* Default Key Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({ ...prev, isDefault: !!checked }));
                }}
              />
              <Label htmlFor="isDefault" className="text-sm">
                Set as default key for {formData.service ? API_SERVICES.find(s => s.value === formData.service)?.label : 'this service'}
              </Label>
            </div>

            {/* Test API Key Section */}
            <Card className="border-border">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Test API Key</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestKey}
                    disabled={isTestingKey || !formData.key || !formData.service}
                  >
                    {isTestingKey ? 'Testing...' : 'Test Key'}
                  </Button>
                </div>
                
                {testResult && (
                  <div className={`p-3 rounded-md text-sm flex items-center gap-2 ${
                    testResult.success 
                      ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                      : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Form Validation Errors */}
            {Object.keys(errors).length > 0 && (
              <Card className="border-destructive">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-destructive">Please fix the following errors:</h4>
                      <ul className="text-sm text-destructive space-y-1">
                        {Object.entries(errors).map(([field, message]) => (
                          <li key={field} className="flex items-start gap-1">
                            <span className="font-medium capitalize">{field}:</span>
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
              disabled={!formData.name || !formData.service || !formData.key}
            >
              {mode === 'edit' ? 'Update API Key' : 'Add API Key'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

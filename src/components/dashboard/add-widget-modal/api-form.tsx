import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { FileText, Terminal } from "lucide-react";
import { useApiForm } from "@/hooks/use-api-form";
import { useApiTesting } from "@/hooks/use-api-testing";
import { useFieldSelection } from "@/hooks/use-field-selection";
import { useCurlParser } from "@/hooks/use-curl-parser";
import { API_CATEGORIES, INPUT_METHODS } from "@/constants/widget-modal";
import type { CreateApiEndpointInput } from "@/lib/validation";
import { CurlInput } from "./curl-input";
import { ApiTesting } from "./api-testing";
import { FieldSelection } from "./field-selection";
import { ErrorDisplay } from "./error-display";
import { apiService } from "@/lib/api-service";

interface ApiFormProps {
  onSubmit: (apiData: CreateApiEndpointInput, selectedFields: string[], fieldMappings: Record<string, string>) => void;
  onBack: () => void;
}

export function ApiForm({ onSubmit, onBack }: ApiFormProps) {
  const [inputMethod, setInputMethod] = useState<'form' | 'curl'>('form');
  
  const apiForm = useApiForm();
  const apiTesting = useApiTesting();
  const fieldSelection = useFieldSelection();
  const curlParser = useCurlParser();

  const handleTestApi = async () => {
    let apiDataToTest = { ...apiForm.apiData };

    // If cURL command is being used and provided, parse it
    if (inputMethod === 'curl' && curlParser.curlCommand.trim()) {
      try {
        const parsed = apiService.parseCurlCommand(curlParser.curlCommand);
        apiDataToTest = {
          ...apiDataToTest,
          url: parsed.url || apiDataToTest.url,
          headers: { ...apiDataToTest.headers, ...parsed.headers },
        };
      } catch (error) {
        console.error('Failed to parse cURL command:', error);
        apiTesting.setTestResult({ 
          success: false, 
          message: 'Failed to parse cURL command. Please check the format.' 
        });
        return;
      }
    }

    // Add API key to headers if provided
    if (apiDataToTest.apiKey) {
      apiDataToTest.headers = {
        ...apiDataToTest.headers,
        'Authorization': `Bearer ${apiDataToTest.apiKey}`
      };
    }

    await apiTesting.testApi(apiDataToTest, (responseData) => {
      const autoFieldSelection = apiTesting.generateAutoFieldSelection(responseData);
      fieldSelection.updateFieldSelection(autoFieldSelection);
    });
  };

  const handleParseCurl = async () => {
    await curlParser.parseCurlToForm((parsed) => {
      apiForm.updateApiData(parsed);
      // Clear any previous test results since the URL has changed
      apiTesting.reset();
      fieldSelection.reset();
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let apiDataToValidate = { ...apiForm.apiData };

    // Clear previous errors
    apiForm.clearFieldError('general');

    // Check if API has been tested successfully
    if (!apiTesting.apiTestResult?.success) {
      apiForm.updateField('name', ''); // Trigger error display
      return;
    }

    // If cURL command is being used and provided, parse it and update apiData
    if (inputMethod === 'curl' && curlParser.curlCommand.trim()) {
      try {
        const parsed = apiService.parseCurlCommand(curlParser.curlCommand);
        if (!parsed.url) {
          apiTesting.setTestResult({ 
            success: false, 
            message: 'No valid URL found in cURL command' 
          });
          return;
        }
        apiDataToValidate = {
          ...apiDataToValidate,
          url: parsed.url,
          headers: { ...apiDataToValidate.headers, ...parsed.headers },
        };
      } catch (error) {
        console.error('Failed to parse cURL command:', error);
        apiTesting.setTestResult({ 
          success: false, 
          message: 'Failed to parse cURL command. Please check the format.' 
        });
        return;
      }
    }

    const validation = apiForm.validateForm(apiDataToValidate);
    
    if (!validation.success || !validation.data) {
      return;
    }

    // Check if fields are selected
    if (fieldSelection.fieldSelection.selectedFields.length === 0) {
      return;
    }
    
    // Submit the form with sample response for caching
    onSubmit(
      {
        ...validation.data,
        sampleResponse: fieldSelection.fieldSelection.responseData
      }, 
      fieldSelection.fieldSelection.selectedFields, 
      fieldSelection.fieldSelection.fieldMappings
    );
  };

  return (
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
              {INPUT_METHODS.map((method) => (
                <Button
                  key={method.value}
                  type="button"
                  variant={inputMethod === method.value ? "default" : "outline"}
                  onClick={() => setInputMethod(method.value)}
                  className="h-auto p-3 flex flex-col items-start gap-1"
                >
                  <div className="flex items-center gap-2">
                    {method.value === 'form' ? (
                      <FileText className="h-4 w-4" />
                    ) : (
                      <Terminal className="h-4 w-4" />
                    )}
                    <span className="font-medium">{method.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground text-left">
                    {method.description}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* cURL Command Section */}
        {inputMethod === 'curl' && (
          <CurlInput
            curlCommand={curlParser.curlCommand}
            isParsing={curlParser.isParsing}
            parseError={curlParser.parseError}
            onCurlChange={curlParser.updateCurlCommand}
            onParse={handleParseCurl}
          />
        )}

        {/* Manual Form Section */}
        {inputMethod === 'form' && (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="apiName">API Name</Label>
              <Input
                id="apiName"
                placeholder="e.g., Alpha Vantage Stocks, Yahoo Finance"
                value={apiForm.apiData.name}
                onChange={(e) => apiForm.updateField('name', e.target.value)}
                className={apiForm.errors.name ? "border-destructive" : ""}
              />
              {apiForm.errors.name && (
                <p className="text-sm text-destructive">{apiForm.errors.name}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="apiUrl">API URL</Label>
              <Input
                id="apiUrl"
                placeholder="https://api.example.com/data"
                value={apiForm.apiData.url}
                onChange={(e) => apiForm.updateField('url', e.target.value)}
                className={apiForm.errors.url ? "border-destructive" : ""}
              />
              {apiForm.errors.url && (
                <p className="text-sm text-destructive">{apiForm.errors.url}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="apiKey">API Key (Optional)</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your API key if required"
                value={apiForm.apiData.apiKey || ""}
                onChange={(e) => apiForm.updateField('apiKey', e.target.value)}
                className={apiForm.errors.apiKey ? "border-destructive" : ""}
              />
              {apiForm.errors.apiKey && (
                <p className="text-sm text-destructive">{apiForm.errors.apiKey}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Will be added as Authorization: Bearer header
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={apiForm.apiData.category}
                onValueChange={(value) => apiForm.updateField('category', value as "stocks" | "crypto" | "forex" | "commodities" | "bonds" | "indices" | "economic" | "custom")}
              >
                <SelectTrigger className={apiForm.errors.category ? "border-destructive" : ""}>
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
              {apiForm.errors.category && (
                <p className="text-sm text-destructive">{apiForm.errors.category}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this API endpoint..."
                value={apiForm.apiData.description || ""}
                onChange={(e) => apiForm.updateField('description', e.target.value)}
                className={apiForm.errors.description ? "border-destructive" : ""}
                rows={2}
              />
              {apiForm.errors.description && (
                <p className="text-sm text-destructive">{apiForm.errors.description}</p>
              )}
            </div>
          </div>
        )}

        {/* Parsed Configuration for cURL method */}
        {inputMethod === 'curl' && (apiForm.apiData.url || apiForm.apiData.name) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Parsed Configuration</CardTitle>
              <CardDescription>
                Automatically extracted from your cURL command
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {apiForm.apiData.name && (
                <div className="grid gap-2">
                  <Label htmlFor="parsedName">API Name</Label>
                  <Input
                    id="parsedName"
                    value={apiForm.apiData.name}
                    onChange={(e) => apiForm.updateField('name', e.target.value)}
                  />
                </div>
              )}
              {apiForm.apiData.url && (
                <div className="grid gap-2">
                  <Label>URL</Label>
                  <p className="text-sm bg-muted p-2 rounded">{apiForm.apiData.url}</p>
                </div>
              )}
              {apiForm.apiData.headers && Object.keys(apiForm.apiData.headers).length > 0 && (
                <div className="grid gap-2">
                  <Label>Headers</Label>
                  <div className="text-sm bg-muted p-2 rounded space-y-1">
                    {Object.entries(apiForm.apiData.headers).map(([key, value]) => (
                      <div key={key} className="font-mono">
                        <span className="text-muted-foreground">{key}:</span> {value}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Test API Section */}
        <ApiTesting
          isTestingApi={apiTesting.isTestingApi}
          apiTestResult={apiTesting.apiTestResult}
          onTest={handleTestApi}
          disabled={(inputMethod === 'curl' ? !curlParser.curlCommand.trim() && !apiForm.apiData.url : !apiForm.apiData.url)}
        />

        {/* Field Selection Section */}
        {fieldSelection.hasResponseData && apiTesting.isTestSuccessful && (
          <FieldSelection
            responseData={fieldSelection.fieldSelection.responseData}
            selectedFields={fieldSelection.fieldSelection.selectedFields}
            fieldMappings={fieldSelection.fieldSelection.fieldMappings}
            onFieldToggle={fieldSelection.toggleFieldSelection}
            onFieldMappingChange={fieldSelection.updateFieldMapping}
            onPreviewField={fieldSelection.setPreviewField}
          />
        )}

        {/* API Validation Errors */}
        <ErrorDisplay errors={apiForm.errors} />
      </div>

      <div className="flex justify-end gap-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack}
        >
          Back
        </Button>
        <Button 
          type="submit"
          disabled={
            (inputMethod === 'curl' ? !curlParser.curlCommand.trim() && !apiForm.apiData.url : !apiForm.apiData.name || !apiForm.apiData.url) ||
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
              : 'Create Widget & API'
          }
        </Button>
      </div>
    </form>
  );
}

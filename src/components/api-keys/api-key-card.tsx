"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Copy, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Key, 
  Calendar, 
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  StarOff
} from "lucide-react";
import { ApiKey } from "@/store/slices/apiKeySlice";
import { format } from "date-fns";
import { toast } from "sonner";

interface ApiKeyCardProps {
  apiKey: ApiKey;
  onEdit: (apiKey: ApiKey) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string, service: string) => void;
  onTest?: (apiKey: ApiKey) => Promise<boolean>;
}

export function ApiKeyCard({ 
  apiKey, 
  onEdit, 
  onDelete, 
  onSetDefault,
  onTest 
}: ApiKeyCardProps) {
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(apiKey.key);
      toast.success("API key copied to clipboard");
    } catch {
      toast.error("Failed to copy API key");
    }
  };

  const handleTestKey = async () => {
    if (!onTest) return;
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const success = await onTest(apiKey);
      setTestResult({
        success,
        message: success ? "API key is valid and working" : "API key test failed"
      });
    } catch {
      setTestResult({
        success: false,
        message: "Failed to test API key"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return "••••••••";
    return `${key.slice(0, 4)}${"•".repeat(Math.max(8, key.length - 8))}${key.slice(-4)}`;
  };

  const getServiceBadgeColor = (service: string) => {
    const colors: Record<string, string> = {
      "alpha_vantage": "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
      "yahoo_finance": "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
      "polygon": "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
      "finnhub": "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300",
      "custom": "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300",
    };
    return colors[service.toLowerCase()] || colors.custom;
  };

  return (
    <Card className="group hover:shadow-md transition-all duration-200 border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base font-medium text-foreground">
                {apiKey.name}
              </CardTitle>
              {apiKey.isDefault && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Default API key for {apiKey.service}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <CardDescription>
              {apiKey.description || `API key for ${apiKey.service}`}
            </CardDescription>
          </div>
          <Badge 
            variant="secondary" 
            className={`${getServiceBadgeColor(apiKey.service)} border-0`}
          >
            {apiKey.service.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* API Key Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">API Key</span>
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowKey(!showKey)}
                      className="h-7 w-7 p-0"
                    >
                      {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showKey ? "Hide" : "Show"} API key</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyKey}
                      className="h-7 w-7 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy API key</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="p-2 bg-muted/50 rounded-md font-mono text-xs text-foreground">
            {showKey ? apiKey.key : maskApiKey(apiKey.key)}
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Created: {format(new Date(apiKey.createdAt), 'MMM dd, yyyy')}</span>
          </div>
          {apiKey.lastUsed && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Last used: {format(new Date(apiKey.lastUsed), 'MMM dd, yyyy')}</span>
            </div>
          )}
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`p-2 rounded-md text-xs flex items-center gap-2 ${
            testResult.success 
              ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
              : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
          }`}>
            {testResult.success ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <AlertCircle className="h-3 w-3" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1">
            {onTest && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestKey}
                disabled={isTesting}
                className="h-7 text-xs"
              >
                {isTesting ? "Testing..." : "Test"}
              </Button>
            )}
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSetDefault(apiKey.id, apiKey.service)}
                    className={`h-7 w-7 p-0 ${apiKey.isDefault ? 'text-amber-500' : 'text-muted-foreground'}`}
                  >
                    {apiKey.isDefault ? <Star className="h-3 w-3 fill-current" /> : <StarOff className="h-3 w-3" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{apiKey.isDefault ? "Remove as default" : "Set as default"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(apiKey)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit API key</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(apiKey.id)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete API key</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, ExternalLink } from "lucide-react";
import type { ApiEndpoint } from "@/types/widget";

interface ApiEndpointListProps {
  apiEndpoints: ApiEndpoint[];
  onDeleteEndpoint: (apiId: string) => void;
}

export function ApiEndpointList({ apiEndpoints, onDeleteEndpoint }: ApiEndpointListProps) {
  const getCategoryColor = (category: string) => {
    const colors = {
      stocks: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      crypto: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      forex: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      commodities: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      bonds: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      indices: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
      economic: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      custom: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    };
    return colors[category as keyof typeof colors] || colors.custom;
  };

  const handleDelete = (apiId: string, apiName: string) => {
    if (window.confirm(`Are you sure you want to delete "${apiName}"? This action cannot be undone.`)) {
      onDeleteEndpoint(apiId);
    }
  };

  if (apiEndpoints.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No API Endpoints</CardTitle>
          <CardDescription>
            You haven&apos;t added any API endpoints yet. Add your first API endpoint to start creating widgets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            API endpoints are the data sources for your widgets. You can connect to various financial APIs
            like Alpha Vantage, Yahoo Finance, or any custom API that returns JSON data.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">API Endpoints</h2>
        <Badge variant="secondary">{apiEndpoints.length} endpoint{apiEndpoints.length !== 1 ? 's' : ''}</Badge>
      </div>
      
      <div className="grid gap-4">
        {apiEndpoints.map((endpoint) => (
          <Card key={endpoint.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <CardTitle className="text-lg">{endpoint.name}</CardTitle>
                    <Badge className={getCategoryColor(endpoint.category)}>
                      {endpoint.category}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <ExternalLink className="h-4 w-4" />
                    <span className="font-mono break-all">{endpoint.url}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(endpoint.id, endpoint.name)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            {(endpoint.description || endpoint.apiKey || Object.keys(endpoint.headers || {}).length > 0) && (
              <CardContent className="space-y-3">
                {endpoint.description && (
                  <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                )}
                
                <div className="flex flex-wrap gap-4 text-sm">
                  {endpoint.apiKey && (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">API Key:</span>
                      <Badge variant="outline">Configured</Badge>
                    </div>
                  )}
                  
                  {endpoint.headers && Object.keys(endpoint.headers).length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Custom Headers:</span>
                      <Badge variant="outline">
                        {Object.keys(endpoint.headers).length} header{Object.keys(endpoint.headers).length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  )}
                </div>
                
                {endpoint.headers && Object.keys(endpoint.headers).length > 0 && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      View Headers
                    </summary>
                    <pre className="mt-2 bg-muted p-2 rounded overflow-x-auto">
                      {JSON.stringify(endpoint.headers, null, 2)}
                    </pre>
                  </details>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Created: {new Date(endpoint.createdAt).toLocaleDateString()}</span>
                  {endpoint.updatedAt && endpoint.updatedAt !== endpoint.createdAt && (
                    <span>Updated: {new Date(endpoint.updatedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

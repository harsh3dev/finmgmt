"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AddApiModal } from "@/components/dashboard/add-api-modal";
import { ApiEndpointList } from "@/components/dashboard/api-endpoint-list";
import { Plus, Database, AlertTriangle, Activity, Tag } from "lucide-react";
import { 
  type CreateApiEndpointInput
} from "@/lib/validation";
import { useWidgets, useApiEndpoints } from "@/hooks/use-dashboard-data";
import type { ApiEndpoint } from "@/types/widget";

export default function ApisPage() {
  const { widgets, loading: widgetsLoading } = useWidgets();
  const { apiEndpoints, addApiEndpoint, removeApiEndpoint, loading: apisLoading } = useApiEndpoints();
  
  const [isAddApiModalOpen, setIsAddApiModalOpen] = useState(false);
  const [warningDialog, setWarningDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const handleAddApiEndpoint = async (apiData: CreateApiEndpointInput) => {
    try {
      const newEndpoint: ApiEndpoint = {
        id: crypto.randomUUID(),
        name: apiData.name,
        url: apiData.url,
        headers: apiData.headers,
        apiKey: apiData.apiKey,
        description: apiData.description,
        category: apiData.category,
        sampleResponse: apiData.sampleResponse as Record<string, unknown> | unknown[] | null | undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addApiEndpoint(newEndpoint);
      setIsAddApiModalOpen(false);
    } catch (error) {
      console.error('Error adding API endpoint:', error);
    }
  };

  const handleDeleteApiEndpoint = async (apiId: string) => {
    try {
      const widgetsUsingApi = widgets.filter(widget => {
        const apiEndpoint = apiEndpoints.find((api: ApiEndpoint) => api.url === widget.apiUrl);
        return apiEndpoint?.id === apiId;
      });

      if (widgetsUsingApi.length > 0) {
        setWarningDialog({
          isOpen: true,
          title: "Cannot Delete API Endpoint",
          message: `This API endpoint is being used by ${widgetsUsingApi.length} widget${widgetsUsingApi.length !== 1 ? 's' : ''}. Please remove or reconfigure the dependent widgets before deleting this API endpoint.`
        });
        return;
      }

      await removeApiEndpoint(apiId);
    } catch (error) {
      console.error('Error removing API endpoint:', error);
    }
  };

  // Filter out imported APIs for this page
  const userApiEndpoints = apiEndpoints.filter((a: ApiEndpoint) => !a.isImported);

  if (widgetsLoading || apisLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading APIs...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="border-b sticky top-0 z-40 backdrop-blur-sm bg-background/95 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">API Endpoints</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your API connections and data sources
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={() => setIsAddApiModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add API Endpoint
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Endpoints
              </CardTitle>
              <Database className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{userApiEndpoints.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                API connections configured
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Connections
              </CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {widgets.filter(w => userApiEndpoints.some((api: ApiEndpoint) => api.id === w.apiEndpointId)).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                APIs being used by widgets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Categories
              </CardTitle>
              <Tag className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {new Set(userApiEndpoints.map((api: ApiEndpoint) => api.category)).size}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Different data types
              </p>
            </CardContent>
          </Card>
        </div>

        {userApiEndpoints.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>No API Endpoints</CardTitle>
              <CardDescription>
                Start by adding your first API endpoint to connect to external data sources.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium text-sm mb-2">Supported API Types:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>REST APIs with JSON responses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Financial data APIs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>APIs with authentication</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Real-time data sources</span>
                  </div>
                </div>
              </div>
              <Button onClick={() => setIsAddApiModalOpen(true)} size="lg" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First API Endpoint
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* API Management Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center space-x-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {userApiEndpoints.length} API Endpoint{userApiEndpoints.length !== 1 ? 's' : ''} Configured
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Set(userApiEndpoints.map((api: ApiEndpoint) => api.category)).size} categories • 
                    {' '}{widgets.filter(w => userApiEndpoints.some((api: ApiEndpoint) => api.id === w.apiEndpointId)).length} in use by widgets
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Test all APIs (placeholder)
                    console.log('Testing all APIs...');
                  }}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Test All
                </Button>
                <Button 
                  size="sm"
                  onClick={() => setIsAddApiModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add API
                </Button>
              </div>
            </div>
            
            {/* API Categories Filter */}
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(userApiEndpoints.map((api: ApiEndpoint) => api.category))).map((category: string) => (
                <div key={category} className="inline-flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full text-xs">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="capitalize">{category}</span>
                  <span className="text-muted-foreground">
                    ({userApiEndpoints.filter((api: ApiEndpoint) => api.category === category).length})
                  </span>
                </div>
              ))}
            </div>
            
            {/* API Endpoints List */}
            <ApiEndpointList 
              apiEndpoints={userApiEndpoints}
              onDeleteEndpoint={handleDeleteApiEndpoint}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <AddApiModal
        isOpen={isAddApiModalOpen}
        onClose={() => setIsAddApiModalOpen(false)}
        onSubmit={handleAddApiEndpoint}
      />

      <Dialog open={warningDialog.isOpen} onOpenChange={(open) => !open && setWarningDialog(prev => ({ ...prev, isOpen: false }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {warningDialog.title}
            </DialogTitle>
            <DialogDescription>
              {warningDialog.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setWarningDialog(prev => ({ ...prev, isOpen: false }))}
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

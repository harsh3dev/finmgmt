"use client";

import { useState, useEffect } from "react";
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
import { Plus, Database, AlertTriangle } from "lucide-react";
import { 
  type CreateApiEndpointInput
} from "@/lib/validation";
import { secureStorageService } from "@/lib/secure-storage";
import type { Widget, ApiEndpoint } from "@/types/widget";

export default function ApisPage() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([]);
  
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

  useEffect(() => {
    const savedWidgets = localStorage.getItem('finance-dashboard-widgets');
    const savedApiEndpoints = localStorage.getItem('finance-dashboard-apis');
    
    if (savedWidgets) {
      try {
        const parsedWidgets = JSON.parse(savedWidgets);
        setWidgets(parsedWidgets);
      } catch (error) {
        console.error('Error loading widgets:', error);
      }
    }
    
    if (savedApiEndpoints) {
      try {
        const parsedApiEndpoints = JSON.parse(savedApiEndpoints);
        const migratedApiEndpoints = parsedApiEndpoints.map((api: ApiEndpoint) => {
          if (api.isImported === undefined) {
            return {
              ...api,
              isImported: false
            };
          }
          return api;
        });
        setApiEndpoints(migratedApiEndpoints.filter((a: ApiEndpoint) => !a.isImported));
      } catch (error) {
        console.error('Error loading API endpoints:', error);
      }
    } else {
      secureStorageService.getApiEndpoints().then(secureEndpoints => {
        if (secureEndpoints.length > 0) {
          setApiEndpoints(secureEndpoints.filter(a => !a.isImported));
        }
      }).catch(error => {
        console.error('Error loading secure API endpoints:', error);
      });
    }
  }, []);

  useEffect(() => {
    secureStorageService.saveApiEndpoints(apiEndpoints).catch(error => {
      console.error('Error saving API endpoints:', error);
    });
  }, [apiEndpoints]);

  const handleAddApiEndpoint = (apiData: CreateApiEndpointInput) => {
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

    setApiEndpoints(prev => [...prev, newEndpoint]);
    setIsAddApiModalOpen(false);
  };

  const handleDeleteApiEndpoint = (apiId: string) => {
    const widgetsUsingApi = widgets.filter(widget => {
      const apiEndpoint = apiEndpoints.find(api => api.url === widget.apiUrl);
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

    setApiEndpoints(prev => prev.filter(api => api.id !== apiId));
  };

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
        {apiEndpoints.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>No API Endpoints</CardTitle>
              <CardDescription>
                Start by adding your first API endpoint to connect to external data sources.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setIsAddApiModalOpen(true)} size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First API Endpoint
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {apiEndpoints.length} API endpoint{apiEndpoints.length !== 1 ? 's' : ''} configured
              </div>
            </div>
            
            <ApiEndpointList 
              apiEndpoints={apiEndpoints}
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

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
import { AddWidgetModal } from "@/components/dashboard/add-widget-modal";
import { ConfigureWidgetModal } from "@/components/dashboard/configure-widget-modal";
import { BentoGrid } from "@/components/dashboard/bento-grid";
import { Plus, Database, AlertTriangle, Grid3X3 } from "lucide-react";
import { 
  type CreateWidgetInput, 
  type CreateApiEndpointInput, 
  type ConfigureWidgetInput 
} from "@/lib/validation";
import { secureStorageService } from "@/lib/secure-storage";
import type { Widget, ApiEndpoint } from "@/types/widget";
import Link from "next/link";

export default function WidgetsPage() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  
  const [isAddWidgetModalOpen, setIsAddWidgetModalOpen] = useState(false);
  const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false);
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
        const migratedWidgets = parsedWidgets.map((widget: Widget) => {
          if (widget.isImported === undefined) {
            return {
              ...widget,
              isImported: false
            };
          }
          return widget;
        });
        setWidgets(migratedWidgets.filter((w: Widget) => !w.isImported));
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
        setApiEndpoints(migratedApiEndpoints);
      } catch (error) {
        console.error('Error loading API endpoints:', error);
      }
    } else {
      secureStorageService.getApiEndpoints().then(secureEndpoints => {
        if (secureEndpoints.length > 0) {
          setApiEndpoints(secureEndpoints);
        }
      }).catch(error => {
        console.error('Error loading secure API endpoints:', error);
      });
    }
  }, []);

  useEffect(() => {
    const allWidgets = localStorage.getItem('finance-dashboard-widgets');
    if (allWidgets) {
      const parsed = JSON.parse(allWidgets);
      const updatedWidgets = parsed.map((w: Widget) => 
        widgets.find(widget => widget.id === w.id) || w
      );
      localStorage.setItem('finance-dashboard-widgets', JSON.stringify(updatedWidgets));
    }
  }, [widgets]);

  useEffect(() => {
    secureStorageService.saveApiEndpoints(apiEndpoints).catch(error => {
      console.error('Error saving API endpoints:', error);
    });
  }, [apiEndpoints]);

  const handleAddWidget = (widgetData: CreateWidgetInput, newApiEndpoint?: CreateApiEndpointInput) => {
    let apiEndpoint: ApiEndpoint;

    if (newApiEndpoint) {
      apiEndpoint = {
        id: crypto.randomUUID(),
        name: newApiEndpoint.name,
        url: newApiEndpoint.url,
        headers: newApiEndpoint.headers,
        apiKey: newApiEndpoint.apiKey,
        description: newApiEndpoint.description,
        category: newApiEndpoint.category,
        sampleResponse: newApiEndpoint.sampleResponse as Record<string, unknown> | unknown[] | null | undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setApiEndpoints(prev => [...prev, apiEndpoint]);
    } else {
      const existingEndpoint = apiEndpoints.find(api => api.id === widgetData.apiEndpointId);
      if (!existingEndpoint) {
        console.error('Selected API endpoint not found');
        return;
      }
      apiEndpoint = existingEndpoint;
    }

    const newWidget: Widget = {
      id: crypto.randomUUID(),
      name: widgetData.name,
      apiUrl: apiEndpoint.url,
      apiEndpointId: apiEndpoint.id,
      refreshInterval: widgetData.refreshInterval,
      displayType: widgetData.displayType,
      position: {
        x: 0,
        y: 0,
        width: 4,
        height: 3,
        ...widgetData.position
      },
      config: widgetData.config || {
        selectedFields: [],
        fieldMappings: {},
        formatSettings: {},
        styling: {}
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setWidgets(prev => [...prev, newWidget]);
    setIsAddWidgetModalOpen(false);
  };

  const handleConfigureWidget = (widget: Widget) => {
    setSelectedWidget(widget);
    setIsConfigureModalOpen(true);
  };

  const handleUpdateWidgetConfig = (config: ConfigureWidgetInput) => {
    if (!selectedWidget) return;

    setWidgets(prev => prev.map(widget => 
      widget.id === selectedWidget.id 
        ? {
            ...widget,
            ...(config.name ? { name: config.name } : {}),
            config: {
              selectedFields: config.selectedFields,
              fieldMappings: config.fieldMappings,
              formatSettings: config.formatSettings,
              styling: config.styling
            },
            updatedAt: new Date()
          }
        : widget
    ));

    setIsConfigureModalOpen(false);
    setSelectedWidget(null);
  };

  const handleRemoveWidget = (widgetId: string) => {
    setWidgets(prev => prev.filter(widget => widget.id !== widgetId));
  };

  const handleUpdateWidgetOrder = (updatedWidgets: Widget[]) => {
    setWidgets(updatedWidgets);
  };

  const userApiEndpoints = apiEndpoints.filter(a => !a.isImported);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="border-b sticky top-0 z-40 backdrop-blur-sm bg-background/95 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Grid3X3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Widgets</h1>
                <p className="text-sm text-muted-foreground">
                  Manage and configure your dashboard widgets
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={() => setIsAddWidgetModalOpen(true)}
                disabled={userApiEndpoints.length === 0}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Widget
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-6 space-y-6">
        {userApiEndpoints.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                No API Endpoints
              </CardTitle>
              <CardDescription>
                You need to add at least one API endpoint before you can create widgets.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/apis">
                <Button>
                  <Database className="h-4 w-4 mr-2" />
                  Manage APIs
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : widgets.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>No Widgets Yet</CardTitle>
              <CardDescription>
                Get started by adding your first widget to the dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setIsAddWidgetModalOpen(true)} size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Widget
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {widgets.length} widget{widgets.length !== 1 ? 's' : ''} configured
              </div>
            </div>
            
            <BentoGrid 
              widgets={widgets}
              apiEndpoints={apiEndpoints}
              onConfigureWidget={handleConfigureWidget}
              onRemoveWidget={handleRemoveWidget}
              onUpdateWidgetOrder={handleUpdateWidgetOrder}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <AddWidgetModal
        isOpen={isAddWidgetModalOpen}
        onClose={() => setIsAddWidgetModalOpen(false)}
        onSubmit={handleAddWidget}
        apiEndpoints={apiEndpoints}
      />

      <ConfigureWidgetModal
        isOpen={isConfigureModalOpen}
        widget={selectedWidget}
        onClose={() => {
          setIsConfigureModalOpen(false);
          setSelectedWidget(null);
        }}
        onSubmit={handleUpdateWidgetConfig}
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

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
import { AddWidgetModal } from "@/components/dashboard/add-widget-modal";
import { ConfigureWidgetModal } from "@/components/dashboard/configure-widget-modal";
import { BentoGrid } from "@/components/dashboard/bento-grid";
import { Plus, Database, AlertTriangle, Grid3X3, Activity, BarChart3, TrendingUp } from "lucide-react";
import { 
  type CreateWidgetInput, 
  type CreateApiEndpointInput, 
  type ConfigureWidgetInput 
} from "@/lib/validation";
import { useReduxWidgets, useReduxApiEndpoints } from "@/hooks/use-redux-dashboard";
import type { Widget, ApiEndpoint } from "@/types/widget";
import Link from "next/link";

export default function WidgetsPage() {
  const { widgets, addWidget, updateWidget, removeWidget, saveWidgets, loading: widgetsLoading, refresh: refreshWidgets } = useReduxWidgets();
  const { apiEndpoints, addApiEndpoint, loading: apisLoading } = useReduxApiEndpoints();
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

  const handleAddWidget = async (widgetData: CreateWidgetInput, newApiEndpoint?: CreateApiEndpointInput) => {
    try {
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

        await addApiEndpoint(apiEndpoint);
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

      await addWidget(newWidget);
      setIsAddWidgetModalOpen(false);
    } catch (error) {
      console.error('Error adding widget:', error);
    }
  };

  const handleConfigureWidget = (widget: Widget) => {
    setSelectedWidget(widget);
    setIsConfigureModalOpen(true);
  };

  const handleUpdateWidgetConfig = async (config: ConfigureWidgetInput) => {
    if (!selectedWidget) return;

    try {
      await updateWidget(selectedWidget.id, {
        ...(config.name ? { name: config.name } : {}),
        config: {
          selectedFields: config.selectedFields,
          fieldMappings: config.fieldMappings,
          formatSettings: config.formatSettings,
          styling: config.styling
        }
      });

      setIsConfigureModalOpen(false);
      setSelectedWidget(null);
    } catch (error) {
      console.error('Error updating widget:', error);
    }
  };

  const handleRemoveWidget = async (widgetId: string) => {
    try {
      await removeWidget(widgetId);
    } catch (error) {
      console.error('Error removing widget:', error);
    }
  };

  const handleUpdateWidgetOrder = async (updatedWidgets: Widget[]) => {
    try {
      await saveWidgets(updatedWidgets);
    } catch (error) {
      console.error('Error updating widget order:', error);
    }
  };

  const userApiEndpoints = apiEndpoints.filter(a => !a.isImported);

  if (widgetsLoading || apisLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading widgets...</p>
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
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Widgets
              </CardTitle>
              <Grid3X3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{widgets.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Displaying real-time data
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Connected APIs
              </CardTitle>
              <Database className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {new Set(widgets.map(w => w.apiEndpointId)).size}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Data sources in use
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Refresh Rate
              </CardTitle>
              <Activity className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {widgets.length > 0 
                  ? Math.round(widgets.reduce((sum, w) => sum + w.refreshInterval, 0) / widgets.length)
                  : 0}s
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Data update frequency
              </p>
            </CardContent>
          </Card>
        </div>

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
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium text-sm mb-2">Quick Start Guide:</h3>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Add an API endpoint to connect to your data source</li>
                  <li>Test the connection to ensure data is available</li>
                  <li>Create widgets to visualize your data</li>
                  <li>Configure and arrange widgets on your dashboard</li>
                </ol>
              </div>
              <Link href="/dashboard/apis">
                <Button size="lg" className="w-full">
                  <Database className="h-4 w-4 mr-2" />
                  Add Your First API Endpoint
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : widgets.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Ready to Create Widgets</CardTitle>
              <CardDescription>
                You have {userApiEndpoints.length} API endpoint{userApiEndpoints.length !== 1 ? 's' : ''} configured. 
                Create your first widget to start visualizing data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs font-medium">Charts</p>
                  <p className="text-xs text-muted-foreground">Line, Bar, Pie</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Grid3X3 className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs font-medium">Tables</p>
                  <p className="text-xs text-muted-foreground">Data grids</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs font-medium">KPIs</p>
                  <p className="text-xs text-muted-foreground">Key metrics</p>
                </div>
              </div>
              <Button onClick={() => setIsAddWidgetModalOpen(true)} size="lg" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Widget
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Widget Management Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center space-x-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {widgets.length} Widget{widgets.length !== 1 ? 's' : ''} Active
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Drag and drop to rearrange • Click to configure
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={refreshWidgets}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Refresh All
                </Button>
                <Button 
                  size="sm"
                  onClick={() => setIsAddWidgetModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Widget
                </Button>
              </div>
            </div>
            
            {/* Widget Grid */}
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

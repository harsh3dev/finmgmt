"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { AddWidgetModal } from "@/components/dashboard/add-widget-modal";
import { AddApiModal } from "@/components/dashboard/add-api-modal";
import { ConfigureWidgetModal } from "@/components/dashboard/configure-widget-modal";
import { WidgetGrid } from "@/components/dashboard/widget-grid";
import { ApiEndpointList } from "@/components/dashboard/api-endpoint-list";
import { Plus, Settings, Database } from "lucide-react";
import { 
  type CreateWidgetInput, 
  type CreateApiEndpointInput, 
  type ConfigureWidgetInput 
} from "@/lib/validation";
import type { Widget, ApiEndpoint } from "@/types/widget";

export default function DashboardPage() {
  // State management
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  
  // Modal states
  const [isAddWidgetModalOpen, setIsAddWidgetModalOpen] = useState(false);
  const [isAddApiModalOpen, setIsAddApiModalOpen] = useState(false);
  const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false);
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<'widgets' | 'apis'>('widgets');

  // Load data from localStorage on mount
  useEffect(() => {
    const savedWidgets = localStorage.getItem('finance-dashboard-widgets');
    const savedApiEndpoints = localStorage.getItem('finance-dashboard-apis');
    
    if (savedWidgets) {
      try {
        setWidgets(JSON.parse(savedWidgets));
      } catch (error) {
        console.error('Error loading widgets:', error);
      }
    }
    
    if (savedApiEndpoints) {
      try {
        setApiEndpoints(JSON.parse(savedApiEndpoints));
      } catch (error) {
        console.error('Error loading API endpoints:', error);
      }
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('finance-dashboard-widgets', JSON.stringify(widgets));
  }, [widgets]);

  useEffect(() => {
    localStorage.setItem('finance-dashboard-apis', JSON.stringify(apiEndpoints));
  }, [apiEndpoints]);

  // Widget management functions
  const handleAddWidget = (widgetData: CreateWidgetInput, newApiEndpoint?: CreateApiEndpointInput) => {
    let apiEndpoint: ApiEndpoint;

    // If a new API endpoint is provided, create it first
    if (newApiEndpoint) {
      apiEndpoint = {
        id: crypto.randomUUID(),
        name: newApiEndpoint.name,
        url: newApiEndpoint.url,
        headers: newApiEndpoint.headers,
        apiKey: newApiEndpoint.apiKey,
        description: newApiEndpoint.description,
        category: newApiEndpoint.category,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add the new API endpoint to the list
      setApiEndpoints(prev => [...prev, apiEndpoint]);
    } else {
      // Find existing API endpoint
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
      refreshInterval: widgetData.refreshInterval,
      displayType: widgetData.displayType,
      position: {
        x: 0,
        y: 0,
        width: 4,
        height: 3,
        ...widgetData.position
      },
      config: {
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

  // API endpoint management functions
  const handleAddApiEndpoint = (apiData: CreateApiEndpointInput) => {
    const newEndpoint: ApiEndpoint = {
      id: crypto.randomUUID(),
      name: apiData.name,
      url: apiData.url,
      headers: apiData.headers,
      apiKey: apiData.apiKey,
      description: apiData.description,
      category: apiData.category,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setApiEndpoints(prev => [...prev, newEndpoint]);
    setIsAddApiModalOpen(false);
  };

  const handleDeleteApiEndpoint = (apiId: string) => {
    // Check if any widgets are using this API
    const widgetsUsingApi = widgets.filter(widget => {
      const apiEndpoint = apiEndpoints.find(api => api.url === widget.apiUrl);
      return apiEndpoint?.id === apiId;
    });

    if (widgetsUsingApi.length > 0) {
      alert(`Cannot delete API endpoint. It is being used by ${widgetsUsingApi.length} widget(s).`);
      return;
    }

    setApiEndpoints(prev => prev.filter(api => api.id !== apiId));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">Finance Dashboard</h1>
              <div className="flex items-center space-x-2">
                <Button
                  variant={activeTab === 'widgets' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('widgets')}
                  size="sm"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Widgets
                </Button>
                <Button
                  variant={activeTab === 'apis' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('apis')}
                  size="sm"
                >
                  <Database className="h-4 w-4 mr-2" />
                  APIs
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {activeTab === 'widgets' && (
                <Button 
                  onClick={() => setIsAddWidgetModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Widget
                </Button>
              )}
              {activeTab === 'apis' && (
                <Button onClick={() => setIsAddApiModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add API
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === 'widgets' && (
          <div className="space-y-6">
            {apiEndpoints.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No API Endpoints</CardTitle>
                  <CardDescription>
                    You need to add at least one API endpoint before you can create widgets.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setActiveTab('apis')}>
                    <Database className="h-4 w-4 mr-2" />
                    Manage APIs
                  </Button>
                </CardContent>
              </Card>
            ) : widgets.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Widgets</CardTitle>
                  <CardDescription>
                    Get started by adding your first widget to the dashboard.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setIsAddWidgetModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Widget
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <WidgetGrid 
                widgets={widgets}
                apiEndpoints={apiEndpoints}
                onConfigureWidget={handleConfigureWidget}
              />
            )}
          </div>
        )}

        {activeTab === 'apis' && (
          <div className="space-y-6">
            <ApiEndpointList 
              apiEndpoints={apiEndpoints}
              onDeleteEndpoint={handleDeleteApiEndpoint}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <AddWidgetModal
        isOpen={isAddWidgetModalOpen}
        onClose={() => setIsAddWidgetModalOpen(false)}
        onSubmit={handleAddWidget}
        apiEndpoints={apiEndpoints}
      />

      <AddApiModal
        isOpen={isAddApiModalOpen}
        onClose={() => setIsAddApiModalOpen(false)}
        onSubmit={handleAddApiEndpoint}
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
    </div>
  );
}

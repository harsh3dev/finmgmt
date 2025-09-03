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
import { ThemeToggle } from "@/components/theme-toggle";
import { AddWidgetModal } from "@/components/dashboard/add-widget-modal";
import { AddApiModal } from "@/components/dashboard/add-api-modal";
import { ConfigureWidgetModal } from "@/components/dashboard/configure-widget-modal";
import { BentoGrid } from "@/components/dashboard/bento-grid";
import { ApiEndpointList } from "@/components/dashboard/api-endpoint-list";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { ImportedContentTab } from "@/components/dashboard/imported-content-tab";
import { ExportButton } from "@/components/dashboard/export-button";
import { ImportButton } from "@/components/dashboard/import-button";
import { TemplateGallery } from "@/components/dashboard/template-gallery";
import { Plus, Database, AlertTriangle, Sparkles } from "lucide-react";
import { 
  type CreateWidgetInput, 
  type CreateApiEndpointInput, 
  type ConfigureWidgetInput 
} from "@/lib/validation";
import { removeImportGroup } from "@/lib/import-tracker";
import { exportDashboard } from "@/lib/dashboard-export";
import { applyTemplate } from "@/lib/template-manager";
import type { Widget, ApiEndpoint, DashboardTab } from "@/types/widget";
import type { ImportedContent } from "@/types/imported-content";
import type { DashboardTemplate } from "@/types/template";

export default function DashboardPage() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  
  const [isAddWidgetModalOpen, setIsAddWidgetModalOpen] = useState(false);
  const [isAddApiModalOpen, setIsAddApiModalOpen] = useState(false);
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
  
  const [activeTab, setActiveTab] = useState<DashboardTab>('widgets');
  const [importedContent, setImportedContent] = useState<ImportedContent[]>([]);
  
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false);

  useEffect(() => {
    const savedWidgets = localStorage.getItem('finance-dashboard-widgets');
    const savedApiEndpoints = localStorage.getItem('finance-dashboard-apis');
    const savedImportedContent = localStorage.getItem('finance-dashboard-imports');
    
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
        setWidgets(migratedWidgets);
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
    }

    if (savedImportedContent) {
      try {
        setImportedContent(JSON.parse(savedImportedContent));
      } catch (error) {
        console.error('Error loading imported content:', error);
        setImportedContent([]);
      }
    } else {
      setImportedContent([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('finance-dashboard-widgets', JSON.stringify(widgets));
  }, [widgets]);

  useEffect(() => {
    localStorage.setItem('finance-dashboard-apis', JSON.stringify(apiEndpoints));
  }, [apiEndpoints]);

  useEffect(() => {
    localStorage.setItem('finance-dashboard-imports', JSON.stringify(importedContent));
  }, [importedContent]);

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

  const handleImportSuccess = (importedWidgets: Widget[], importedApiEndpoints: ApiEndpoint[]) => {
    setWidgets(prev => [...prev, ...importedWidgets]);
    setApiEndpoints(prev => [...prev, ...importedApiEndpoints]);
  };

  const handleSwitchToImportedTab = () => {
    setActiveTab('imported');
  };

  const handleDeleteImportSession = (importId: string) => {
    const result = removeImportGroup(importId);
    if (result.success) {
      setWidgets(prev => prev.filter(w => !result.removedWidgets.includes(w.id)));
      setApiEndpoints(prev => prev.filter(a => !result.removedApiEndpoints.includes(a.id)));
      
      setImportedContent(prev => prev.filter(session => session.importId !== importId));
    } else {
      setWarningDialog({
        isOpen: true,
        title: "Failed to Delete Import Session",
        message: result.error || "An unknown error occurred while deleting the import session."
      });
    }
  };

  const handleBulkExportImportSession = (importId: string) => {
    const sessionWidgets = widgets.filter(w => w.importId === importId);
    const sessionApis = apiEndpoints.filter(a => a.importId === importId);
    
    if (sessionWidgets.length === 0 && sessionApis.length === 0) {
      setWarningDialog({
        isOpen: true,
        title: "No Content to Export",
        message: "This import session contains no widgets or API endpoints to export."
      });
      return;
    }

    const importSession = importedContent.find(session => session.importId === importId);
    const exportName = importSession?.sourceName || 'Import Session';

    exportDashboard(sessionWidgets, sessionApis, undefined, { 
      exportName: `${exportName} - Re-export`
    }).then(exportData => {
      // Download the file
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const filename = `${exportName.toLowerCase().replace(/\s+/g, '-')}-re-export-${new Date().toISOString().split('T')[0]}.json`;
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }).catch(error => {
      console.error('Export failed:', error);
      setWarningDialog({
        isOpen: true,
        title: "Export Failed",
        message: "Failed to export the import session. Please try again."
      });
    });
  };

  const handleOpenTemplateGallery = () => {
    setIsTemplateGalleryOpen(true);
  };

  const handleCloseTemplateGallery = () => {
    setIsTemplateGalleryOpen(false);
  };

  const handleSelectTemplate = async (template: DashboardTemplate) => {
    setIsTemplateGalleryOpen(false);
    
    try {
      const result = await applyTemplate(template);
      
      if (result.success) {
        setWidgets(prev => [...prev, ...result.widgets]);
        setApiEndpoints(prev => [...prev, ...result.apiEndpoints]);
        
        const newWidgets = [...widgets, ...result.widgets];
        const newApiEndpoints = [...apiEndpoints, ...result.apiEndpoints];
        
        localStorage.setItem('finance-dashboard-widgets', JSON.stringify(newWidgets));
        localStorage.setItem('finance-dashboard-apis', JSON.stringify(newApiEndpoints));
        
        setWarningDialog({
          isOpen: true,
          title: "Template Applied Successfully",
          message: `${template.name} has been added to your dashboard with ${result.widgets.length} widgets and ${result.apiEndpoints.length} API endpoints.`
        });
        
      } else {
        setWarningDialog({
          isOpen: true,
          title: "Template Application Failed",
          message: result.error || "Failed to apply the template. Please try again."
        });
      }
    } catch (error) {
      console.error('Failed to apply template:', error);
      setWarningDialog({
        isOpen: true,
        title: "Template Application Failed",
        message: "An unexpected error occurred while applying the template."
      });
    }
  };

  const userWidgets = widgets.filter(w => !w.isImported);
  const userApiEndpoints = apiEndpoints.filter(a => !a.isImported);
  const importedWidgets = widgets.filter(w => w.isImported);
  const importedApiEndpoints = apiEndpoints.filter(a => a.isImported);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-40 backdrop-blur-sm bg-card/95">
          <div className="container mx-auto px-4 py-4 max-w-7xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <h1 className="text-xl sm:text-2xl font-bold">Finance Dashboard</h1>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handleOpenTemplateGallery}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span className="hidden sm:inline">Templates</span>
                  </Button>
                  <ImportButton
                    onImportSuccess={handleImportSuccess}
                    onSwitchToImportedTab={handleSwitchToImportedTab}
                    size="sm"
                  />
                  <ExportButton
                    widgets={widgets}
                    apiEndpoints={apiEndpoints}
                    size="sm"
                  />
                </div>
              {activeTab === 'widgets' && (
                <Button 
                  onClick={() => setIsAddWidgetModalOpen(true)}
                  className="flex-1 sm:flex-none"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Add Widget</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              )}
              {activeTab === 'apis' && (
                <Button 
                  onClick={() => setIsAddApiModalOpen(true)}
                  className="flex-1 sm:flex-none"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Add API</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 max-w-7xl">
          <DashboardTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            widgetCount={userWidgets.length}
            apiCount={userApiEndpoints.length}
            importedWidgetCount={importedWidgets.length}
            importedApiCount={importedApiEndpoints.length}
          />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-8xl">
        {activeTab === 'widgets' && (
          <div className="space-y-6">
            {userApiEndpoints.length === 0 ? (
              <Card className="max-w-2xl mx-auto">
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
            ) : userWidgets.length === 0 ? (
              <Card className="max-w-2xl mx-auto">
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
              <BentoGrid 
                widgets={userWidgets}
                apiEndpoints={apiEndpoints}
                onConfigureWidget={handleConfigureWidget}
                onRemoveWidget={handleRemoveWidget}
                onUpdateWidgetOrder={handleUpdateWidgetOrder}
              />
            )}
          </div>
        )}

        {activeTab === 'apis' && (
          <div className="space-y-6">
            <ApiEndpointList 
              apiEndpoints={userApiEndpoints}
              onDeleteEndpoint={handleDeleteApiEndpoint}
            />
          </div>
        )}

        {activeTab === 'imported' && (
          <ImportedContentTab
            importedWidgets={importedWidgets}
            importedApiEndpoints={importedApiEndpoints}
            allApiEndpoints={apiEndpoints}
            onConfigureWidget={handleConfigureWidget}
            onDeleteWidget={handleRemoveWidget}
            onDeleteApi={handleDeleteApiEndpoint}
            onUpdateWidgetOrder={(widgets) => {
              setWidgets(prev => [
                ...prev.filter(w => !w.isImported),
                ...widgets
              ]);
            }}
            onDeleteImportSession={handleDeleteImportSession}
            onBulkExportImportSession={handleBulkExportImportSession}
          />
        )}
      </main>

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

      <TemplateGallery
        isOpen={isTemplateGalleryOpen}
        onClose={handleCloseTemplateGallery}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );
}

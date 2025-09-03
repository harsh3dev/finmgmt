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
import { ImportedContentTab } from "@/components/dashboard/imported-content-tab";
import { ImportButton } from "@/components/dashboard/import-button";
import { ExportButton } from "@/components/dashboard/export-button";
import { ConfigureWidgetModal } from "@/components/dashboard/configure-widget-modal";
import { FileInput, AlertTriangle } from "lucide-react";
import { 
  type ConfigureWidgetInput 
} from "@/lib/validation";
import { removeImportGroup } from "@/lib/import-tracker";
import { secureStorageService } from "@/lib/secure-storage";
import { exportDashboard } from "@/lib/dashboard-export";
import type { Widget, ApiEndpoint } from "@/types/widget";
import type { ImportedContent } from "@/types/imported-content";

export default function ImportedPage() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([]);
  const [importedContent, setImportedContent] = useState<ImportedContent[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  
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
    const savedImportedContent = localStorage.getItem('finance-dashboard-imports');
    
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
        setApiEndpoints(parsedApiEndpoints);
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
    secureStorageService.saveApiEndpoints(apiEndpoints).catch(error => {
      console.error('Error saving API endpoints:', error);
    });
  }, [apiEndpoints]);

  useEffect(() => {
    localStorage.setItem('finance-dashboard-imports', JSON.stringify(importedContent));
  }, [importedContent]);

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

  const importedWidgets = widgets.filter(w => w.isImported);
  const importedApiEndpoints = apiEndpoints.filter(a => a.isImported);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="border-b sticky top-0 z-40 backdrop-blur-sm bg-background/95 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileInput className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Imported Content</h1>
                <p className="text-sm text-muted-foreground">
                  Manage imported widgets and API endpoints
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ImportButton
                onImportSuccess={handleImportSuccess}
                onSwitchToImportedTab={() => {}}
                size="default"
              />
              <ExportButton
                widgets={importedWidgets}
                apiEndpoints={importedApiEndpoints}
                size="default"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-6 space-y-6">
        {importedWidgets.length === 0 && importedApiEndpoints.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>No Imported Content</CardTitle>
              <CardDescription>
                Import dashboard configurations to get started with pre-built widgets and API connections.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <ImportButton
                  onImportSuccess={handleImportSuccess}
                  onSwitchToImportedTab={() => {}}
                  size="lg"
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {importedWidgets.length} imported widget{importedWidgets.length !== 1 ? 's' : ''} • {importedApiEndpoints.length} imported API{importedApiEndpoints.length !== 1 ? 's' : ''}
              </div>
            </div>
            
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
          </div>
        )}
      </div>

      {/* Modals */}
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

"use client";

import { useState, useEffect, useCallback } from "react";
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
import { FileInput, AlertTriangle, Grid3X3, Database, Clock, FileText, Download, Trash2 } from "lucide-react";
import { 
  type ConfigureWidgetInput 
} from "@/lib/validation";
import { removeImportGroup } from "@/lib/import-tracker";
import { exportDashboard } from "@/lib/dashboard-export";
import { dashboardStorage } from "@/lib/dashboard-storage";
import type { Widget, ApiEndpoint } from "@/types/widget";
import { useReduxWidgets } from "@/hooks/use-redux-widgets";
import type { ImportedContent } from "@/types/imported-content";
import Link from "next/link";

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

  // --- Normalization helpers ---
  const normalizeWidget = (w: Widget): Widget => ({
    ...w,
    createdAt: new Date(w.createdAt),
    updatedAt: new Date(w.updatedAt),
    importDate: w.importDate ? new Date(w.importDate) : undefined
  });
  const normalizeApi = (a: ApiEndpoint): ApiEndpoint => ({
    ...a,
    createdAt: new Date(a.createdAt),
    updatedAt: new Date(a.updatedAt),
    importDate: a.importDate ? new Date(a.importDate) : undefined
  });
  const normalizeImportSession = (s: ImportedContent): ImportedContent => ({
    ...s,
    importDate: new Date(s.importDate)
  });

  const loadAll = useCallback(async () => {
    try {
      const { widgets: w, apiEndpoints: apis, importedContent: imports } = await dashboardStorage.getAllData();
      const normalizedWidgets = w.map(normalizeWidget);
      const normalizedApis = apis.map(normalizeApi);
      const normalizedImports = imports.map(normalizeImportSession);

      setWidgets(normalizedWidgets);
      setApiEndpoints(normalizedApis);
      setImportedContent(normalizedImports);

      // If import sessions exist but none of their widgets are found, try raw reload (fallback)
      if (normalizedImports.length > 0 && !normalizedWidgets.some(w => w.isImported)) {
        const rawWidgets = JSON.parse(localStorage.getItem('finance-dashboard-widgets') || '[]');
        if (rawWidgets.some((rw: Widget) => rw.isImported)) {
          setWidgets(rawWidgets.map(normalizeWidget));
        }
      }
    } catch (e) {
      console.error('Failed to load dashboard storage', e);
    }
  }, []);

  useEffect(() => {
    loadAll();
    // Subscribe to storage changes for live sync
  // Access static events safely
  const events = (dashboardStorage.constructor as typeof dashboardStorage.constructor & { events: Record<string,string> }).events;
  const unsubWidgets = dashboardStorage.subscribe(events.widgetsChanged, loadAll);
  const unsubApis = dashboardStorage.subscribe(events.apisChanged, loadAll);
  const unsubImports = dashboardStorage.subscribe(events.importsChanged, loadAll);
    return () => {
      unsubWidgets();
      unsubApis();
      unsubImports();
    };
  }, [loadAll]);

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
  // Persist removal
  dashboardStorage.removeWidget(widgetId).catch(err => console.error('Persist remove widget failed', err));
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
  dashboardStorage.removeApiEndpoint(apiId).catch(err => console.error('Persist remove api failed', err));
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
  // Persist updated imports list
  dashboardStorage.saveImportedContent(importedContent.filter(s => s.importId !== importId)).catch(err => console.error('Persist imports failed', err));
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

  // Access redux to update central widget store
  const { updateWidget: updateReduxWidget, refresh: refreshReduxWidgets } = useReduxWidgets();

  const handlePromoteImportedWidget = async (widget: Widget) => {
    try {
      // Update redux/storage representation
      await updateReduxWidget(widget.id, {
        isImported: false,
        importId: undefined,
        importSource: undefined,
        importDate: undefined,
        updatedAt: new Date()
      } as Partial<Widget>);

      // Update local page state so it disappears from imported list
      setWidgets(prev => prev.map(w => w.id === widget.id ? ({
        ...w,
        isImported: false,
        importId: undefined,
        importSource: undefined,
        importDate: undefined,
        updatedAt: new Date()
      }) : w));

      // Optionally refresh redux cache
      refreshReduxWidgets();
      // Persist promotion: save entire widget list
      dashboardStorage.saveWidgets(
        (await dashboardStorage.getWidgets()).map(normalizeWidget)
      ).catch(err => console.error('Persist promote failed', err));
    } catch (e) {
      console.error('Failed to promote imported widget', e);
      setWarningDialog({
        isOpen: true,
        title: 'Promotion Failed',
        message: 'Could not move widget to Widgets tab. Please try again.'
      });
    }
  };

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
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Import Sessions
              </CardTitle>
              <FileInput className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{importedContent.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Configuration imports
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Imported Widgets
              </CardTitle>
              <Grid3X3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{importedWidgets.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                From external sources
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Imported APIs
              </CardTitle>
              <Database className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{importedApiEndpoints.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                External data sources
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Last Import
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {importedContent.length > 0 
                  ? Math.ceil((Date.now() - new Date(Math.max(...importedContent.map(ic => new Date(ic.importDate).getTime()))).getTime()) / (1000 * 60 * 60 * 24))
                  : 0}d
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Days ago
              </p>
            </CardContent>
          </Card>
        </div>

        {importedWidgets.length === 0 && importedApiEndpoints.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>No Imported Content</CardTitle>
              <CardDescription>
                Import dashboard configurations to get started with pre-built widgets and API connections.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium text-sm mb-2">What you can import:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <FileInput className="h-4 w-4 text-primary" />
                    <span>Complete dashboard configurations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Grid3X3 className="h-4 w-4 text-primary" />
                    <span>Pre-configured widgets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    <span>API endpoint configurations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span>Template configurations</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <ImportButton
                  onImportSuccess={handleImportSuccess}
                  onSwitchToImportedTab={() => {}}
                  size="lg"
                />
                <Link href="/dashboard/templates">
                  <Button variant="outline" size="lg" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Browse Templates
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Import Management Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center space-x-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {importedWidgets.length} Imported Widget{importedWidgets.length !== 1 ? 's' : ''} • {importedApiEndpoints.length} API{importedApiEndpoints.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    From {importedContent.length} import session{importedContent.length !== 1 ? 's' : ''} • Manage configurations independently
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <ExportButton
                  widgets={importedWidgets}
                  apiEndpoints={importedApiEndpoints}
                  size="sm"
                />
                <ImportButton
                  onImportSuccess={handleImportSuccess}
                  onSwitchToImportedTab={() => {}}
                  size="sm"
                />
              </div>
            </div>
            
            {/* Import Sessions Overview */}
            {importedContent.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Import Sessions</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {importedContent.map((session) => {
                    const sessionWidgets = importedWidgets.filter(w => w.importId === session.importId);
                    const sessionApis = importedApiEndpoints.filter(a => a.importId === session.importId);
                    
                    return (
                      <Card key={session.importId}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-sm">{session.sourceName}</CardTitle>
                              <CardDescription className="text-xs">
                                Imported {new Date(session.importDate).toLocaleDateString()}
                              </CardDescription>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleBulkExportImportSession(session.importId)}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteImportSession(session.importId)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{sessionWidgets.length} widgets</span>
                            <span>{sessionApis.length} APIs</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Imported Content Grid */}
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
              onPromoteImportedWidget={handlePromoteImportedWidget}
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

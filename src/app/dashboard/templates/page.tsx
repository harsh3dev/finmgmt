"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TemplateGalleryPage } from "@/components/dashboard/template-gallery-page";
import { TemplateApplyModal } from "@/components/dashboard/template-apply-modal";
import { FileText, AlertTriangle, Sparkles } from "lucide-react";
import { secureStorageService } from "@/lib/secure-storage";
import { applyTemplate } from "@/lib/template-manager";
import type { Widget, ApiEndpoint } from "@/types/widget";
import type { DashboardTemplate } from "@/types/template";

export default function TemplatesPage() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([]);
  const [pendingTemplate, setPendingTemplate] = useState<DashboardTemplate | null>(null);
  const [isApplyTemplateModalOpen, setIsApplyTemplateModalOpen] = useState(false);
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

  const handleSelectTemplate = async (template: DashboardTemplate) => {
    // Open key collection modal first
    setPendingTemplate(template);
    setIsApplyTemplateModalOpen(true);
  };

  const handleApplyTemplateWithConfig = async (config: { templateId: string; customName?: string; userProvidedApiKeys?: Record<string,string> }) => {
    if (!pendingTemplate) return;
    setIsApplyTemplateModalOpen(false);
    
    try {
      const result = await applyTemplate(pendingTemplate, config);
      if (result.success) {
        const newWidgets = [...widgets, ...result.widgets];
        const newApiEndpoints = [...apiEndpoints, ...result.apiEndpoints];
        
        setWidgets(newWidgets);
        setApiEndpoints(newApiEndpoints);
        
        localStorage.setItem('finance-dashboard-widgets', JSON.stringify(newWidgets));
        secureStorageService.saveApiEndpoints(newApiEndpoints).catch(error => {
          console.error('Error saving API endpoints:', error);
        });
        
        setWarningDialog({
          isOpen: true,
          title: "Template Applied Successfully",
          message: `${pendingTemplate.name} has been added with ${result.widgets.length} widgets and ${result.apiEndpoints.length} API endpoints.`
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
    } finally {
      setPendingTemplate(null);
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
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Templates</h1>
                <p className="text-sm text-muted-foreground">
                  Browse and apply dashboard templates to get started quickly
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                Ready-to-use configurations
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-6">
        <TemplateGalleryPage onSelectTemplate={handleSelectTemplate} />
      </div>

      {/* Modals */}
      <TemplateApplyModal
        isOpen={isApplyTemplateModalOpen}
        template={pendingTemplate}
        onCancel={() => { 
          setIsApplyTemplateModalOpen(false); 
          setPendingTemplate(null); 
        }}
        onApply={handleApplyTemplateWithConfig}
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

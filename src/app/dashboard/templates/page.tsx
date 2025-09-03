"use client";

import { useState } from "react";
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
import { applyTemplate } from "@/lib/template-manager";
import { useReduxWidgets, useReduxApiEndpoints } from "@/hooks/use-redux-dashboard";
import { useAppDispatch } from "@/hooks/redux";
import { addApiKey, type ApiKey } from "@/store/slices/apiKeySlice";
import type { DashboardTemplate } from "@/types/template";
import { toast } from "sonner";

export default function TemplatesPage() {
  const dispatch = useAppDispatch();
  const { addWidget } = useReduxWidgets();
  const { addApiEndpoint } = useReduxApiEndpoints();
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

        // Add all new widgets to Redux store
        for (const widget of result.widgets) {

          await addWidget(widget);
        }
        
        // Add all new API endpoints to Redux store
        for (const endpoint of result.apiEndpoints) {

          await addApiEndpoint(endpoint);
        }
        
        // Extract and add API keys to Redux store
        if (config.userProvidedApiKeys) {

          for (const [service, key] of Object.entries(config.userProvidedApiKeys)) {
            if (key && key.trim()) {
              const apiKey: ApiKey = {
                id: crypto.randomUUID(),
                name: `${service} API Key (from ${pendingTemplate.name})`,
                service: service,
                key: key.trim(),
                description: `API key for ${service} service, added from template: ${pendingTemplate.name}`,
                isEncrypted: false,
                createdAt: new Date(),
                isDefault: true, // Set as default for this service
              };
              
              try {

                await dispatch(addApiKey(apiKey)).unwrap();

              } catch (error) {
                console.warn(`❌ Failed to add API key for ${service}:`, error);
              }
            }
          }
        }
        

        toast.success(`Template "${pendingTemplate.name}" applied successfully! Added ${result.widgets.length} widgets and ${result.apiEndpoints.length} API endpoints.`);
        
        setWarningDialog({
          isOpen: true,
          title: "Template Applied Successfully",
          message: `${pendingTemplate.name} has been added with ${result.widgets.length} widgets and ${result.apiEndpoints.length} API endpoints.`
        });
      } else {
        toast.error(`Failed to apply template: ${result.error || "Unknown error"}`);
        setWarningDialog({
          isOpen: true,
          title: "Template Application Failed",
          message: result.error || "Failed to apply the template. Please try again."
        });
      }
    } catch (error) {
      console.error('Failed to apply template:', error);
      toast.error("An unexpected error occurred while applying the template.");
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
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">Templates</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Browse and apply dashboard templates
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Ready-to-use configurations</span>
                <span className="sm:hidden">Ready to use</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-4 sm:mt-6">
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

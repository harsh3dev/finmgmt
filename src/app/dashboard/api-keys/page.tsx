"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ApiKeyList } from "@/components/api-keys/api-key-list";
import { ApiKeyModal } from "@/components/api-keys/api-key-modal";
import { Key, Plus, Info, RefreshCw } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { 
  loadApiKeys, 
  addApiKey, 
  updateApiKey, 
  deleteApiKey, 
  setDefaultApiKey,
  selectApiKeys,
  selectApiKeysLoading,
  selectApiKeysError,
  clearError,
  ApiKey,
} from "@/store/slices/apiKeySlice";
import { toast } from "sonner";

export default function ApiKeysPage() {
  const dispatch = useAppDispatch();
  const apiKeys = useAppSelector(selectApiKeys);
  const loading = useAppSelector(selectApiKeysLoading);
  const error = useAppSelector(selectApiKeysError);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingApiKey, setEditingApiKey] = useState<ApiKey | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; apiKey: ApiKey | null }>({
    isOpen: false,
    apiKey: null
  });

  // Load API keys on component mount
  useEffect(() => {
    dispatch(loadApiKeys());
  }, [dispatch]);

  // Clear errors after a delay
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleAddApiKey = () => {
    setModalMode('create');
    setEditingApiKey(null);
    setIsModalOpen(true);
  };

  const handleEditApiKey = (apiKey: ApiKey) => {
    setModalMode('edit');
    setEditingApiKey(apiKey);
    setIsModalOpen(true);
  };

  const handleDeleteApiKey = (id: string) => {
    const apiKey = apiKeys.find(key => key.id === id);
    if (apiKey) {
      setDeleteDialog({ isOpen: true, apiKey });
    }
  };

  const confirmDelete = async () => {
    if (deleteDialog.apiKey) {
      try {
        await dispatch(deleteApiKey(deleteDialog.apiKey.id)).unwrap();
        toast.success("API key deleted successfully");
      } catch {
        toast.error("Failed to delete API key");
      }
    }
    setDeleteDialog({ isOpen: false, apiKey: null });
  };

  const handleSetDefault = async (id: string, service: string) => {
    try {
      await dispatch(setDefaultApiKey({ id, service })).unwrap();
      toast.success("Default API key updated");
    } catch {
      toast.error("Failed to update default API key");
    }
  };

  const handleModalSubmit = async (apiKeyData: Omit<ApiKey, 'id' | 'createdAt'>) => {
    try {
      if (modalMode === 'edit' && editingApiKey) {
        await dispatch(updateApiKey({ 
          id: editingApiKey.id, 
          updates: apiKeyData 
        })).unwrap();
        toast.success("API key updated successfully");
      } else {
        await dispatch(addApiKey(apiKeyData)).unwrap();
        toast.success("API key added successfully");
      }
    } catch {
      toast.error(modalMode === 'edit' ? "Failed to update API key" : "Failed to add API key");
    }
  };

  const handleTestApiKey = async (apiKey: ApiKey): Promise<boolean> => {
    // Simulate API key testing
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simple validation based on key length and format
        const isValid = apiKey.key.length >= 8;
        resolve(isValid);
      }, 1000);
    });
  };

  const handleRefresh = () => {
    dispatch(loadApiKeys());
    toast.success("API keys refreshed");
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="border-b sticky top-0 z-40 backdrop-blur-sm bg-background/95 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">API Key Manager</h1>
                <p className="text-sm text-muted-foreground">
                  Securely manage your API keys and authentication
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={handleAddApiKey}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add API Key
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-6 space-y-6">

        {/* Error Display */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <Info className="h-4 w-4" />
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* API Keys List */}
        <ApiKeyList
          apiKeys={apiKeys}
          loading={loading}
          onEdit={handleEditApiKey}
          onDelete={handleDeleteApiKey}
          onSetDefault={handleSetDefault}
          onAdd={handleAddApiKey}
          onTest={handleTestApiKey}
        />
      </div>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        apiKey={editingApiKey}
        mode={modalMode}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => !open && setDeleteDialog({ isOpen: false, apiKey: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteDialog.apiKey?.name}&quot;? 
              This action cannot be undone and may affect widgets using this API key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

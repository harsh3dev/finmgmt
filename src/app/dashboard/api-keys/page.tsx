"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Key, Plus, Shield, AlertTriangle } from "lucide-react";

export default function ApiKeysPage() {
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
                disabled
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
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              API Key Management
            </CardTitle>
            <CardDescription>
              This feature will be available when Redux state management is implemented in Phase 8.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Features coming soon:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Secure API key storage and encryption</li>
                <li>API key management (add, edit, delete)</li>
                <li>Service-specific key organization</li>
                <li>Key testing and validation</li>
                <li>Usage tracking and monitoring</li>
              </ul>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-amber-500">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Development Note</p>
                  <p className="text-muted-foreground mt-1">
                    API Key Manager will be fully implemented in Phase 8 with Redux state management. 
                    Currently, API keys are managed through the Add API modal in other sections.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

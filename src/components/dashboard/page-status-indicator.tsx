"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle2, 
  Grid3X3, 
  Database, 
  FileInput, 
  FileText,
  BarChart3 
} from "lucide-react";

interface PageStatusIndicatorProps {
  className?: string;
}

export function PageStatusIndicator({ className }: PageStatusIndicatorProps) {
  const pages = [
    {
      name: "Dashboard Overview",
      path: "/dashboard",
      icon: BarChart3,
      status: "active",
      description: "Main dashboard with activity summary and quick actions"
    },
    {
      name: "Widget Management",
      path: "/dashboard/widgets",
      icon: Grid3X3,
      status: "active",
      description: "Create, configure, and manage dashboard widgets"
    },
    {
      name: "API Management",
      path: "/dashboard/apis",
      icon: Database,
      status: "active",
      description: "Manage API endpoints and data connections"
    },
    {
      name: "Imported Content",
      path: "/dashboard/imported",
      icon: FileInput,
      status: "active",
      description: "View and manage imported configurations"
    },
    {
      name: "Templates",
      path: "/dashboard/templates",
      icon: FileText,
      status: "active",
      description: "Browse and apply pre-built dashboard templates"
    }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Phase 6 Implementation Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pages.map((page) => (
            <div key={page.path} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <page.icon className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium text-sm">{page.name}</p>
                  <p className="text-xs text-muted-foreground">{page.description}</p>
                </div>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                {page.status}
              </Badge>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Phase 6 Complete</span>
          </div>
          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
            All page components have been restructured with dedicated layouts, 
            enhanced organization, and page-specific actions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

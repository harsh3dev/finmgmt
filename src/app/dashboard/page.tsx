"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageStatusIndicator } from "@/components/dashboard/page-status-indicator";
import { 
  BarChart3, 
  Database, 
  Grid3X3, 
  FileInput, 
  FileText,
  TrendingUp,
  Activity,
  Clock,
  ChevronRight,
  Plus
} from "lucide-react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import Link from "next/link";

export default function DashboardOverview() {
  const { 
    widgets, 
    apiEndpoints, 
    importedContent, 
    loading,
    userWidgets,
    userApiEndpoints,
    importedWidgets,
    importedApiEndpoints
  } = useDashboardData();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const stats = [
    {
      title: "Total Widgets",
      value: widgets.length,
      icon: Grid3X3,
      description: `${userWidgets.length} created, ${importedWidgets.length} imported`,
      href: "/dashboard/widgets",
      color: "text-blue-600"
    },
    {
      title: "API Endpoints",
      value: apiEndpoints.length,
      icon: Database,
      description: `${userApiEndpoints.length} created, ${importedApiEndpoints.length} imported`,
      href: "/dashboard/apis",
      color: "text-green-600"
    },
    {
      title: "Import Sessions",
      value: importedContent.length,
      icon: FileInput,
      description: "Imported configurations",
      href: "/dashboard/imported",
      color: "text-purple-600"
    },
    {
      title: "Active Data Sources",
      value: new Set(widgets.map(w => w.apiEndpointId)).size,
      icon: Activity,
      description: "Unique API connections",
      href: "/dashboard/apis",
      color: "text-orange-600"
    }
  ];

  const recentWidgets = userWidgets
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  const recentApiEndpoints = userApiEndpoints
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="border-b sticky top-0 z-40 backdrop-blur-sm bg-background/95 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard Overview</h1>
                <p className="text-sm text-muted-foreground">
                  Monitor your finance dashboard configuration and activity
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/dashboard/templates">
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Browse Templates
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-6 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Widgets */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Grid3X3 className="h-5 w-5 text-blue-600" />
                  Recent Widgets
                </CardTitle>
                <CardDescription>Recently updated widgets</CardDescription>
              </div>
              <Link href="/dashboard/widgets">
                <Button variant="ghost" size="sm">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentWidgets.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Grid3X3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No widgets created yet</p>
                  <Link href="/dashboard/widgets">
                    <Button size="sm" className="mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Widget
                    </Button>
                  </Link>
                </div>
              ) : (
                recentWidgets.map((widget) => (
                  <div key={widget.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground">{widget.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {widget.displayType} • Updated {new Date(widget.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs">{widget.refreshInterval}s</span>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        widget.refreshInterval <= 30 ? 'bg-green-500' : 
                        widget.refreshInterval <= 60 ? 'bg-yellow-500' : 'bg-gray-500'
                      }`} title={`Refresh rate: ${widget.refreshInterval}s`} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent API Endpoints */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-green-600" />
                  Recent APIs
                </CardTitle>
                <CardDescription>Recently added API endpoints</CardDescription>
              </div>
              <Link href="/dashboard/apis">
                <Button variant="ghost" size="sm">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentApiEndpoints.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No API endpoints added yet</p>
                  <Link href="/dashboard/apis">
                    <Button size="sm" className="mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Add API
                    </Button>
                  </Link>
                </div>
              ) : (
                recentApiEndpoints.map((api) => (
                  <div key={api.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground">{api.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {api.category} • Added {new Date(api.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Active
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full" title="API endpoint active" />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Summary */}
        {(widgets.length > 0 || apiEndpoints.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Dashboard Activity
              </CardTitle>
              <CardDescription>
                Overview of your dashboard configuration and usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-lg font-bold text-foreground">{widgets.length}</div>
                  <p className="text-xs text-muted-foreground">Total Widgets</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-lg font-bold text-foreground">{apiEndpoints.length}</div>
                  <p className="text-xs text-muted-foreground">API Endpoints</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-lg font-bold text-foreground">
                    {new Set(apiEndpoints.map(a => a.category)).size}
                  </div>
                  <p className="text-xs text-muted-foreground">Data Categories</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-lg font-bold text-foreground">{importedContent.length}</div>
                  <p className="text-xs text-muted-foreground">Imports</p>
                </div>
              </div>
              
              {/* Quick Actions Row */}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Link href="/dashboard/widgets">
                  <Button variant="outline" size="sm">
                    <Grid3X3 className="h-4 w-4 mr-2" />
                    Manage Widgets
                  </Button>
                </Link>
                <Link href="/dashboard/apis">
                  <Button variant="outline" size="sm">
                    <Database className="h-4 w-4 mr-2" />
                    Manage APIs
                  </Button>
                </Link>
                <Link href="/dashboard/imported">
                  <Button variant="outline" size="sm">
                    <FileInput className="h-4 w-4 mr-2" />
                    View Imports
                  </Button>
                </Link>
                <Link href="/dashboard/templates">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Browse Templates
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Start Guide */}
        {widgets.length === 0 && apiEndpoints.length === 0 && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Quick Start Guide
              </CardTitle>
              <CardDescription>
                Get started with your finance dashboard in just a few steps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <h3 className="font-medium mb-2">Add API Endpoints</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Connect to financial data sources
                  </p>
                  <Link href="/dashboard/apis">
                    <Button size="sm" variant="outline">
                      <Database className="h-4 w-4 mr-2" />
                      Add APIs
                    </Button>
                  </Link>
                </div>

                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <h3 className="font-medium mb-2">Create Widgets</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Visualize your financial data
                  </p>
                  <Link href="/dashboard/widgets">
                    <Button size="sm" variant="outline">
                      <Grid3X3 className="h-4 w-4 mr-2" />
                      Add Widgets
                    </Button>
                  </Link>
                </div>

                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <h3 className="font-medium mb-2">Use Templates</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Or start with pre-built configurations
                  </p>
                  <Link href="/dashboard/templates">
                    <Button size="sm" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Browse Templates
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Development Status - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <PageStatusIndicator />
        )}
      </div>
    </DashboardLayout>
  );
}

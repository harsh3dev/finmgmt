'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowRight, 
  Database, 
  Clock, 
  CheckCircle,
  BarChart3,
  Info,
  Settings
} from 'lucide-react';
import { DashboardTemplate, TEMPLATE_CATEGORIES } from '@/types/template';

interface TemplateDetailsModalProps {
  isOpen: boolean;
  template: DashboardTemplate;
  onClose: () => void;
  onUseTemplate: () => void;
}

export function TemplateDetailsModal({
  isOpen,
  template,
  onClose,
  onUseTemplate
}: TemplateDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'widgets' | 'apis' | 'setup'>('overview');

  const estimatedTime = 5;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'widgets', label: 'Widgets', icon: BarChart3 },
    { id: 'apis', label: 'APIs', icon: Database },
    { id: 'setup', label: 'Setup', icon: Settings }
  ] as const;

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-2xl font-bold">{template.name}</h3>
          <Badge className="bg-primary/10 text-primary">
            {TEMPLATE_CATEGORIES[template.category]}
          </Badge>
        </div>
        <p className="text-muted-foreground text-lg">{template.description}</p>
      </div>

      {/* Key Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{template.widgets.length}</div>
            <div className="text-sm text-muted-foreground">Widgets</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Database className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{template.apiEndpoints.length}</div>
            <div className="text-sm text-muted-foreground">Data Sources</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{estimatedTime}m</div>
            <div className="text-sm text-muted-foreground">Setup Time</div>
          </CardContent>
        </Card>
      </div>

      {/* Requirements */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold">Requirements</h4>
        <div className="grid gap-3">
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <div className="font-medium">Ready to Use</div>
              <div className="text-sm text-muted-foreground">
                Template comes with pre-configured APIs and data sources
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Author and Version */}
      <div className="border-t pt-4">
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>Created by {template.author}</span>
          <span>Version {template.version}</span>
        </div>
      </div>
    </div>
  );

  const renderWidgetsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold">Template Widgets</h4>
        <Badge variant="outline">{template.widgets.length} widgets</Badge>
      </div>
      
      <div className="grid gap-4">
        {template.widgets.map((widget) => (
          <Card key={widget.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{widget.name}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    {widget.displayType || 'auto'}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {widget.refreshInterval}s refresh
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Selected Fields:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {widget.config.selectedFields.slice(0, 3).map((field) => (
                      <Badge key={field} variant="outline" className="text-xs">
                        {widget.config.fieldMappings[field] || field}
                      </Badge>
                    ))}
                    {widget.config.selectedFields.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{widget.config.selectedFields.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Position:</span>{' '}
                    {widget.position.width}×{widget.position.height}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Format:</span>{' '}
                    {widget.config.formatSettings?.currency || 'Default'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderApisTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold">Data Sources</h4>
        <Badge variant="outline">{template.apiEndpoints.length} APIs</Badge>
      </div>
      
      <div className="grid gap-4">
        {template.apiEndpoints.map((api) => (
          <Card key={api.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{api.name}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Ready to Use
                  </Badge>
                </div>
              </div>
              {api.description && (
                <p className="text-sm text-muted-foreground">{api.description}</p>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Endpoint:
                  </div>
                  <div className="text-sm font-mono bg-muted p-2 rounded break-all">
                    {api.url}
                  </div>
                </div>
                
                {api.rateLimit && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Rate Limits:
                    </div>
                    <div className="text-xs text-muted-foreground grid grid-cols-3 gap-2">
                      <div>{api.rateLimit.requestsPerMinute}/min</div>
                      <div>{api.rateLimit.requestsPerHour}/hour</div>
                      <div>{api.rateLimit.requestsPerDay}/day</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderSetupTab = () => (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold">Setup Instructions</h4>
      
      <div className="space-y-4">
        {template.setupInstructions.map((instruction, index) => (
          <div key={index} className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
              {index + 1}
            </div>
            <div className="text-sm">{instruction}</div>
          </div>
        ))}
      </div>

      {/* Ready to use notice */}
      <div className="border-t pt-6">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium">Ready to Use</span>
            </div>
            <p className="text-sm text-muted-foreground">
              This template is ready to be applied immediately with pre-configured APIs and widgets.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl">Template Details</DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex-shrink-0 border-b">
          <div className="flex space-x-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-1">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'widgets' && renderWidgetsTab()}
          {activeTab === 'apis' && renderApisTab()}
          {activeTab === 'setup' && renderSetupTab()}
        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0 border-t pt-4 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onUseTemplate} className="group">
            Use This Template
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

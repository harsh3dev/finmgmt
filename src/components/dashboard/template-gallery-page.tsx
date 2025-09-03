'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, Grid, List, Sparkles, TrendingUp } from 'lucide-react';
import { DashboardTemplate, TemplateCategory, TEMPLATE_CATEGORIES } from '@/types/template';
import { getAvailableTemplates, searchTemplates } from '@/lib/template-manager';
import { TemplateCard } from './template-card';
import { TemplateDetailsModal } from './template-details-modal-simple';

interface TemplateGalleryPageProps {
  onSelectTemplate: (template: DashboardTemplate) => void;
}

export function TemplateGalleryPage({ onSelectTemplate }: TemplateGalleryPageProps) {
  const [templates, setTemplates] = useState<DashboardTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<DashboardTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<DashboardTemplate | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Filter templates based on search and category
  useEffect(() => {
    const filterTemplates = async () => {
      try {
        const filtered = await searchTemplates({
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          searchQuery: searchQuery || undefined
        });
        setFilteredTemplates(filtered);
      } catch (error) {
        console.error('Failed to filter templates:', error);
        setFilteredTemplates(templates);
      }
    };
    
    filterTemplates();
  }, [templates, selectedCategory, searchQuery]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const availableTemplates = await getAvailableTemplates();
      setTemplates(availableTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (template: DashboardTemplate) => {
    setSelectedTemplate(template);
    setShowDetailsModal(true);
  };

  const handleUseTemplate = (template: DashboardTemplate) => {
    setShowDetailsModal(false);
    onSelectTemplate(template);
  };

  const categories: Array<{ key: TemplateCategory | 'all'; label: string }> = [
    { key: 'all', label: 'All Templates' },
    ...Object.entries(TEMPLATE_CATEGORIES).map(([key, label]) => ({
      key: key as TemplateCategory,
      label
    }))
  ];

  const getTemplateStats = (template: DashboardTemplate) => {
    const hasApiKey = template.apiEndpoints.some(api => !api.apiKey);
    const estimatedTime = 5;

    return {
      hasApiKey,
      estimatedTime,
      difficulty: 'beginner' as const 
    };
  };

  const popularTemplates = filteredTemplates.slice(0, 3);
  const regularTemplates = filteredTemplates.slice(3);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
        </div>
        
        {/* Controls Skeleton */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="h-10 bg-muted rounded flex-1 animate-pulse"></div>
            <div className="h-10 bg-muted rounded w-20 animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 bg-muted rounded w-20 animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-96 bg-muted rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard Templates</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Get started quickly with pre-built templates
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="flex-1 sm:flex-none"
            >
              <Grid className="h-4 w-4" />
              <span className="ml-1 sm:hidden">Grid</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="flex-1 sm:flex-none"
            >
              <List className="h-4 w-4" />
              <span className="ml-1 sm:hidden">List</span>
            </Button>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <X className="w-4 h-4" />
              Clear
            </Button>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category.key}
                variant={selectedCategory === category.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.key)}
                className="h-8 text-xs sm:text-sm"
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Templates Content */}
      {filteredTemplates.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <Filter className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search criteria or browse all templates.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            >
              Show All Templates
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Popular Templates Section */}
          {popularTemplates.length > 0 && selectedCategory === 'all' && !searchQuery && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Popular Templates</h3>
                <Badge variant="secondary">Trending</Badge>
              </div>
              <div className={`grid gap-4 sm:gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {popularTemplates.map((template) => {
                  const stats = getTemplateStats(template);
                  return (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isPopular={true}
                      difficulty={stats.difficulty}
                      estimatedSetupTime={stats.estimatedTime}
                      tags={[
                        template.category,
                        stats.hasApiKey ? 'api-key' : 'no-setup',
                        'ready-to-use'
                      ]}
                      onUseTemplate={() => handleTemplateSelect(template)}
                      onPreview={() => handleTemplateSelect(template)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* All Templates Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">
                  {selectedCategory !== 'all' ? TEMPLATE_CATEGORIES[selectedCategory] : 'All Templates'}
                </h3>
              </div>
              <div className="text-sm text-muted-foreground">
                {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            <div className={`grid gap-4 sm:gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {(selectedCategory === 'all' && !searchQuery ? regularTemplates : filteredTemplates).map((template) => {
                const stats = getTemplateStats(template);
                return (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isPopular={false}
                    difficulty={stats.difficulty}
                    estimatedSetupTime={stats.estimatedTime}
                    tags={[
                      template.category,
                      stats.hasApiKey ? 'api-key' : 'no-setup',
                      'ready-to-use'
                    ]}
                    onUseTemplate={() => handleTemplateSelect(template)}
                    onPreview={() => handleTemplateSelect(template)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Gallery Stats */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Template Gallery Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-primary">{templates.length}</div>
              <div className="text-muted-foreground text-xs sm:text-sm">Total Templates</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-primary">{categories.length - 1}</div>
              <div className="text-muted-foreground text-xs sm:text-sm">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-primary">
                {templates.reduce((acc, t) => acc + t.widgets.length, 0)}
              </div>
              <div className="text-muted-foreground text-xs sm:text-sm">Total Widgets</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-primary">
                {templates.reduce((acc, t) => acc + t.apiEndpoints.length, 0)}
              </div>
              <div className="text-muted-foreground text-xs sm:text-sm">Data Sources</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Details Modal */}
      {showDetailsModal && selectedTemplate && (
        <TemplateDetailsModal
          isOpen={showDetailsModal}
          template={selectedTemplate}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedTemplate(null);
          }}
          onUseTemplate={() => handleUseTemplate(selectedTemplate)}
        />
      )}
    </div>
  );
}

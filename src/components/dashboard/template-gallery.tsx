'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, X } from 'lucide-react';
import { DashboardTemplate, TemplateCategory, TEMPLATE_CATEGORIES } from '@/types/template';
import { getAvailableTemplates, searchTemplates } from '@/lib/template-manager';
import { TemplateCard } from './template-card';
import { TemplateDetailsModal } from './template-details-modal-simple';

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: DashboardTemplate) => void;
}

export function TemplateGallery({ isOpen, onClose, onSelectTemplate }: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<DashboardTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<DashboardTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<DashboardTemplate | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load templates on component mount
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

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
    onClose();
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl sm:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-2xl font-bold">Template Gallery</DialogTitle>
            <p className="text-muted-foreground">
              Get started quickly with pre-built dashboard templates for different financial use cases.
            </p>
          </DialogHeader>

          {/* Search and Filter Controls */}
          <div className="flex-shrink-0 space-y-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="flex items-center gap-2"
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
                  className="h-8"
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading templates...</p>
                </div>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                  <p className="text-muted-foreground mb-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-1">
                {filteredTemplates.map((template) => {
                  const stats = getTemplateStats(template);
                  return (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isPopular={false} // TODO: Implement popularity logic
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
            )}
          </div>

          {/* Gallery Stats */}
          <div className="flex-shrink-0 border-t pt-4">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>
                Showing {filteredTemplates.length} of {templates.length} templates
              </span>
              <span>
                Categories: {categories.length - 1}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
    </>
  );
}

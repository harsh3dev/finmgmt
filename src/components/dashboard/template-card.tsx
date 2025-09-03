'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Key, Database, Users, ArrowRight, PlayCircle } from 'lucide-react';
import { DashboardTemplate } from '@/types/template';

interface TemplateCardProps {
  template: DashboardTemplate;
  isPopular: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedSetupTime: number; // in minutes
  tags: string[];
  onUseTemplate: () => void;
  onPreview: () => void;
}

export function TemplateCard({
  template,
  isPopular,
  difficulty,
  estimatedSetupTime,
  tags,
  onUseTemplate,
  onPreview
}: TemplateCardProps) {
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-700';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'stocks':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'crypto':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'forex':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'economic':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'personal':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400';
      case 'api-key':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'no-setup':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'demo-data':
        return 'bg-muted text-muted-foreground';
      case 'live-data':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const requiresApiKey = template.apiEndpoints.some(api => !api.apiKey);
  const hasDemoData = template.apiEndpoints.length > 0; 

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:border-primary/50 relative overflow-hidden bg-card min-h-[400px] flex flex-col">
      {/* Popular badge */}
      {isPopular && (
        <div className="absolute top-2 right-2 z-10">
          <Badge className="bg-primary text-primary-foreground text-xs">
            <Users className="w-3 h-3 mr-1" />
            Popular
          </Badge>
        </div>
      )}

      {/* Preview image placeholder */}
      <div className="h-28 sm:h-32 bg-gradient-to-br from-primary/10 to-primary/5 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-primary/20 text-2xl sm:text-4xl font-bold">
            {template.category.toUpperCase().slice(0, 3)}
          </div>
        </div>
        {/* Preview overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
          <Button
            variant="secondary"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs"
            onClick={onPreview}
          >
            <PlayCircle className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Preview</span>
          </Button>
        </div>
      </div>

      <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg font-semibold line-clamp-1 text-card-foreground">
              {template.name}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-1">
              {template.description}
            </CardDescription>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-2 sm:gap-3 pt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span className="text-xs">{estimatedSetupTime}m</span>
          </div>
          {requiresApiKey && (
            <div className="flex items-center gap-1">
              <Key className="w-3 h-3" />
              <span className="hidden sm:inline text-xs">API key</span>
            </div>
          )}
          {hasDemoData && (
            <div className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              <span className="hidden sm:inline text-xs">Demo</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6 flex-1 flex flex-col">
        {/* Tags and difficulty */}
        <div className="flex flex-wrap gap-1 mb-3 sm:mb-4">
          <Badge
            variant="outline"
            className={`text-xs ${getDifficultyColor(difficulty)}`}
          >
            {difficulty}
          </Badge>
          {tags.slice(0, 2).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className={`text-xs ${getTagColor(tag)}`}
            >
              {tag.replace('-', ' ')}
            </Badge>
          ))}
          {tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{tags.length - 2}
            </Badge>
          )}
        </div>

        {/* Template stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm flex-1">
          <div>
            <div className="text-muted-foreground">Widgets</div>
            <div className="font-medium text-foreground">{template.widgets.length}</div>
          </div>
          <div>
            <div className="text-muted-foreground">APIs</div>
            <div className="font-medium text-foreground">{template.apiEndpoints.length}</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2 mt-auto">
          <Button
            onClick={onUseTemplate}
            className="flex-1 group/button text-xs sm:text-sm"
            size="sm"
          >
            <span className="sm:hidden">Use</span>
            <span className="hidden sm:inline">Configure & Use</span>
            <ArrowRight className="w-4 h-4 ml-1 sm:ml-2 group-hover/button:translate-x-1 transition-transform" />
          </Button>
          <Button
            variant="outline"
            onClick={onPreview}
            size="sm"
            className="px-3 text-xs sm:text-sm sm:w-auto"
          >
            <PlayCircle className="w-4 h-4" />
            <span className="ml-1 sm:hidden">Preview</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

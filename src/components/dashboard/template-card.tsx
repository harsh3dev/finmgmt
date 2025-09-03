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
        return 'bg-green-100 text-green-800 border-green-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'stocks':
        return 'bg-blue-100 text-blue-800';
      case 'crypto':
        return 'bg-purple-100 text-purple-800';
      case 'forex':
        return 'bg-green-100 text-green-800';
      case 'economic':
        return 'bg-orange-100 text-orange-800';
      case 'personal':
        return 'bg-pink-100 text-pink-800';
      case 'api-key':
        return 'bg-red-100 text-red-800';
      case 'no-setup':
        return 'bg-green-100 text-green-800';
      case 'demo-data':
        return 'bg-gray-100 text-gray-800';
      case 'live-data':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const requiresApiKey = template.apiEndpoints.some(api => !api.apiKey);
  const hasDemoData = template.apiEndpoints.length > 0; 

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:border-primary/50 relative overflow-hidden">
      {/* Popular badge */}
      {isPopular && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-primary text-primary-foreground">
            <Users className="w-3 h-3 mr-1" />
            Popular
          </Badge>
        </div>
      )}

      {/* Preview image placeholder */}
      <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-primary/20 text-4xl font-bold">
            {template.category.toUpperCase().slice(0, 3)}
          </div>
        </div>
        {/* Preview overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
          <Button
            variant="secondary"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onClick={onPreview}
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-1">
              {template.name}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {template.description}
            </CardDescription>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {estimatedSetupTime}m setup
          </div>
          {requiresApiKey && (
            <div className="flex items-center gap-1">
              <Key className="w-3 h-3" />
              API key
            </div>
          )}
          {hasDemoData && (
            <div className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              Demo data
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Tags and difficulty */}
        <div className="flex flex-wrap gap-1 mb-4">
          <Badge
            variant="outline"
            className={`text-xs ${getDifficultyColor(difficulty)}`}
          >
            {difficulty}
          </Badge>
          {tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className={`text-xs ${getTagColor(tag)}`}
            >
              {tag.replace('-', ' ')}
            </Badge>
          ))}
          {tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{tags.length - 3}
            </Badge>
          )}
        </div>

        {/* Template stats */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <div className="text-muted-foreground">Widgets</div>
            <div className="font-medium">{template.widgets.length}</div>
          </div>
          <div>
            <div className="text-muted-foreground">APIs</div>
            <div className="font-medium">{template.apiEndpoints.length}</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            onClick={onUseTemplate}
            className="flex-1 group/button"
            size="sm"
          >
            Configure & Use
            <ArrowRight className="w-4 h-4 ml-2 group-hover/button:translate-x-1 transition-transform" />
          </Button>
          <Button
            variant="outline"
            onClick={onPreview}
            size="sm"
            className="px-3"
          >
            <PlayCircle className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

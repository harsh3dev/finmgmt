// Template System Types

import { Widget, ApiEndpoint, DashboardLayout, DashboardSettings } from '@/types/widget';

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  author: string;
  version: string;
  previewImage?: string;
  widgets: Widget[];
  apiEndpoints: ApiEndpoint[];
  layout: DashboardLayout;
  setupInstructions: string[];
  settings?: DashboardSettings;
  templateMetadata: {
    isTemplate: true;
    templateId: string;
    templateVersion: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type TemplateCategory = 'stocks' | 'crypto' | 'forex' | 'economic' | 'personal';

export interface TemplateApplicationResult {
  success: boolean;
  widgets: Widget[];
  apiEndpoints: ApiEndpoint[];
  error?: string;
  templateId: string;
}

export interface TemplateSetupConfig {
  templateId: string;
  customName?: string;
  /** Map of service identifier -> raw API key provided by user at template application time */
  userProvidedApiKeys?: Record<string, string>;
}

export interface TemplatePreview {
  template: DashboardTemplate;
  screenshots?: string[];
}

export interface TemplateGalleryFilter {
  category?: TemplateCategory;
  searchQuery?: string;
  requiresApiKey?: boolean;
  hasDemoData?: boolean;
}

export interface TemplateCard {
  template: DashboardTemplate;
  isPopular: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedSetupTime: number; // in minutes
  tags: string[];
}

export interface TemplateManager {
  loadTemplate: (templateId: string) => Promise<DashboardTemplate | null>;
  applyTemplate: (template: DashboardTemplate, config?: TemplateSetupConfig) => Promise<TemplateApplicationResult>;
  getAvailableTemplates: () => DashboardTemplate[];
  searchTemplates: (filter: TemplateGalleryFilter) => DashboardTemplate[];
}

export interface TemplateError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export const TEMPLATE_CATEGORIES: Record<TemplateCategory, string> = {
  stocks: 'Stock Portfolio',
  crypto: 'Cryptocurrency',
  forex: 'Forex Trading',
  economic: 'Economic Indicators',
  personal: 'Personal Finance'
};

export const TEMPLATE_DIFFICULTIES = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced'
} as const;

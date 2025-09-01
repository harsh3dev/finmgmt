import { z } from 'zod';
import type { ApiCategory, DisplayType } from '@/types/widget';

// API Endpoint validation schema
export const createApiEndpointSchema = z.object({
  name: z.string()
    .min(1, 'API name is required')
    .max(100, 'API name must be less than 100 characters'),
  
  url: z.url('Please enter a valid URL')
    .refine((url) => {
      try {
        const parsedUrl = new URL(url);
        return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
      } catch {
        return false;
      }
    }, 'URL must use HTTP or HTTPS protocol'),
  
  category: z.enum(['stocks', 'crypto', 'forex', 'commodities', 'bonds', 'indices', 'economic', 'custom'] as const),
  
  headers: z.record(z.string(), z.string()).optional(),
  
  apiKey: z.string()
    .max(1000, 'API key must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
  
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  
  curlCommand: z.string().optional(),
});

export type CreateApiEndpointInput = z.infer<typeof createApiEndpointSchema>;

// Widget validation schema
export const createWidgetSchema = z.object({
  name: z.string()
    .min(1, 'Widget name is required')
    .max(100, 'Widget name must be less than 100 characters'),
  
  apiEndpointId: z.string()
    .min(1, 'API endpoint is required')
    .or(z.literal('new'))
    .or(z.literal('')),
  
  displayType: z.enum(['card', 'table', 'chart'] as const),
  
  refreshInterval: z.number()
    .min(30, 'Refresh interval must be at least 30 seconds')
    .max(86400, 'Refresh interval must be less than 24 hours'),
  
  position: z.object({
    x: z.number().optional(),
    y: z.number().optional(),
    width: z.number().min(1).optional(),
    height: z.number().min(1).optional(),
  }).optional(),
});

// Alternative widget schema for widgets without API endpoints (static/demo widgets)
export const createWidgetWithoutApiSchema = z.object({
  name: z.string()
    .min(1, 'Widget name is required')
    .max(100, 'Widget name must be less than 100 characters'),
  
  apiEndpointId: z.string().optional(),
  
  displayType: z.enum(['card', 'table', 'chart'] as const),
  
  refreshInterval: z.number()
    .min(30, 'Refresh interval must be at least 30 seconds')
    .max(86400, 'Refresh interval must be less than 24 hours'),
  
  position: z.object({
    x: z.number().optional(),
    y: z.number().optional(),
    width: z.number().min(1).optional(),
    height: z.number().min(1).optional(),
  }).optional(),
});

export type CreateWidgetInput = z.infer<typeof createWidgetSchema>;

// Widget configuration validation schema
export const configureWidgetSchema = z.object({
  selectedFields: z.array(z.string()),
  
  fieldMappings: z.record(z.string(), z.string()),
  
  formatSettings: z.object({
    currency: z.string().optional(),
    decimalPlaces: z.number().min(0).max(10).optional(),
    showPercentage: z.boolean().optional(),
    dateFormat: z.string().optional(),
    numberFormat: z.enum(['default', 'compact', 'scientific']).optional(),
  }),
  
  styling: z.object({
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
    borderColor: z.string().optional(),
    borderRadius: z.number().min(0).max(50).optional(),
    shadow: z.boolean().optional(),
  }),
});

export type ConfigureWidgetInput = z.infer<typeof configureWidgetSchema>;

// cURL command validation
export const curlCommandSchema = z.string()
  .min(1, 'cURL command is required')
  .refine((curl) => {
    const trimmed = curl.trim().toLowerCase();
    return trimmed.startsWith('curl ') || trimmed === 'curl';
  }, 'Command must start with "curl"')
  .refine((curl) => {
    // Basic validation to ensure it has a URL
    const urlPattern = /https?:\/\/[^\s]+/;
    return urlPattern.test(curl);
  }, 'cURL command must contain a valid HTTP/HTTPS URL');

export type CurlCommandInput = z.infer<typeof curlCommandSchema>;

// Form validation helper
export const validateFormData = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};

// Common API categories for dropdowns
export const API_CATEGORIES: { value: ApiCategory; label: string; description?: string }[] = [
  { value: 'stocks', label: 'Stocks', description: 'Stock market data and quotes' },
  { value: 'crypto', label: 'Cryptocurrency', description: 'Digital currency prices and data' },
  { value: 'forex', label: 'Foreign Exchange', description: 'Currency exchange rates' },
  { value: 'commodities', label: 'Commodities', description: 'Raw materials and primary products' },
  { value: 'bonds', label: 'Bonds', description: 'Fixed income securities' },
  { value: 'indices', label: 'Market Indices', description: 'Stock market indices and benchmarks' },
  { value: 'economic', label: 'Economic Data', description: 'Economic indicators and statistics' },
  { value: 'custom', label: 'Custom', description: 'Custom or other financial data' },
];

// Common display types for widgets
export const DISPLAY_TYPES: { value: DisplayType; label: string; description: string }[] = [
  { value: 'card', label: 'Card', description: 'Simple key-value display with clean layout' },
  { value: 'table', label: 'Table', description: 'Tabular data display with rows and columns' },
  { value: 'chart', label: 'Chart', description: 'Visual data representation with graphs' },
];

// Refresh interval presets
export const REFRESH_INTERVALS = [
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 300, label: '5 minutes' },
  { value: 900, label: '15 minutes' },
  { value: 1800, label: '30 minutes' },
  { value: 3600, label: '1 hour' },
  { value: 21600, label: '6 hours' },
  { value: 86400, label: '24 hours' },
];

import type { CreateWidgetInput, CreateApiEndpointInput } from '@/lib/validation';
import type { ApiEndpoint } from '@/types/widget';

export type ModalStep = 'widget' | 'api';

export type InputMethod = 'form' | 'curl';

export interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (widget: CreateWidgetInput, newApiEndpoint?: CreateApiEndpointInput) => void;
  apiEndpoints: ApiEndpoint[];
}

export interface WidgetFormProps {
  widgetData: CreateWidgetInput;
  errors: Record<string, string>;
  apiEndpoints: ApiEndpoint[];
  onFieldChange: <K extends keyof CreateWidgetInput>(field: K, value: CreateWidgetInput[K]) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export interface ApiFormProps {
  onSubmit: (apiData: CreateApiEndpointInput, selectedFields: string[], fieldMappings: Record<string, string>) => void;
  onBack: () => void;
}

export interface ApiTestingProps {
  apiData: CreateApiEndpointInput;
  onTestSuccess: (responseData: Record<string, unknown> | unknown[]) => void;
  onTestError: (error: string) => void;
}

export interface FieldSelectionProps {
  responseData: Record<string, unknown> | unknown[] | null;
  selectedFields: string[];
  fieldMappings: Record<string, string>;
  onFieldToggle: (field: string, displayName?: string) => void;
  onFieldMappingChange: (field: string, displayName: string) => void;
  onPreviewField?: (field: string | null) => void;
}

export interface CurlInputProps {
  curlCommand: string;
  isParsing: boolean;
  parseError: string | null;
  onCurlChange: (command: string) => void;
  onParse: () => void;
}

export interface ErrorDisplayProps {
  errors: Record<string, string>;
  title?: string;
}

export interface WidgetFormState {
  data: CreateWidgetInput;
  errors: Record<string, string>;
  isValid: boolean;
}

export interface ApiFormState {
  data: CreateApiEndpointInput;
  errors: Record<string, string>;
  isValid: boolean;
}

export interface FieldInfo {
  name: string;
  type: string;
  path: string;
  sampleValue: unknown;
  formattedValue: string;
  isNested: boolean;
  depth: number;
}

export interface FieldValidation {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
}

export interface ApiTestResult {
  success: boolean;
  message: string;
  responseData?: Record<string, unknown> | unknown[];
}

export interface WidgetConfig {
  selectedFields: string[];
  fieldMappings: Record<string, string>;
  formatSettings: Record<string, unknown>;
  styling: Record<string, unknown>;
}

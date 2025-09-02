// Main modal component
export { AddWidgetModal } from '../add-widget-modal';

// Sub-components
export { WidgetForm } from './widget-form';
export { ApiForm } from './api-form';
export { CurlInput } from './curl-input';
export { ApiTesting } from './api-testing';
export { FieldSelection } from './field-selection';
export { TreeFieldSelection } from './tree-field-selection';
export { ErrorDisplay } from './error-display';

// Hooks
export { useWidgetForm } from '@/hooks/use-widget-form';
export { useApiForm } from '@/hooks/use-api-form';
export { useApiTesting } from '@/hooks/use-api-testing';
export { useFieldSelection } from '@/hooks/use-field-selection';
export { useCurlParser } from '@/hooks/use-curl-parser';
export type { ApiEndpoint } from '@/types/widget';

export { 
  type CreateWidgetInput,
  type CreateApiEndpointInput
} from "@/lib/validation";

export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Types
export type * from '@/lib/widget-modal/types';

// Constants
export * from '@/constants/widget-modal';

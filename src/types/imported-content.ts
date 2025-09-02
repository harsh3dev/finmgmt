export interface ImportedContent {
  importId: string;
  importDate: Date;
  sourceName: string; // Original export name
  sourceDescription?: string;
  widgets: string[]; // Widget IDs that were imported in this session
  apiEndpoints: string[]; // API endpoint IDs that were imported in this session
  isTemplate?: boolean; // If imported from a template
  templateId?: string;
  templateVersion?: string;
  importMetadata: ImportMetadata;
}

export interface ImportMetadata {
  originalExportDate?: string;
  originalAppVersion?: string;
  importedBy?: string; // User identifier if available
  importSource: ImportSource;
  totalItems: number;
  successfulItems: number;
  failedItems: number;
  importDuration?: number; // Time taken in milliseconds
}

export type ImportSource = 
  | 'file-upload'
  | 'template-gallery'
  | 'url-import'
  | 'drag-drop'
  | 'clipboard';

// Import session tracking
export interface ImportSession {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  status: ImportSessionStatus;
  importedContent: ImportedContent[];
  errors: ImportError[];
  progress: ImportProgress;
}

export type ImportSessionStatus = 
  | 'pending'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ImportProgress {
  stage: ImportStage;
  progress: number; // 0-100
  message: string;
  currentItem?: string;
  itemsProcessed: number;
  totalItems: number;
}

export type ImportStage = 
  | 'validating'
  | 'generating-ids'
  | 'importing-apis'
  | 'importing-widgets'
  | 'updating-storage'
  | 'tracking-import'
  | 'complete'
  | 'error';

export interface ImportError {
  errorId: string;
  timestamp: Date;
  stage: ImportStage;
  itemType: 'widget' | 'api' | 'setting';
  itemId?: string;
  itemName?: string;
  errorCode: string;
  message: string;
  details?: Record<string, unknown>;
  isRecoverable: boolean;
}

// Import tracking functions types
export interface ImportTracker {
  trackImport: (importData: ImportedContent) => void;
  getImportSession: (importId: string) => ImportedContent | null;
  getAllImportSessions: () => ImportedContent[];
  removeImportGroup: (importId: string) => void;
  getImportedItems: (type: 'widgets' | 'apis') => string[];
  isImported: (itemId: string) => boolean;
  getImportSource: (itemId: string) => ImportedContent | null;
}

// Storage structure for imported content
export interface ImportStorage {
  version: string;
  lastUpdated: Date;
  importSessions: ImportedContent[];
  totalImports: number;
  totalImportedWidgets: number;
  totalImportedApis: number;
}

// Import management operations
export interface ImportOperation {
  operationType: ImportOperationType;
  targetItems: string[];
  metadata?: Record<string, unknown>;
}

export type ImportOperationType = 
  | 'delete-import-session'
  | 'delete-selected-items'
  | 'export-import-session'
  | 'merge-import-sessions'
  | 'restore-import-session';

// Import filter and search
export interface ImportFilter {
  dateRange?: {
    start: Date;
    end: Date;
  };
  sourceType?: ImportSource[];
  isTemplate?: boolean;
  hasErrors?: boolean;
  searchTerm?: string;
}

export interface ImportSearchResult {
  importSessions: ImportedContent[];
  totalResults: number;
  searchTime: number;
  filters: ImportFilter;
}

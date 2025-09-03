export interface TableColumn {
  key: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  type?: 'string' | 'number' | 'date' | 'boolean';
  width?: string;
}

export interface DataTableProps {
  data: unknown[];
  columns?: TableColumn[];
  searchable?: boolean;
  sortable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  exportable?: boolean;
  compact?: boolean;
  className?: string;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface SortState {
  column: string | null;
  direction: 'asc' | 'desc' | null;
}

export interface SearchState {
  query: string;
  filteredData: unknown[];
}

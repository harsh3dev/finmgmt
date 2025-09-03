// Table utility functions

import type { TableColumn } from '@/types/table';

/**
 * Generate columns from data structure
 */
export function generateColumnsFromData(data: unknown[]): TableColumn[] {
  if (!Array.isArray(data) || data.length === 0) return [];
  
  const firstItem = data[0];
  if (typeof firstItem !== 'object' || firstItem === null) {
    return [{
      key: 'value',
      header: 'Value',
      sortable: true,
      type: 'string'
    }];
  }
  
  const keys = Object.keys(firstItem as Record<string, unknown>);
  return keys.map(key => {
    const value = (firstItem as Record<string, unknown>)[key];
    const type = detectColumnType(value);
    
    return {
      key,
      header: formatHeaderName(key),
      sortable: true,
      filterable: type === 'string',
      type
    };
  });
}

/**
 * Detect column type from value
 */
function detectColumnType(value: unknown): TableColumn['type'] {
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'string') {
    // Check if it's a date string
    if (isDateString(value)) return 'date';
    return 'string';
  }
  return 'string';
}

/**
 * Check if string represents a date
 */
function isDateString(str: string): boolean {
  const date = new Date(str);
  return !isNaN(date.getTime()) && str.length > 8;
}

/**
 * Format header name for display
 */
function formatHeaderName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
}

/**
 * Sort data by column
 */
export function sortData(
  data: unknown[], 
  column: string, 
  direction: 'asc' | 'desc'
): unknown[] {
  return [...data].sort((a, b) => {
    const aVal = getValueFromObject(a, column);
    const bVal = getValueFromObject(b, column);
    
    // Handle null/undefined values
    if (aVal === null || aVal === undefined) return direction === 'asc' ? 1 : -1;
    if (bVal === null || bVal === undefined) return direction === 'asc' ? -1 : 1;
    
    // Compare based on type
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    // String comparison
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    
    if (direction === 'asc') {
      return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
    } else {
      return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
    }
  });
}

/**
 * Filter data by search query
 */
export function filterData(data: unknown[], query: string): unknown[] {
  if (!query.trim()) return data;
  
  const lowercaseQuery = query.toLowerCase();
  
  return data.filter(item => {
    if (typeof item === 'string') {
      return item.toLowerCase().includes(lowercaseQuery);
    }
    
    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>;
      return Object.values(obj).some(value => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(lowercaseQuery);
      });
    }
    
    return String(item).toLowerCase().includes(lowercaseQuery);
  });
}

/**
 * Paginate data
 */
export function paginateData(
  data: unknown[], 
  currentPage: number, 
  pageSize: number
): { 
  paginatedData: unknown[]; 
  totalPages: number; 
} {
  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  return {
    paginatedData: data.slice(startIndex, endIndex),
    totalPages
  };
}

/**
 * Get value from object using key
 */
function getValueFromObject(obj: unknown, key: string): unknown {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const record = obj as Record<string, unknown>;
  return record[key];
}

/**
 * Format cell value for display
 */
export function formatCellValue(value: unknown, type: TableColumn['type'] = 'string'): string {
  if (value === null || value === undefined) return 'N/A';
  
  switch (type) {
    case 'number':
      if (typeof value === 'number') {
        return value.toLocaleString();
      }
      break;
    
    case 'date':
      if (typeof value === 'string' && isDateString(value)) {
        return new Date(value).toLocaleDateString();
      }
      break;
    
    case 'boolean':
      return value ? 'Yes' : 'No';
    
    default:
      return String(value);
  }
  
  return String(value);
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: unknown[], filename: string = 'data.csv'): void {
  if (!data.length) return;
  
  const firstItem = data[0];
  if (typeof firstItem !== 'object' || firstItem === null) {
    // Simple array of values
    const csv = data.map(item => `"${String(item).replace(/"/g, '""')}"`).join('\n');
    downloadCSV(csv, filename);
    return;
  }
  
  // Array of objects
  const keys = Object.keys(firstItem as Record<string, unknown>);
  const headers = keys.join(',');
  
  const rows = data.map(item => {
    const obj = item as Record<string, unknown>;
    return keys.map(key => {
      const value = obj[key];
      const stringValue = value === null || value === undefined ? '' : String(value);
      return `"${stringValue.replace(/"/g, '""')}"`;
    }).join(',');
  });
  
  const csv = [headers, ...rows].join('\n');
  downloadCSV(csv, filename);
}

/**
 * Download CSV content as file
 */
function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

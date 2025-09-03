"use client";

import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableSearch } from './table-search';
import { TablePagination } from './table-pagination';
import { formatCellValue, generateColumnsFromData, sortData, filterData, paginateData, exportToCSV } from '@/lib/table-utils';
import { ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react';
import type { DataTableProps, PaginationState, SortState, SearchState } from '@/types/table';

export function DataTable({
  data,
  columns: providedColumns,
  searchable = true,
  sortable = true,
  paginated = true,
  pageSize: initialPageSize = 10,
  exportable = false,
  compact = false,
  className = ""
}: DataTableProps) {
  // Generate columns if not provided
  const columns = useMemo(() => 
    providedColumns || generateColumnsFromData(data), 
    [providedColumns, data]
  );
  
  // State management
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    filteredData: data
  });
  
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    direction: null
  });
  
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: initialPageSize,
    totalItems: data.length,
    totalPages: Math.ceil(data.length / initialPageSize)
  });
  
  // Process data through search, sort, and pagination
  const processedData = useMemo(() => {
    let result = data;
    
    // Apply search filter
    if (searchable && searchState.query) {
      result = filterData(result, searchState.query);
    }
    
    // Apply sorting
    if (sortable && sortState.column && sortState.direction) {
      result = sortData(result, sortState.column, sortState.direction);
    }
    
    // Update pagination totals
    const totalItems = result.length;
    const totalPages = Math.ceil(totalItems / pagination.pageSize);
    
    // Apply pagination
    let paginatedResult = result;
    if (paginated) {
      const { paginatedData } = paginateData(result, pagination.currentPage, pagination.pageSize);
      paginatedResult = paginatedData;
    }
    
    // Update pagination state if needed
    if (totalItems !== pagination.totalItems || totalPages !== pagination.totalPages) {
      setPagination(prev => ({
        ...prev,
        totalItems,
        totalPages,
        currentPage: Math.min(prev.currentPage, totalPages || 1)
      }));
    }
    
    return {
      displayData: paginatedResult,
      filteredData: result,
      totalItems,
      totalPages
    };
  }, [data, searchState.query, sortState, pagination.currentPage, pagination.pageSize, pagination.totalItems, pagination.totalPages, searchable, sortable, paginated]);
  
  // Event handlers
  const handleSearch = (query: string) => {
    setSearchState(prev => ({ ...prev, query }));
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
  };
  
  const handleSort = (column: string) => {
    if (!sortable) return;
    
    setSortState(prev => {
      if (prev.column === column) {
        // Cycle through: asc -> desc -> none
        if (prev.direction === 'asc') {
          return { column, direction: 'desc' };
        } else if (prev.direction === 'desc') {
          return { column: null, direction: null };
        }
      }
      return { column, direction: 'asc' };
    });
  };
  
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };
  
  const handlePageSizeChange = (newPageSize: number) => {
    setPagination(prev => ({
      ...prev,
      pageSize: newPageSize,
      currentPage: 1,
      totalPages: Math.ceil(prev.totalItems / newPageSize)
    }));
  };
  
  const handleExport = () => {
    const exportData = searchState.query ? processedData.filteredData : data;
    exportToCSV(exportData, 'table-data.csv');
  };
  
  const getSortIcon = (column: string) => {
    if (sortState.column !== column) {
      return <ArrowUpDown className={compact ? "h-3 w-3" : "h-4 w-4"} />;
    }
    
    if (sortState.direction === 'asc') {
      return <ArrowUp className={compact ? "h-3 w-3" : "h-4 w-4"} />;
    } else if (sortState.direction === 'desc') {
      return <ArrowDown className={compact ? "h-3 w-3" : "h-4 w-4"} />;
    }
    
    return <ArrowUpDown className={compact ? "h-3 w-3" : "h-4 w-4"} />;
  };
  
  if (data.length === 0) {
    return (
      <div className={`text-center py-8 text-muted-foreground ${className}`}>
        <p className={compact ? "text-sm" : ""}>No data available</p>
      </div>
    );
  }
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={compact ? "text-xs" : ""}>
            Table View • {processedData.totalItems} rows
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {searchable && (
            <TableSearch 
              onSearch={handleSearch} 
              compact={compact}
              placeholder={`Search ${processedData.totalItems} rows...`}
            />
          )}
          
          {exportable && (
            <Button
              variant="outline"
              size={compact ? "sm" : "default"}
              onClick={handleExport}
              className={compact ? "h-8" : ""}
            >
              <Download className={compact ? "h-3 w-3 mr-1" : "h-4 w-4 mr-2"} />
              Export
            </Button>
          )}
        </div>
      </div>
      
      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`text-left font-medium text-muted-foreground ${
                      compact ? "p-2 text-xs" : "p-3 text-sm"
                    } ${
                      sortable && column.sortable !== false ? "cursor-pointer hover:bg-muted/70" : ""
                    }`}
                    onClick={() => sortable && column.sortable !== false && handleSort(column.key)}
                    style={column.width ? { width: column.width } : undefined}
                  >
                    <div className="flex items-center gap-2">
                      {column.header}
                      {sortable && column.sortable !== false && getSortIcon(column.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processedData.displayData.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className="border-b hover:bg-muted/30 transition-colors"
                >
                  {columns.map((column) => {
                    const value = typeof row === 'object' && row !== null 
                      ? (row as Record<string, unknown>)[column.key]
                      : row;
                    
                    return (
                      <td 
                        key={column.key} 
                        className={`${compact ? "p-2 text-xs" : "p-3 text-sm"} max-w-xs`}
                      >
                        <div className="truncate" title={String(value || '')}>
                          {formatCellValue(value, column.type)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination */}
      {paginated && processedData.totalPages > 1 && (
        <TablePagination
          pagination={{
            ...pagination,
            totalItems: processedData.totalItems,
            totalPages: processedData.totalPages
          }}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          compact={compact}
        />
      )}
    </div>
  );
}

"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { PaginationState } from '@/types/table';

interface TablePaginationProps {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  compact?: boolean;
}

export function TablePagination({ 
  pagination, 
  onPageChange, 
  onPageSizeChange,
  compact = false 
}: TablePaginationProps) {
  const { currentPage, totalPages, totalItems, pageSize } = pagination;
  
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  
  const pageSizeOptions = compact ? [10, 25, 50] : [10, 25, 50, 100];
  
  return (
    <div className={`flex items-center justify-between ${compact ? 'text-xs' : 'text-sm'}`}>
      {/* Items info */}
      <div className="text-muted-foreground">
        {totalItems > 0 ? (
          <>
            Showing {startItem}-{endItem} of {totalItems} items
          </>
        ) : (
          'No items'
        )}
      </div>
      
      {/* Controls */}
      <div className="flex items-center space-x-2">
        {/* Page size selector */}
        {!compact && (
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground">Rows per page:</span>
            <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
              <SelectTrigger className="w-16 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map(size => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Page navigation */}
        <div className="flex items-center space-x-1">
          {/* First page */}
          <Button
            variant="outline"
            size={compact ? "sm" : "default"}
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className={compact ? "h-7 w-7 p-0" : "h-8 w-8 p-0"}
          >
            <ChevronsLeft className={compact ? "h-3 w-3" : "h-4 w-4"} />
          </Button>
          
          {/* Previous page */}
          <Button
            variant="outline"
            size={compact ? "sm" : "default"}
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={compact ? "h-7 w-7 p-0" : "h-8 w-8 p-0"}
          >
            <ChevronLeft className={compact ? "h-3 w-3" : "h-4 w-4"} />
          </Button>
          
          {/* Page numbers */}
          <div className={`flex items-center space-x-1 ${compact ? 'text-xs' : ''}`}>
            {renderPageNumbers(currentPage, totalPages, onPageChange, compact)}
          </div>
          
          {/* Next page */}
          <Button
            variant="outline"
            size={compact ? "sm" : "default"}
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={compact ? "h-7 w-7 p-0" : "h-8 w-8 p-0"}
          >
            <ChevronRight className={compact ? "h-3 w-3" : "h-4 w-4"} />
          </Button>
          
          {/* Last page */}
          <Button
            variant="outline"
            size={compact ? "sm" : "default"}
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={compact ? "h-7 w-7 p-0" : "h-8 w-8 p-0"}
          >
            <ChevronsRight className={compact ? "h-3 w-3" : "h-4 w-4"} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function renderPageNumbers(
  currentPage: number, 
  totalPages: number, 
  onPageChange: (page: number) => void,
  compact: boolean
) {
  const pages: (number | string)[] = [];
  
  if (totalPages <= 7) {
    // Show all pages if there are 7 or fewer
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);
    
    if (currentPage > 3) {
      pages.push('...');
    }
    
    // Show pages around current page
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (currentPage < totalPages - 2) {
      pages.push('...');
    }
    
    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
  }
  
  return pages.map((page, index) => {
    if (page === '...') {
      return (
        <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
          ...
        </span>
      );
    }
    
    const pageNumber = page as number;
    const isActive = pageNumber === currentPage;
    
    return (
      <Button
        key={pageNumber}
        variant={isActive ? "default" : "outline"}
        size={compact ? "sm" : "default"}
        onClick={() => onPageChange(pageNumber)}
        className={compact ? "h-7 w-7 p-0 text-xs" : "h-8 w-8 p-0"}
      >
        {pageNumber}
      </Button>
    );
  });
}

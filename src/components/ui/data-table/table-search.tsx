"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface TableSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  compact?: boolean;
  initialValue?: string;
}

export function TableSearch({ 
  onSearch, 
  placeholder = "Search all columns...", 
  compact = false,
  initialValue = ""
}: TableSearchProps) {
  const [query, setQuery] = useState(initialValue);
  
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onSearch(query);
    }, 300); // 300ms debounce
    
    return () => clearTimeout(debounceTimer);
  }, [query, onSearch]);
  
  const handleClear = () => {
    setQuery('');
  };
  
  return (
    <div className="relative">
      <div className="relative">
        <Search className={`absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground ${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`pl-8 pr-8 ${compact ? 'h-8 text-xs' : ''}`}
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className={`absolute right-1 top-1/2 transform -translate-y-1/2 ${compact ? 'h-6 w-6 p-0' : 'h-7 w-7 p-0'}`}
          >
            <X className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
          </Button>
        )}
      </div>
    </div>
  );
}

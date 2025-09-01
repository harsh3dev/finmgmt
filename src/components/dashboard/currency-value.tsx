"use client";

import { 
  useCurrencyConversion, 
  formatCurrencyValue, 
  detectCurrencyFromData 
} from "@/lib/currency-service";
import type { Widget } from "@/types/widget";

interface CurrencyValueProps {
  value: unknown;
  widget: Widget;
  apiData?: unknown;
}

export function CurrencyValue({ value, widget, apiData }: CurrencyValueProps) {
  const { formatSettings } = widget.config;
  
  // Detect source currency from API data if available
  const sourceCurrency = apiData ? detectCurrencyFromData(apiData) : 'USD';
  const targetCurrency = formatSettings.currency?.toUpperCase() || 'USD';
  
  // Always call the hook, but control with enabled parameter
  const { convertedAmount, isLoading, isError } = useCurrencyConversion({
    amount: typeof value === 'number' ? value : 0,
    fromCurrency: sourceCurrency,
    toCurrency: targetCurrency,
    enabled: typeof value === 'number' && 
             Boolean(formatSettings.currency) && 
             sourceCurrency !== targetCurrency,
  });

  // If not a number or no currency setting, use simple formatting
  if (typeof value !== 'number' || !formatSettings.currency) {
    return <span>{formatSimpleValue(value, widget)}</span>;
  }

  if (isLoading) {
    return <span className="text-muted-foreground">Converting...</span>;
  }

  if (isError || convertedAmount === null) {
    // Fallback to simple currency formatting
    return (
      <span>
        {formatCurrencyValue(value, targetCurrency, formatSettings.decimalPlaces)}
      </span>
    );
  }

  return (
    <span>
      {formatCurrencyValue(convertedAmount, targetCurrency, formatSettings.decimalPlaces)}
    </span>
  );
}

// Helper function for non-currency values
function formatSimpleValue(value: unknown, widget: Widget): string {
  if (value === null || value === undefined || value === '') return 'N/A';
  
  const { formatSettings } = widget.config;
  
  if (typeof value === 'number') {
    let formatted = value;
    
    // Apply decimal places
    if (formatSettings.decimalPlaces !== undefined) {
      formatted = parseFloat(formatted.toFixed(formatSettings.decimalPlaces));
    }
    
    return formatted.toString();
  }
  
  if (typeof value === 'string') {
    // Try to parse string as number for decimal formatting
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && formatSettings.decimalPlaces !== undefined) {
      return numericValue.toFixed(formatSettings.decimalPlaces);
    }
    return value;
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  // For objects or arrays, show a preview
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return `Array (${value.length} items)`;
    }
    return 'Object';
  }
  
  return String(value);
}

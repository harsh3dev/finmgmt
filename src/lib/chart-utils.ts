import type { ChartData, ChartAnalysis, ChartType } from '@/types/chart';

/**
 * Transform raw data into chart-compatible format
 */
export function transformDataForChart(
  data: unknown,
  xField?: string
): ChartData[] {

  
  if (!data) return [];
  
  if (!Array.isArray(data)) {
    // Convert single object to array
    if (typeof data === 'object' && data !== null) {
      const result = [data as ChartData];

      return result;
    }

    return [];
  }

  const result = data
    .filter(item => item && typeof item === 'object')
    .map((item, index) => {
      const chartItem: ChartData = { ...item as Record<string, unknown> };
      
      // Ensure we have a name field for charts
      if (!chartItem.name && !chartItem.label) {
        if (xField && chartItem[xField]) {
          chartItem.name = String(chartItem[xField]);
        } else {
          chartItem.name = `Item ${index + 1}`;
        }
      }
      
      return chartItem;
    });
    

  return result;
}

/**
 * Extract numeric values from data for simple visualizations
 */
export function extractNumericData(data: unknown, fields: string[]): Array<{
  name: string;
  value: number;
  field: string;
}> {
  const numericData: Array<{ name: string; value: number; field: string }> = [];
  

  
  fields.forEach(field => {
    // Handle array notation like "financials[].fiscalPeriodNumber"
    if (field.includes('[]')) {
      const [arrayPath, itemPath] = field.split('[].');
      const arrayValue = getNestedValue(data, arrayPath);
      

      
      if (Array.isArray(arrayValue)) {
        arrayValue.forEach((item, index) => {
          if (item && typeof item === 'object') {
            const value = getNestedValue(item, itemPath);

            
            // Accept numbers OR numeric strings
            if (typeof value === 'number' && !isNaN(value)) {
              numericData.push({
                name: `${itemPath || field} #${index + 1}`,
                value,
                field: `${field}[${index}]`
              });
            } else if (typeof value === 'string') {
              const parsed = parseFloat(value.replace(/,/g, ''));
              if (!isNaN(parsed)) {
                numericData.push({
                  name: `${itemPath || field} #${index + 1}`,
                  value: parsed,
                  field: `${field}[${index}]`
                });
              }
            }
          }
        });
      }
    } else {
      // Handle regular nested paths
      const value = getNestedValue(data, field);

      
      if (typeof value === 'number' && !isNaN(value)) {
        numericData.push({
          name: field.split('.').pop() || field,
          value,
          field
        });
      } else if (typeof value === 'string') {
        const parsed = parseFloat(value.replace(/,/g, ''));
        if (!isNaN(parsed)) {
          numericData.push({
            name: field.split('.').pop() || field,
            value: parsed,
            field
          });
        }
      } else if (Array.isArray(value)) {
        const numbers = value.filter(v => typeof v === 'number' && !isNaN(v)) as number[];
        // Also allow numeric strings inside arrays
        if (numbers.length === 0) {
          const numFromStrings = value
            .filter(v => typeof v === 'string')
            .map(v => parseFloat((v as string).replace(/,/g, '')))
            .filter(v => !isNaN(v));
          if (numFromStrings.length > 0) {
            const avg = numFromStrings.reduce((sum, num) => sum + num, 0) / numFromStrings.length;
            numericData.push({
              name: `${field.split('.').pop() || field} (avg)` ,
              value: avg,
              field
            });
            return;
          }
        }
        if (numbers.length > 0) {
          const avg = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
          numericData.push({
            name: `${field.split('.').pop() || field} (avg)`,
            value: avg,
            field
          });
        } else if (value.length && typeof value[0] === 'object' && value[0] !== null) {
          // Array of objects but user gave path without '[]' – attempt numeric property discovery
          const firstObj = value.find(v => typeof v === 'object' && v !== null) as Record<string, unknown> | undefined;
          if (firstObj) {
            Object.keys(firstObj).slice(0, 5).forEach(key => {
              const raw = (firstObj as Record<string, unknown>)[key];
              let num: number | null = null;
              if (typeof raw === 'number') num = raw;
              else if (typeof raw === 'string') {
                const parsed = parseFloat(raw.replace(/,/g, ''));
                if (!isNaN(parsed)) num = parsed;
              }
              if (num !== null) {
                numericData.push({
                  name: `${key}`,
                  value: num,
                  field: `${field}[].${key}`
                });
              }
            });
          }
        }
      }
    }
  });
  

  return numericData;
}

/**
 * Find numeric fields directly from data structure
 */
function findNumericFieldsDirectly(data: unknown, requestedFields: string[]): string[] {
  const numericFields: string[] = [];
  
  if (Array.isArray(data) && data.length > 0) {
    const firstItem = data[0];
    if (typeof firstItem === 'object' && firstItem !== null) {
      const obj = firstItem as Record<string, unknown>;
      Object.keys(obj).forEach(key => {
        if (requestedFields.includes(key) && typeof obj[key] === 'number') {
          numericFields.push(key);
        }
      });
    }
  } else if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    Object.keys(obj).forEach(key => {
      if (requestedFields.includes(key) && typeof obj[key] === 'number') {
        numericFields.push(key);
      }
    });
  }
  
  return numericFields;
}

/**
 * Analyze data structure for chart recommendations
 */
export function analyzeDataForChart(data: unknown, fields: string[]): ChartAnalysis {
  let hasTimeField = false;
  let hasNumericFields = false;
  let hasCategoricalField = false;
  const numericFields: string[] = [];
  const categoricalFields: string[] = [];
  const timeFields: string[] = [];



  // Analyze each field
  fields.forEach(field => {
    const value = getNestedValue(data, field);

    
    const fieldType = detectFieldType(value, field);

    
    switch (fieldType) {
      case 'time':
        hasTimeField = true;
        timeFields.push(field);
        break;
      case 'numeric':
        hasNumericFields = true;
        numericFields.push(field);
        break;
      case 'categorical':
        hasCategoricalField = true;
        categoricalFields.push(field);
        break;
    }
  });

  // Also try to detect numeric fields directly from data if field paths are failing
  if (numericFields.length === 0 && typeof data === 'object' && data !== null) {

    
    const directNumericFields = findNumericFieldsDirectly(data, fields);

    
    directNumericFields.forEach((field: string) => {
      if (!numericFields.includes(field)) {
        numericFields.push(field);
        hasNumericFields = true;
      }
    });
  }

  // Determine recommended chart type
  let recommendedChartType: ChartType = 'bar';
  let reasoning = 'Default bar chart for mixed data';

  if (hasTimeField && hasNumericFields) {
    recommendedChartType = 'line';
    reasoning = 'Time series data detected - line chart best for trends';
  } else if (hasCategoricalField && hasNumericFields) {
    if (categoricalFields.length === 1 && numericFields.length === 1) {
      // Simple categorical vs numeric - could be pie or bar
      if (Array.isArray(data) && data.length <= 8) {
        recommendedChartType = 'pie';
        reasoning = 'Small categorical dataset - pie chart shows proportions well';
      } else {
        recommendedChartType = 'bar';
        reasoning = 'Categorical data - bar chart for comparisons';
      }
    } else {
      recommendedChartType = 'bar';
      reasoning = 'Multiple fields - bar chart handles complexity well';
    }
  } else if (numericFields.length >= 2) {
    recommendedChartType = 'scatter';
    reasoning = 'Multiple numeric fields - scatter plot shows correlations';
  } else if (hasNumericFields) {
    recommendedChartType = 'area';
    reasoning = 'Single numeric field - area chart emphasizes magnitude';
  }

  return {
    hasTimeField,
    hasNumericFields,
    hasCategoricalField,
    numericFields,
    categoricalFields,
    timeFields,
    recommendedChartType,
    reasoning
  };
}

/**
 * Detect field type based on content and name
 */
function detectFieldType(value: unknown, fieldName: string): 'time' | 'numeric' | 'categorical' | 'other' {
  const fieldLower = fieldName.toLowerCase();
  
  // Time field detection
  if (fieldLower.includes('date') || fieldLower.includes('time') || fieldLower.includes('timestamp')) {
    return 'time';
  }
  
  if (typeof value === 'string') {
    // Check if string looks like a date
    const date = new Date(value);
    if (!isNaN(date.getTime()) && value.length > 8) {
      return 'time';
    }
    return 'categorical';
  }
  
  if (typeof value === 'number') {
    return 'numeric';
  }
  
  if (Array.isArray(value)) {
    const firstItem = value[0];
    if (typeof firstItem === 'number') {
      return 'numeric';
    }
    if (typeof firstItem === 'string') {
      return 'categorical';
    }
  }
  
  return 'other';
}

/**
 * Get default colors for charts
 */
export function getChartColors(theme: 'light' | 'dark' = 'light'): string[] {
  if (theme === 'dark') {
    return [
      '#60a5fa', // blue-400
      '#34d399', // emerald-400
      '#f87171', // red-400
      '#fbbf24', // amber-400
      '#a78bfa', // violet-400
      '#fb7185', // rose-400
      '#4ade80', // green-400
      '#38bdf8', // sky-400
    ];
  }
  
  return [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#ef4444', // red-500
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#22c55e', // green-500
    '#06b6d4', // cyan-500
  ];
}

/**
 * Helper function to get nested values (reused from widget-renderer-helpers)
 */
function getNestedValue(obj: unknown, path: string): unknown {
  if (!obj || !path) return null;
  
  let current: unknown = obj;
  const pathParts = path.split('.');
  
  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i];
    
    if (current === null || current === undefined) return null;
    
    if (Array.isArray(current)) {
      if (/^\d+$/.test(part)) {
        const index = parseInt(part, 10);
        if (index >= 0 && index < current.length) {
          current = current[index];
          continue;
        } else {
          return null;
        }
      }
      
      if (part === '[]' || part === '*') {
        continue;
      } 
      
      const remainingPath = pathParts.slice(i).join('.');
      const results = current.map(item => {
        if (item && typeof item === 'object') {
          return getNestedValue(item, remainingPath);
        }
        return null;
      }).filter(v => v !== null && v !== undefined);
      
      if (results.length > 0) {
        const firstResult = results[0];
        if (typeof firstResult !== 'object' && results.every(r => r === firstResult)) {
          return firstResult;
        }
        return results;
      }
      return null;
    } else if (typeof current === 'object' && current !== null) {
      const currentObj = current as Record<string, unknown>;
      
      if (part in currentObj) {
        current = currentObj[part];
      } else {
        let found = false;
        for (let j = i; j < pathParts.length; j++) {
          const compoundKey = pathParts.slice(i, j + 1).join('.');
          if (compoundKey in currentObj) {
            current = currentObj[compoundKey];
            i = j;
            found = true;
            break;
          }
        }
        
        if (!found) {
          return null;
        }
      }
    } else {
      return null;
    }
  }
  
  return current;
}

/**
 * Format numbers for chart display
 */
export function formatChartNumber(value: number, type: 'currency' | 'percentage' | 'number' = 'number'): string {
  if (type === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  }
  
  if (type === 'percentage') {
    return `${(value * 100).toFixed(1)}%`;
  }
  
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  
  return value.toFixed(2);
}

/**
 * Generate responsive chart dimensions
 */
export function getChartDimensions(compact: boolean = false): { width: number; height: number } {
  if (compact) {
    return { width: 300, height: 200 };
  }
  return { width: 400, height: 300 };
}

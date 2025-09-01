import type { CreateApiEndpointInput } from '@/lib/validation';

export function parseCurlCommand(curlCommand: string): Partial<CreateApiEndpointInput> {
  const trimmed = curlCommand.trim();
  
  if (!trimmed.toLowerCase().startsWith('curl ')) {
    throw new Error('Command must start with "curl"');
  }

  const urlMatch = trimmed.match(/['"]?(https?:\/\/[^\s'"]+)['"]?/);
  if (!urlMatch) {
    throw new Error('No valid URL found in cURL command');
  }

  const url = urlMatch[1];
  const headers: Record<string, string> = {};

  const headerMatches = trimmed.matchAll(/-H\s+['"]([^'"]+)['"]/g);
  for (const match of headerMatches) {
    const headerString = match[1];
    const colonIndex = headerString.indexOf(':');
    if (colonIndex > 0) {
      const key = headerString.substring(0, colonIndex).trim();
      const value = headerString.substring(colonIndex + 1).trim();
      headers[key] = value;
    }
  }

  const methodMatch = trimmed.match(/-X\s+(\w+)/i);
  const method = methodMatch ? methodMatch[1].toUpperCase() : 'GET';

  if (method !== 'GET') {
    headers['X-HTTP-Method'] = method;
  }

  return {
    url,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  };
}

export function generateApiNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    if (pathParts.length > 0) {
      return `${hostname} - ${pathParts[0]}`;
    }
    
    return `API from ${hostname}`;
  } catch {
    return 'Custom API';
  }
}

export function validateApiUrl(url: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!url) {
    errors.push('URL is required');
    return { isValid: false, errors };
  }

  try {
    const urlObj = new URL(url);
    
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      errors.push('URL must use HTTP or HTTPS protocol');
    }
    
    if (!urlObj.hostname) {
      errors.push('URL must have a valid hostname');
    }
    
    if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
      errors.push('Localhost URLs may not be accessible from your dashboard');
    }
    
  } catch {
    errors.push('Invalid URL format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function guessApiCategory(url: string, headers?: Record<string, string>): 'stocks' | 'crypto' | 'forex' | 'commodities' | 'bonds' | 'indices' | 'economic' | 'custom' {
  const urlLower = url.toLowerCase();
  const allText = [urlLower, JSON.stringify(headers || {}).toLowerCase()].join(' ');

  if (allText.includes('stock') || allText.includes('equity') || allText.includes('alphavantage')) {
    return 'stocks';
  }
  
  if (allText.includes('crypto') || allText.includes('bitcoin') || allText.includes('ethereum') || allText.includes('coinbase') || allText.includes('binance')) {
    return 'crypto';
  }
  
  if (allText.includes('forex') || allText.includes('currency') || allText.includes('exchange') || allText.includes('fixer.io')) {
    return 'forex';
  }
  
  if (allText.includes('gold') || allText.includes('oil') || allText.includes('commodity')) {
    return 'commodities';
  }
  
  if (allText.includes('bond') || allText.includes('treasury')) {
    return 'bonds';
  }
  
  if (allText.includes('index') || allText.includes('s&p') || allText.includes('nasdaq') || allText.includes('dow')) {
    return 'indices';
  }
  
  if (allText.includes('economic') || allText.includes('gdp') || allText.includes('inflation') || allText.includes('fed')) {
    return 'economic';
  }

  return 'custom';
}

export function sanitizeApiHeaders(headers: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  const allowedHeaders = [
    'authorization',
    'content-type',
    'accept',
    'user-agent',
    'x-api-key',
    'x-rapidapi-key',
    'x-rapidapi-host'
  ];

  Object.entries(headers).forEach(([key, value]) => {
    const keyLower = key.toLowerCase();
    if (allowedHeaders.includes(keyLower)) {
      sanitized[key] = value;
    }
  });

  return sanitized;
}

/**
 * Check if API endpoint requires authentication
 */
export function requiresAuthentication(url: string, headers?: Record<string, string>): boolean {
  const urlLower = url.toLowerCase();
  const headerKeys = Object.keys(headers || {}).map(k => k.toLowerCase());

  // Check for auth headers
  if (headerKeys.some(key => 
    key.includes('authorization') || 
    key.includes('api-key') || 
    key.includes('x-api-key')
  )) {
    return true;
  }

  // Check for known APIs that require auth
  const authRequiredPatterns = [
    'alphavantage.co',
    'rapidapi.com',
    'api.polygon.io',
    'api.twelvedata.com'
  ];

  return authRequiredPatterns.some(pattern => urlLower.includes(pattern));
}

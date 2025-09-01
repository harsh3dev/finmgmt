import type { ApiEndpoint, ApiResponse } from "@/types/widget";

export interface CurlRequest {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  data?: unknown;
  timeout?: number;
}

export interface ParsedCurlRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  data?: string;
}

export class ApiService {
  private static instance: ApiService;
  private cache = new Map<string, { data: ApiResponse; timestamp: number; ttl: number }>();
  private requestQueue = new Map<string, Promise<ApiResponse>>();

  private constructor() {}

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  /**
   * Parse a cURL command string into a request object
   */
  parseCurlCommand(curlCommand: string): ParsedCurlRequest {
    const result: ParsedCurlRequest = {
      url: '',
      method: 'GET',
      headers: {},
    };

    // Remove 'curl' from the beginning and normalize whitespace
    const cleanCommand = curlCommand
      .replace(/^curl\s+/i, '')
      .replace(/\\\s*\n\s*/g, ' ')
      .trim();

    // Extract URL (first argument that looks like a URL or is quoted)
    const urlMatch = cleanCommand.match(/(?:^|\s)(['"]?)([^\s'"]+?)\1(?:\s|$)/) ||
                    cleanCommand.match(/(?:^|\s)(['"])([^'"]+)\1(?:\s|$)/);
    
    if (urlMatch) {
      result.url = urlMatch[2];
    }

    // Extract method
    const methodMatch = cleanCommand.match(/-X\s+([A-Z]+)|--request\s+([A-Z]+)/i);
    if (methodMatch) {
      result.method = (methodMatch[1] || methodMatch[2]).toUpperCase();
    }

    // Extract headers
    const headerMatches = cleanCommand.matchAll(/-H\s+['"]([^'"]+)['"]|--header\s+['"]([^'"]+)['"]/g);
    for (const match of headerMatches) {
      const headerValue = match[1] || match[2];
      const [key, ...valueParts] = headerValue.split(':');
      if (key && valueParts.length > 0) {
        result.headers[key.trim()] = valueParts.join(':').trim();
      }
    }

    // Extract data/body
    const dataMatch = cleanCommand.match(/-d\s+['"]([^'"]*?)['"]|--data\s+['"]([^'"]*?)['"]|-d\s+(\S+)|--data\s+(\S+)/);
    if (dataMatch) {
      result.data = dataMatch[1] || dataMatch[2] || dataMatch[3] || dataMatch[4];
    }

    return result;
  }

  /**
   * Fetch data from an API endpoint with caching and error handling
   */
  async fetchData(
    endpoint: ApiEndpoint, 
    options: {
      bypassCache?: boolean;
      timeout?: number;
      curlCommand?: string;
    } = {}
  ): Promise<ApiResponse> {
    const { bypassCache = false, timeout = 30000, curlCommand } = options;
    
    try {
      // Create cache key
      const cacheKey = `${endpoint.id}-${endpoint.url}`;
      
      // Check cache first (unless bypassing)
      if (!bypassCache) {
        const cached = this.getCachedResponse(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // Check if request is already in progress
      if (this.requestQueue.has(cacheKey)) {
        return await this.requestQueue.get(cacheKey)!;
      }

      // Create request promise
      const requestPromise = this.executeRequest(endpoint, timeout, curlCommand);
      this.requestQueue.set(cacheKey, requestPromise);

      try {
        const response = await requestPromise;
        
        // Cache successful responses for 5 minutes
        if (response.status === 'success') {
          this.setCachedResponse(cacheKey, response, 5 * 60 * 1000);
        }

        return response;
      } finally {
        // Remove from queue when complete
        this.requestQueue.delete(cacheKey);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        data: null,
        status: 'error',
        error: errorMessage,
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Execute the actual HTTP request
   */
  private async executeRequest(
    endpoint: ApiEndpoint, 
    timeout: number,
    curlCommand?: string
  ): Promise<ApiResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      let requestConfig: RequestInit;
      let url: string;

      if (curlCommand) {
        // Parse cURL command if provided
        const parsed = this.parseCurlCommand(curlCommand);
        url = parsed.url;
        requestConfig = {
          method: parsed.method,
          headers: {
            'Content-Type': 'application/json',
            ...parsed.headers,
          },
          body: parsed.data ? JSON.stringify(parsed.data) : undefined,
          signal: controller.signal,
        };
      } else {
        // Use endpoint configuration
        url = endpoint.url;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...endpoint.headers,
        };

        // Add API key to headers if available
        if (endpoint.apiKey) {
          headers['Authorization'] = `Bearer ${endpoint.apiKey}`;
        }

        requestConfig = {
          method: 'GET',
          headers,
          signal: controller.signal,
        };
      }

      const response = await fetch(url, requestConfig);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      let data: unknown;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        // Try to parse as JSON, fallback to text
        try {
          data = JSON.parse(text);
        } catch {
          data = { content: text };
        }
      }

      return {
        data: data as Record<string, unknown> | unknown[] | null,
        status: 'success',
        lastUpdated: new Date(),
      };

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Get cached response if valid
   */
  private getCachedResponse(key: string): ApiResponse | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now > cached.timestamp + cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return {
      ...cached.data,
      lastUpdated: new Date(cached.timestamp),
    };
  }

  /**
   * Set cached response
   */
  private setCachedResponse(key: string, response: ApiResponse, ttl: number): void {
    this.cache.set(key, {
      data: response,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Clear all cached responses
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear cached response for a specific endpoint
   */
  clearCacheForEndpoint(endpointId: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.startsWith(`${endpointId}-`)
    );
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Test an API endpoint configuration
   */
  async testEndpoint(endpoint: Omit<ApiEndpoint, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse> {
    const testEndpoint: ApiEndpoint = {
      ...endpoint,
      id: 'test',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.fetchData(testEndpoint, { bypassCache: true, timeout: 10000 });
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const apiService = ApiService.getInstance();

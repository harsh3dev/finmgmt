import { ApiEndpoint } from '@/types/widget';
import { 
  encryptApiKey, 
  decryptApiKey, 
  isValidEncryptedData,
  type EncryptedData 
} from '@/lib/crypto-utils';

interface SecureApiEndpoint extends Omit<ApiEndpoint, 'apiKey'> {
  apiKey?: string | EncryptedData;
  isEncrypted?: boolean;
}

class SecureStorageService {
  private static instance: SecureStorageService;
  private readonly STORAGE_KEY = 'finance-dashboard-apis';
  private readonly MIGRATION_KEY = 'finance-api-migration-v1';

  private constructor() {}

  static getInstance(): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService();
    }
    return SecureStorageService.instance;
  }

  private async migrateExistingEndpoints(): Promise<void> {
    try {
      const migrated = localStorage.getItem(this.MIGRATION_KEY);
      if (migrated) return;

      const existing = localStorage.getItem(this.STORAGE_KEY);
      if (!existing) {
        localStorage.setItem(this.MIGRATION_KEY, 'completed');
        return;
      }

      const endpoints: ApiEndpoint[] = JSON.parse(existing);
      const migratedEndpoints: SecureApiEndpoint[] = [];

      for (const endpoint of endpoints) {
        if (endpoint.apiKey && typeof endpoint.apiKey === 'string') {
          try {
            const encrypted = await encryptApiKey(endpoint.apiKey);
            migratedEndpoints.push({
              ...endpoint,
              apiKey: encrypted,
              isEncrypted: true,
            });
          } catch (error) {
            console.warn(`Failed to encrypt API key for endpoint ${endpoint.id}:`, error);
            migratedEndpoints.push({
              ...endpoint,
              isEncrypted: false,
            });
          }
        } else {
          migratedEndpoints.push({
            ...endpoint,
            isEncrypted: false,
          });
        }
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(migratedEndpoints));
      localStorage.setItem(this.MIGRATION_KEY, 'completed');
      
      console.log(`Migrated ${migratedEndpoints.length} API endpoints with encryption`);
    } catch (error) {
      console.error('Failed to migrate API endpoints:', error);
    }
  }

  async getApiEndpoints(): Promise<ApiEndpoint[]> {
    await this.migrateExistingEndpoints();

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const endpoints: SecureApiEndpoint[] = JSON.parse(stored);
      const decryptedEndpoints: ApiEndpoint[] = [];

      for (const endpoint of endpoints) {
        let apiKey: string | undefined = undefined;

        if (endpoint.apiKey) {
          if (endpoint.isEncrypted && isValidEncryptedData(endpoint.apiKey)) {
            try {
              apiKey = await decryptApiKey(endpoint.apiKey as EncryptedData);
            } catch (error) {
              console.warn(`Failed to decrypt API key for endpoint ${endpoint.id}:`, error);
              apiKey = undefined;
            }
          } else if (typeof endpoint.apiKey === 'string') {
            apiKey = endpoint.apiKey;
          }
        }

        decryptedEndpoints.push({
          ...endpoint,
          apiKey,
        });
      }

      return decryptedEndpoints;
    } catch (error) {
      console.error('Failed to get API endpoints:', error);
      return [];
    }
  }

  async saveApiEndpoints(endpoints: ApiEndpoint[]): Promise<boolean> {
    try {
      const secureEndpoints: SecureApiEndpoint[] = [];

      for (const endpoint of endpoints) {
        let secureEndpoint: SecureApiEndpoint = {
          ...endpoint,
          isEncrypted: false,
        };

        if (endpoint.apiKey && endpoint.apiKey.trim().length > 0) {
          try {
            const encrypted = await encryptApiKey(endpoint.apiKey);
            secureEndpoint = {
              ...endpoint,
              apiKey: encrypted,
              isEncrypted: true,
            };
          } catch (error) {
            console.warn(`Failed to encrypt API key for endpoint ${endpoint.id}:`, error);
            secureEndpoint = {
              ...endpoint,
              isEncrypted: false,
            };
          }
        }

        secureEndpoints.push(secureEndpoint);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(secureEndpoints));
      return true;
    } catch (error) {
      console.error('Failed to save API endpoints:', error);
      return false;
    }
  }

  async addApiEndpoint(endpoint: ApiEndpoint): Promise<boolean> {
    try {
      const existing = await this.getApiEndpoints();
      const updated = [...existing, endpoint];
      return this.saveApiEndpoints(updated);
    } catch (error) {
      console.error('Failed to add API endpoint:', error);
      return false;
    }
  }

  async updateApiEndpoint(endpointId: string, updates: Partial<ApiEndpoint>): Promise<boolean> {
    try {
      const existing = await this.getApiEndpoints();
      const index = existing.findIndex(ep => ep.id === endpointId);
      
      if (index === -1) {
        throw new Error(`Endpoint with ID ${endpointId} not found`);
      }

      existing[index] = { ...existing[index], ...updates };
      return this.saveApiEndpoints(existing);
    } catch (error) {
      console.error('Failed to update API endpoint:', error);
      return false;
    }
  }

  async removeApiEndpoint(endpointId: string): Promise<boolean> {
    try {
      const existing = await this.getApiEndpoints();
      const filtered = existing.filter(ep => ep.id !== endpointId);
      return this.saveApiEndpoints(filtered);
    } catch (error) {
      console.error('Failed to remove API endpoint:', error);
      return false;
    }
  }

  async getApiEndpoint(endpointId: string): Promise<ApiEndpoint | null> {
    try {
      const endpoints = await this.getApiEndpoints();
      return endpoints.find(ep => ep.id === endpointId) || null;
    } catch (error) {
      console.error('Failed to get API endpoint:', error);
      return null;
    }
  }

  async getMaskedApiKeys(): Promise<Record<string, string>> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return {};

      const endpoints: SecureApiEndpoint[] = JSON.parse(stored);
      const masked: Record<string, string> = {};

      for (const endpoint of endpoints) {
        if (endpoint.apiKey) {
          if (endpoint.isEncrypted && isValidEncryptedData(endpoint.apiKey)) {
            masked[endpoint.id] = '••••••••••••••••';
          } else if (typeof endpoint.apiKey === 'string') {
            const key = endpoint.apiKey;
            if (key.length >= 8) {
              const start = key.substring(0, 4);
              const end = key.substring(key.length - 4);
              const middle = '•'.repeat(Math.min(key.length - 8, 20));
              masked[endpoint.id] = `${start}${middle}${end}`;
            } else {
              masked[endpoint.id] = '••••••••';
            }
          }
        }
      }

      return masked;
    } catch (error) {
      console.error('Failed to get masked API keys:', error);
      return {};
    }
  }

  async hasEncryptedKey(endpointId: string): Promise<boolean> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return false;

      const endpoints: SecureApiEndpoint[] = JSON.parse(stored);
      const endpoint = endpoints.find(ep => ep.id === endpointId);
      
      return !!(endpoint?.isEncrypted && endpoint.apiKey);
    } catch (error) {
      console.error('Failed to check encrypted key status:', error);
      return false;
    }
  }

  clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.MIGRATION_KEY);
  }

  async getStorageStats(): Promise<{
    totalEndpoints: number;
    encryptedKeys: number;
    plainTextKeys: number;
    noKeys: number;
  }> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return { totalEndpoints: 0, encryptedKeys: 0, plainTextKeys: 0, noKeys: 0 };
      }

      const endpoints: SecureApiEndpoint[] = JSON.parse(stored);
      let encryptedKeys = 0;
      let plainTextKeys = 0;
      let noKeys = 0;

      for (const endpoint of endpoints) {
        if (!endpoint.apiKey) {
          noKeys++;
        } else if (endpoint.isEncrypted) {
          encryptedKeys++;
        } else {
          plainTextKeys++;
        }
      }

      return {
        totalEndpoints: endpoints.length,
        encryptedKeys,
        plainTextKeys,
        noKeys,
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { totalEndpoints: 0, encryptedKeys: 0, plainTextKeys: 0, noKeys: 0 };
    }
  }
}

export const secureStorageService = SecureStorageService.getInstance();

export async function getSecureApiEndpoints(): Promise<ApiEndpoint[]> {
  return secureStorageService.getApiEndpoints();
}

export async function saveSecureApiEndpoints(endpoints: ApiEndpoint[]): Promise<boolean> {
  return secureStorageService.saveApiEndpoints(endpoints);
}

export async function addSecureApiEndpoint(endpoint: ApiEndpoint): Promise<boolean> {
  return secureStorageService.addApiEndpoint(endpoint);
}

export async function updateSecureApiEndpoint(
  endpointId: string, 
  updates: Partial<ApiEndpoint>
): Promise<boolean> {
  return secureStorageService.updateApiEndpoint(endpointId, updates);
}

export async function removeSecureApiEndpoint(endpointId: string): Promise<boolean> {
  return secureStorageService.removeApiEndpoint(endpointId);
}

export async function getSecureApiEndpoint(endpointId: string): Promise<ApiEndpoint | null> {
  return secureStorageService.getApiEndpoint(endpointId);
}

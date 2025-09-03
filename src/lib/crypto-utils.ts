interface EncryptedData {
  encrypted: string;
  iv: string;
  salt: string;
}

class CryptoManager {
  private static instance: CryptoManager;
  private keyCache: Map<string, CryptoKey> = new Map();

  private constructor() {}

  static getInstance(): CryptoManager {
    if (!CryptoManager.instance) {
      CryptoManager.instance = new CryptoManager();
    }
    return CryptoManager.instance;
  }

  private async generateDeviceKey(): Promise<string> {
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset().toString(),
      navigator.hardwareConcurrency?.toString() || '4',
      navigator.platform,
    ].join('|');

    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    const hashArray = new Uint8Array(hashBuffer);
    return btoa(String.fromCharCode(...hashArray));
  }

  private async deriveKey(salt: ArrayBuffer): Promise<CryptoKey> {
    const deviceKey = await this.generateDeviceKey();
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(deviceKey),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encryptApiKey(apiKey: string): Promise<EncryptedData> {
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const key = await this.deriveKey(salt.buffer);

      const encoder = new TextEncoder();
      const data = encoder.encode(apiKey);
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        data
      );

      const encrypted = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
      const ivBase64 = btoa(String.fromCharCode(...iv));
      const saltBase64 = btoa(String.fromCharCode(...salt));

      return {
        encrypted,
        iv: ivBase64,
        salt: saltBase64,
      };
    } catch (error) {
      console.error('Failed to encrypt API key:', error);
      throw new Error('Encryption failed');
    }
  }

  async decryptApiKey(encryptedData: EncryptedData): Promise<string> {
    try {
      const encrypted = new Uint8Array(
        atob(encryptedData.encrypted)
          .split('')
          .map(char => char.charCodeAt(0))
      );
      const iv = new Uint8Array(
        atob(encryptedData.iv)
          .split('')
          .map(char => char.charCodeAt(0))
      );
      const salt = new Uint8Array(
        atob(encryptedData.salt)
          .split('')
          .map(char => char.charCodeAt(0))
      );

      const key = await this.deriveKey(salt.buffer);

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Failed to decrypt API key:', error);
      throw new Error('Decryption failed - key may be corrupted or tampered with');
    }
  }

  secureWipe(): void {
    try {
      if (typeof (globalThis as { gc?: () => void }).gc === 'function') {
        (globalThis as { gc: () => void }).gc();
      }
    } catch {
    }
  }

  maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) {
      return '••••••••';
    }
    
    const start = apiKey.substring(0, 4);
    const end = apiKey.substring(apiKey.length - 4);
    const middle = '•'.repeat(Math.min(apiKey.length - 8, 20));
    
    return `${start}${middle}${end}`;
  }

  isValidEncryptedData(data: unknown): data is EncryptedData {
    return (
      data !== null &&
      data !== undefined &&
      typeof data === 'object' &&
      'encrypted' in data &&
      'iv' in data &&
      'salt' in data &&
      typeof (data as EncryptedData).encrypted === 'string' &&
      typeof (data as EncryptedData).iv === 'string' &&
      typeof (data as EncryptedData).salt === 'string' &&
      (data as EncryptedData).encrypted.length > 0 &&
      (data as EncryptedData).iv.length > 0 &&
      (data as EncryptedData).salt.length > 0
    );
  }

  clearCache(): void {
    this.keyCache.clear();
  }
}

export const cryptoManager = CryptoManager.getInstance();

export async function encryptApiKey(apiKey: string): Promise<EncryptedData> {
  return cryptoManager.encryptApiKey(apiKey);
}

export async function decryptApiKey(encryptedData: EncryptedData): Promise<string> {
  return cryptoManager.decryptApiKey(encryptedData);
}

export function maskApiKey(apiKey: string): string {
  return cryptoManager.maskApiKey(apiKey);
}

export function secureWipe(): void {
  return cryptoManager.secureWipe();
}

export function isValidEncryptedData(data: unknown): data is EncryptedData {
  return cryptoManager.isValidEncryptedData(data);
}

export type { EncryptedData };

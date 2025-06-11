import { StorageEnum } from '../base/enums';
import { createStorage } from '../base/base';
import type { BaseStorage } from '../base/types';

export interface CentralizedApiConfig {
  baseUrl: string;
  enabled: boolean;
  lastChecked?: number;
  version?: string;
}

// Default configuration for centralized API
const defaultConfig: CentralizedApiConfig = {
  baseUrl: 'https://einanoshou.onrender.com/api/chat/completions', // Your actual Render URL
  enabled: true,
  lastChecked: Date.now(),
  version: '1.0.0',
};

// Storage for centralized API configuration
const storage = createStorage<CentralizedApiConfig>('centralized-api-config', defaultConfig, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export type CentralizedApiStorage = BaseStorage<CentralizedApiConfig> & {
  updateConfig: (config: Partial<CentralizedApiConfig>) => Promise<void>;
  getBaseUrl: () => Promise<string>;
  setBaseUrl: (baseUrl: string) => Promise<void>;
  checkHealth: () => Promise<boolean>;
};

export const centralizedApiStore: CentralizedApiStorage = {
  ...storage,

  async updateConfig(config: Partial<CentralizedApiConfig>) {
    const current = (await storage.get()) || defaultConfig;
    await storage.set({
      ...current,
      ...config,
      lastChecked: Date.now(),
    });
  },

  async getBaseUrl() {
    const config = (await storage.get()) || defaultConfig;
    return config.baseUrl;
  },

  async setBaseUrl(baseUrl: string) {
    await this.updateConfig({ baseUrl });
  },

  async checkHealth() {
    try {
      const config = (await storage.get()) || defaultConfig;
      const healthUrl = config.baseUrl.replace('/api/chat/completions', '/health');

      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await this.updateConfig({ lastChecked: Date.now() });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  },
};

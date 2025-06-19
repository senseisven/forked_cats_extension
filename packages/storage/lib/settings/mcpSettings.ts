import { createStorage } from '../base/base';
import type { BaseStorage } from '../base/types';
import { StorageEnum } from '../base/enums';
import type { MCPSettings, MCPServerConfig } from './types';

// Simple logger replacement since we don't have access to dev-utils
const logger = {
  info: (message: string, ...args: any[]) => console.info(`[MCPSettings] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[MCPSettings] ${message}`, ...args),
};

export type MCPSettingsStorage = BaseStorage<MCPSettings> & {
  addServer: (server: MCPServerConfig) => Promise<void>;
  removeServer: (serverId: string) => Promise<void>;
  toggleServer: (serverId: string, enabled: boolean) => Promise<void>;
  updateServerCredentials: (serverId: string, credentials: MCPServerConfig['credentials']) => Promise<void>;
  updateServerTestResult: (serverId: string, result: MCPServerConfig['lastTestResult']) => Promise<void>;
  getEnabledServers: () => Promise<MCPServerConfig[]>;
  getServerById: (serverId: string) => Promise<MCPServerConfig | undefined>;
  updateSettings: (settings: Partial<MCPSettings>) => Promise<void>;
  getSettings: () => Promise<MCPSettings>;
  generateServerId: (name: string) => string;
};

const defaultSettings: MCPSettings = {
  servers: [],
  globalEnabled: true,
  fallbackToBrowserAutomation: true,
  debugMode: false,
};

const storage = createStorage<MCPSettings>('mcp-settings', defaultSettings, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const mcpSettingsStore: MCPSettingsStorage = {
  ...storage,

  async getSettings(): Promise<MCPSettings> {
    try {
      const settings = await storage.get();
      return { ...defaultSettings, ...settings };
    } catch (error) {
      logger.error('Error getting MCP settings:', error);
      return defaultSettings;
    }
  },

  async updateSettings(partialSettings: Partial<MCPSettings>): Promise<void> {
    try {
      const currentSettings = await mcpSettingsStore.getSettings();
      const updatedSettings = { ...currentSettings, ...partialSettings };
      await storage.set(updatedSettings);
      logger.info('MCP settings updated successfully');
    } catch (error) {
      logger.error('Error updating MCP settings:', error);
      throw error;
    }
  },

  async addServer(server: MCPServerConfig): Promise<void> {
    try {
      const settings = await mcpSettingsStore.getSettings();

      // Check if server already exists
      const existingIndex = settings.servers.findIndex(s => s.id === server.id);
      if (existingIndex >= 0) {
        // Update existing server
        settings.servers[existingIndex] = server;
      } else {
        // Add new server
        settings.servers.push(server);
      }

      await storage.set(settings);
      logger.info(`MCP server ${server.name} added/updated successfully`);
    } catch (error) {
      logger.error('Error adding MCP server:', error);
      throw error;
    }
  },

  async removeServer(serverId: string): Promise<void> {
    try {
      const settings = await mcpSettingsStore.getSettings();
      settings.servers = settings.servers.filter(s => s.id !== serverId);
      await storage.set(settings);
      logger.info(`MCP server ${serverId} removed successfully`);
    } catch (error) {
      logger.error('Error removing MCP server:', error);
      throw error;
    }
  },

  async toggleServer(serverId: string, enabled: boolean): Promise<void> {
    try {
      const settings = await mcpSettingsStore.getSettings();
      const server = settings.servers.find(s => s.id === serverId);
      if (server) {
        server.enabled = enabled;
        await storage.set(settings);
        logger.info(`MCP server ${serverId} ${enabled ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      logger.error('Error toggling MCP server:', error);
      throw error;
    }
  },

  async updateServerCredentials(serverId: string, credentials: MCPServerConfig['credentials']): Promise<void> {
    try {
      const settings = await mcpSettingsStore.getSettings();
      const server = settings.servers.find(s => s.id === serverId);
      if (server) {
        server.credentials = credentials;
        await storage.set(settings);
        logger.info(`MCP server ${serverId} credentials updated`);
      }
    } catch (error) {
      logger.error('Error updating MCP server credentials:', error);
      throw error;
    }
  },

  async updateServerTestResult(serverId: string, result: MCPServerConfig['lastTestResult']): Promise<void> {
    try {
      const settings = await mcpSettingsStore.getSettings();
      const server = settings.servers.find(s => s.id === serverId);
      if (server) {
        server.lastTestResult = result;
        await storage.set(settings);
        logger.info(`MCP server ${serverId} test result updated`);
      }
    } catch (error) {
      logger.error('Error updating MCP server test result:', error);
      throw error;
    }
  },

  async getEnabledServers(): Promise<MCPServerConfig[]> {
    try {
      const settings = await mcpSettingsStore.getSettings();
      return settings.servers.filter(s => s.enabled);
    } catch (error) {
      logger.error('Error getting enabled MCP servers:', error);
      return [];
    }
  },

  async getServerById(serverId: string): Promise<MCPServerConfig | undefined> {
    try {
      const settings = await mcpSettingsStore.getSettings();
      return settings.servers.find(s => s.id === serverId);
    } catch (error) {
      logger.error('Error getting MCP server by ID:', error);
      return undefined;
    }
  },

  // Helper method to generate unique ID for new servers
  generateServerId(name: string): string {
    return `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },
};

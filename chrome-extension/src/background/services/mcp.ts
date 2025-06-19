import { createLogger } from '@src/background/log';
import { mcpSettingsStore, type MCPServerConfig as StoredMCPServerConfig } from '@extension/storage';

const logger = createLogger('MCPService');

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  description: string;
  capabilities: string[];
  endpoint?: string;
  authHeader?: string;
}

export interface MCPToolCall {
  serverName: string;
  toolName: string;
  arguments: Record<string, unknown>;
}

export interface MCPToolResult {
  success: boolean;
  content?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export class MCPService {
  private availableServers: MCPServerConfig[] = [];
  private settingsLoaded = false;

  constructor() {
    logger.info('🔧 MCP Service initialized');
    this.loadServersFromSettings();
  }

  private async loadServersFromSettings(): Promise<void> {
    try {
      const settings = await mcpSettingsStore.getSettings();

      if (!settings.globalEnabled) {
        logger.info('🔧 MCP Service disabled globally');
        this.availableServers = [];
        this.settingsLoaded = true;
        return;
      }

      const enabledServers = settings.servers.filter(s => s.enabled);

      this.availableServers = enabledServers.map(server => ({
        name: server.name,
        command: 'node', // Default command
        args: [], // Will be configured per server type
        description: server.description,
        capabilities: server.capabilities,
        endpoint: this.buildEndpointFromCredentials(server),
        authHeader: this.buildAuthHeaderFromCredentials(server),
      }));

      logger.info(`🔧 Loaded ${this.availableServers.length} enabled MCP servers`);
      this.settingsLoaded = true;
    } catch (error) {
      logger.error('🔧 Failed to load MCP settings:', error);
      this.availableServers = [];
      this.settingsLoaded = true;
    }
  }

  private buildEndpointFromCredentials(server: StoredMCPServerConfig): string | undefined {
    // For now, return undefined to force fallback to browser automation
    // In a real implementation, this would construct the appropriate endpoint
    // based on the server type and credentials

    if (!server.credentials) {
      return undefined;
    }

    // Example for different server types:
    switch (server.providerType) {
      case 'google-sheets':
        // Would need actual MCP server endpoint
        return undefined; // 'http://localhost:3000' when properly configured
      case 'notion':
        return undefined; // 'http://localhost:3001' when properly configured
      case 'github':
        return undefined; // 'http://localhost:3002' when properly configured
      default:
        return undefined;
    }
  }

  private buildAuthHeaderFromCredentials(server: StoredMCPServerConfig): string | undefined {
    if (!server.credentials) {
      return undefined;
    }

    switch (server.credentials.type) {
      case 'api_key':
        return server.credentials.apiKey ? `Bearer ${server.credentials.apiKey}` : undefined;
      case 'oauth':
        return server.credentials.accessToken ? `Bearer ${server.credentials.accessToken}` : undefined;
      default:
        return undefined;
    }
  }

  /**
   * Get all available MCP servers and their capabilities
   */
  async getAvailableServers(): Promise<MCPServerConfig[]> {
    if (!this.settingsLoaded) {
      await this.loadServersFromSettings();
    }
    return this.availableServers;
  }

  /**
   * Reload servers from settings (call when settings change)
   */
  async reloadServers(): Promise<void> {
    await this.loadServersFromSettings();
  }

  /**
   * Execute a tool call on an MCP server
   */
  async executeToolCall(toolCall: MCPToolCall): Promise<MCPToolResult> {
    const { serverName, toolName, arguments: args } = toolCall;

    const server = this.availableServers.find(s => s.name === serverName);
    if (!server) {
      return { success: false, error: `Unknown MCP server: ${serverName}` };
    }

    // Multiple layers of protection against fake/invalid endpoints
    if (!server.endpoint || server.endpoint.includes('glama.ai') || server.endpoint.includes('fake')) {
      const errorMsg = `MCP server '${serverName}' is not configured with a valid endpoint (${server.endpoint || 'undefined'}). Falling back to browser automation for Google Sheets operations.`;
      logger.info(`🔧 [MCP] ${errorMsg}`);
      return { success: false, error: errorMsg };
    }

    try {
      logger.info(`🔧 [MCP] Calling ${serverName}.${toolName} via ${server.endpoint}`);

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      // Build JSON-RPC 2.0 request body for tools/call
      const requestBody = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args ?? {},
        },
      };

      const response = await fetch(server.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(server.authHeader ? { Authorization: server.authHeader } : {}),
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        const errorMsg = `MCP endpoint error (${response.status}): ${text}. Falling back to browser automation.`;
        logger.error(`🔧 [MCP] ${errorMsg}`);
        return { success: false, error: errorMsg };
      }

      const rpcResponse = await response.json();

      if (rpcResponse.error) {
        const errorMsg = `MCP server error: ${rpcResponse.error.message || 'Unknown MCP error'}. Falling back to browser automation.`;
        logger.error(`🔧 [MCP] ${errorMsg}`);
        return { success: false, error: errorMsg };
      }

      // MCP spec: successful tool call returns result.content array
      const content = rpcResponse.result?.content?.[0]?.text ?? JSON.stringify(rpcResponse.result);

      logger.info(`🔧 [MCP] Successfully executed ${serverName}.${toolName}`);
      return { success: true, content, metadata: rpcResponse.result };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      const errorMsg = `MCP connection failed: ${error}. Falling back to browser automation for Google Sheets operations.`;
      logger.error(`🔧 [MCP] ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Check if MCP should be used for a given task
   */
  async shouldUseMCP(
    task: string,
    url?: string,
  ): Promise<{ shouldUse: boolean; serverName?: string; reasoning?: string }> {
    const lowerTask = task.toLowerCase();
    const lowerUrl = url?.toLowerCase() || '';

    // Ensure servers are loaded
    if (!this.settingsLoaded) {
      await this.loadServersFromSettings();
    }

    // Check if Google Sheets MCP server is properly configured
    const googleSheetsServer = this.availableServers.find(s => s.name === 'google-sheets');
    const isMCPAvailable = googleSheetsServer && googleSheetsServer.endpoint;

    // Google Sheets detection
    if (
      lowerTask.includes('spreadsheet') ||
      lowerTask.includes('google sheets') ||
      lowerTask.includes('sheet') ||
      lowerTask.includes('csv') ||
      lowerTask.includes('データ入力') ||
      lowerTask.includes('表') ||
      lowerUrl.includes('sheets.google.com') ||
      lowerUrl.includes('docs.google.com/spreadsheets')
    ) {
      if (!isMCPAvailable) {
        logger.info(`🔧 [MCP] Google Sheets task detected but MCP server not available, using browser automation`);
        return { shouldUse: false };
      }

      return {
        shouldUse: true,
        serverName: 'google-sheets',
        reasoning:
          'Task involves spreadsheet operations - MCP provides more reliable data manipulation than browser automation',
      };
    }

    // Check for data manipulation keywords that might benefit from MCP
    if (
      lowerTask.includes('create table') ||
      lowerTask.includes('add row') ||
      lowerTask.includes('insert data') ||
      lowerTask.includes('update cell') ||
      lowerTask.includes('データ追加') ||
      lowerTask.includes('セル更新')
    ) {
      if (!isMCPAvailable) {
        logger.info(`🔧 [MCP] Data manipulation task detected but MCP server not available, using browser automation`);
        return { shouldUse: false };
      }

      return {
        shouldUse: true,
        serverName: 'google-sheets',
        reasoning: 'Data manipulation task detected - MCP provides more precise control than browser automation',
      };
    }

    return { shouldUse: false };
  }

  /**
   * Get MCP context for planner reasoning
   */
  async getMCPContext(): Promise<string> {
    // Ensure servers are loaded
    if (!this.settingsLoaded) {
      await this.loadServersFromSettings();
    }

    const serverInfos = this.availableServers.map(server => {
      return `${server.name}: ${server.description} (${server.capabilities.join(', ')})`;
    });

    if (serverInfos.length === 0) {
      return `No MCP servers are currently configured or enabled.
Browser automation will be used for all tasks.

To enable MCP integrations, configure servers in the extension settings.`;
    }

    return `Available MCP Tools:
${serverInfos.join('\n')}

When to use MCP:
- For Google Sheets: Use when task involves creating, reading, or modifying spreadsheet data
- MCP provides more reliable and precise data manipulation than browser automation
- Especially useful for complex data operations, bulk updates, or when exact cell positioning is critical
- Automatically falls back to browser automation if MCP servers are not available`;
  }
}

// Singleton instance
export const mcpService = new MCPService();

import { createLogger } from '@src/background/log';

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
  private readonly availableServers: MCPServerConfig[] = [
    {
      name: 'google-sheets',
      command: 'node',
      args: ['/tmp/google-sheets-mcp/dist/index.js'],
      description: 'Google Sheets integration for reading, writing, and managing spreadsheets',
      capabilities: [
        'create_spreadsheet',
        'list_sheets',
        'create_sheet',
        'read_all_from_sheet',
        'read_headings',
        'read_rows',
        'read_columns',
        'edit_cell',
        'edit_row',
        'edit_column',
        'insert_row',
        'insert_column',
        'rename_sheet',
        'rename_doc',
        'refresh_auth',
      ],
      endpoint: undefined, // Temporarily disable remote endpoint
      authHeader: undefined,
    },
  ];

  constructor() {
    logger.info('🔧 MCP Service initialized');
  }

  /**
   * Get all available MCP servers and their capabilities
   */
  getAvailableServers(): MCPServerConfig[] {
    return this.availableServers;
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

    if (!server.endpoint) {
      const errorMsg = `MCP server '${serverName}' is not configured with a valid endpoint. Falling back to browser automation for Google Sheets operations.`;
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
  shouldUseMCP(task: string, url?: string): { shouldUse: boolean; serverName?: string; reasoning?: string } {
    const lowerTask = task.toLowerCase();
    const lowerUrl = url?.toLowerCase() || '';

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
  getMCPContext(): string {
    const serverInfos = this.availableServers.map(server => {
      return `${server.name}: ${server.description} (${server.capabilities.join(', ')})`;
    });

    return `Available MCP Tools:
${serverInfos.join('\n')}

When to use MCP:
- For Google Sheets: Use when task involves creating, reading, or modifying spreadsheet data
- MCP provides more reliable and precise data manipulation than browser automation
- Especially useful for complex data operations, bulk updates, or when exact cell positioning is critical`;
  }
}

// Singleton instance
export const mcpService = new MCPService();

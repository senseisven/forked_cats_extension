import React, { useState, useEffect } from 'react';
import { Button } from '@extension/ui';
import { mcpSettingsStore, type MCPServerConfig, DEFAULT_MCP_SERVERS } from '@extension/storage';

interface MCPSettingsProps {
  isDarkMode: boolean;
}

interface CredentialFormData {
  type: 'oauth' | 'api_key' | 'service_account';
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
  serviceAccountJson?: string;
  scopes?: string;
}

export const MCPSettings: React.FC<MCPSettingsProps> = ({ isDarkMode }) => {
  const [servers, setServers] = useState<MCPServerConfig[]>([]);
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [fallbackToBrowserAutomation, setFallbackToBrowserAutomation] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<(typeof DEFAULT_MCP_SERVERS)[0] | null>(null);
  const [credentials, setCredentials] = useState<CredentialFormData>({ type: 'oauth' });
  const [testingServer, setTestingServer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await mcpSettingsStore.getSettings();
      setServers(settings.servers);
      setGlobalEnabled(settings.globalEnabled);
      setFallbackToBrowserAutomation(settings.fallbackToBrowserAutomation);
      setDebugMode(settings.debugMode);
    } catch (err) {
      setError('Failed to load MCP settings');
      console.error('Error loading MCP settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalToggle = async (enabled: boolean) => {
    try {
      await mcpSettingsStore.updateSettings({ globalEnabled: enabled });
      setGlobalEnabled(enabled);
    } catch (err) {
      setError('Failed to update global MCP setting');
    }
  };

  const handleFallbackToggle = async (enabled: boolean) => {
    try {
      await mcpSettingsStore.updateSettings({ fallbackToBrowserAutomation: enabled });
      setFallbackToBrowserAutomation(enabled);
    } catch (err) {
      setError('Failed to update fallback setting');
    }
  };

  const handleDebugToggle = async (enabled: boolean) => {
    try {
      await mcpSettingsStore.updateSettings({ debugMode: enabled });
      setDebugMode(enabled);
    } catch (err) {
      setError('Failed to update debug setting');
    }
  };

  const handleServerToggle = async (serverId: string, enabled: boolean) => {
    try {
      await mcpSettingsStore.toggleServer(serverId, enabled);
      setServers(prev => prev.map(s => (s.id === serverId ? { ...s, enabled } : s)));
    } catch (err) {
      setError('Failed to toggle server');
    }
  };

  const handleRemoveServer = async (serverId: string) => {
    try {
      await mcpSettingsStore.removeServer(serverId);
      setServers(prev => prev.filter(s => s.id !== serverId));
    } catch (err) {
      setError('Failed to remove server');
    }
  };

  const handleTestConnection = async (serverId: string) => {
    setTestingServer(serverId);
    try {
      // TODO: Implement actual connection testing
      // For now, just simulate a test
      await new Promise(resolve => setTimeout(resolve, 2000));

      const testResult = {
        success: Math.random() > 0.3, // Simulate 70% success rate
        error: Math.random() > 0.3 ? undefined : 'Failed to connect to server',
        testedAt: new Date().toISOString(),
      };

      await mcpSettingsStore.updateServerTestResult(serverId, testResult);
      setServers(prev => prev.map(s => (s.id === serverId ? { ...s, lastTestResult: testResult } : s)));
    } catch (err) {
      setError('Failed to test connection');
    } finally {
      setTestingServer(null);
    }
  };

  const handleAddServer = async () => {
    if (!selectedTemplate) return;

    try {
      const newServer: MCPServerConfig = {
        id: mcpSettingsStore.generateServerId(selectedTemplate.name!),
        name: selectedTemplate.name!,
        displayName: selectedTemplate.displayName!,
        description: selectedTemplate.description!,
        capabilities: selectedTemplate.capabilities!,
        enabled: false,
        providerType: selectedTemplate.providerType!,
        icon: selectedTemplate.icon,
        category: selectedTemplate.category!,
        credentials:
          credentials.type === 'oauth'
            ? {
                type: 'oauth',
                clientId: credentials.clientId,
                clientSecret: credentials.clientSecret,
                scopes: credentials.scopes?.split(',').map(s => s.trim()),
              }
            : credentials.type === 'api_key'
              ? {
                  type: 'api_key',
                  apiKey: credentials.apiKey,
                }
              : {
                  type: 'service_account',
                  serviceAccountJson: credentials.serviceAccountJson,
                },
      };

      await mcpSettingsStore.addServer(newServer);
      setServers(prev => [...prev, newServer]);

      // Reset form
      setShowAddForm(false);
      setSelectedTemplate(null);
      setCredentials({ type: 'oauth' });
    } catch (err) {
      setError('Failed to add server');
    }
  };

  if (loading) {
    return <div className={`p-6 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Loading MCP settings...</div>;
  }

  const baseCardClass = `rounded-lg border ${
    isDarkMode ? 'border-slate-600 bg-slate-700/50' : 'border-[#d4c4a8] bg-white/30'
  } backdrop-blur-sm p-6`;

  const buttonClass = (variant: 'primary' | 'secondary' | 'danger' = 'primary') => {
    const base = 'px-4 py-2 rounded-lg font-medium transition-colors';
    if (variant === 'primary') {
      return `${base} ${isDarkMode ? 'bg-sky-600 hover:bg-sky-700 text-white' : 'bg-[#8b7355] hover:bg-[#7a6449] text-white'}`;
    }
    if (variant === 'secondary') {
      return `${base} ${isDarkMode ? 'bg-slate-600 hover:bg-slate-500 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`;
    }
    return `${base} bg-red-600 hover:bg-red-700 text-white`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-2`}>
          MCP Integrations
        </h2>
        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Configure Model Context Protocol servers to extend the browser's capabilities with external services like
          Google Sheets, Notion, GitHub, and more.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-lg border border-red-500 bg-red-100 text-red-800">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-600 hover:text-red-800">
            ✕
          </button>
        </div>
      )}

      {/* Global Settings */}
      <div className={baseCardClass}>
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-4`}>
          Global Settings
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Enable MCP Integrations
              </label>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Allow the browser to use configured MCP servers for enhanced capabilities
              </p>
            </div>
            <button
              onClick={() => handleGlobalToggle(!globalEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                globalEnabled
                  ? isDarkMode
                    ? 'bg-sky-600'
                    : 'bg-[#8b7355]'
                  : isDarkMode
                    ? 'bg-slate-600'
                    : 'bg-gray-300'
              }`}>
              <div
                className={`absolute w-5 h-5 bg-white rounded-full shadow-lg transition-transform top-0.5 ${
                  globalEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Fallback to Browser Automation
              </label>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Use browser automation when MCP servers are unavailable
              </p>
            </div>
            <button
              onClick={() => handleFallbackToggle(!fallbackToBrowserAutomation)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                fallbackToBrowserAutomation
                  ? isDarkMode
                    ? 'bg-sky-600'
                    : 'bg-[#8b7355]'
                  : isDarkMode
                    ? 'bg-slate-600'
                    : 'bg-gray-300'
              }`}>
              <div
                className={`absolute w-5 h-5 bg-white rounded-full shadow-lg transition-transform top-0.5 ${
                  fallbackToBrowserAutomation ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Debug Mode</label>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Enable detailed logging for MCP operations
              </p>
            </div>
            <button
              onClick={() => handleDebugToggle(!debugMode)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                debugMode ? (isDarkMode ? 'bg-sky-600' : 'bg-[#8b7355]') : isDarkMode ? 'bg-slate-600' : 'bg-gray-300'
              }`}>
              <div
                className={`absolute w-5 h-5 bg-white rounded-full shadow-lg transition-transform top-0.5 ${
                  debugMode ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Configured Servers */}
      <div className={baseCardClass}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            Configured Servers
          </h3>
          <button onClick={() => setShowAddForm(true)} className={buttonClass('primary')}>
            Add Server
          </button>
        </div>

        {servers.length === 0 ? (
          <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="text-4xl mb-2">🔧</div>
            <p>No MCP servers configured yet.</p>
            <p className="text-sm">Add a server to get started with external integrations.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {servers.map(server => (
              <div
                key={server.id}
                className={`border rounded-lg p-4 ${
                  isDarkMode ? 'border-slate-600 bg-slate-800/30' : 'border-gray-200 bg-white/50'
                }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{server.icon}</span>
                      <h4 className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {server.displayName}
                      </h4>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          server.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                        {server.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                      {server.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {server.capabilities.slice(0, 3).map(capability => (
                        <span
                          key={capability}
                          className={`px-2 py-1 text-xs rounded ${
                            isDarkMode ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                          }`}>
                          {capability}
                        </span>
                      ))}
                      {server.capabilities.length > 3 && (
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            isDarkMode ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                          }`}>
                          +{server.capabilities.length - 3} more
                        </span>
                      )}
                    </div>

                    {server.lastTestResult && (
                      <div className={`text-xs ${server.lastTestResult.success ? 'text-green-600' : 'text-red-600'}`}>
                        Last test: {server.lastTestResult.success ? 'Success' : 'Failed'}
                        {server.lastTestResult.error && ` - ${server.lastTestResult.error}`}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestConnection(server.id)}
                      disabled={testingServer === server.id}
                      className={`${buttonClass('secondary')} text-sm ${
                        testingServer === server.id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}>
                      {testingServer === server.id ? 'Testing...' : 'Test'}
                    </button>
                    <button
                      onClick={() => handleServerToggle(server.id, !server.enabled)}
                      className={buttonClass(server.enabled ? 'secondary' : 'primary')}>
                      {server.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={() => handleRemoveServer(server.id)} className={buttonClass('danger')}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Server Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${baseCardClass} max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Add MCP Server
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className={`${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'}`}>
                ✕
              </button>
            </div>

            {!selectedTemplate ? (
              <div className="space-y-3">
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Choose a service to integrate:
                </p>
                {DEFAULT_MCP_SERVERS.map(template => (
                  <button
                    key={template.name}
                    onClick={() => setSelectedTemplate(template)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-800/30 hover:bg-slate-700/50'
                        : 'border-gray-200 bg-white/50 hover:bg-white/80'
                    }`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{template.icon}</span>
                      <div>
                        <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          {template.displayName}
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {template.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <span className="text-xl">{selectedTemplate.icon}</span>
                  <div>
                    <div className="font-medium text-blue-900">{selectedTemplate.displayName}</div>
                    <div className="text-sm text-blue-700">{selectedTemplate.description}</div>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-1`}>
                    Authentication Type
                  </label>
                  <select
                    value={credentials.type}
                    onChange={e => setCredentials({ ...credentials, type: e.target.value as any })}
                    className={`w-full p-2 border rounded-lg ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-700 text-gray-200'
                        : 'border-gray-300 bg-white text-gray-800'
                    }`}>
                    <option value="oauth">OAuth 2.0</option>
                    <option value="api_key">API Key</option>
                    <option value="service_account">Service Account</option>
                  </select>
                </div>

                {credentials.type === 'oauth' && (
                  <>
                    <div>
                      <label
                        className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-1`}>
                        Client ID
                      </label>
                      <input
                        type="text"
                        value={credentials.clientId || ''}
                        onChange={e => setCredentials({ ...credentials, clientId: e.target.value })}
                        className={`w-full p-2 border rounded-lg ${
                          isDarkMode
                            ? 'border-slate-600 bg-slate-700 text-gray-200'
                            : 'border-gray-300 bg-white text-gray-800'
                        }`}
                        placeholder="Enter your OAuth Client ID"
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-1`}>
                        Client Secret
                      </label>
                      <input
                        type="password"
                        value={credentials.clientSecret || ''}
                        onChange={e => setCredentials({ ...credentials, clientSecret: e.target.value })}
                        className={`w-full p-2 border rounded-lg ${
                          isDarkMode
                            ? 'border-slate-600 bg-slate-700 text-gray-200'
                            : 'border-gray-300 bg-white text-gray-800'
                        }`}
                        placeholder="Enter your OAuth Client Secret"
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-1`}>
                        Scopes (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={credentials.scopes || ''}
                        onChange={e => setCredentials({ ...credentials, scopes: e.target.value })}
                        className={`w-full p-2 border rounded-lg ${
                          isDarkMode
                            ? 'border-slate-600 bg-slate-700 text-gray-200'
                            : 'border-gray-300 bg-white text-gray-800'
                        }`}
                        placeholder="https://www.googleapis.com/auth/spreadsheets"
                      />
                    </div>
                  </>
                )}

                {credentials.type === 'api_key' && (
                  <div>
                    <label
                      className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-1`}>
                      API Key
                    </label>
                    <input
                      type="password"
                      value={credentials.apiKey || ''}
                      onChange={e => setCredentials({ ...credentials, apiKey: e.target.value })}
                      className={`w-full p-2 border rounded-lg ${
                        isDarkMode
                          ? 'border-slate-600 bg-slate-700 text-gray-200'
                          : 'border-gray-300 bg-white text-gray-800'
                      }`}
                      placeholder="Enter your API key"
                    />
                  </div>
                )}

                {credentials.type === 'service_account' && (
                  <div>
                    <label
                      className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-1`}>
                      Service Account JSON
                    </label>
                    <textarea
                      value={credentials.serviceAccountJson || ''}
                      onChange={e => setCredentials({ ...credentials, serviceAccountJson: e.target.value })}
                      rows={4}
                      className={`w-full p-2 border rounded-lg ${
                        isDarkMode
                          ? 'border-slate-600 bg-slate-700 text-gray-200'
                          : 'border-gray-300 bg-white text-gray-800'
                      }`}
                      placeholder="Paste your service account JSON here"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => setSelectedTemplate(null)} className={buttonClass('secondary')}>
                    Back
                  </button>
                  <button onClick={handleAddServer} className={buttonClass('primary')}>
                    Add Server
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

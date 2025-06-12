import { llmProviderStore } from './llmProviders';
import { ProviderTypeEnum } from './types';
import { centralizedApiStore } from './centralizedApi';

/**
 * Sets up the default centralized API provider if it doesn't exist
 * This is the no-API-key-required option for users
 */
export async function setupDefaultCentralizedProvider(apiBaseUrl?: string): Promise<void> {
  try {
    const providerId = ProviderTypeEnum.CentralizedAPI;
    const hasProvider = await llmProviderStore.hasProvider(providerId);

    if (!hasProvider) {
      console.log('Setting up default centralized API provider...');

      // Use provided URL or default
      const baseUrl = apiBaseUrl || 'https://einanoshou.onrender.com/api/openrouter';

      // Update centralized API config
      await centralizedApiStore.setBaseUrl(baseUrl);

      // Create the provider configuration
      await llmProviderStore.setProvider(providerId, {
        apiKey: 'not-required',
        name: 'エイナーのAI (No API Key Required)',
        type: ProviderTypeEnum.CentralizedAPI,
        baseUrl: baseUrl,
        modelNames: [
          'openai/gpt-4.1',
          'openai/gpt-4.1-mini',
          'openai/o4-mini',
          'openai/gpt-4o-2024-11-20',
          'google/gemini-2.5-flash-preview',
          'anthropic/claude-3-5-sonnet-20241022',
          'anthropic/claude-3-5-haiku-20241022',
        ],
        createdAt: Date.now(),
      });

      console.log('✅ Default centralized API provider configured');
    } else {
      console.log('Centralized API provider already exists');
    }
  } catch (error) {
    console.error('Failed to setup default centralized provider:', error);
  }
}

/**
 * Updates the centralized API base URL for existing provider
 */
export async function updateCentralizedApiUrl(newBaseUrl: string): Promise<void> {
  try {
    const providerId = ProviderTypeEnum.CentralizedAPI;
    const existingProvider = await llmProviderStore.getProvider(providerId);

    if (existingProvider) {
      await llmProviderStore.setProvider(providerId, {
        ...existingProvider,
        baseUrl: newBaseUrl,
      });

      await centralizedApiStore.setBaseUrl(newBaseUrl);
      console.log(`✅ Updated centralized API URL to: ${newBaseUrl}`);
    }
  } catch (error) {
    console.error('Failed to update centralized API URL:', error);
  }
}

/**
 * Checks if centralized API is healthy and available
 */
export async function checkCentralizedApiHealth(): Promise<boolean> {
  try {
    return await centralizedApiStore.checkHealth();
  } catch (error) {
    console.error('Failed to check centralized API health:', error);
    return false;
  }
}

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

    // Use provided URL or default
    const baseUrl = apiBaseUrl || 'https://einanoshou.onrender.com/api/openrouter';

    // Latest comprehensive model list
    const latestModelNames = [
      // Latest OpenAI models
      'openai/gpt-4.1',
      'openai/gpt-4.1-mini',
      'openai/o4-mini',
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'openai/o3',
      'openai/o3-mini',
      // Latest Claude models (best for reliability and reasoning)
      'anthropic/claude-sonnet-4', // Claude Sonnet 4 - Latest flagship model
      'anthropic/claude-3.7-sonnet', // Fixed: removed date suffix
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3.5-haiku',
      'anthropic/claude-opus-4',
      // Latest Google models (fast and cost-effective)
      'google/gemini-2.5-pro-preview', // Gemini 2.5 Pro - Latest flagship
      'google/gemini-2.5-flash-preview-05-20',
      'google/gemini-2.5-flash-preview-05-20:thinking',
      'google/gemini-2.0-flash',
      'google/gemini-1.5-pro',
      'google/gemini-1.5-flash',
      // Meta LLaMA (open source excellence)
      'meta-llama/llama-4-maverick',
      'meta-llama/llama-4-scout',
      'meta-llama/llama-3.3-70b-instruct',
      'meta-llama/llama-3.1-70b-instruct',
      'meta-llama/llama-3.1-8b-instruct',
      // DeepSeek (reasoning powerhouse)
      'deepseek/deepseek-chat', // DeepSeek V3
      'deepseek/deepseek-r1', // DeepSeek R1 reasoning
      'deepseek/deepseek-r1-0528-qwen3-8b', // Latest distilled reasoning model
      // Mistral (European excellence)
      'mistralai/mistral-large-2411',
      'mistralai/codestral-2501',
      'mistralai/mixtral-8x22b-instruct',
      'mistralai/pixtral-large-2411',
      // Qwen (Alibaba's flagship)
      'qwen/qwen-max',
      'qwen/qwen3-32b',
      'qwen/qwq-32b', // QwQ reasoning model
      // xAI Grok (latest from X/Twitter)
      'x-ai/grok-3-beta',
      'x-ai/grok-3-mini-beta',
      // Specialized models
      'perplexity/sonar-pro', // Web search enhanced
      'cohere/command-r-plus', // Enterprise focused
    ];

    if (!hasProvider) {
      console.log('Setting up default centralized API provider...');

      // Update centralized API config
      await centralizedApiStore.setBaseUrl(baseUrl);

      // Create the provider configuration
      await llmProviderStore.setProvider(providerId, {
        apiKey: 'not-required',
        name: 'ネコノテAI (No API Key Required)',
        type: ProviderTypeEnum.CentralizedAPI,
        baseUrl: baseUrl,
        modelNames: latestModelNames,
        createdAt: Date.now(),
      });

      console.log('✅ Default centralized API provider configured');
    } else {
      // Check if existing provider needs model list update
      console.log('Centralized API provider already exists, checking for model updates...');

      const existingProvider = await llmProviderStore.getProvider(providerId);

      if (existingProvider) {
        const currentModels = existingProvider.modelNames || [];

        // Check if we have the old limited model set (7 or fewer models)
        // or if we're missing any of the key new flagship models
        const hasNewModels =
          currentModels.includes('anthropic/claude-sonnet-4') ||
          currentModels.includes('google/gemini-2.5-pro-preview') ||
          currentModels.includes('meta-llama/llama-4-maverick') ||
          currentModels.includes('deepseek/deepseek-r1') ||
          currentModels.includes('openai/o3');

        // Force update if we have old models or missing new flagship models
        if (currentModels.length <= 25 || !hasNewModels) {
          console.log(
            `Updating centralized API provider with latest models... (current: ${currentModels.length}, hasNew: ${hasNewModels})`,
          );

          await llmProviderStore.setProvider(providerId, {
            ...existingProvider,
            modelNames: latestModelNames,
            baseUrl: baseUrl, // Also update URL in case it changed
          });

          console.log('✅ Centralized API provider updated with latest models');
        } else {
          console.log('Centralized API provider already has latest models');
        }
      }
    }

    // Temporary debug call to check OpenRouter key
    try {
      const response = await fetch('https://einanoshou.onrender.com/debug/openrouter');
      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter debug check failed:', { status: response.status, body: errorText });
      } else {
        const data = await response.json();
        console.log('OpenRouter debug check:', data);
      }
    } catch (error) {
      console.error('OpenRouter debug check failed:', error);
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

import { llmProviderStore } from './llmProviders';
import { ProviderTypeEnum, AgentNameEnum } from './types';
import { centralizedApiStore } from './centralizedApi';
import { agentModelStore } from './agentModels';

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
        name: 'ネコノテAPI',
        type: ProviderTypeEnum.CentralizedAPI,
        baseUrl: baseUrl,
        modelNames: latestModelNames,
        createdAt: Date.now(),
      });

      console.log('✅ Default centralized API provider configured');
    } else {
      // Provider exists - force update to fix any cached naming issues
      console.log('Centralized API provider already exists, checking for updates...');

      const existingProvider = await llmProviderStore.getProvider(providerId);

      if (existingProvider) {
        const currentModels = existingProvider.modelNames || [];
        const currentName = existingProvider.name;

        // Check if we have the old limited model set (7 or fewer models)
        // or if we're missing any of the key new flagship models
        const hasNewModels =
          currentModels.includes('anthropic/claude-sonnet-4') ||
          currentModels.includes('google/gemini-2.5-pro-preview') ||
          currentModels.includes('meta-llama/llama-4-maverick') ||
          currentModels.includes('deepseek/deepseek-r1') ||
          currentModels.includes('openai/o3');

        // Force update if we have old models, missing new flagship models, or wrong name
        const shouldUpdate =
          currentModels.length <= 25 ||
          !hasNewModels ||
          currentName !== 'ネコノテAPI' ||
          currentName?.includes('エイナー') ||
          currentName?.includes('No API Key Required');

        if (shouldUpdate) {
          console.log(
            `Updating centralized API provider... (models: ${currentModels.length}, hasNew: ${hasNewModels}, name: "${currentName}")`,
          );

          await llmProviderStore.setProvider(providerId, {
            ...existingProvider,
            name: 'ネコノテAPI', // Force update the name to fix cached issues
            modelNames: latestModelNames,
            baseUrl: baseUrl, // Also update URL in case it changed
          });

          console.log('✅ Centralized API provider updated with correct name and latest models');
        } else {
          console.log('Centralized API provider already has correct name and latest models');
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

/**
 * Sets up default agent models with Gemini 2.5 Pro Preview for all agents
 */
export async function setupDefaultAgentModels(): Promise<void> {
  try {
    console.log('Setting up default agent models...');

    // Check if we have a centralized API provider configured
    const providerId = ProviderTypeEnum.CentralizedAPI;
    const hasProvider = await llmProviderStore.hasProvider(providerId);

    if (!hasProvider) {
      console.log('No centralized provider found, setting up default provider first...');
      await setupDefaultCentralizedProvider();
    }

    // Set Gemini 2.5 Pro Preview for all three agents
    const defaultModelConfig = {
      provider: providerId,
      modelName: 'google/gemini-2.5-pro-preview',
      parameters: {
        temperature: 0.1,
        topP: 0.1,
      },
    };

    // Set up all three agents with the same model
    const agents = [AgentNameEnum.Planner, AgentNameEnum.Navigator, AgentNameEnum.Validator];

    for (const agent of agents) {
      const hasModel = await agentModelStore.hasAgentModel(agent);
      if (!hasModel) {
        await agentModelStore.setAgentModel(agent, defaultModelConfig);
        console.log(`✅ Set ${agent} to use Gemini 2.5 Pro Preview`);
      } else {
        console.log(`${agent} already has a model configured, skipping...`);
      }
    }

    console.log('✅ Default agent models setup completed');
  } catch (error) {
    console.error('Failed to setup default agent models:', error);
  }
}

/**
 * Forces update of all agent models to use Gemini 2.5 Pro Preview
 */
export async function forceUpdateAgentModels(): Promise<void> {
  try {
    console.log('Force updating all agent models to Gemini 2.5 Pro Preview...');

    // Ensure we have a centralized API provider
    const providerId = ProviderTypeEnum.CentralizedAPI;
    const hasProvider = await llmProviderStore.hasProvider(providerId);

    if (!hasProvider) {
      await setupDefaultCentralizedProvider();
    }

    const defaultModelConfig = {
      provider: providerId,
      modelName: 'google/gemini-2.5-pro-preview',
      parameters: {
        temperature: 0.1,
        topP: 0.1,
      },
    };

    // Force update all three agents
    const agents = [AgentNameEnum.Planner, AgentNameEnum.Navigator, AgentNameEnum.Validator];

    for (const agent of agents) {
      await agentModelStore.setAgentModel(agent, defaultModelConfig);
      console.log(`✅ Updated ${agent} to use Gemini 2.5 Pro Preview`);
    }

    console.log('✅ All agent models updated to Gemini 2.5 Pro Preview');
  } catch (error) {
    console.error('Failed to force update agent models:', error);
  }
}

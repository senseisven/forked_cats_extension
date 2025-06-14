// Agent name, used to identify the agent in the settings
export enum AgentNameEnum {
  Planner = 'planner',
  Navigator = 'navigator',
  Validator = 'validator',
}

// Provider type, types before CustomOpenAI are built-in providers, CustomOpenAI is a custom provider
// For built-in providers, we will create ChatModel instances with its respective LangChain ChatModel classes
// For custom providers, we will create ChatModel instances with the ChatOpenAI class
export enum ProviderTypeEnum {
  OpenAI = 'openai',
  Anthropic = 'anthropic',
  DeepSeek = 'deepseek',
  Gemini = 'gemini',
  Grok = 'grok',
  Ollama = 'ollama',
  AzureOpenAI = 'azure_openai',
  OpenRouter = 'openrouter',
  CentralizedAPI = 'centralized_api', // New centralized API service
  Groq = 'groq',
  Cerebras = 'cerebras',
  CustomOpenAI = 'custom_openai',
}

// Default supported models for each built-in provider
export const llmProviderModelNames = {
  [ProviderTypeEnum.OpenAI]: ['gpt-4.1', 'gpt-4.1-mini', 'gpt-4o', 'gpt-4o-mini', 'o4-mini', 'o3'],
  [ProviderTypeEnum.Anthropic]: [
    'claude-sonnet-4-20250514',
    'claude-3-7-sonnet-latest',
    'claude-3-5-sonnet-latest',
    'claude-3-5-haiku-latest',
  ],
  [ProviderTypeEnum.DeepSeek]: ['deepseek-chat', 'deepseek-reasoner'],
  [ProviderTypeEnum.Gemini]: [
    'gemini-2.5-flash-preview-05-20',
    'gemini-2.5-pro-preview-06-05',
    'gemini-2.0-flash',
    // 'gemini-2.0-flash-thinking-exp-01-21', // TODO: not support function calling for now
  ],
  [ProviderTypeEnum.Grok]: ['grok-3', 'grok-3-fast', 'grok-3-mini', 'grok-3-mini-fast'],
  [ProviderTypeEnum.Ollama]: ['qwen3:14b', 'falcon3:10b', 'qwen2.5-coder:14b', 'mistral-small:24b'],
  [ProviderTypeEnum.AzureOpenAI]: ['gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-4o', 'gpt-4o-mini', 'o4-mini', 'o3'],
  [ProviderTypeEnum.OpenRouter]: [
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
  ],
  [ProviderTypeEnum.CentralizedAPI]: [
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
  ],
  [ProviderTypeEnum.Groq]: ['llama-3.3-70b-versatile'],
  [ProviderTypeEnum.Cerebras]: ['llama-3.3-70b'],
  // Custom OpenAI providers don't have predefined models as they are user-defined
};

// Default parameters for each agent per provider, for providers not specified, use OpenAI parameters
export const llmProviderParameters = {
  [ProviderTypeEnum.OpenAI]: {
    [AgentNameEnum.Planner]: {
      temperature: 0.7,
      topP: 0.9,
    },
    [AgentNameEnum.Navigator]: {
      temperature: 0.3,
      topP: 0.85,
    },
    [AgentNameEnum.Validator]: {
      temperature: 0.1,
      topP: 0.8,
    },
  },
  [ProviderTypeEnum.Anthropic]: {
    [AgentNameEnum.Planner]: {
      temperature: 0.3,
      topP: 0.6,
    },
    [AgentNameEnum.Navigator]: {
      temperature: 0.2,
      topP: 0.5,
    },
    [AgentNameEnum.Validator]: {
      temperature: 0.1,
      topP: 0.5,
    },
  },
  [ProviderTypeEnum.Gemini]: {
    [AgentNameEnum.Planner]: {
      temperature: 0.7,
      topP: 0.9,
    },
    [AgentNameEnum.Navigator]: {
      temperature: 0.3,
      topP: 0.85,
    },
    [AgentNameEnum.Validator]: {
      temperature: 0.1,
      topP: 0.8,
    },
  },
  [ProviderTypeEnum.Grok]: {
    [AgentNameEnum.Planner]: {
      temperature: 0.7,
      topP: 0.9,
    },
    [AgentNameEnum.Navigator]: {
      temperature: 0.3,
      topP: 0.85,
    },
    [AgentNameEnum.Validator]: {
      temperature: 0.1,
      topP: 0.8,
    },
  },
  [ProviderTypeEnum.Ollama]: {
    [AgentNameEnum.Planner]: {
      temperature: 0.3,
      topP: 0.9,
    },
    [AgentNameEnum.Navigator]: {
      temperature: 0.1,
      topP: 0.85,
    },
    [AgentNameEnum.Validator]: {
      temperature: 0.1,
      topP: 0.8,
    },
  },
  [ProviderTypeEnum.AzureOpenAI]: {
    [AgentNameEnum.Planner]: {
      temperature: 0.7,
      topP: 0.9,
    },
    [AgentNameEnum.Navigator]: {
      temperature: 0.3,
      topP: 0.85,
    },
    [AgentNameEnum.Validator]: {
      temperature: 0.1,
      topP: 0.8,
    },
  },
  [ProviderTypeEnum.OpenRouter]: {
    [AgentNameEnum.Planner]: {
      temperature: 0.7,
      topP: 0.9,
    },
    [AgentNameEnum.Navigator]: {
      temperature: 0.3,
      topP: 0.85,
    },
    [AgentNameEnum.Validator]: {
      temperature: 0.1,
      topP: 0.8,
    },
  },
  [ProviderTypeEnum.CentralizedAPI]: {
    [AgentNameEnum.Planner]: {
      temperature: 0.7,
      topP: 0.9,
    },
    [AgentNameEnum.Navigator]: {
      temperature: 0.3,
      topP: 0.85,
    },
    [AgentNameEnum.Validator]: {
      temperature: 0.1,
      topP: 0.8,
    },
  },
  [ProviderTypeEnum.Groq]: {
    [AgentNameEnum.Planner]: {
      temperature: 0.7,
      topP: 0.9,
    },
    [AgentNameEnum.Navigator]: {
      temperature: 0.3,
      topP: 0.85,
    },
    [AgentNameEnum.Validator]: {
      temperature: 0.1,
      topP: 0.8,
    },
  },
  [ProviderTypeEnum.Cerebras]: {
    [AgentNameEnum.Planner]: {
      temperature: 0.7,
      topP: 0.9,
    },
    [AgentNameEnum.Navigator]: {
      temperature: 0.3,
      topP: 0.85,
    },
    [AgentNameEnum.Validator]: {
      temperature: 0.1,
      topP: 0.8,
    },
  },
};

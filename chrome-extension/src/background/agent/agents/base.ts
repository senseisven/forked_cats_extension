import type { z } from 'zod';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { AgentContext, AgentOutput } from '../types';
import type { BasePrompt } from '../prompts/base';
import type { BaseMessage } from '@langchain/core/messages';
import { createLogger } from '@src/background/log';
import type { Action } from '../actions/builder';
import { convertInputMessages, extractJsonFromModelOutput, removeThinkTags } from '../messages/utils';
import { isAbortedError, RequestCancelledError } from './errors';
import { TokenUsageManager } from '@extension/storage';

const logger = createLogger('agent');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CallOptions = Record<string, any>;

// Update options to use Zod schema
export interface BaseAgentOptions {
  chatLLM: BaseChatModel;
  context: AgentContext;
  prompt: BasePrompt;
}
export interface ExtraAgentOptions {
  id?: string;
  toolCallingMethod?: string;
  callOptions?: CallOptions;
}

/**
 * Base class for all agents
 * @param T - The Zod schema for the model output
 * @param M - The type of the result field of the agent output
 */
export abstract class BaseAgent<T extends z.ZodType, M = unknown> {
  protected id: string;
  protected chatLLM: BaseChatModel;
  protected prompt: BasePrompt;
  protected context: AgentContext;
  protected actions: Record<string, Action> = {};
  protected modelOutputSchema: T;
  protected toolCallingMethod: string | null;
  protected chatModelLibrary: string;
  protected modelName: string;
  protected withStructuredOutput: boolean;
  protected callOptions?: CallOptions;
  protected modelOutputToolName: string;
  declare ModelOutput: z.infer<T>;

  constructor(modelOutputSchema: T, options: BaseAgentOptions, extraOptions?: Partial<ExtraAgentOptions>) {
    // base options
    this.modelOutputSchema = modelOutputSchema;
    this.chatLLM = options.chatLLM;
    this.prompt = options.prompt;
    this.context = options.context;
    // TODO: fix this, the name is not correct in production environment
    this.chatModelLibrary = this.chatLLM.constructor.name;
    this.modelName = this.getModelName();
    this.withStructuredOutput = this.setWithStructuredOutput();
    // extra options
    this.id = extraOptions?.id || 'agent';
    this.toolCallingMethod = this.setToolCallingMethod(extraOptions?.toolCallingMethod);
    this.callOptions = extraOptions?.callOptions;
    this.modelOutputToolName = `${this.id}_output`;
  }

  // Set the model name
  private getModelName(): string {
    if ('modelName' in this.chatLLM) {
      return this.chatLLM.modelName as string;
    }
    if ('model_name' in this.chatLLM) {
      return this.chatLLM.model_name as string;
    }
    if ('model' in this.chatLLM) {
      return this.chatLLM.model as string;
    }
    return 'Unknown';
  }

  // Set the tool calling method
  private setToolCallingMethod(toolCallingMethod?: string): string | null {
    if (toolCallingMethod === 'auto') {
      switch (this.chatModelLibrary) {
        case 'ChatGoogleGenerativeAI':
          return null;
        case 'ChatOpenAI':
        case 'AzureChatOpenAI':
        case 'ChatGroq':
        case 'ChatXAI':
          return 'function_calling';
        default:
          return null;
      }
    }
    return toolCallingMethod || null;
  }

  // Set whether to use structured output based on the model name
  private setWithStructuredOutput(): boolean {
    // Disable structured output for models known to have issues
    const modelLower = this.modelName.toLowerCase();

    // DeepSeek reasoning models don't support structured output well
    if (modelLower.includes('deepseek-reasoner') || modelLower.includes('deepseek-r1')) {
      return false;
    }

    // Some older OpenAI models might have structured output issues
    if (modelLower.includes('gpt-4o-mini') && modelLower.includes('openai/')) {
      console.warn(
        `Model ${this.modelName} may have structured output compatibility issues, trying alternative approach`,
      );
      return false; // Temporarily disable to test
    }

    return true;
  }

  async invoke(inputMessages: BaseMessage[]): Promise<this['ModelOutput']> {
    logger.info(`🚀 Starting invoke for ${this.id} with model ${this.modelName}`);

    // Check token availability before making the call
    logger.info('🔍 Checking token availability...');
    const hasTokens = await TokenUsageManager.hasTokens(this.modelName);
    if (!hasTokens) {
      logger.error('❌ Insufficient tokens');
      const remaining = await TokenUsageManager.getRemainingTokens();
      const cost = TokenUsageManager.getTokenCost(this.modelName);
      const errorMessage =
        this.context.language === 'ja'
          ? `トークンが不足しています。残り: ${remaining}、必要: ${cost}。来月まで待つか、プランをアップグレードしてください。`
          : `Insufficient tokens. Remaining: ${remaining}, Required: ${cost}. Please wait until next month or upgrade your plan.`;
      throw new Error(errorMessage);
    }
    logger.info('✅ Tokens available, proceeding...');

    let response;
    let success = false;

    try {
      // Use structured output
      if (this.withStructuredOutput) {
        logger.info('🔧 Using structured output approach...');
        const structuredLlm = this.chatLLM.withStructuredOutput(this.modelOutputSchema, {
          includeRaw: true,
          name: this.modelOutputToolName,
        });
        logger.info('🔧 Structured LLM created, making API call...');

        response = await structuredLlm.invoke(inputMessages, {
          signal: this.context.controller.signal,
          ...this.callOptions,
        });

        logger.info('📡 API call completed, checking response...');

        if (response.parsed) {
          logger.info('✅ Response parsed successfully');
          success = true;
          // Consume tokens on successful completion
          await TokenUsageManager.consumeTokens(this.modelName, this.id);
          return response.parsed;
        }
        logger.error('❌ Failed to parse response', response);
        throw new Error('Could not parse response with structured output');
      } else {
        logger.info('🔧 Using non-structured output approach...');
        // Without structured output support, need to extract JSON from model output manually
        const convertedInputMessages = convertInputMessages(inputMessages, this.modelName);
        logger.info('🔧 Input messages converted, making API call...');

        response = await this.chatLLM.invoke(convertedInputMessages, {
          signal: this.context.controller.signal,
          ...this.callOptions,
        });

        logger.info('📡 API call completed, processing response...');

        if (typeof response.content === 'string') {
          response.content = removeThinkTags(response.content);
          try {
            const extractedJson = extractJsonFromModelOutput(response.content);
            const parsed = this.validateModelOutput(extractedJson);
            if (parsed) {
              logger.info('✅ Response processed successfully');
              success = true;
              // Consume tokens on successful completion
              await TokenUsageManager.consumeTokens(this.modelName, this.id);
              return parsed;
            }
          } catch (error) {
            const errorMessage = `Failed to extract JSON from response: ${error}`;
            logger.error('❌ JSON extraction failed:', errorMessage);
            throw new Error(errorMessage);
          }
        }
        const errorMessage = `Failed to parse response: ${response}`;
        logger.error('❌ Response parsing failed:', errorMessage);
        throw new Error('Could not parse response');
      }
    } catch (error) {
      logger.error('❌ Invoke error:', error);
      if (isAbortedError(error)) {
        throw error;
      }

      // Don't consume tokens on error - user shouldn't be charged for failed requests
      if (this.withStructuredOutput) {
        const errorMessage = `${this.modelName}の構造化出力呼び出しに失敗しました: ${error}`;
        throw new Error(errorMessage);
      } else {
        throw error;
      }
    }
  }

  // Execute the agent and return the result
  abstract execute(): Promise<AgentOutput<M>>;

  // Helper method to validate metadata
  protected validateModelOutput(data: unknown): this['ModelOutput'] | undefined {
    if (!this.modelOutputSchema || !data) return undefined;
    try {
      return this.modelOutputSchema.parse(data);
    } catch (error) {
      logger.error('validateModelOutput', error);
      throw new Error('Could not validate model output');
    }
  }
}

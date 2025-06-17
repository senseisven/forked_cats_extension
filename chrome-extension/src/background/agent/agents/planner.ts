import { BaseAgent, type BaseAgentOptions, type ExtraAgentOptions } from './base';
import { createLogger } from '@src/background/log';
import { z } from 'zod';
import type { AgentOutput } from '../types';
import { HumanMessage } from '@langchain/core/messages';
import { Actors, ExecutionState } from '../event/types';
import { getStatusMessages } from '../prompts/templates/dynamic';
import {
  ChatModelAuthError,
  ChatModelForbiddenError,
  isAbortedError,
  isAuthenticationError,
  isForbiddenError,
  LLM_FORBIDDEN_ERROR_MESSAGE,
  RequestCancelledError,
} from './errors';
const logger = createLogger('PlannerAgent');

// Define Zod schema for planner output
export const plannerOutputSchema = z.object({
  observation: z.string(),
  challenges: z.string(),
  done: z.union([
    z.boolean(),
    z.string().transform(val => {
      if (val.toLowerCase() === 'true') return true;
      if (val.toLowerCase() === 'false') return false;
      throw new Error('Invalid boolean string');
    }),
  ]),
  next_steps: z.string(),
  reasoning: z.string(),
  web_task: z.union([
    z.boolean(),
    z.string().transform(val => {
      if (val.toLowerCase() === 'true') return true;
      if (val.toLowerCase() === 'false') return false;
      throw new Error('Invalid boolean string');
    }),
  ]),
});

export type PlannerOutput = z.infer<typeof plannerOutputSchema>;

export class PlannerAgent extends BaseAgent<typeof plannerOutputSchema, PlannerOutput> {
  constructor(options: BaseAgentOptions, extraOptions?: Partial<ExtraAgentOptions>) {
    super(plannerOutputSchema, options, { ...extraOptions, id: 'planner' });
  }

  async execute(): Promise<AgentOutput<PlannerOutput>> {
    try {
      logger.info('🔄 Planner starting execution...');
      const statusMessages = getStatusMessages(this.context.language);
      this.context.emitEvent(Actors.PLANNER, ExecutionState.STEP_START, statusMessages.planning);

      logger.info('📝 Getting messages from message manager...');
      // get all messages from the message manager, state message should be the last one
      const messages = this.context.messageManager.getMessages();
      logger.info(`📝 Got ${messages.length} messages from message manager`);

      // Use full message history except the first one
      const plannerMessages = [this.prompt.getSystemMessage(), ...messages.slice(1)];
      logger.info(`📝 Prepared ${plannerMessages.length} messages for planner`);

      // Remove images from last message if vision is not enabled for planner but vision is enabled
      if (!this.context.options.useVisionForPlanner && this.context.options.useVision) {
        logger.info('🖼️ Removing images from last message (vision disabled for planner)');
        const lastStateMessage = plannerMessages[plannerMessages.length - 1];
        let newMsg = '';

        if (Array.isArray(lastStateMessage.content)) {
          for (const msg of lastStateMessage.content) {
            if (msg.type === 'text') {
              newMsg += msg.text;
            }
            // Skip image_url messages
          }
        } else {
          newMsg = lastStateMessage.content;
        }

        plannerMessages[plannerMessages.length - 1] = new HumanMessage(newMsg);
        logger.info('🖼️ Images removed from last message');
      }

      logger.info('🤖 Invoking planner model...');
      const modelOutput = await this.invoke(plannerMessages);
      logger.info('✅ Planner model invocation completed');

      if (!modelOutput) {
        logger.error('❌ Planner model returned null/undefined output');
        const statusMessages = getStatusMessages(this.context.language);
        throw new Error(statusMessages.plannerFailed);
      }

      logger.info('📊 Planner model output received, emitting success event');
      this.context.emitEvent(Actors.PLANNER, ExecutionState.STEP_OK, modelOutput.next_steps);
      logger.info('Planner output', JSON.stringify(modelOutput, null, 2));

      return {
        id: this.id,
        result: modelOutput,
      };
    } catch (error) {
      logger.error('❌ Planner execution error:', error);
      // Check if this is an authentication error
      if (isAuthenticationError(error)) {
        throw new ChatModelAuthError('Planner API Authentication failed. Please verify your API key', error);
      }
      if (isForbiddenError(error)) {
        throw new ChatModelForbiddenError(LLM_FORBIDDEN_ERROR_MESSAGE, error);
      }
      if (isAbortedError(error)) {
        throw new RequestCancelledError((error as Error).message);
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Planning failed: ${errorMessage}`);
      this.context.emitEvent(Actors.PLANNER, ExecutionState.STEP_FAIL, `計画失敗: ${errorMessage}`);
      return {
        id: this.id,
        error: errorMessage,
      };
    }
  }
}

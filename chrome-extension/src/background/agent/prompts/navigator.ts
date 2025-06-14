/* eslint-disable @typescript-eslint/no-unused-vars */
import { BasePrompt } from './base';
import { type HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { AgentContext } from '@src/background/agent/types';
import { createLogger } from '@src/background/log';
import { navigatorSystemPromptTemplate } from './templates/navigator';
import { getDynamicNavigatorPrompt, type DetectedLanguage } from './templates/dynamic';

const logger = createLogger('agent/prompts/navigator');

export class NavigatorPrompt extends BasePrompt {
  private systemMessage: SystemMessage;
  private language: DetectedLanguage;

  constructor(
    private readonly maxActionsPerStep = 10,
    language: DetectedLanguage = 'auto',
  ) {
    super();
    this.language = language;

    const promptTemplate = getDynamicNavigatorPrompt(language);
    // Format the template with the maxActionsPerStep
    const formattedPrompt = promptTemplate.replace('{{max_actions}}', this.maxActionsPerStep.toString()).trim();
    this.systemMessage = new SystemMessage(formattedPrompt);
  }

  /**
   * Update the language of the prompt at runtime and regenerate the cached
   * system message so that subsequent navigator calls use the correct
   * language.
   */
  public setLanguage(language: DetectedLanguage): void {
    this.language = language;
    const promptTemplate = getDynamicNavigatorPrompt(language);
    const formattedPrompt = promptTemplate.replace('{{max_actions}}', this.maxActionsPerStep.toString()).trim();
    this.systemMessage = new SystemMessage(formattedPrompt);
  }

  getSystemMessage(): SystemMessage {
    /**
     * Get the system prompt for the agent.
     *
     * @returns SystemMessage containing the formatted system prompt
     */
    return this.systemMessage;
  }

  async getUserMessage(context: AgentContext): Promise<HumanMessage> {
    return await this.buildBrowserStateUserMessage(context);
  }
}

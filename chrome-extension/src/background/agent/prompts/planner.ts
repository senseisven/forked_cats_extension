/* eslint-disable @typescript-eslint/no-unused-vars */
import { BasePrompt } from './base';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { AgentContext } from '@src/background/agent/types';
import { plannerSystemPromptTemplate } from './templates/planner';
import { getDynamicPlannerPrompt, type DetectedLanguage } from './templates/dynamic';

export class PlannerPrompt extends BasePrompt {
  private language: DetectedLanguage;

  constructor(language: DetectedLanguage = 'auto') {
    super();
    this.language = language;
  }

  getSystemMessage(): SystemMessage {
    const promptTemplate = getDynamicPlannerPrompt(this.language);
    return new SystemMessage(promptTemplate);
  }

  async getUserMessage(context: AgentContext): Promise<HumanMessage> {
    return new HumanMessage('');
  }
}

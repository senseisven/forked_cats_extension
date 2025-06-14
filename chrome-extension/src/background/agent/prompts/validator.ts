import { BasePrompt } from './base';
import { type HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { AgentContext } from '@src/background/agent/types';
import { validatorSystemPromptTemplate } from './templates/validator';
import { getDynamicValidatorPrompt, type DetectedLanguage } from './templates/dynamic';

export class ValidatorPrompt extends BasePrompt {
  private tasks: string[] = [];
  private language: DetectedLanguage;

  constructor(task: string, language: DetectedLanguage = 'auto') {
    super();
    this.tasks.push(task);
    this.language = language;
  }

  /**
   * Update the language of the prompt at runtime. This ensures the validator
   * messages are regenerated in the correct language when users switch
   * languages between follow-up tasks.
   */
  public setLanguage(language: DetectedLanguage): void {
    this.language = language;
  }

  private tasksToValidate(): string {
    if (this.tasks.length === 1) {
      return this.tasks[0];
    }

    const lastTask = this.tasks[this.tasks.length - 1];
    const previousTasks = this.tasks
      .slice(0, -1)
      .map((task, index) => `${index + 1}. ${task}`)
      .join('\n');
    const tasksString = `
${lastTask}

The above task is the ultimate task to validate. It is a follow up task of the following previous tasks, please take the previous tasks into account when validating the ultimate task.

Previous tasks:
${previousTasks}
`;
    return tasksString;
  }

  getSystemMessage(): SystemMessage {
    const taskToValidate = this.tasksToValidate();
    const message = getDynamicValidatorPrompt(this.language, taskToValidate);
    return new SystemMessage(message);
  }
  /**
   * Get the user message for the validator prompt
   * @param context - The agent context
   * @returns The user message
   */
  async getUserMessage(context: AgentContext): Promise<HumanMessage> {
    return await this.buildBrowserStateUserMessage(context);
  }

  addFollowUpTask(task: string): void {
    this.tasks.push(task);
  }
}

import { ExecutionState } from './agent/event/types';
import { nanoid } from 'nanoid';

// AG-UI Event Types (simplified version based on the source)
export enum AGUIEventType {
  TEXT_MESSAGE_START = 'TEXT_MESSAGE_START',
  TEXT_MESSAGE_CONTENT = 'TEXT_MESSAGE_CONTENT',
  TEXT_MESSAGE_END = 'TEXT_MESSAGE_END',
  TOOL_CALL_START = 'TOOL_CALL_START',
  TOOL_CALL_ARGS = 'TOOL_CALL_ARGS',
  TOOL_CALL_END = 'TOOL_CALL_END',
  RUN_STARTED = 'RUN_STARTED',
  RUN_FINISHED = 'RUN_FINISHED',
  RUN_ERROR = 'RUN_ERROR',
  STEP_STARTED = 'STEP_STARTED',
  STEP_FINISHED = 'STEP_FINISHED',
}

export interface AGUIEvent {
  type: AGUIEventType;
  timestamp: number;
  [key: string]: any;
}

export class LegacyToAGUIEventBridge {
  private currentMessageId: string | null = null;
  private currentRunId: string | null = null;
  private currentToolCallId: string | null = null;

  /**
   * Converts legacy executor events to AG-UI events
   */
  convertEvent(legacyEvent: any): AGUIEvent[] {
    const aguiEvents: AGUIEvent[] = [];
    const timestamp = legacyEvent.timestamp || Date.now();

    switch (legacyEvent.state) {
      case ExecutionState.TASK_START:
        this.currentRunId = nanoid();
        aguiEvents.push({
          type: AGUIEventType.RUN_STARTED,
          threadId: 'main-thread',
          runId: this.currentRunId,
          timestamp,
        });
        break;

      case ExecutionState.TASK_OK:
        if (this.currentRunId) {
          aguiEvents.push({
            type: AGUIEventType.RUN_FINISHED,
            threadId: 'main-thread',
            runId: this.currentRunId,
            timestamp,
          });
          this.currentRunId = null;
        }
        break;

      case ExecutionState.TASK_FAIL:
        aguiEvents.push({
          type: AGUIEventType.RUN_ERROR,
          message: legacyEvent.data?.details || 'Task failed',
          code: 'TASK_FAILURE',
          timestamp,
        });
        this.currentRunId = null;
        break;

      case ExecutionState.TASK_CANCEL:
        aguiEvents.push({
          type: AGUIEventType.RUN_ERROR,
          message: 'Task was cancelled',
          code: 'TASK_CANCELLED',
          timestamp,
        });
        this.currentRunId = null;
        break;

      case ExecutionState.STEP_START:
        const stepName = this.getStepName(legacyEvent.actor);
        aguiEvents.push({
          type: AGUIEventType.STEP_STARTED,
          stepName,
          timestamp,
        });

        // If this is a step that generates output, start a message
        if (this.shouldStartMessage(legacyEvent.actor)) {
          this.currentMessageId = nanoid();
          aguiEvents.push({
            type: AGUIEventType.TEXT_MESSAGE_START,
            messageId: this.currentMessageId,
            role: 'assistant',
            timestamp,
          });
        }
        break;

      case ExecutionState.STEP_OK:
        const stepNameOk = this.getStepName(legacyEvent.actor);

        // Add message content if we have details
        if (this.currentMessageId && legacyEvent.data?.details) {
          aguiEvents.push({
            type: AGUIEventType.TEXT_MESSAGE_CONTENT,
            messageId: this.currentMessageId,
            delta: legacyEvent.data.details,
            timestamp,
          });
        }

        // End the message if we started one
        if (this.currentMessageId && this.shouldStartMessage(legacyEvent.actor)) {
          aguiEvents.push({
            type: AGUIEventType.TEXT_MESSAGE_END,
            messageId: this.currentMessageId,
            timestamp,
          });
          this.currentMessageId = null;
        }

        aguiEvents.push({
          type: AGUIEventType.STEP_FINISHED,
          stepName: stepNameOk,
          timestamp,
        });
        break;

      case ExecutionState.STEP_FAIL:
        const stepNameFail = this.getStepName(legacyEvent.actor);

        // End message with error content if we have one active
        if (this.currentMessageId) {
          if (legacyEvent.data?.details) {
            aguiEvents.push({
              type: AGUIEventType.TEXT_MESSAGE_CONTENT,
              messageId: this.currentMessageId,
              delta: `Error: ${legacyEvent.data.details}`,
              timestamp,
            });
          }

          aguiEvents.push({
            type: AGUIEventType.TEXT_MESSAGE_END,
            messageId: this.currentMessageId,
            timestamp,
          });
          this.currentMessageId = null;
        }

        aguiEvents.push({
          type: AGUIEventType.STEP_FINISHED,
          stepName: stepNameFail,
          timestamp,
        });
        break;
    }

    return aguiEvents;
  }

  private getStepName(actor: string): string {
    switch (actor) {
      case 'PLANNER':
        return 'Planning';
      case 'NAVIGATOR':
        return 'Navigation';
      case 'VALIDATOR':
        return 'Validation';
      case 'SYSTEM':
        return 'System';
      default:
        return actor || 'Unknown';
    }
  }

  private shouldStartMessage(actor: string): boolean {
    // Start messages for actors that typically provide user-visible output
    return actor === 'PLANNER' || actor === 'NAVIGATOR' || actor === 'SYSTEM';
  }

  reset() {
    this.currentMessageId = null;
    this.currentRunId = null;
    this.currentToolCallId = null;
  }
}

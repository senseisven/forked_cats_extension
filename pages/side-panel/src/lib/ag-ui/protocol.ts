import { nanoid } from 'nanoid';
import {
  EventType,
  AGUIEvent,
  TextMessageStartEvent,
  TextMessageContentEvent,
  TextMessageEndEvent,
  ToolCallStartEvent,
  ToolCallArgsEvent,
  ToolCallEndEvent,
  RunStartedEvent,
  RunFinishedEvent,
  RunErrorEvent,
  StepStartedEvent,
  StepFinishedEvent,
  isAGUIEvent,
} from './events';

// Event factory functions
export function createUserMessage(
  text: string,
  threadId?: string,
): { type: 'user_message'; id: string; text: string; threadId?: string } {
  return {
    type: 'user_message',
    id: nanoid(),
    text,
    threadId,
  };
}

export function createTextMessageStart(messageId?: string): TextMessageStartEvent {
  return {
    type: EventType.TEXT_MESSAGE_START,
    messageId: messageId || nanoid(),
    role: 'assistant',
    timestamp: Date.now(),
  };
}

export function createTextMessageContent(messageId: string, delta: string): TextMessageContentEvent {
  return {
    type: EventType.TEXT_MESSAGE_CONTENT,
    messageId,
    delta,
    timestamp: Date.now(),
  };
}

export function createTextMessageEnd(messageId: string): TextMessageEndEvent {
  return {
    type: EventType.TEXT_MESSAGE_END,
    messageId,
    timestamp: Date.now(),
  };
}

export function createToolCallStart(
  toolCallId: string,
  toolCallName: string,
  parentMessageId?: string,
): ToolCallStartEvent {
  return {
    type: EventType.TOOL_CALL_START,
    toolCallId: toolCallId || nanoid(),
    toolCallName,
    parentMessageId,
    timestamp: Date.now(),
  };
}

export function createToolCallArgs(toolCallId: string, delta: string): ToolCallArgsEvent {
  return {
    type: EventType.TOOL_CALL_ARGS,
    toolCallId,
    delta,
    timestamp: Date.now(),
  };
}

export function createToolCallEnd(toolCallId: string): ToolCallEndEvent {
  return {
    type: EventType.TOOL_CALL_END,
    toolCallId,
    timestamp: Date.now(),
  };
}

export function createRunStarted(threadId: string, runId?: string): RunStartedEvent {
  return {
    type: EventType.RUN_STARTED,
    threadId,
    runId: runId || nanoid(),
    timestamp: Date.now(),
  };
}

export function createRunFinished(threadId: string, runId: string): RunFinishedEvent {
  return {
    type: EventType.RUN_FINISHED,
    threadId,
    runId,
    timestamp: Date.now(),
  };
}

export function createRunError(message: string, code?: string): RunErrorEvent {
  return {
    type: EventType.RUN_ERROR,
    message,
    code,
    timestamp: Date.now(),
  };
}

export function createStepStarted(stepName: string): StepStartedEvent {
  return {
    type: EventType.STEP_STARTED,
    stepName,
    timestamp: Date.now(),
  };
}

export function createStepFinished(stepName: string): StepFinishedEvent {
  return {
    type: EventType.STEP_FINISHED,
    stepName,
    timestamp: Date.now(),
  };
}

// Message protocol functions
export function sendUserMessage(text: string, threadId?: string, port?: chrome.runtime.Port) {
  const message = createUserMessage(text, threadId);

  // Try to use the provided port first, then fall back to sendMessage
  if (port && port.postMessage) {
    try {
      port.postMessage(message);
    } catch (error) {
      console.error('Failed to send message via port:', error);
      chrome.runtime.sendMessage(message);
    }
  } else {
    chrome.runtime.sendMessage(message);
  }
}

// Export the isAGUIEvent function for use in message routing
export { isAGUIEvent };

// Helper to create tool action result message
export function createToolActionResult(toolCallId: string, status: 'success' | 'error', payload?: any) {
  return {
    type: 'tool_action_result',
    toolCallId,
    status,
    payload,
    timestamp: Date.now(),
  };
}

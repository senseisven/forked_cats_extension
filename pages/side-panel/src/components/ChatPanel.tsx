import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AGUIEvent, EventType } from '../lib/ag-ui/events';
import { sendUserMessage } from '../lib/ag-ui/protocol';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  toolCalls?: ToolCall[];
  error?: string;
}

interface ToolCall {
  id: string;
  name: string;
  args: string;
  status: 'pending' | 'success' | 'error';
  result?: any;
}

interface ChatPanelProps {
  eventStream: AGUIEvent[];
  onUserSend: (text: string) => void;
  className?: string;
}

export default function ChatPanel({ eventStream, onUserSend, className = '' }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<string | null>(null);
  const [currentToolCalls, setCurrentToolCalls] = useState<Map<string, ToolCall>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStreamingMessage]);

  // Process AG-UI events
  useEffect(() => {
    if (eventStream.length === 0) return;

    const latestEvent = eventStream[eventStream.length - 1];
    handleAGUIEvent(latestEvent);
  }, [eventStream]);

  const handleAGUIEvent = useCallback((event: AGUIEvent) => {
    switch (event.type) {
      case EventType.RUN_STARTED:
        setIsProcessing(true);
        break;

      case EventType.RUN_FINISHED:
        setIsProcessing(false);
        setCurrentStreamingMessage(null);
        break;

      case EventType.RUN_ERROR:
        setIsProcessing(false);
        setMessages(prev => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: '',
            error: event.message,
            timestamp: event.timestamp || Date.now(),
          },
        ]);
        break;

      case EventType.TEXT_MESSAGE_START:
        setCurrentStreamingMessage('');
        setMessages(prev => [
          ...prev,
          {
            id: event.messageId,
            role: 'assistant',
            content: '',
            timestamp: event.timestamp || Date.now(),
            isStreaming: true,
          },
        ]);
        break;

      case EventType.TEXT_MESSAGE_CONTENT:
        setCurrentStreamingMessage(prev => (prev || '') + event.delta);
        setMessages(prev =>
          prev.map(msg => (msg.id === event.messageId ? { ...msg, content: msg.content + event.delta } : msg)),
        );
        break;

      case EventType.TEXT_MESSAGE_END:
        setCurrentStreamingMessage(null);
        setMessages(prev => prev.map(msg => (msg.id === event.messageId ? { ...msg, isStreaming: false } : msg)));
        break;

      case EventType.TOOL_CALL_START:
        const newToolCall: ToolCall = {
          id: event.toolCallId,
          name: event.toolCallName,
          args: '',
          status: 'pending',
        };
        setCurrentToolCalls(prev => new Map(prev.set(event.toolCallId, newToolCall)));
        break;

      case EventType.TOOL_CALL_ARGS:
        setCurrentToolCalls(prev => {
          const toolCall = prev.get(event.toolCallId);
          if (toolCall) {
            return new Map(
              prev.set(event.toolCallId, {
                ...toolCall,
                args: toolCall.args + event.delta,
              }),
            );
          }
          return prev;
        });
        break;

      case EventType.TOOL_CALL_END:
        setCurrentToolCalls(prev => {
          const toolCall = prev.get(event.toolCallId);
          if (toolCall) {
            const updatedToolCall = { ...toolCall, status: 'success' as const };
            setMessages(prevMessages =>
              prevMessages.map(msg =>
                msg.isStreaming
                  ? {
                      ...msg,
                      toolCalls: [...(msg.toolCalls || []), updatedToolCall],
                    }
                  : msg,
              ),
            );
            const newMap = new Map(prev);
            newMap.delete(event.toolCallId);
            return newMap;
          }
          return prev;
        });
        break;

      case EventType.STEP_STARTED:
        console.log(`Step started: ${event.stepName}`);
        break;

      case EventType.STEP_FINISHED:
        console.log(`Step finished: ${event.stepName}`);
        break;
    }
  }, []);

  const handleSend = useCallback(() => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    onUserSend(input.trim());
    setInput('');
  }, [input, isProcessing, onUserSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.error
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-gray-100 text-gray-900'
              }`}>
              {message.error ? (
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Error
                  </span>
                  <span>{message.error}</span>
                </div>
              ) : (
                <>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.isStreaming && <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1"></span>}
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.toolCalls.map(toolCall => (
                        <ToolCallCard key={toolCall.id} toolCall={toolCall} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        {/* Active tool calls */}
        {Array.from(currentToolCalls.values()).map(toolCall => (
          <div key={toolCall.id} className="flex justify-start">
            <div className="max-w-[80%] bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
              <ToolCallCard toolCall={toolCall} />
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            disabled={isProcessing}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
            {isProcessing ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Tool call card component
function ToolCallCard({ toolCall }: { toolCall: ToolCall }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    success: 'bg-green-100 text-green-800 border-green-300',
    error: 'bg-red-100 text-red-800 border-red-300',
  };

  const statusIcons = {
    pending: '⏳',
    success: '✅',
    error: '❌',
  };

  return (
    <div className={`border rounded-lg p-3 ${statusColors[toolCall.status]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span>{statusIcons[toolCall.status]}</span>
          <span className="font-medium">{toolCall.name}</span>
          <span className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded">{toolCall.status}</span>
        </div>
        <button onClick={() => setIsExpanded(!isExpanded)} className="text-xs underline hover:no-underline">
          {isExpanded ? 'Hide' : 'Show'} details
        </button>
      </div>

      {isExpanded && (
        <div className="mt-2 text-xs">
          <div className="mb-2">
            <strong>Arguments:</strong>
            <pre className="mt-1 p-2 bg-white bg-opacity-50 rounded text-xs overflow-auto">
              {toolCall.args || 'Loading...'}
            </pre>
          </div>
          {toolCall.result && (
            <div>
              <strong>Result:</strong>
              <pre className="mt-1 p-2 bg-white bg-opacity-50 rounded text-xs overflow-auto">
                {JSON.stringify(toolCall.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React from 'react';
import ChatPanel from './ChatPanel';
import { useEventBus } from '../store/eventBus';

export default function AgentChat() {
  const { events, pushUserText } = useEventBus();

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white">
        <h1 className="text-lg font-semibold text-gray-900">AG-UI Agent Chat</h1>
        <p className="text-sm text-gray-600">Powered by AG-UI Protocol</p>
      </div>

      <div className="flex-1 min-h-0">
        <ChatPanel eventStream={events} onUserSend={pushUserText} className="h-full" />
      </div>
    </div>
  );
}

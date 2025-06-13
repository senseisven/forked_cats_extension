import { useState, useEffect, useCallback } from 'react';
import { AGUIEvent, isAGUIEvent } from '../lib/ag-ui/events';
import { sendUserMessage } from '../lib/ag-ui/protocol';

class EventBus {
  private events: AGUIEvent[] = [];
  private listeners: Set<(events: AGUIEvent[]) => void> = new Set();
  private port: chrome.runtime.Port | null = null;

  constructor() {
    this.setupConnection();
  }

  private setupConnection() {
    try {
      // Connect to background script
      this.port = chrome.runtime.connect({ name: 'ag-ui-connection' });

      this.port.onMessage.addListener(message => {
        if (isAGUIEvent(message)) {
          this.addEvent(message);
        }
      });

      this.port.onDisconnect.addListener(() => {
        console.log('AG-UI connection disconnected');
        this.port = null;
        // Attempt to reconnect after a delay
        setTimeout(() => this.setupConnection(), 1000);
      });
    } catch (error) {
      console.error('Failed to setup AG-UI connection:', error);
    }
  }

  addEvent(event: AGUIEvent) {
    this.events.push(event);
    // Keep only the last 1000 events to prevent memory issues
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
    this.notifyListeners();
  }

  getEvents(): AGUIEvent[] {
    return [...this.events];
  }

  subscribe(listener: (events: AGUIEvent[]) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.getEvents());
      } catch (error) {
        console.error('Error in event bus listener:', error);
      }
    });
  }

  sendUserMessage(text: string) {
    if (this.port) {
      sendUserMessage(text);
    } else {
      console.error('No connection to background script');
    }
  }

  clear() {
    this.events = [];
    this.notifyListeners();
  }
}

// Global event bus instance
const eventBus = new EventBus();

// React hook to use the event bus
export function useEventBus() {
  const [events, setEvents] = useState<AGUIEvent[]>([]);

  useEffect(() => {
    // Initial events
    setEvents(eventBus.getEvents());

    // Subscribe to updates
    const unsubscribe = eventBus.subscribe(setEvents);
    return unsubscribe;
  }, []);

  const pushUserText = useCallback((text: string) => {
    eventBus.sendUserMessage(text);
  }, []);

  const clearEvents = useCallback(() => {
    eventBus.clear();
  }, []);

  return {
    events,
    pushUserText,
    clearEvents,
  };
}

export default eventBus;

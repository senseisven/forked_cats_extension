import React, { useState, useEffect, useRef } from 'react';
import { useEventBus } from '../store/eventBus';
import ChatInput from './ChatInput';
import BookmarkList from './BookmarkList';
import MessageList from './MessageList';
import { t } from '@extension/i18n';
import favoritesStorage, { type FavoritePrompt } from '@extension/storage/lib/prompt/favorites';
import { type Message, Actors } from '@extension/storage';

export default function AgentChat() {
  const { events, pushUserText } = useEventBus();
  const [messages, setMessages] = useState<Message[]>([]);
  const [favoritePrompts, setFavoritePrompts] = useState<FavoritePrompt[]>([]);
  const [inputEnabled, setInputEnabled] = useState(true);
  const [showStopButton, setShowStopButton] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const setInputTextRef = useRef<((text: string) => void) | null>(null);

  // Process AG-UI events and convert them to Message format
  useEffect(() => {
    if (events.length === 0) return;

    const newMessages: Message[] = [];
    let currentMessage = '';
    let isStreaming = false;

    for (const event of events) {
      switch (event.type) {
        case 'RUN_STARTED':
          setInputEnabled(false);
          setShowStopButton(true);
          break;

        case 'RUN_FINISHED':
          setInputEnabled(true);
          setShowStopButton(false);
          if (isStreaming && currentMessage) {
            newMessages.push({
              actor: Actors.PLANNER,
              content: currentMessage,
              timestamp: event.timestamp || Date.now(),
            });
            currentMessage = '';
            isStreaming = false;
          }
          break;

        case 'RUN_ERROR':
          setInputEnabled(true);
          setShowStopButton(false);
          newMessages.push({
            actor: Actors.SYSTEM,
            content: `Error: ${event.message}`,
            timestamp: event.timestamp || Date.now(),
          });
          isStreaming = false;
          break;

        case 'TEXT_MESSAGE_START':
          isStreaming = true;
          currentMessage = '';
          break;

        case 'TEXT_MESSAGE_CONTENT':
          if (isStreaming) {
            currentMessage += event.delta;
          }
          break;

        case 'TEXT_MESSAGE_END':
          if (isStreaming && currentMessage) {
            newMessages.push({
              actor: Actors.PLANNER,
              content: currentMessage,
              timestamp: event.timestamp || Date.now(),
            });
            currentMessage = '';
            isStreaming = false;
          }
          break;
      }
    }

    if (newMessages.length > 0) {
      setMessages(prev => [...prev, ...newMessages]);
    }
  }, [events]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load favorite prompts
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const prompts = await favoritesStorage.getAllPrompts();
        setFavoritePrompts(prompts);
      } catch (error) {
        console.error('Failed to load favorite prompts:', error);
      }
    };
    loadFavorites();
  }, []);

  const handleSendMessage = async (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    // Add user message to UI
    const userMessage: Message = {
      actor: Actors.USER,
      content: trimmedText,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Send through AG-UI protocol
    pushUserText(trimmedText);
  };

  const handleStopTask = () => {
    setInputEnabled(true);
    setShowStopButton(false);
    // TODO: Implement actual stop functionality
  };

  const handleBookmarkSelect = (content: string) => {
    if (setInputTextRef.current) {
      setInputTextRef.current(content);
    }
  };

  const handleBookmarkUpdateTitle = async (id: number, title: string) => {
    try {
      await favoritesStorage.updatePromptTitle(id, title);
      const prompts = await favoritesStorage.getAllPrompts();
      setFavoritePrompts(prompts);
    } catch (error) {
      console.error('Failed to update favorite prompt title:', error);
    }
  };

  const handleBookmarkDelete = async (id: number) => {
    try {
      await favoritesStorage.removePrompt(id);
      const prompts = await favoritesStorage.getAllPrompts();
      setFavoritePrompts(prompts);
    } catch (error) {
      console.error('Failed to delete favorite prompt:', error);
    }
  };

  const handleBookmarkReorder = async (draggedId: number, targetId: number) => {
    try {
      await favoritesStorage.reorderPrompts(draggedId, targetId);
      const updatedPromptsFromStorage = await favoritesStorage.getAllPrompts();
      setFavoritePrompts(updatedPromptsFromStorage);
    } catch (error) {
      console.error('Failed to reorder favorite prompts:', error);
    }
  };

  const handleBookmarkAdd = async (title: string, content: string) => {
    try {
      await favoritesStorage.addPrompt(title, content);
      const prompts = await favoritesStorage.getAllPrompts();
      setFavoritePrompts(prompts);
    } catch (error) {
      console.error('Failed to add favorite prompt:', error);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {messages.length === 0 && (
        <>
          <div
            className={`border-t ${isDarkMode ? 'border-sky-900' : 'border-sky-100'} mb-2 p-2 shadow-sm backdrop-blur-sm`}>
            <ChatInput
              onSendMessage={handleSendMessage}
              onStopTask={handleStopTask}
              disabled={!inputEnabled}
              showStopButton={showStopButton}
              setContent={setter => {
                setInputTextRef.current = setter;
              }}
              isDarkMode={isDarkMode}
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            <BookmarkList
              bookmarks={favoritePrompts}
              onBookmarkSelect={handleBookmarkSelect}
              onBookmarkUpdateTitle={handleBookmarkUpdateTitle}
              onBookmarkDelete={handleBookmarkDelete}
              onBookmarkReorder={handleBookmarkReorder}
              onBookmarkAdd={handleBookmarkAdd}
              isDarkMode={isDarkMode}
            />
          </div>
        </>
      )}
      {messages.length > 0 && (
        <div
          className={`scrollbar-gutter-stable flex-1 overflow-x-hidden overflow-y-scroll scroll-smooth p-2 ${isDarkMode ? 'bg-slate-900/80' : ''}`}>
          <MessageList messages={messages} isDarkMode={isDarkMode} />
          <div ref={messagesEndRef} />
        </div>
      )}
      {messages.length > 0 && (
        <div className={`border-t ${isDarkMode ? 'border-sky-900' : 'border-sky-100'} p-2 shadow-sm backdrop-blur-sm`}>
          <ChatInput
            onSendMessage={handleSendMessage}
            onStopTask={handleStopTask}
            disabled={!inputEnabled}
            showStopButton={showStopButton}
            setContent={setter => {
              setInputTextRef.current = setter;
            }}
            isDarkMode={isDarkMode}
          />
        </div>
      )}
    </div>
  );
}

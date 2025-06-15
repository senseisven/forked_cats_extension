import type { Message } from '@extension/storage';
import { ACTOR_PROFILES } from '../types/message';
import { memo } from 'react';

// Simple language detection for UI
type DetectedLanguage = 'ja' | 'en' | 'auto';

function detectLanguageFromText(text: string): DetectedLanguage {
  if (!text || text.trim().length === 0) {
    return 'auto';
  }

  // Japanese character ranges
  const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g;
  const japaneseMatches = text.match(japaneseRegex) || [];
  const japaneseRatio = japaneseMatches.length / text.length;

  // If more than 10% of characters are Japanese, consider it Japanese
  if (japaneseRatio > 0.1) {
    return 'ja';
  }

  // Otherwise assume English
  return 'en';
}

function detectLanguageFromMessages(messages: Message[]): DetectedLanguage {
  // Look at the last few user messages to detect language
  const userMessages = messages
    .filter(msg => msg.actor === 'user')
    .slice(-3) // Last 3 user messages
    .map(msg => msg.content)
    .join(' ');

  return detectLanguageFromText(userMessages);
}

// Localized loading text
const loadingText = {
  ja: {
    planning: '計画中...',
    navigating: 'ナビゲーション中...',
    validating: '検証中...',
    processing: '処理中...',
  },
  en: {
    planning: 'Planning...',
    navigating: 'Navigating...',
    validating: 'Validating...',
    processing: 'Processing...',
  },
  auto: {
    planning: 'Planning...',
    navigating: 'Navigating...',
    validating: 'Validating...',
    processing: 'Processing...',
  },
};

interface MessageListProps {
  messages: Message[];
  isDarkMode?: boolean;
}

export default memo(function MessageList({ messages, isDarkMode = false }: MessageListProps) {
  const detectedLanguage = detectLanguageFromMessages(messages);

  return (
    <div className="max-w-full space-y-4">
      {messages.map((message, index) => (
        <MessageBlock
          key={`${message.actor}-${message.timestamp}-${index}`}
          message={message}
          isSameActor={index > 0 ? messages[index - 1].actor === message.actor : false}
          isDarkMode={isDarkMode}
          detectedLanguage={detectedLanguage}
        />
      ))}
    </div>
  );
});

interface MessageBlockProps {
  message: Message;
  isSameActor: boolean;
  isDarkMode?: boolean;
  detectedLanguage: DetectedLanguage;
}

// Modern loader component with different styles for each agent
function ModernLoader({
  actor,
  isDarkMode = false,
  language = 'en',
}: {
  actor: string;
  isDarkMode?: boolean;
  language?: DetectedLanguage;
}) {
  const texts = loadingText[language];

  const getLoaderStyle = () => {
    switch (actor) {
      case 'planner':
        // Pulsing dots for planner (thinking/planning)
        return (
          <div className="flex items-center space-x-1">
            <div
              className={`h-2 w-2 rounded-full ${isDarkMode ? 'bg-orange-400' : 'bg-orange-500'} animate-pulse-dot`}
              style={{ animationDelay: '0ms' }}
            />
            <div
              className={`h-2 w-2 rounded-full ${isDarkMode ? 'bg-orange-400' : 'bg-orange-500'} animate-pulse-dot`}
              style={{ animationDelay: '160ms' }}
            />
            <div
              className={`h-2 w-2 rounded-full ${isDarkMode ? 'bg-orange-400' : 'bg-orange-500'} animate-pulse-dot`}
              style={{ animationDelay: '320ms' }}
            />
            <span className={`ml-2 text-xs ${isDarkMode ? 'text-orange-300' : 'text-orange-600'} font-medium`}>
              {texts.planning}
            </span>
          </div>
        );

      case 'navigator':
        // Wave animation for navigator (navigating/moving)
        return (
          <div className="flex items-center space-x-1">
            <div
              className={`h-3 w-1 rounded-full ${isDarkMode ? 'bg-blue-400' : 'bg-blue-500'} animate-wave`}
              style={{ animationDelay: '0ms' }}
            />
            <div
              className={`h-3 w-1 rounded-full ${isDarkMode ? 'bg-blue-400' : 'bg-blue-500'} animate-wave`}
              style={{ animationDelay: '100ms' }}
            />
            <div
              className={`h-3 w-1 rounded-full ${isDarkMode ? 'bg-blue-400' : 'bg-blue-500'} animate-wave`}
              style={{ animationDelay: '200ms' }}
            />
            <div
              className={`h-3 w-1 rounded-full ${isDarkMode ? 'bg-blue-400' : 'bg-blue-500'} animate-wave`}
              style={{ animationDelay: '300ms' }}
            />
            <div
              className={`h-3 w-1 rounded-full ${isDarkMode ? 'bg-blue-400' : 'bg-blue-500'} animate-wave`}
              style={{ animationDelay: '400ms' }}
            />
            <span className={`ml-2 text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-600'} font-medium`}>
              {texts.navigating}
            </span>
          </div>
        );

      case 'validator':
        // Breathing circle for validator (checking/validating)
        return (
          <div className="flex items-center space-x-2">
            <div className={`h-3 w-3 rounded-full ${isDarkMode ? 'bg-pink-400' : 'bg-pink-500'} animate-breathe`} />
            <span className={`text-xs ${isDarkMode ? 'text-pink-300' : 'text-pink-600'} font-medium`}>
              {texts.validating}
            </span>
          </div>
        );

      default:
        // Shimmer effect for other agents
        return (
          <div className="flex items-center space-x-2">
            <div
              className={`h-2 w-16 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'} animate-shimmer`}
              style={{
                background: isDarkMode
                  ? 'linear-gradient(90deg, #374151 25%, #6b7280 50%, #374151 75%)'
                  : 'linear-gradient(90deg, #d1d5db 25%, #9ca3af 50%, #d1d5db 75%)',
                backgroundSize: '200% 100%',
              }}
            />
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} font-medium`}>
              {texts.processing}
            </span>
          </div>
        );
    }
  };

  return <div className="flex items-center py-1">{getLoaderStyle()}</div>;
}

function MessageBlock({ message, isSameActor, isDarkMode = false, detectedLanguage }: MessageBlockProps) {
  if (!message.actor) {
    console.error('No actor found');
    return <div />;
  }
  const actor = ACTOR_PROFILES[message.actor as keyof typeof ACTOR_PROFILES];
  const isProgress = message.content === 'Showing progress...';

  return (
    <div
      className={`flex max-w-full gap-3 ${
        !isSameActor
          ? `mt-4 border-t ${isDarkMode ? 'border-sky-800/50' : 'border-sky-200/50'} pt-4 first:mt-0 first:border-t-0 first:pt-0`
          : ''
      }`}>
      {!isSameActor && (
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: actor.iconBackground }}>
          <img src={actor.icon} alt={actor.name} className="size-6" />
        </div>
      )}
      {isSameActor && <div className="w-8" />}

      <div className="min-w-0 flex-1">
        {!isSameActor && (
          <div className={`mb-1 text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            {actor.name}
          </div>
        )}

        <div className="space-y-0.5">
          <div className={`whitespace-pre-wrap break-words text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {isProgress ? (
              <ModernLoader actor={message.actor} isDarkMode={isDarkMode} language={detectedLanguage} />
            ) : (
              message.content
            )}
          </div>
          {!isProgress && (
            <div className={`text-right text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {formatTimestamp(message.timestamp)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Formats a timestamp (in milliseconds) to a readable time string
 * @param timestamp Unix timestamp in milliseconds
 * @returns Formatted time string
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();

  // Check if the message is from today
  const isToday = date.toDateString() === now.toDateString();

  // Check if the message is from yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  // Check if the message is from this year
  const isThisYear = date.getFullYear() === now.getFullYear();

  // Format the time (HH:MM)
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return timeStr; // Just show the time for today's messages
  }

  if (isYesterday) {
    return `Yesterday, ${timeStr}`;
  }

  if (isThisYear) {
    // Show month and day for this year
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
  }

  // Show full date for older messages
  return `${date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}, ${timeStr}`;
}

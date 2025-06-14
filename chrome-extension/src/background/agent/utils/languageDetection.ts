export type DetectedLanguage = 'ja' | 'en' | 'auto';

/**
 * Detects the language of the given text
 * @param text - The text to analyze
 * @returns The detected language ('ja' for Japanese, 'en' for English, 'auto' for fallback)
 */
export function detectLanguage(text: string): DetectedLanguage {
  if (!text || text.trim().length === 0) {
    return 'auto';
  }

  // Japanese character ranges (with global flag to match all occurrences)
  const hiraganaRegex = /[\u3040-\u309f]/g;
  const katakanaRegex = /[\u30a0-\u30ff]/g;
  const kanjiRegex = /[\u4e00-\u9faf]/g;
  const japaneseRegex = new RegExp([hiraganaRegex.source, katakanaRegex.source, kanjiRegex.source].join('|'), 'g');

  // Check for Japanese characters
  const japaneseMatches = text.match(japaneseRegex) || [];
  const japaneseRatio = japaneseMatches.length / text.length;

  // If more than 10% of characters are Japanese, consider it Japanese
  if (japaneseRatio > 0.1) {
    return 'ja';
  }

  // Check for English characters (letters, numbers, common punctuation)
  const englishRegex = /[a-zA-Z0-9\s.,!?;:'"()\-]/g;
  const englishMatches = text.match(englishRegex) || [];
  const englishRatio = englishMatches.length / text.length;

  // If more than 70% of characters are English-like, consider it English
  if (englishRatio > 0.7) {
    return 'en';
  }

  // Fallback to auto if unclear
  return 'auto';
}

/**
 * Get language name for display
 */
export function getLanguageName(language: DetectedLanguage): string {
  switch (language) {
    case 'ja':
      return 'Japanese';
    case 'en':
      return 'English';
    case 'auto':
      return 'Auto';
    default:
      return 'Unknown';
  }
}

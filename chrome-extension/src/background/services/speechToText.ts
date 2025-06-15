import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage } from '@langchain/core/messages';
import { createLogger } from '../log';
import { ProviderConfig, speechToTextModelStore } from '@extension/storage';

const logger = createLogger('SpeechToText');

// Simplified message function - will use Japanese for common error messages
function getMessage(
  key: 'speechToTextNotConfigured' | 'speechToTextProviderNotFound' | 'speechTranscriptionFailed',
): string {
  const messages = {
    speechToTextNotConfigured: '音声テキスト変換モデルが設定されていません。設定でGeminiモデルを設定してください。',
    speechToTextProviderNotFound:
      '音声テキスト変換モデルのプロバイダーが見つからないか、Geminiプロバイダーではありません。設定でGeminiモデルを設定してください。',
    speechTranscriptionFailed: '音声の文字起こしに失敗しました',
  };
  return messages[key];
}

export class SpeechToTextService {
  private llm: ChatGoogleGenerativeAI;

  private constructor(llm: ChatGoogleGenerativeAI) {
    this.llm = llm;
  }

  static async create(providers: Record<string, ProviderConfig>): Promise<SpeechToTextService> {
    try {
      const config = await speechToTextModelStore.getSpeechToTextModel();

      if (!config?.provider || !config?.modelName) {
        throw new Error(getMessage('speechToTextNotConfigured'));
      }

      const provider = providers[config.provider];
      logger.info('Found provider for speech-to-text:', provider ? 'yes' : 'no', provider?.type);

      if (
        !provider ||
        (provider.type !== 'gemini' &&
          !(provider.type === 'centralized_api' && config.modelName.startsWith('google/gemini')))
      ) {
        throw new Error(getMessage('speechToTextProviderNotFound'));
      }

      const llm = new ChatGoogleGenerativeAI({
        model: config.modelName,
        apiKey: provider.apiKey,
        temperature: 0.1,
        topP: 0.8,
      });
      logger.info(`Speech-to-text service created with model: ${config.modelName}`);
      return new SpeechToTextService(llm);
    } catch (error) {
      logger.error('Failed to create speech-to-text service:', error);
      throw error;
    }
  }

  async transcribeAudio(base64Audio: string): Promise<string> {
    try {
      logger.info('Starting audio transcription...');

      // Create transcription message with audio data
      const transcriptionMessage = new HumanMessage({
        content: [
          {
            type: 'text',
            text: 'Transcribe this audio. Return only the transcribed text without any additional formatting or explanations.',
          },
          {
            type: 'media',
            data: base64Audio,
            mimeType: 'audio/webm',
          },
        ],
      });

      // Get transcription from Gemini
      const transcriptionResponse = await this.llm.invoke([transcriptionMessage]);

      const transcribedText = transcriptionResponse.content.toString().trim();
      logger.info('Audio transcription completed:', transcribedText);

      return transcribedText;
    } catch (error) {
      logger.error('Failed to transcribe audio:', error);
      throw new Error(
        `${getMessage('speechTranscriptionFailed')}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

import React, { useEffect, useState } from 'react';
import { TokenUsageManager } from '@extension/storage';

interface TokenCounterProps {
  isDarkMode?: boolean;
}

interface TokenUsage {
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
  daysUntilReset: number;
}

export default function TokenCounter({ isDarkMode = false }: TokenCounterProps) {
  const [usage, setUsage] = useState<TokenUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsage = async () => {
      try {
        const usageSummary = await TokenUsageManager.getUsageSummary();
        setUsage(usageSummary);
      } catch (error) {
        console.error('Failed to load token usage:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsage();

    // Refresh usage every 30 seconds
    const interval = setInterval(loadUsage, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div
        className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <div className={`flex items-center space-x-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          <span className="text-sm">トークン使用量を読み込み中...</span>
        </div>
      </div>
    );
  }

  if (!usage) {
    return null;
  }

  const getUsageColor = () => {
    if (usage.percentage >= 90) return isDarkMode ? 'text-red-400' : 'text-red-600';
    if (usage.percentage >= 75) return isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
    return isDarkMode ? 'text-green-400' : 'text-green-600';
  };

  const getProgressColor = () => {
    if (usage.percentage >= 90) return 'bg-red-500';
    if (usage.percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div
      className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            トークン使用量
          </span>
        </div>
        <span className={`text-sm font-mono ${getUsageColor()}`}>
          {usage.used}/{usage.limit}
        </span>
      </div>

      {/* Progress bar */}
      <div className={`w-full h-2 rounded-full mb-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${getProgressColor()}`}
          style={{ width: `${Math.min(usage.percentage, 100)}%` }}></div>
      </div>

      <div className="flex justify-between items-center text-xs">
        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>残り: {usage.remaining}トークン</span>
        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>リセットまで: {usage.daysUntilReset}日</span>
      </div>

      {usage.remaining <= 5 && (
        <div
          className={`mt-2 p-2 rounded text-xs ${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700'}`}>
          ⚠️ トークンが不足しています。プレミアムプランへのアップグレードをご検討ください。
        </div>
      )}
    </div>
  );
}

// Japanese explanation component
export function TokenExplanation({ isDarkMode = false }: { isDarkMode?: boolean }) {
  return (
    <div
      className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
      <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
        🎯 トークンシステムについて
      </h3>

      <div className="space-y-3 text-sm">
        <div>
          <h4 className={`font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>トークンとは？</h4>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            トークンはAIエージェント（プランナー、ナビゲーター、バリデーター）を使用するための通貨です。
            Cursorと同様のシステムで、モデルの品質に応じてトークンが消費されます。
          </p>
        </div>

        <div>
          <h4 className={`font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            トークンの消費タイミング
          </h4>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            トークンは、ユーザーがプロンプトを入力した時ではなく、各エージェントが実行された時に消費されます。
            例：プランナー実行 → 1トークン消費、ナビゲーター実行 → 1トークン消費、など
          </p>
        </div>

        <div>
          <h4 className={`font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>無料プラン</h4>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            無料ユーザーは月額50トークンまで利用できます。トークンは毎月1日にリセットされます。
          </p>
        </div>

        <div>
          <h4 className={`font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            モデル別のトークンコスト
          </h4>
          <div className={`text-xs space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <div>• 高性能モデル（Claude Sonnet 4、GPT-4.1、O3）: 3-6トークン</div>
            <div>• 標準モデル（GPT-4o、DeepSeek）: 2-3トークン</div>
            <div>• 軽量モデル（GPT-4o-mini、Haiku）: 1トークン</div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { TokenUsageManager, DEFAULT_TOKEN_COSTS } from '@extension/storage';
import { TokenExplanation } from '../../../side-panel/src/components/TokenCounter';

interface TokenSettingsProps {
  isDarkMode?: boolean;
}

interface TokenUsage {
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
  daysUntilReset: number;
}

export function TokenSettings({ isDarkMode = false }: TokenSettingsProps) {
  const [usage, setUsage] = useState<TokenUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTokenCosts, setShowTokenCosts] = useState(false);

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
  }, []);

  const handleResetTokens = async () => {
    try {
      await TokenUsageManager.resetTokens();
      const usageSummary = await TokenUsageManager.getUsageSummary();
      setUsage(usageSummary);
    } catch (error) {
      console.error('Failed to reset tokens:', error);
    }
  };

  const getUsageColor = () => {
    if (!usage) return '';
    if (usage.percentage >= 90) return isDarkMode ? 'text-red-400' : 'text-red-600';
    if (usage.percentage >= 75) return isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
    return isDarkMode ? 'text-green-400' : 'text-green-600';
  };

  const getProgressColor = () => {
    if (!usage) return '';
    if (usage.percentage >= 90) return 'bg-red-500';
    if (usage.percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-left text-2xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          🎯 トークン使用量
        </h2>
        <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          AIエージェントの使用状況とトークン管理
        </p>
      </div>

      {loading ? (
        <div
          className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <div className={`flex items-center space-x-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
            <span>トークン使用量を読み込み中...</span>
          </div>
        </div>
      ) : usage ? (
        <div
          className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              現在の使用状況
            </h3>
            <span className={`text-lg font-mono ${getUsageColor()}`}>
              {usage.used}/{usage.limit}
            </span>
          </div>

          {/* Progress bar */}
          <div className={`w-full h-3 rounded-full mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div
              className={`h-full rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${Math.min(usage.percentage, 100)}%` }}></div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className={`block ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>残りトークン</span>
              <span className={`text-xl font-bold ${getUsageColor()}`}>{usage.remaining}</span>
            </div>
            <div>
              <span className={`block ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>リセットまで</span>
              <span className={`text-xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {usage.daysUntilReset}日
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-300">
            <button
              onClick={handleResetTokens}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}>
              🔄 トークンをリセット（テスト用）
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <p className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            トークン使用量を読み込めませんでした
          </p>
        </div>
      )}

      {/* Token Cost Information */}
      <div
        className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            モデル別トークンコスト
          </h3>
          <button
            onClick={() => setShowTokenCosts(!showTokenCosts)}
            className={`text-sm font-medium ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}>
            {showTokenCosts ? '非表示' : '表示'}
          </button>
        </div>

        {showTokenCosts && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(DEFAULT_TOKEN_COSTS)
                .sort(([, a], [, b]) => b - a)
                .map(([model, cost]) => (
                  <div
                    key={model}
                    className={`flex justify-between items-center p-2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
                    <span className={`text-sm font-mono ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {model}
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        cost >= 5
                          ? isDarkMode
                            ? 'text-red-400'
                            : 'text-red-600'
                          : cost >= 3
                            ? isDarkMode
                              ? 'text-yellow-400'
                              : 'text-yellow-600'
                            : isDarkMode
                              ? 'text-green-400'
                              : 'text-green-600'
                      }`}>
                      {cost} トークン
                    </span>
                  </div>
                ))}
            </div>
            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
              * 高性能モデルほど多くのトークンを消費します
            </div>
          </div>
        )}
      </div>

      {/* Token System Explanation */}
      <TokenExplanation isDarkMode={isDarkMode} />
    </div>
  );
}

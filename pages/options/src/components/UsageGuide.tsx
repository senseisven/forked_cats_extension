import React from 'react';

interface UsageGuideProps {
  isDarkMode: boolean;
}

const UsageGuide: React.FC<UsageGuideProps> = ({ isDarkMode }) => {
  const stepBoxClass = `p-6 rounded-lg border ${
    isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-white/80 border-[#d4c4a8]'
  } shadow-sm backdrop-blur-sm`;

  const stepNumberClass = `inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm ${
    isDarkMode ? 'bg-sky-600' : 'bg-[#8b7355]'
  }`;

  const exampleClass = `p-3 rounded-md font-mono text-sm ${
    isDarkMode
      ? 'bg-slate-700/70 text-gray-300 border border-slate-600'
      : 'bg-[#8b7355]/10 text-gray-700 border border-[#d4c4a8]'
  }`;

  const tipClass = `p-4 rounded-md border-l-4 ${
    isDarkMode ? 'bg-slate-800/30 border-sky-500 text-gray-300' : 'bg-blue-50/80 border-[#8b7355] text-gray-700'
  }`;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-left">
        <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          ネコノテ使用ガイド 🐱
        </h1>
        <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          簡単ステップでAIウェブ自動化をマスターしよう！
        </p>
      </div>

      {/* Step 1 */}
      <div className={stepBoxClass}>
        <div className="flex items-start space-x-4">
          <div className={stepNumberClass}>1</div>
          <div className="flex-1">
            <h3 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              拡張機能を開く
            </h3>
            <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              ブラウザのツールバーにあるネコノテアイコン🐱をクリックして、サイドパネルを開きます。
            </p>
          </div>
        </div>
      </div>

      {/* Step 2 */}
      <div className={stepBoxClass}>
        <div className="flex items-start space-x-4">
          <div className={stepNumberClass}>2</div>
          <div className="flex-1">
            <h3 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              タスクを入力する準備
            </h3>
            <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              チャット欄は下部にあります。自然な日本語でタスクを入力できます。AIモデルは自動設定済みなので、すぐに開始できます。
            </p>
          </div>
        </div>
      </div>

      {/* Step 3 */}
      <div className={stepBoxClass}>
        <div className="flex items-start space-x-4">
          <div className={stepNumberClass}>3</div>
          <div className="flex-1">
            <h3 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              タスクを入力
            </h3>
            <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              チャット欄に自然な日本語でタスクを入力します。以下のような例があります：
            </p>
            <div className={exampleClass}>
              <div className="space-y-2">
                <p>「YouTubeで猫の動画を検索して」</p>
                <p>「Amazonで本を探して」</p>
                <p>「ニュースサイトで今日の主要なニュースを教えて」</p>
                <p>「天気予報を調べて明日の天気を教えて」</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 4 */}
      <div className={stepBoxClass}>
        <div className="flex items-start space-x-4">
          <div className={stepNumberClass}>4</div>
          <div className="flex-1">
            <h3 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              AIエージェントが作業
            </h3>
            <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              3つのAIエージェントが協力してタスクを実行します：
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🐱</span>
                <div>
                  <strong className={isDarkMode ? 'text-gray-100' : 'text-gray-800'}>プランニャー：</strong>
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>タスクを計画します</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🧭</span>
                <div>
                  <strong className={isDarkMode ? 'text-gray-100' : 'text-gray-800'}>ニャビゲーター：</strong>
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>ウェブページを操作します</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">✓</span>
                <div>
                  <strong className={isDarkMode ? 'text-gray-100' : 'text-gray-800'}>バリデーニャー：</strong>
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>結果を検証します</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 5 */}
      <div className={stepBoxClass}>
        <div className="flex items-start space-x-4">
          <div className={stepNumberClass}>5</div>
          <div className="flex-1">
            <h3 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              結果を確認
            </h3>
            <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              AIエージェントがタスクを完了すると、結果がチャットに表示されます。必要に応じて追加の質問や修正を依頼できます。
            </p>
          </div>
        </div>
      </div>

      {/* Tips section */}
      <div className={tipClass}>
        <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>💡 便利なヒント</h4>
        <ul className={`space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <li>• 具体的で明確な指示を出すと、より良い結果が得られます</li>
          <li>• 複雑なタスクは段階的に分けて依頼すると効果的です</li>
          <li>• 停止ボタンで実行中のタスクをいつでも中止できます</li>
          <li>• 履歴機能で過去の会話を振り返ることができます</li>
        </ul>
      </div>

      {/* Support section */}
      <div className={tipClass}>
        <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>🆘 サポート</h4>
        <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
          問題が発生した場合は、設定画面から各種オプションを確認したり、新しいチャットを開始してください。
          エラーが続く場合は、ブラウザの再起動を試してみてください。
        </p>
      </div>
    </div>
  );
};

export default UsageGuide;

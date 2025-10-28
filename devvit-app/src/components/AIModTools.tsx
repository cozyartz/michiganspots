import { useState } from 'react';

interface AIModToolsProps {
  username: string;
  postId: string;
}

type Tool = 'content-analysis' | 'sentiment' | 'spam-detection' | null;

export const AIModTools = ({ username, postId }: AIModToolsProps) => {
  const [activeTool, setActiveTool] = useState<Tool>(null);
  const [analysisText, setAnalysisText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch('/api/mod-history?limit=50');
      if (!response.ok) {
        throw new Error('Failed to load history');
      }
      const data = await response.json();
      setHistory(data.history || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Failed to load history:', err);
      setHistory([]);
      setStats(null);
    } finally {
      setLoadingHistory(false);
    }
  };

  const analyzeContent = async (tool: Tool) => {
    if (!analysisText.trim()) {
      alert('Please enter some text to analyze');
      return;
    }

    setLoading(true);
    try {
      // Call Cloudflare AI via server endpoint
      const response = await fetch('/api/ai-mod/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: analysisText,
          tool,
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis request failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Analysis failed:', err);
      // Show error state
      setResult({
        tool: tool === 'content-analysis' ? 'Content Analysis' :
              tool === 'sentiment' ? 'Sentiment Analysis' : 'Spam Detection',
        error: 'Failed to analyze content. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (activeTool === null && !showHistory) {
    return (
      <div className="flex flex-col items-center justify-start min-h-screen p-4 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-6 space-y-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🤖 AI Moderator Tools</h1>
            <p className="text-gray-600">Moderator: {username}</p>
            <p className="text-sm text-orange-600 font-semibold mt-2">
              ⚠️ Moderators Only
            </p>
          </div>

          <button
            onClick={() => {
              setShowHistory(true);
              loadHistory();
            }}
            className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl transition-all"
          >
            📊 View Moderation History
          </button>

          <div className="space-y-3 pt-4">
            <button
              onClick={() => setActiveTool('content-analysis')}
              className="w-full text-left p-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              <div className="text-2xl font-bold mb-2">📊 Content Analysis</div>
              <p className="text-sm opacity-90">
                Analyze posts and comments for toxicity, profanity, and rule violations
              </p>
            </button>

            <button
              onClick={() => setActiveTool('sentiment')}
              className="w-full text-left p-6 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              <div className="text-2xl font-bold mb-2">💭 Sentiment Detection</div>
              <p className="text-sm opacity-90">
                Detect emotional tone and sentiment in community discussions
              </p>
            </button>

            <button
              onClick={() => setActiveTool('spam-detection')}
              className="w-full text-left p-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              <div className="text-2xl font-bold mb-2">🚫 Spam Detection</div>
              <p className="text-sm opacity-90">
                Identify spam, bot activity, and suspicious content patterns
              </p>
            </button>
          </div>

          <div className="text-center text-sm text-gray-500 pt-4 border-t">
            Powered by Cloudflare AI & Michigan Spots
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <button
            onClick={() => {
              setActiveTool(null);
              setResult(null);
              setAnalysisText('');
            }}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
          >
            ← Back
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">
              {activeTool === 'content-analysis' && '📊 Content Analysis'}
              {activeTool === 'sentiment' && '💭 Sentiment Detection'}
              {activeTool === 'spam-detection' && '🚫 Spam Detection'}
            </h2>
          </div>
          <div className="w-20"></div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Enter text to analyze:
          </label>
          <textarea
            value={analysisText}
            onChange={(e) => setAnalysisText(e.target.value)}
            placeholder="Paste the content you want to analyze..."
            className="w-full h-32 p-3 border-2 border-gray-300 rounded-lg resize-none focus:border-blue-500 focus:outline-none"
          />
        </div>

        <button
          onClick={() => analyzeContent(activeTool)}
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:bg-gray-400"
        >
          {loading ? 'Analyzing...' : 'Analyze Content'}
        </button>

        {result && (
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 space-y-3">
            <h3 className="text-lg font-bold text-gray-900">{result.tool} Results</h3>

            {result.toxicity !== undefined && (
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Toxicity</span>
                  <span className="text-sm font-semibold">{(result.toxicity * 100).toFixed(0)}%</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${result.toxicity * 100}%` }}
                  />
                </div>
              </div>
            )}

            {result.positive !== undefined && (
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Positive</span>
                  <span className="text-sm font-semibold">{(result.positive * 100).toFixed(0)}%</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${result.positive * 100}%` }}
                  />
                </div>
              </div>
            )}

            {result.spamScore !== undefined && (
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Spam Score</span>
                  <span className="text-sm font-semibold">{(result.spamScore * 100).toFixed(0)}%</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{ width: `${result.spamScore * 100}%` }}
                  />
                </div>
              </div>
            )}

            {result.recommendation && (
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-600">Recommendation:</p>
                <p className="text-lg font-bold text-blue-600">{result.recommendation}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // History Dashboard View
  if (showHistory) {
    return (
      <div className="flex flex-col items-center justify-start min-h-screen p-4 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900">
        <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowHistory(false)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">📊 Moderation History</h1>
            <button
              onClick={loadHistory}
              disabled={loadingHistory}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:bg-gray-400"
            >
              {loadingHistory ? 'Loading...' : '🔄 Refresh'}
            </button>
          </div>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Total Analyses</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalAnalyses}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Avg Toxicity</p>
                <p className="text-2xl font-bold text-red-600">{(stats.averageToxicity * 100).toFixed(1)}%</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Avg Spam</p>
                <p className="text-2xl font-bold text-orange-600">{(stats.averageSpamScore * 100).toFixed(1)}%</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.recommendations.Approve || 0}</p>
              </div>
            </div>
          )}

          {loadingHistory ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No moderation history yet. Analyze some content to get started!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.map((entry, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-gray-900">
                      {entry.tool === 'content-analysis' && '📊 Content Analysis'}
                      {entry.tool === 'sentiment' && '💭 Sentiment'}
                      {entry.tool === 'spam-detection' && '🚫 Spam Detection'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2 italic">"{entry.textPreview}..."</p>
                  <div className="flex flex-wrap gap-2">
                    {entry.result.toxicity !== undefined && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                        Toxicity: {(entry.result.toxicity * 100).toFixed(0)}%
                      </span>
                    )}
                    {entry.result.spamScore !== undefined && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                        Spam: {(entry.result.spamScore * 100).toFixed(0)}%
                      </span>
                    )}
                    {entry.result.recommendation && (
                      <span className={`text-xs px-2 py-1 rounded font-semibold ${
                        entry.result.recommendation === 'Approve'
                          ? 'bg-green-100 text-green-700'
                          : entry.result.recommendation === 'Remove'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {entry.result.recommendation}
                      </span>
                    )}
                    {entry.result.overall && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {entry.result.overall}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
};

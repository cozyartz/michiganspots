import { useState, useEffect } from 'react';
import type { GameScore } from '../shared/types/api';

interface LeaderboardProps {
  username: string;
  postId: string;
}

export const Leaderboard = ({ username, postId }: LeaderboardProps) => {
  const [topScores, setTopScores] = useState<GameScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'word-search' | 'trivia'>('all');

  useEffect(() => {
    loadLeaderboard();
  }, [filter]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      // Fetch leaderboard from server
      const res = await fetch(`/api/leaderboard/${filter}`);
      if (res.ok) {
        const data = await res.json();
        setTopScores(data.topScores || []);
      } else {
        // Fallback to mock data if API fails
        const mockScores: GameScore[] = [
          { username: 'Player1', score: 850, game: 'word-search', timestamp: Date.now() - 3600000 },
          { username: 'Player2', score: 720, game: 'trivia', timestamp: Date.now() - 7200000 },
          { username: 'Player3', score: 650, game: 'word-search', timestamp: Date.now() - 10800000 },
          { username: 'Player4', score: 580, game: 'trivia', timestamp: Date.now() - 14400000 },
          { username: 'Player5', score: 520, game: 'word-search', timestamp: Date.now() - 18000000 },
        ];

        const filtered =
          filter === 'all' ? mockScores : mockScores.filter((s) => s.game === filter);

        setTopScores(filtered.sort((a, b) => b.score - a.score).slice(0, 10));
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return `#${rank + 1}`;
  };

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-orange-900 mb-2">🏆 Leaderboard</h1>
          <p className="text-gray-600">Top players in Michigan Arcade</p>
        </div>

        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'all'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Games
          </button>
          <button
            onClick={() => setFilter('word-search')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'word-search'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Word Search
          </button>
          <button
            onClick={() => setFilter('trivia')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'trivia'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Trivia
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading leaderboard...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {topScores.map((score, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                  score.username === username
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold w-12">{getRankEmoji(index)}</span>
                  <div>
                    <p className="font-bold text-gray-900">
                      {score.username}
                      {score.username === username && (
                        <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">
                          You
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      {score.game === 'word-search' ? '🔍 Word Search' : '❓ Trivia'} •{' '}
                      {getTimeAgo(score.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">{score.score}</p>
                  <p className="text-xs text-gray-500">points</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {topScores.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-600">No scores yet. Be the first to play!</p>
          </div>
        )}

        <div className="text-center text-sm text-gray-500 pt-4 border-t">
          Powered by Michigan Spots
        </div>
      </div>
    </div>
  );
};

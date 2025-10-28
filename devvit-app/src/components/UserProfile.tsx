import { useState, useEffect } from 'react';
import { MICHIGAN_CHALLENGES, type MichiganChallenge } from '../shared/types/challenges';

interface UserProfileProps {
  username: string;
  onBack?: () => void;
}

interface UserStats {
  totalScore: number;
  gamesPlayed: number;
  challengesCompleted: number;
  totalChallenges: number;
}

interface GameStats {
  bestScore: number;
  totalScore: number;
  timesPlayed: number;
}

interface RecentActivity {
  game: string;
  score: number;
  timestamp: number;
}

interface ChallengeProgress {
  challengeId: string;
  completedLandmarks: string[];
  completedAt?: number;
  totalScore: number;
}

interface UserProfile {
  username: string;
  stats: UserStats;
  gameStats: Record<string, GameStats>;
  rankings: Record<string, number>;
  challengeProgress: ChallengeProgress[];
  recentActivity: RecentActivity[];
}

export const UserProfile = ({ username, onBack }: UserProfileProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'challenges' | 'activity'>('stats');

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/profile/${username}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          setProfile(data.profile);
        } else {
          setError(data.message || 'Failed to load profile');
        }
      } else {
        setError('Failed to load profile');
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const getGameName = (gameId: string): string => {
    const gameNames: Record<string, string> = {
      'photo-hunt': 'Photo Hunt',
      'trivia': 'Trivia',
      'word-search': 'Word Search',
      'memory-match': 'Memory Match',
    };
    return gameNames[gameId] || gameId;
  };

  const getGameIcon = (gameId: string): string => {
    const gameIcons: Record<string, string> = {
      'photo-hunt': '📷',
      'trivia': '🧠',
      'word-search': '🔤',
      'memory-match': '🎴',
    };
    return gameIcons[gameId] || '🎮';
  };

  const getRankEmoji = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getChallengeById = (id: string): MichiganChallenge | undefined => {
    return MICHIGAN_CHALLENGES.find((c) => c.id === id);
  };

  const calculateChallengeProgress = (
    challenge: MichiganChallenge,
    completed: string[]
  ): number => {
    return Math.min(100, (completed.length / challenge.requiredCount) * 100);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-xl text-gray-700">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 text-center space-y-4">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900">Profile Not Found</h2>
          <p className="text-gray-600">{error || 'Unable to load user profile'}</p>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="text-center border-b pb-4">
          <div className="flex items-center justify-between mb-2">
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                ← Back
              </button>
            )}
            <div className="flex-1" />
          </div>
          <div className="text-6xl mb-3">👤</div>
          <h1 className="text-3xl font-bold text-purple-900 mb-2">u/{profile.username}</h1>
          <p className="text-gray-600">Michigan Arcade Player</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl p-4 text-white text-center">
            <div className="text-3xl font-bold">{profile.stats.totalScore}</div>
            <div className="text-sm opacity-90">Total Points</div>
          </div>
          <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-xl p-4 text-white text-center">
            <div className="text-3xl font-bold">{profile.stats.gamesPlayed}</div>
            <div className="text-sm opacity-90">Games Played</div>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl p-4 text-white text-center">
            <div className="text-3xl font-bold">
              {profile.stats.challengesCompleted}/{profile.stats.totalChallenges}
            </div>
            <div className="text-sm opacity-90">Challenges</div>
          </div>
          <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl p-4 text-white text-center">
            <div className="text-3xl font-bold">
              {Math.round(
                (profile.stats.challengesCompleted / profile.stats.totalChallenges) * 100
              )}
              %
            </div>
            <div className="text-sm opacity-90">Completion</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 justify-center border-b">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'stats'
                ? 'text-purple-600 border-b-4 border-purple-600'
                : 'text-gray-600 hover:text-purple-600'
            }`}
          >
            📊 Game Stats
          </button>
          <button
            onClick={() => setActiveTab('challenges')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'challenges'
                ? 'text-purple-600 border-b-4 border-purple-600'
                : 'text-gray-600 hover:text-purple-600'
            }`}
          >
            🏆 Challenges
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'activity'
                ? 'text-purple-600 border-b-4 border-purple-600'
                : 'text-gray-600 hover:text-purple-600'
            }`}
          >
            📈 Recent Activity
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {/* Game Stats Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Game Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(profile.gameStats).map(([gameId, stats]) => (
                  <div
                    key={gameId}
                    className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-200"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-4xl">{getGameIcon(gameId)}</div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {getGameName(gameId)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Rank: {getRankEmoji(profile.rankings[gameId] || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Best Score:</span>
                        <span className="font-bold text-orange-600">{stats.bestScore}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Score:</span>
                        <span className="font-bold text-green-600">{stats.totalScore}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Times Played:</span>
                        <span className="font-bold text-blue-600">{stats.timesPlayed}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Challenges Tab */}
          {activeTab === 'challenges' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Challenge Progress</h2>
              {profile.challengeProgress.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">🗺️</div>
                  <p className="text-xl">No challenges started yet</p>
                  <p className="text-sm">Start exploring Michigan to unlock challenges!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {profile.challengeProgress.map((progress) => {
                    const challenge = getChallengeById(progress.challengeId);
                    if (!challenge) return null;

                    const progressPercent = calculateChallengeProgress(
                      challenge,
                      progress.completedLandmarks
                    );
                    const isCompleted = !!progress.completedAt;

                    return (
                      <div
                        key={challenge.id}
                        className={`rounded-xl p-4 border-2 ${
                          isCompleted
                            ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-400'
                            : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="text-4xl">{challenge.icon}</div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">
                                {challenge.name}
                              </h3>
                              <p className="text-sm text-gray-600">{challenge.description}</p>
                            </div>
                          </div>
                          {isCompleted && (
                            <div className="text-3xl">✅</div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Progress:</span>
                            <span className="font-bold text-purple-600">
                              {progress.completedLandmarks.length}/{challenge.requiredCount} landmarks
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                isCompleted ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Bonus Points:</span>
                            <span className="font-bold text-orange-600">
                              +{challenge.bonusPoints}
                            </span>
                          </div>
                          {isCompleted && progress.completedAt && (
                            <div className="text-sm text-green-600 font-semibold">
                              Completed {getTimeAgo(progress.completedAt)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Recent Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
              {profile.recentActivity.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">🎮</div>
                  <p className="text-xl">No recent activity</p>
                  <p className="text-sm">Start playing games to see your activity here!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {profile.recentActivity.map((activity, index) => (
                    <div
                      key={`${activity.game}-${activity.timestamp}-${index}`}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-200 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{getGameIcon(activity.game)}</div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {getGameName(activity.game)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {getTimeAgo(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-orange-600">
                          {activity.score}
                        </div>
                        <div className="text-xs text-gray-600">points</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

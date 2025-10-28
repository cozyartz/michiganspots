import { useState, useEffect } from 'react';
import { MICHIGAN_CHALLENGES, type MichiganChallenge } from '../shared/types/challenges';

interface ChallengeBrowserProps {
  username: string;
  onBack?: () => void;
}

interface UserChallengeProgress {
  challengeId: string;
  completedLandmarks: string[];
  completedAt?: number;
  totalScore: number;
}

export const ChallengeBrowser = ({ username, onBack }: ChallengeBrowserProps) => {
  const [userProgress, setUserProgress] = useState<UserChallengeProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [expandedChallenge, setExpandedChallenge] = useState<string | null>(null);

  useEffect(() => {
    loadUserProgress();
  }, [username]);

  const loadUserProgress = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/challenges/progress/${username}`);
      if (res.ok) {
        const data = await res.json();
        setUserProgress(data.progress || []);
      }
    } catch (err) {
      console.error('Failed to load challenge progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const getChallengeProgress = (challengeId: string): UserChallengeProgress | undefined => {
    return userProgress.find((p) => p.challengeId === challengeId);
  };

  const calculateProgress = (challenge: MichiganChallenge): number => {
    const progress = getChallengeProgress(challenge.id);
    if (!progress) return 0;
    return Math.min(100, (progress.completedLandmarks.length / challenge.requiredCount) * 100);
  };

  const isCompleted = (challengeId: string): boolean => {
    const progress = getChallengeProgress(challengeId);
    return !!progress?.completedAt;
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'hard':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      'great-lakes': '🌊',
      'natural-wonders': '⛰️',
      'urban-landmarks': '🏙️',
      'historical-sites': '🏛️',
      'seasonal': '🍂',
      'hidden-gems': '💎',
    };
    return icons[category] || '📍';
  };

  const filteredChallenges = MICHIGAN_CHALLENGES.filter((challenge) => {
    const categoryMatch = categoryFilter === 'all' || challenge.category === categoryFilter;
    const difficultyMatch = difficultyFilter === 'all' || challenge.difficulty === difficultyFilter;
    return categoryMatch && difficultyMatch;
  });

  const completedCount = MICHIGAN_CHALLENGES.filter((c) => isCompleted(c.id)).length;
  const totalProgress = (completedCount / MICHIGAN_CHALLENGES.length) * 100;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-teal-500 via-blue-500 to-indigo-500">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="animate-spin text-6xl mb-4">🗺️</div>
          <p className="text-xl text-gray-700">Loading challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 bg-gradient-to-br from-teal-500 via-blue-500 to-indigo-500">
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
          <div className="text-6xl mb-3">🗺️</div>
          <h1 className="text-3xl font-bold text-teal-900 mb-2">Michigan Challenges</h1>
          <p className="text-gray-600">Explore the Great Lakes State</p>
        </div>

        {/* Progress Summary */}
        <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-6 border-2 border-teal-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Your Progress</h3>
              <p className="text-sm text-gray-600">
                {completedCount} of {MICHIGAN_CHALLENGES.length} challenges completed
              </p>
            </div>
            <div className="text-4xl font-bold text-teal-600">{Math.round(totalProgress)}%</div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-blue-500 transition-all"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Category</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  categoryFilter === 'all'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              {['great-lakes', 'natural-wonders', 'urban-landmarks', 'historical-sites', 'seasonal', 'hidden-gems'].map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                      categoryFilter === cat
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {getCategoryIcon(cat)}{' '}
                    {cat
                      .split('-')
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ')}
                  </button>
                )
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Difficulty</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDifficultyFilter('all')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  difficultyFilter === 'all'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              {['easy', 'medium', 'hard'].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficultyFilter(diff)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    difficultyFilter === diff
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Challenge Cards */}
        <div className="space-y-4">
          {filteredChallenges.map((challenge) => {
            const progress = calculateProgress(challenge);
            const completed = isCompleted(challenge.id);
            const userChallengeProgress = getChallengeProgress(challenge.id);
            const isExpanded = expandedChallenge === challenge.id;

            return (
              <div
                key={challenge.id}
                className={`rounded-xl p-5 border-2 transition-all ${
                  completed
                    ? 'bg-gradient-to-br from-green-50 to-teal-50 border-green-400'
                    : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 hover:border-teal-400'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-5xl">{challenge.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{challenge.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{challenge.description}</p>
                      <div className="flex gap-2 flex-wrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded border ${getDifficultyColor(
                            challenge.difficulty
                          )}`}
                        >
                          {challenge.difficulty.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 text-xs font-semibold rounded border bg-orange-100 text-orange-700 border-orange-300">
                          +{challenge.bonusPoints} points
                        </span>
                        <span className="px-2 py-1 text-xs font-semibold rounded border bg-blue-100 text-blue-700 border-blue-300">
                          {challenge.requiredCount} landmarks
                        </span>
                      </div>
                    </div>
                  </div>
                  {completed && <div className="text-4xl">✅</div>}
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress:</span>
                    <span className="font-bold text-teal-600">
                      {userChallengeProgress?.completedLandmarks.length || 0}/{challenge.requiredCount}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        completed ? 'bg-green-500' : 'bg-teal-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Expand/Collapse Button */}
                <button
                  onClick={() => setExpandedChallenge(isExpanded ? null : challenge.id)}
                  className="w-full py-2 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                >
                  {isExpanded ? '▼ Hide Details' : '▶ Show Landmarks'}
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-300 space-y-2">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Required Landmarks ({challenge.requiredCount} of {challenge.landmarks.length}):
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {challenge.landmarks.map((landmark) => {
                        const isCompleted = userChallengeProgress?.completedLandmarks.includes(
                          landmark
                        );
                        return (
                          <div
                            key={landmark}
                            className={`p-2 rounded-lg text-sm flex items-center gap-2 ${
                              isCompleted
                                ? 'bg-green-100 text-green-800'
                                : 'bg-white text-gray-700'
                            }`}
                          >
                            <span>{isCompleted ? '✅' : '📍'}</span>
                            <span>{landmark}</span>
                          </div>
                        );
                      })}
                    </div>
                    {completed && userChallengeProgress?.completedAt && (
                      <p className="text-sm text-green-600 font-semibold mt-3">
                        Completed on {new Date(userChallengeProgress.completedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredChallenges.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl">No challenges match your filters</p>
            <p className="text-sm">Try adjusting your category or difficulty filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

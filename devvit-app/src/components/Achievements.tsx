import { useState, useEffect } from 'react';
import { getTierColor, getTierName, type Achievement, type AchievementTier } from '../shared/types/achievements';

interface AchievementsProps {
  username: string;
  onBack?: () => void;
}

interface AchievementWithProgress extends Achievement {
  unlocked: boolean;
  unlockedAt?: number;
}

export const Achievements = ({ username, onBack }: AchievementsProps) => {
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [prestigePoints, setPrestigePoints] = useState(0);
  const [unlockedCount, setUnlockedCount] = useState(0);

  useEffect(() => {
    loadAchievements();
  }, [username]);

  const loadAchievements = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/achievements/${username}`);
      if (res.ok) {
        const data = await res.json();
        setAchievements(data.achievements || []);
        setUnlockedCount(data.unlockedCount || 0);
        setPrestigePoints(data.prestigePoints || 0);
      }
    } catch (err) {
      console.error('Failed to load achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAchievements = achievements.filter((achievement) => {
    const categoryMatch = filter === 'all' || achievement.category === filter;
    const tierMatch = tierFilter === 'all' || achievement.tier === tierFilter;
    return categoryMatch && tierMatch;
  });

  const unlockedFiltered = filteredAchievements.filter((a) => a.unlocked).length;
  const completionPercent = achievements.length > 0 ? (unlockedCount / achievements.length) * 100 : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="animate-spin text-6xl mb-4">🏆</div>
          <p className="text-xl text-gray-700">Loading achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500">
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
          <div className="text-6xl mb-3">🏆</div>
          <h1 className="text-3xl font-bold text-purple-900 mb-2">Achievements</h1>
          <p className="text-gray-600">Unlock badges and earn prestige points</p>
        </div>

        {/* Progress Summary */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{unlockedCount}</div>
              <div className="text-sm text-gray-600">Unlocked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-600">{Math.round(completionPercent)}%</div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{prestigePoints}</div>
              <div className="text-sm text-gray-600">Prestige</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Category</p>
            <div className="flex gap-2 flex-wrap">
              {['all', 'games', 'challenges', 'exploration', 'mastery', 'social'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    filter === cat
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Tier</p>
            <div className="flex gap-2 flex-wrap">
              {['all', 'bronze', 'silver', 'gold', 'platinum', 'legendary'].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setTierFilter(tier)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    tierFilter === tier
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Achievement Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAchievements.map((achievement) => {
            const tierColor = getTierColor(achievement.tier as AchievementTier);

            return (
              <div
                key={achievement.id}
                className={`rounded-xl p-5 border-2 transition-all ${
                  achievement.unlocked
                    ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-400'
                    : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 opacity-60'
                }`}
              >
                <div className="flex items-start gap-4 mb-3">
                  <div
                    className={`text-5xl ${achievement.unlocked ? '' : 'grayscale opacity-40'}`}
                  >
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {achievement.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                    <div className="flex gap-2 flex-wrap">
                      <span
                        className="px-2 py-1 text-xs font-semibold rounded border"
                        style={{
                          backgroundColor: `${tierColor}20`,
                          borderColor: `${tierColor}60`,
                          color: tierColor,
                        }}
                      >
                        {getTierName(achievement.tier as AchievementTier)}
                      </span>
                      <span className="px-2 py-1 text-xs font-semibold rounded border bg-purple-100 text-purple-700 border-purple-300">
                        +{achievement.points} prestige
                      </span>
                    </div>
                  </div>
                  {achievement.unlocked && <div className="text-3xl">✅</div>}
                </div>

                {achievement.unlocked && achievement.unlockedAt && (
                  <p className="text-xs text-green-600 font-semibold text-right">
                    Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl">No achievements match your filters</p>
            <p className="text-sm">Try adjusting your category or tier filters</p>
          </div>
        )}

        {/* Stats Footer */}
        <div className="border-t pt-4 text-center text-sm text-gray-600">
          Showing {unlockedFiltered} unlocked of {filteredAchievements.length} achievements
        </div>
      </div>
    </div>
  );
};

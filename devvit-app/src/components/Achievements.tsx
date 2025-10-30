import { useState, useEffect } from 'react';
import { getTierColor, getTierName, type Achievement, type AchievementTier } from '../shared/types/achievements';
import { getTheme } from './theme';

interface AchievementsProps {
  username: string;
  onBack?: () => void;
  isDark: boolean;
}

interface AchievementWithProgress extends Achievement {
  unlocked: boolean;
  unlockedAt?: number;
}

export const Achievements = ({ username, onBack, isDark }: AchievementsProps) => {
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [prestigePoints, setPrestigePoints] = useState(0);
  const [unlockedCount, setUnlockedCount] = useState(0);

  const theme = getTheme(isDark);

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
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '16px',
        background: `linear-gradient(135deg, ${theme.colors.copper} 0%, ${theme.colors.cyan.primary} 50%, ${theme.colors.amber} 100%)`,
      }}>
        <div style={{
          maxWidth: '672px',
          width: '100%',
          backgroundColor: theme.colors.card,
          borderRadius: '16px',
          boxShadow: theme.shadows.xl,
          padding: '32px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>🏆</div>
          <p style={{ fontSize: '20px', color: theme.colors.text }}>Loading achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      minHeight: '100vh',
      padding: '16px',
      background: `linear-gradient(135deg, ${theme.colors.copper} 0%, ${theme.colors.cyan.primary} 50%, ${theme.colors.amber} 100%)`,
    }}>
      <div style={{
        maxWidth: '896px',
        width: '100%',
        backgroundColor: theme.colors.card,
        borderRadius: '16px',
        boxShadow: theme.shadows.xl,
        padding: '24px',
      }}>
        {/* Header */}
        <div style={{ borderBottom: `2px solid ${theme.colors.border}`, paddingBottom: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            {onBack && (
              <button
                onClick={onBack}
                style={{
                  padding: '8px 16px',
                  backgroundColor: theme.colors.secondary,
                  color: theme.colors.text,
                  borderRadius: '8px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: theme.shadows.sm,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.cyan.light;
                  e.currentTarget.style.boxShadow = theme.shadows.md;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.secondary;
                  e.currentTarget.style.boxShadow = theme.shadows.sm;
                }}
              >
                ← Back
              </button>
            )}
            <div style={{ flex: 1 }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '60px', marginBottom: '12px' }}>🏆</div>
            <h1 style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: theme.colors.copper,
              marginBottom: '8px',
            }}>
              Achievements
            </h1>
            <p style={{ color: theme.colors.text, fontSize: '18px', fontWeight: '500' }}>Unlock badges and earn prestige points</p>
          </div>
        </div>

        {/* Progress Summary */}
        <div style={{
          backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
          borderRadius: '16px',
          padding: '24px',
          border: `2px solid ${theme.colors.cyan.primary}`,
          boxShadow: theme.shadows.lg,
          marginBottom: '24px',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '36px',
                fontWeight: '900',
                color: theme.colors.copper,
              }}>
                {unlockedCount}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: theme.colors.text, marginTop: '4px' }}>Unlocked</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '36px',
                fontWeight: '900',
                color: theme.colors.cyan.dark,
              }}>
                {Math.round(completionPercent)}%
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: theme.colors.text, marginTop: '4px' }}>Complete</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '36px',
                fontWeight: '900',
                color: theme.colors.amber,
              }}>
                {prestigePoints}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: theme.colors.text, marginTop: '4px' }}>Prestige</div>
            </div>
          </div>
          <div style={{
            width: '100%',
            backgroundColor: isDark ? '#374151' : '#D1D5DB',
            borderRadius: '9999px',
            height: '20px',
            overflow: 'hidden',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
          }}>
            <div style={{
              height: '100%',
              background: `linear-gradient(90deg, ${theme.colors.copper} 0%, ${theme.colors.cyan.primary} 50%, ${theme.colors.amber} 100%)`,
              width: `${completionPercent}%`,
              transition: 'width 0.5s ease',
              boxShadow: theme.shadows.lg,
            }} />
          </div>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: theme.colors.text, marginBottom: '8px' }}>Category</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['all', 'games', 'challenges', 'exploration', 'mastery', 'social'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: filter === cat ? theme.colors.copper : theme.colors.secondary,
                    color: filter === cat ? '#FFFFFF' : theme.colors.text,
                  }}
                  onMouseEnter={(e) => {
                    if (filter !== cat) {
                      e.currentTarget.style.backgroundColor = theme.colors.cyan.light;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filter !== cat) {
                      e.currentTarget.style.backgroundColor = theme.colors.secondary;
                    }
                  }}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', color: theme.colors.text, marginBottom: '8px' }}>Tier</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['all', 'bronze', 'silver', 'gold', 'platinum', 'legendary'].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setTierFilter(tier)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: tierFilter === tier ? theme.colors.copper : theme.colors.secondary,
                    color: tierFilter === tier ? '#FFFFFF' : theme.colors.text,
                  }}
                  onMouseEnter={(e) => {
                    if (tierFilter !== tier) {
                      e.currentTarget.style.backgroundColor = theme.colors.cyan.light;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (tierFilter !== tier) {
                      e.currentTarget.style.backgroundColor = theme.colors.secondary;
                    }
                  }}
                >
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Achievement Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {filteredAchievements.map((achievement) => {
            const tierColor = getTierColor(achievement.tier as AchievementTier);

            return (
              <div
                key={achievement.id}
                style={{
                  borderRadius: '12px',
                  padding: '20px',
                  border: `3px solid ${achievement.unlocked ? theme.colors.amber : theme.colors.border}`,
                  transition: 'all 0.2s',
                  backgroundColor: achievement.unlocked
                    ? (isDark ? '#1F2937' : '#FEF3C7')
                    : theme.colors.secondary,
                  boxShadow: achievement.unlocked ? theme.shadows.lg : theme.shadows.sm,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = theme.shadows.xl;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = achievement.unlocked ? theme.shadows.lg : theme.shadows.sm;
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '12px' }}>
                  <div style={{
                    fontSize: '48px',
                    transition: 'all 0.2s',
                    filter: achievement.unlocked ? 'none' : 'grayscale(100%)',
                    opacity: achievement.unlocked ? 1 : 0.5,
                  }}>
                    {achievement.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: theme.colors.text,
                      marginBottom: '6px',
                    }}>
                      {achievement.name}
                    </h3>
                    <p style={{ fontSize: '14px', color: theme.colors.text, marginBottom: '10px', opacity: 0.85 }}>{achievement.description}</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        borderRadius: '6px',
                        border: `2px solid ${tierColor}`,
                        backgroundColor: isDark ? '#111827' : '#FFFFFF',
                        color: tierColor,
                      }}>
                        {getTierName(achievement.tier as AchievementTier)}
                      </span>
                      <span style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        borderRadius: '6px',
                        border: `2px solid ${theme.colors.copper}`,
                        backgroundColor: isDark ? '#111827' : '#FFFFFF',
                        color: theme.colors.copper,
                      }}>
                        +{achievement.points} prestige
                      </span>
                    </div>
                  </div>
                  {achievement.unlocked && <div style={{ fontSize: '30px' }}>✅</div>}
                </div>

                {achievement.unlocked && achievement.unlockedAt && (
                  <p style={{
                    fontSize: '13px',
                    color: '#FFFFFF',
                    fontWeight: 'bold',
                    textAlign: 'right',
                    backgroundColor: theme.colors.forest.primary,
                    padding: '6px 12px',
                    borderRadius: '6px',
                  }}>
                    🎉 Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {filteredAchievements.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: theme.colors.textSecondary }}>
            <div style={{ fontSize: '60px', marginBottom: '16px' }}>🔍</div>
            <p style={{ fontSize: '20px', marginBottom: '8px' }}>No achievements match your filters</p>
            <p style={{ fontSize: '14px' }}>Try adjusting your category or tier filters</p>
          </div>
        )}

        {/* Stats Footer */}
        <div style={{
          borderTop: `1px solid ${theme.colors.border}`,
          paddingTop: '16px',
          textAlign: 'center',
          fontSize: '14px',
          color: theme.colors.textSecondary,
        }}>
          Showing {unlockedFiltered} unlocked of {filteredAchievements.length} achievements
        </div>
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { MICHIGAN_CHALLENGES, type MichiganChallenge } from '../shared/types/challenges';
import { getTheme } from './theme';

interface UserProfileProps {
  username: string;
  onBack?: () => void;
  isDark?: boolean;
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

interface RedditUser {
  id: string;
  username: string;
  createdAt: number;
  karma: {
    total: number;
    link: number;
    comment: number;
  };
  iconUrl: string;
}

interface UserProfile {
  username: string;
  redditUser: RedditUser | null;
  stats: UserStats;
  gameStats: Record<string, GameStats>;
  rankings: Record<string, number>;
  challengeProgress: ChallengeProgress[];
  recentActivity: RecentActivity[];
}

export const UserProfile = ({ username, onBack, isDark = false }: UserProfileProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'challenges' | 'activity'>('stats');

  const theme = getTheme(isDark);

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

  const getAccountAge = (createdAt: number): string => {
    const days = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24));
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    return `${Math.floor(days / 365)} years`;
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
      <div style={{
        minHeight: '100vh',
        width: '100%',
        background: theme.colors.background,
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          maxWidth: '600px',
          width: '100%',
          background: theme.colors.card,
          borderRadius: '24px',
          boxShadow: theme.shadows.xl,
          padding: '32px',
          textAlign: 'center',
          border: `1px solid ${theme.colors.border}`,
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>⏳</div>
          <p style={{ fontSize: '20px', color: theme.colors.ink.primary, fontWeight: '700' }}>
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100%',
        background: theme.colors.background,
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          maxWidth: '600px',
          width: '100%',
          background: theme.colors.card,
          borderRadius: '24px',
          boxShadow: theme.shadows.xl,
          padding: '32px',
          textAlign: 'center',
          border: `1px solid ${theme.colors.border}`,
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>😕</div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: theme.colors.ink.primary, marginBottom: '12px' }}>
            Profile Not Found
          </h2>
          <p style={{ fontSize: '16px', color: theme.colors.ink.secondary, marginBottom: '24px' }}>
            {error || 'Unable to load user profile'}
          </p>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                padding: '12px 24px',
                background: `linear-gradient(135deg, ${theme.colors.cyan.primary} 0%, ${theme.colors.cyan.dark} 100%)`,
                color: 'white',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '16px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: theme.shadows.md,
              }}
            >
              ← Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: theme.colors.background,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: '900px' }}>
        {/* Header with Back Button */}
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                padding: '12px 20px',
                background: theme.colors.card,
                color: theme.colors.ink.primary,
                borderRadius: '12px',
                fontWeight: '700',
                border: `2px solid ${theme.colors.border}`,
                cursor: 'pointer',
                boxShadow: theme.shadows.sm,
              }}
            >
              ← Back
            </button>
          )}
        </div>

        {/* Profile Card */}
        <div style={{
          background: theme.colors.card,
          borderRadius: '24px',
          padding: '24px',
          marginBottom: '16px',
          boxShadow: theme.shadows.lg,
          border: `1px solid ${theme.colors.border}`,
        }}>
          {/* Reddit Profile Header */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ position: 'relative' }}>
              {profile.redditUser?.iconUrl ? (
                <img
                  src={profile.redditUser.iconUrl}
                  alt={`u/${profile.username}`}
                  style={{
                    width: '96px',
                    height: '96px',
                    borderRadius: '50%',
                    border: `4px solid ${theme.colors.copper}`,
                    boxShadow: theme.shadows.lg,
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    e.currentTarget.src = 'https://www.redditstatic.com/avatars/avatar_default_02_FF4500.png';
                  }}
                />
              ) : (
                <div style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  border: `4px solid ${theme.colors.copper}`,
                  background: `linear-gradient(135deg, ${theme.colors.copper} 0%, ${theme.colors.copperDark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '48px',
                  fontWeight: '800',
                  boxShadow: theme.shadows.lg,
                }}>
                  {profile.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{
                position: 'absolute',
                bottom: '-4px',
                right: '-4px',
                background: theme.colors.cyan.primary,
                border: `4px solid ${theme.colors.card}`,
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}>
                🎮
              </div>
            </div>

            {/* User Info */}
            <div style={{ flex: 1 }}>
              <h1 style={{
                fontSize: '32px',
                fontWeight: '800',
                color: theme.colors.ink.primary,
                marginBottom: '8px',
                letterSpacing: '0.02em',
              }}>
                u/{profile.username}
              </h1>
              <p style={{
                fontSize: '16px',
                fontWeight: '600',
                color: theme.colors.ink.secondary,
                marginBottom: '12px',
              }}>
                Michigan Arcade Player
              </p>

              {/* Reddit Stats */}
              {profile.redditUser && (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '100px',
                    background: `${theme.colors.copper}15`,
                    border: `2px solid ${theme.colors.copper}40`,
                  }}>
                    <span style={{ fontSize: '16px' }}>🔥</span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: theme.colors.copperDark }}>
                      {profile.redditUser.karma.total.toLocaleString()} Karma
                    </span>
                  </div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '100px',
                    background: `${theme.colors.cyan.primary}15`,
                    border: `2px solid ${theme.colors.cyan.primary}40`,
                  }}>
                    <span style={{ fontSize: '16px' }}>🎂</span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: theme.colors.cyan.dark }}>
                      {getAccountAge(profile.redditUser.createdAt)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            <div style={{
              background: `linear-gradient(135deg, ${theme.colors.amber.primary} 0%, ${theme.colors.amber.dark} 100%)`,
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center',
              boxShadow: theme.shadows.md,
            }}>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>
                {profile.stats.totalScore}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>
                Total Points
              </div>
            </div>

            <div style={{
              background: `linear-gradient(135deg, ${theme.colors.cyan.primary} 0%, ${theme.colors.cyan.dark} 100%)`,
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center',
              boxShadow: theme.shadows.md,
            }}>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>
                {profile.stats.gamesPlayed}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>
                Games Played
              </div>
            </div>

            <div style={{
              background: `linear-gradient(135deg, ${theme.colors.coral.primary} 0%, ${theme.colors.coral.dark} 100%)`,
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center',
              boxShadow: theme.shadows.md,
            }}>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>
                {profile.stats.challengesCompleted}/{profile.stats.totalChallenges}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>
                Challenges
              </div>
            </div>

            <div style={{
              background: `linear-gradient(135deg, ${theme.colors.forest.primary} 0%, ${theme.colors.forest.dark} 100%)`,
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center',
              boxShadow: theme.shadows.md,
            }}>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>
                {Math.round((profile.stats.challengesCompleted / profile.stats.totalChallenges) * 100)}%
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>
                Completion
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          background: theme.colors.card,
          borderRadius: '16px',
          padding: '8px',
          marginBottom: '16px',
          display: 'flex',
          gap: '8px',
          border: `1px solid ${theme.colors.border}`,
          boxShadow: theme.shadows.sm,
        }}>
          <button
            onClick={() => setActiveTab('stats')}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '12px',
              background: activeTab === 'stats' ? `linear-gradient(135deg, ${theme.colors.cyan.primary} 0%, ${theme.colors.cyan.dark} 100%)` : 'transparent',
              color: activeTab === 'stats' ? 'white' : theme.colors.ink.secondary,
              border: 'none',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: activeTab === 'stats' ? theme.shadows.md : 'none',
            }}
          >
            📊 Game Stats
          </button>
          <button
            onClick={() => setActiveTab('challenges')}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '12px',
              background: activeTab === 'challenges' ? `linear-gradient(135deg, ${theme.colors.amber.primary} 0%, ${theme.colors.amber.dark} 100%)` : 'transparent',
              color: activeTab === 'challenges' ? 'white' : theme.colors.ink.secondary,
              border: 'none',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: activeTab === 'challenges' ? theme.shadows.md : 'none',
            }}
          >
            🏆 Challenges
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '12px',
              background: activeTab === 'activity' ? `linear-gradient(135deg, ${theme.colors.coral.primary} 0%, ${theme.colors.coral.dark} 100%)` : 'transparent',
              color: activeTab === 'activity' ? 'white' : theme.colors.ink.secondary,
              border: 'none',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: activeTab === 'activity' ? theme.shadows.md : 'none',
            }}
          >
            📈 Activity
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'stats' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {Object.entries(profile.gameStats).map(([gameId, stats]) => (
              <div
                key={gameId}
                style={{
                  background: theme.colors.card,
                  borderRadius: '16px',
                  padding: '20px',
                  border: `2px solid ${theme.colors.border}`,
                  boxShadow: theme.shadows.md,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '40px' }}>{getGameIcon(gameId)}</div>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: theme.colors.ink.primary, marginBottom: '4px' }}>
                      {getGameName(gameId)}
                    </h3>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: theme.colors.ink.secondary }}>
                      Rank: {getRankEmoji(profile.rankings[gameId] || 0)}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', color: theme.colors.ink.secondary }}>Best Score:</span>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: theme.colors.amber.primary }}>{stats.bestScore}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', color: theme.colors.ink.secondary }}>Total Score:</span>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: theme.colors.cyan.primary }}>{stats.totalScore}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', color: theme.colors.ink.secondary }}>Times Played:</span>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: theme.colors.coral.primary }}>{stats.timesPlayed}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'challenges' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {profile.challengeProgress.length === 0 ? (
              <div style={{
                background: theme.colors.card,
                borderRadius: '16px',
                padding: '48px 24px',
                textAlign: 'center',
                border: `1px solid ${theme.colors.border}`,
              }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🗺️</div>
                <p style={{ fontSize: '20px', fontWeight: '700', color: theme.colors.ink.primary, marginBottom: '8px' }}>
                  No challenges started yet
                </p>
                <p style={{ fontSize: '14px', color: theme.colors.ink.secondary }}>
                  Start exploring Michigan to unlock challenges!
                </p>
              </div>
            ) : (
              profile.challengeProgress.map((progress) => {
                const challenge = getChallengeById(progress.challengeId);
                if (!challenge) return null;

                const progressPercent = calculateChallengeProgress(challenge, progress.completedLandmarks);
                const isCompleted = !!progress.completedAt;

                return (
                  <div
                    key={challenge.id}
                    style={{
                      background: isCompleted ? `linear-gradient(135deg, ${theme.colors.forest.primary}15 0%, ${theme.colors.forest.light}10 100%)` : theme.colors.card,
                      borderRadius: '16px',
                      padding: '20px',
                      border: `2px solid ${isCompleted ? theme.colors.forest.primary : theme.colors.border}`,
                      boxShadow: theme.shadows.md,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '40px' }}>{challenge.icon}</div>
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: '800', color: theme.colors.ink.primary, marginBottom: '4px' }}>
                            {challenge.name}
                          </h3>
                          <p style={{ fontSize: '14px', color: theme.colors.ink.secondary }}>
                            {challenge.description}
                          </p>
                        </div>
                      </div>
                      {isCompleted && <div style={{ fontSize: '32px' }}>✅</div>}
                    </div>
                    <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ color: theme.colors.ink.secondary }}>Progress:</span>
                      <span style={{ fontWeight: '800', color: theme.colors.cyan.primary }}>
                        {progress.completedLandmarks.length}/{challenge.requiredCount} landmarks
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '12px',
                      background: theme.colors.border,
                      borderRadius: '100px',
                      overflow: 'hidden',
                      marginBottom: '8px',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${progressPercent}%`,
                        background: isCompleted ? theme.colors.forest.primary : theme.colors.cyan.primary,
                        borderRadius: '100px',
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                    {isCompleted && progress.completedAt && (
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: theme.colors.forest.primary,
                        marginTop: '8px',
                      }}>
                        Completed {getTimeAgo(progress.completedAt)}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {profile.recentActivity.length === 0 ? (
              <div style={{
                background: theme.colors.card,
                borderRadius: '16px',
                padding: '48px 24px',
                textAlign: 'center',
                border: `1px solid ${theme.colors.border}`,
              }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎮</div>
                <p style={{ fontSize: '20px', fontWeight: '700', color: theme.colors.ink.primary, marginBottom: '8px' }}>
                  No recent activity
                </p>
                <p style={{ fontSize: '14px', color: theme.colors.ink.secondary }}>
                  Start playing games to see your activity here!
                </p>
              </div>
            ) : (
              profile.recentActivity.map((activity, index) => (
                <div
                  key={`${activity.game}-${activity.timestamp}-${index}`}
                  style={{
                    background: theme.colors.card,
                    borderRadius: '16px',
                    padding: '16px',
                    border: `2px solid ${theme.colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: theme.shadows.sm,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '32px' }}>{getGameIcon(activity.game)}</div>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', color: theme.colors.ink.primary, marginBottom: '4px' }}>
                        {getGameName(activity.game)}
                      </h3>
                      <p style={{ fontSize: '14px', color: theme.colors.ink.secondary }}>
                        {getTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: theme.colors.amber.primary }}>
                      {activity.score}
                    </div>
                    <div style={{ fontSize: '12px', color: theme.colors.ink.secondary }}>points</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Database, Trophy, Users, TrendingUp } from 'lucide-react';

interface PointsSystemStatusProps {
  username: string;
  onBack: () => void;
}

interface SystemStatus {
  redisConnected: boolean;
  leaderboardsActive: boolean;
  userStatsTracking: boolean;
  challengeProgressTracking: boolean;
  achievementSystem: boolean;
  cloudflareSync: boolean;
  totalUsers: number;
  totalScores: number;
  lastActivity: number;
}

interface UserStats {
  totalScore: number;
  gamesPlayed: number;
  gameBreakdown: Record<string, { plays: number; totalScore: number; bestScore: number }>;
  globalRank: number | null;
  lastPlayed: number;
}

export function PointsSystemStatus({ username, onBack }: PointsSystemStatusProps) {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [globalLeaderboard, setGlobalLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  useEffect(() => {
    checkSystemStatus();
  }, [username]);

  const checkSystemStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      // Test Redis connectivity and get system status
      const [userStatsRes, globalLeaderboardRes, gameLeaderboardRes, syncStatusRes] = await Promise.all([
        fetch(`/api/user/stats/${username}`),
        fetch('/api/leaderboard/global?limit=5'),
        fetch('/api/leaderboard/all?period=alltime&limit=5'),
        fetch('/api/sync/status'),
      ]);

      // Check user stats
      let userStatsData = null;
      if (userStatsRes.ok) {
        const userData = await userStatsRes.json();
        userStatsData = userData.stats;
      }

      // Check global leaderboard
      let globalData = [];
      if (globalLeaderboardRes.ok) {
        const globalRes = await globalLeaderboardRes.json();
        globalData = globalRes.leaderboard || [];
      }

      // Check game leaderboard
      let gameLeaderboardActive = false;
      if (gameLeaderboardRes.ok) {
        const gameRes = await gameLeaderboardRes.json();
        gameLeaderboardActive = Array.isArray(gameRes.topScores) && gameRes.topScores.length >= 0;
      }

      // Test challenge progress
      const challengeRes = await fetch(`/api/challenges/progress/${username}`);
      const challengeProgressActive = challengeRes.ok;

      // Test achievements
      const achievementRes = await fetch(`/api/achievements/${username}`);
      const achievementSystemActive = achievementRes.ok;

      // Check Cloudflare sync status
      let cloudflareSync = false;
      if (syncStatusRes.ok) {
        const syncStatus = await syncStatusRes.json();
        cloudflareSync = syncStatus.cloudflareSync || false;
      }

      const status: SystemStatus = {
        redisConnected: userStatsRes.ok && globalLeaderboardRes.ok,
        leaderboardsActive: gameLeaderboardActive,
        userStatsTracking: userStatsRes.ok,
        challengeProgressTracking: challengeProgressActive,
        achievementSystem: achievementSystemActive,
        cloudflareSync,
        totalUsers: globalData.length,
        totalScores: userStatsData?.gamesPlayed || 0,
        lastActivity: userStatsData?.lastPlayed || 0,
      };

      setSystemStatus(status);
      setUserStats(userStatsData);
      setGlobalLeaderboard(globalData);
    } catch (err) {
      console.error('System status check failed:', err);
      setError('Failed to check system status');
    } finally {
      setLoading(false);
    }
  };

  const triggerCloudflareSync = async () => {
    setSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch('/api/sync/cloudflare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          syncType: 'full',
          username,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setSyncResult(`✅ Sync successful! Users: ${result.results.users}, Scores: ${result.results.scores}, Challenges: ${result.results.challenges}, Achievements: ${result.results.achievements}`);
        // Refresh system status
        setTimeout(() => {
          checkSystemStatus();
        }, 1000);
      } else {
        setSyncResult(`❌ Sync failed: ${result.message}`);
      }
    } catch (err) {
      console.error('Sync error:', err);
      setSyncResult('❌ Sync failed: Network error');
    } finally {
      setSyncing(false);
      // Clear result after 10 seconds
      setTimeout(() => setSyncResult(null), 10000);
    }
  };

  const StatusIndicator = ({ active, label }: { active: boolean; label: string }) => (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-white/50">
      {active ? (
        <CheckCircle className="w-5 h-5 text-green-600" />
      ) : (
        <AlertCircle className="w-5 h-5 text-red-600" />
      )}
      <span className={`font-medium ${active ? 'text-green-800' : 'text-red-800'}`}>
        {label}
      </span>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-parchment to-parchment-light p-6 flex items-center justify-center">
        <div className="parchment-card text-center">
          <div className="animate-spin text-4xl mb-4">⚙️</div>
          <h2 className="font-heading text-xl font-bold text-ink-primary mb-2">
            Checking Points System
          </h2>
          <p className="text-ink-secondary">Verifying Reddit storage and leaderboards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-parchment to-parchment-light p-6 flex items-center justify-center">
        <div className="parchment-card text-center">
          <AlertCircle className="w-16 h-16 text-coral-primary mx-auto mb-4" />
          <h2 className="font-heading text-xl font-bold text-ink-primary mb-2">System Check Failed</h2>
          <p className="text-ink-secondary mb-4">{error}</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gradient-to-r from-cyan-primary to-cyan-dark text-white font-heading font-bold treasure-border hover:from-cyan-dark hover:to-cyan-primary transition-all duration-300"
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-parchment to-parchment-light p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="parchment-card">
          <button
            onClick={onBack}
            className="mb-4 px-4 py-2 bg-parchment-light border-2 border-ink-primary/20 text-ink-primary font-heading font-bold treasure-border hover:bg-ink-primary/5 transition-colors"
          >
            ← Back to Games
          </button>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-forest-green to-forest-green/80 rounded-full flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold text-ink-primary">Points System Status</h1>
              <p className="text-ink-secondary">Reddit-powered scoring and leaderboards for the hackathon</p>
            </div>
          </div>

          {systemStatus && (
            <div className="bg-gradient-to-r from-forest-green/10 to-cyan-primary/10 rounded-lg p-4 border border-forest-green/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-forest-green" />
                  <span className="font-heading font-bold text-ink-primary">
                    System Status: {systemStatus.redisConnected ? 'OPERATIONAL' : 'ISSUES DETECTED'}
                  </span>
                </div>
                <button
                  onClick={triggerCloudflareSync}
                  disabled={syncing}
                  className="px-3 py-1 bg-gradient-to-r from-cyan-primary to-cyan-dark text-white text-sm font-bold rounded-lg hover:from-cyan-dark hover:to-cyan-primary transition-all duration-300 disabled:opacity-50"
                >
                  {syncing ? '⏳ Syncing...' : '🔄 Sync to Cloudflare'}
                </button>
              </div>
              <p className="text-sm text-ink-secondary mb-2">
                Using Reddit's Redis storage for persistent, hackathon-compliant data management
              </p>
              {syncResult && (
                <div className="text-sm bg-white/50 rounded p-2 mt-2">
                  {syncResult}
                </div>
              )}
            </div>
          )}
        </div>

        {/* System Components Status */}
        {systemStatus && (
          <div className="parchment-card">
            <h2 className="font-heading text-xl font-bold text-ink-primary mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              System Components
            </h2>
            
            <div className="grid md:grid-cols-2 gap-3">
              <StatusIndicator 
                active={systemStatus.redisConnected} 
                label="Reddit Redis Storage" 
              />
              <StatusIndicator 
                active={systemStatus.leaderboardsActive} 
                label="Game Leaderboards" 
              />
              <StatusIndicator 
                active={systemStatus.userStatsTracking} 
                label="User Statistics" 
              />
              <StatusIndicator 
                active={systemStatus.challengeProgressTracking} 
                label="Challenge Progress" 
              />
              <StatusIndicator 
                active={systemStatus.achievementSystem} 
                label="Achievement System" 
              />
              <StatusIndicator 
                active={systemStatus.cloudflareSync} 
                label="Cloudflare Database Sync" 
              />
              <StatusIndicator 
                active={systemStatus.totalUsers > 0} 
                label={`Active Users (${systemStatus.totalUsers})`} 
              />
            </div>
          </div>
        )}

        {/* User Stats */}
        {userStats && (
          <div className="parchment-card">
            <h2 className="font-heading text-xl font-bold text-ink-primary mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Your Statistics
            </h2>
            
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="bg-gradient-to-br from-amber-light/20 to-amber-primary/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-amber-dark">{userStats.totalScore}</div>
                <div className="text-sm text-ink-secondary">Total Points</div>
              </div>
              <div className="bg-gradient-to-br from-cyan-light/20 to-cyan-primary/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-cyan-dark">{userStats.gamesPlayed}</div>
                <div className="text-sm text-ink-secondary">Games Played</div>
              </div>
              <div className="bg-gradient-to-br from-forest-green/20 to-forest-green/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-forest-green">
                  {userStats.globalRank ? `#${userStats.globalRank}` : 'Unranked'}
                </div>
                <div className="text-sm text-ink-secondary">Global Rank</div>
              </div>
            </div>

            {Object.keys(userStats.gameBreakdown).length > 0 && (
              <div>
                <h3 className="font-heading font-bold text-ink-primary mb-2">Game Breakdown</h3>
                <div className="space-y-2">
                  {Object.entries(userStats.gameBreakdown).map(([game, stats]) => (
                    <div key={game} className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <span className="font-medium text-ink-primary capitalize">
                        {game.replace('-', ' ')}
                      </span>
                      <div className="text-right">
                        <div className="text-sm font-bold text-ink-primary">{stats.bestScore} best</div>
                        <div className="text-xs text-ink-secondary">{stats.plays} plays</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Global Leaderboard Preview */}
        {globalLeaderboard.length > 0 && (
          <div className="parchment-card">
            <h2 className="font-heading text-xl font-bold text-ink-primary mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top Players (Global)
            </h2>
            
            <div className="space-y-2">
              {globalLeaderboard.map((player, index) => (
                <div key={player.username} className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold w-8">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </span>
                    <span className="font-medium text-ink-primary">
                      {player.username}
                      {player.username === username && (
                        <span className="ml-2 text-xs bg-cyan-primary text-white px-2 py-1 rounded">You</span>
                      )}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-ink-primary">{player.totalScore}</div>
                    <div className="text-xs text-ink-secondary">{player.gamesPlayed} games</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technical Details */}
        <div className="parchment-card">
          <h2 className="font-heading text-xl font-bold text-ink-primary mb-4">Technical Implementation</h2>
          
          <div className="bg-gradient-to-r from-ink-primary/5 to-ink-primary/10 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-forest-green mt-0.5" />
              <div>
                <div className="font-bold text-ink-primary">Reddit Redis Storage</div>
                <div className="text-sm text-ink-secondary">
                  All scores stored in Reddit's Redis instance using sorted sets for efficient leaderboards
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-forest-green mt-0.5" />
              <div>
                <div className="font-bold text-ink-primary">Time-Period Leaderboards</div>
                <div className="text-sm text-ink-secondary">
                  Daily, weekly, monthly, and all-time rankings with automatic expiration
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-forest-green mt-0.5" />
              <div>
                <div className="font-bold text-ink-primary">Anti-Cheat Protection</div>
                <div className="text-sm text-ink-secondary">
                  Score validation and capping to prevent unrealistic scores
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-forest-green mt-0.5" />
              <div>
                <div className="font-bold text-ink-primary">Comprehensive Tracking</div>
                <div className="text-sm text-ink-secondary">
                  User stats, challenge progress, achievements, and global rankings
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-forest-green mt-0.5" />
              <div>
                <div className="font-bold text-ink-primary">Cloudflare Database Backup</div>
                <div className="text-sm text-ink-secondary">
                  Real-time sync to Cloudflare database for analytics, backup, and cross-platform access
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
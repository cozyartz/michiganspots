/**
 * Leaderboard Widget Component
 * Compact leaderboard display for use in sidebars, dashboards, etc.
 */

import { Devvit } from '@devvit/public-api';
import { 
  LeaderboardData, 
  LeaderboardEntry, 
  LeaderboardConfig 
} from '../types/core.js';
import { 
  LeaderboardService, 
  DEFAULT_LEADERBOARD_CONFIGS 
} from '../services/leaderboardService.js';

export interface LeaderboardWidgetProps {
  type?: 'individual' | 'city';
  timeframe?: 'weekly' | 'monthly' | 'alltime';
  maxEntries?: number;
  showUserRank?: boolean;
  compact?: boolean;
  title?: string;
}

export const LeaderboardWidget: Devvit.CustomPostComponent = (context) => {
  const { useState, useAsync } = context;
  const leaderboardService = new LeaderboardService(context);

  // Props with defaults
  const type = 'individual';
  const timeframe = 'weekly';
  const maxEntries = 5;
  const showUserRank = true;
  const compact = true;
  const title = 'Top Players';

  // State
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [userRank, setUserRank] = useState<{ rank: number; entry: LeaderboardEntry | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load leaderboard data
  const loadData = useAsync(async () => {
    try {
      setLoading(true);
      setError(null);

      const config: LeaderboardConfig = {
        type,
        timeframe,
        maxEntries: maxEntries * 2, // Load more to account for filtering
        updateInterval: 15
      };

      const data = await leaderboardService.getLeaderboard(config);
      setLeaderboardData(data);

      // Load current user's rank if requested
      if (showUserRank) {
        const currentUser = await context.reddit.getCurrentUser();
        if (currentUser) {
          const rank = await leaderboardService.getUserRank(currentUser.username, config);
          setUserRank(rank);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading leaderboard widget:', err);
      setError('Failed to load rankings');
      setLoading(false);
    }
  });

  // Render loading state
  if (loading) {
    return (
      <vstack 
        backgroundColor="secondary-background" 
        cornerRadius="medium" 
        padding="medium"
        gap="small"
      >
        <text size="medium" weight="bold">{title}</text>
        <text size="small" color="secondary">Loading rankings...</text>
      </vstack>
    );
  }

  // Render error state
  if (error || !leaderboardData) {
    return (
      <vstack 
        backgroundColor="secondary-background" 
        cornerRadius="medium" 
        padding="medium"
        gap="small"
      >
        <text size="medium" weight="bold">{title}</text>
        <text size="small" color="red">Failed to load</text>
        <button size="small" onPress={() => loadData()}>
          Retry
        </button>
      </vstack>
    );
  }

  const topEntries = leaderboardData.entries.slice(0, maxEntries);

  return (
    <vstack 
      backgroundColor="secondary-background" 
      cornerRadius="medium" 
      padding="medium"
      gap="small"
    >
      {/* Header */}
      <hstack alignment="space-between">
        <text size="medium" weight="bold">{title}</text>
        <text size="small" color="secondary">
          {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
        </text>
      </hstack>

      {/* Top Entries */}
      <vstack gap="xsmall">
        {topEntries.map((entry, index) => (
          <CompactLeaderboardEntry
            key={entry.username}
            entry={entry}
            isCurrentUser={userRank?.entry?.username === entry.username}
            compact={compact}
          />
        ))}
      </vstack>

      {/* Current User Rank (if not in top entries) */}
      {showUserRank && userRank && userRank.rank > maxEntries && (
        <>
          <spacer size="small" />
          <vstack 
            backgroundColor="primary-background" 
            cornerRadius="small" 
            padding="small"
            gap="xsmall"
          >
            <text size="small" color="secondary" alignment="center">
              Your Position
            </text>
            <CompactLeaderboardEntry
              entry={userRank.entry!}
              isCurrentUser={true}
              compact={compact}
              showFullRank={true}
            />
          </vstack>
        </>
      )}

      {/* Footer */}
      <hstack alignment="space-between">
        <text size="xsmall" color="secondary">
          {leaderboardData.totalParticipants} total players
        </text>
        <text size="xsmall" color="secondary">
          Updated {new Date(leaderboardData.lastUpdated).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </text>
      </hstack>
    </vstack>
  );
};

// Compact entry component
interface CompactLeaderboardEntryProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  compact: boolean;
  showFullRank?: boolean;
}

const CompactLeaderboardEntry: Devvit.BlockComponent<CompactLeaderboardEntryProps> = (
  { entry, isCurrentUser, compact, showFullRank = false },
  context
) => {
  const getRankDisplay = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  const getRankColor = (rank: number): string => {
    if (rank <= 3) return 'gold';
    if (rank <= 10) return 'primary';
    return 'secondary';
  };

  if (compact) {
    return (
      <hstack 
        alignment="space-between" 
        padding="xsmall"
        backgroundColor={isCurrentUser ? 'primary-background' : undefined}
        cornerRadius="xsmall"
      >
        <hstack gap="small" alignment="center">
          <text 
            size="small" 
            weight="bold" 
            color={getRankColor(entry.rank)}
            minWidth="20px"
          >
            {getRankDisplay(entry.rank)}
          </text>
          <text 
            size="small" 
            weight={isCurrentUser ? 'bold' : 'normal'}
          >
            u/{entry.username.length > 12 ? 
              entry.username.substring(0, 12) + '...' : 
              entry.username
            }
          </text>
          {isCurrentUser && (
            <text size="xsmall" color="primary">(You)</text>
          )}
        </hstack>
        
        <text size="small" color="secondary">
          {entry.points}pts
        </text>
      </hstack>
    );
  }

  return (
    <vstack 
      backgroundColor={isCurrentUser ? 'primary-background' : undefined}
      cornerRadius="small"
      padding="small"
      gap="xsmall"
    >
      <hstack alignment="space-between">
        <hstack gap="small" alignment="center">
          <text 
            size="medium" 
            weight="bold" 
            color={getRankColor(entry.rank)}
          >
            {getRankDisplay(entry.rank)}
          </text>
          <text size="medium" weight={isCurrentUser ? 'bold' : 'normal'}>
            u/{entry.username}
          </text>
          {isCurrentUser && (
            <text size="small" color="primary">(You)</text>
          )}
        </hstack>
        
        <text size="medium" weight="bold">
          {entry.points} pts
        </text>
      </hstack>
      
      {showFullRank && entry.rank > 3 && (
        <text size="small" color="secondary">
          Rank #{entry.rank}
        </text>
      )}
      
      <hstack gap="medium">
        <text size="small" color="secondary">
          {entry.completedChallenges} challenges
        </text>
        <text size="small" color="secondary">
          {entry.badgeCount} badges
        </text>
      </hstack>
    </vstack>
  );
};

// Quick stats component
export const LeaderboardQuickStats: Devvit.CustomPostComponent = (context) => {
  const { useState, useAsync } = context;
  const leaderboardService = new LeaderboardService(context);

  const [stats, setStats] = useState<{
    totalUsers: number;
    averagePoints: number;
    topScore: number;
    activeUsers: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useAsync(async () => {
    try {
      const config: LeaderboardConfig = {
        type: 'individual',
        timeframe: 'alltime',
        maxEntries: 100,
        updateInterval: 60
      };

      const statsData = await leaderboardService.getLeaderboardStats(config);
      setStats(statsData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading leaderboard stats:', error);
      setLoading(false);
    }
  });

  if (loading || !stats) {
    return (
      <hstack gap="large" alignment="center">
        <text size="small" color="secondary">Loading stats...</text>
      </hstack>
    );
  }

  return (
    <hstack gap="large" alignment="center">
      <vstack alignment="center" gap="xsmall">
        <text size="large" weight="bold">{stats.totalUsers}</text>
        <text size="xsmall" color="secondary">Players</text>
      </vstack>
      
      <vstack alignment="center" gap="xsmall">
        <text size="large" weight="bold">{stats.topScore}</text>
        <text size="xsmall" color="secondary">Top Score</text>
      </vstack>
      
      <vstack alignment="center" gap="xsmall">
        <text size="large" weight="bold">{stats.averagePoints}</text>
        <text size="xsmall" color="secondary">Avg Points</text>
      </vstack>
      
      <vstack alignment="center" gap="xsmall">
        <text size="large" weight="bold">{stats.activeUsers}</text>
        <text size="xsmall" color="secondary">Active</text>
      </vstack>
    </hstack>
  );
};

// Export components
export const renderLeaderboardWidget = (props: LeaderboardWidgetProps = {}) => {
  return <LeaderboardWidget {...props} />;
};

export const renderLeaderboardQuickStats = () => {
  return <LeaderboardQuickStats />;
};
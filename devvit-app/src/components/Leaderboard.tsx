/**
 * Leaderboard Component
 * Displays leaderboards with tabbed interface, user rank highlighting, and pagination
 */

import { Devvit } from '@devvit/public-api';
import { 
  LeaderboardData, 
  LeaderboardEntry, 
  LeaderboardConfig,
  RankingCriteria 
} from '../types/core.js';
import { 
  LeaderboardService, 
  DEFAULT_LEADERBOARD_CONFIGS,
  RANKING_PRESETS 
} from '../services/leaderboardService.js';

export interface LeaderboardProps {
  currentUser?: string;
  initialConfig?: LeaderboardConfig;
  showUserRank?: boolean;
  maxDisplayEntries?: number;
}

export interface LeaderboardState {
  activeTab: string;
  currentPage: number;
  searchQuery: string;
  leaderboardData: Record<string, LeaderboardData>;
  userRank: { rank: number; entry: LeaderboardEntry | null } | null;
  loading: boolean;
  error: string | null;
}

export const LeaderboardComponent: Devvit.CustomPostComponent = (context) => {
  const { useState, useAsync } = context;
  const leaderboardService = new LeaderboardService(context);

  // Component state
  const [activeTab, setActiveTab] = useState('weekly');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [leaderboardData, setLeaderboardData] = useState<Record<string, LeaderboardData>>({});
  const [userRank, setUserRank] = useState<{ rank: number; entry: LeaderboardEntry | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ENTRIES_PER_PAGE = 20;

  // Load leaderboard data
  const loadLeaderboards = useAsync(async () => {
    try {
      setLoading(true);
      setError(null);

      const configs = DEFAULT_LEADERBOARD_CONFIGS.filter(config => config.type === 'individual');
      const leaderboards: Record<string, LeaderboardData> = {};

      // Load all leaderboard types
      for (const config of configs) {
        const data = await leaderboardService.getLeaderboard(config);
        leaderboards[config.timeframe] = data;
      }

      setLeaderboardData(leaderboards);

      // Load current user's rank if available
      const currentUser = await context.reddit.getCurrentUser();
      if (currentUser) {
        const activeConfig = configs.find(c => c.timeframe === activeTab);
        if (activeConfig) {
          const rank = await leaderboardService.getUserRank(currentUser.username, activeConfig);
          setUserRank(rank);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading leaderboards:', err);
      setError('Failed to load leaderboards');
      setLoading(false);
    }
  });

  // Handle tab change
  const handleTabChange = async (newTab: string) => {
    setActiveTab(newTab);
    setCurrentPage(1);
    setSearchQuery('');

    // Load user rank for new tab
    const currentUser = await context.reddit.getCurrentUser();
    if (currentUser) {
      const config = DEFAULT_LEADERBOARD_CONFIGS.find(
        c => c.timeframe === newTab && c.type === 'individual'
      );
      if (config) {
        try {
          const rank = await leaderboardService.getUserRank(currentUser.username, config);
          setUserRank(rank);
        } catch (err) {
          console.error('Error loading user rank:', err);
        }
      }
    }
  };

  // Filter entries based on search
  const getFilteredEntries = (entries: LeaderboardEntry[]): LeaderboardEntry[] => {
    if (!searchQuery.trim()) return entries;
    
    return entries.filter(entry => 
      entry.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Get paginated entries
  const getPaginatedEntries = (entries: LeaderboardEntry[]): LeaderboardEntry[] => {
    const startIndex = (currentPage - 1) * ENTRIES_PER_PAGE;
    const endIndex = startIndex + ENTRIES_PER_PAGE;
    return entries.slice(startIndex, endIndex);
  };

  // Render loading state
  if (loading) {
    return (
      <vstack alignment="center middle" padding="large">
        <text size="large">Loading leaderboards...</text>
        <spacer size="medium" />
        <text size="medium" color="secondary">
          Calculating rankings and user positions
        </text>
      </vstack>
    );
  }

  // Render error state
  if (error) {
    return (
      <vstack alignment="center middle" padding="large">
        <text size="large" color="red">⚠️ Error</text>
        <spacer size="small" />
        <text size="medium">{error}</text>
        <spacer size="medium" />
        <button onPress={() => loadLeaderboards()}>
          Retry
        </button>
      </vstack>
    );
  }

  const currentLeaderboard = leaderboardData[activeTab];
  if (!currentLeaderboard) {
    return (
      <vstack alignment="center middle" padding="large">
        <text size="large">No leaderboard data available</text>
      </vstack>
    );
  }

  const filteredEntries = getFilteredEntries(currentLeaderboard.entries);
  const paginatedEntries = getPaginatedEntries(filteredEntries);
  const totalPages = Math.ceil(filteredEntries.length / ENTRIES_PER_PAGE);

  return (
    <vstack padding="medium" gap="medium">
      {/* Header */}
      <vstack gap="small">
        <text size="xxlarge" weight="bold" alignment="center">
          🏆 Leaderboard
        </text>
        <text size="medium" color="secondary" alignment="center">
          Compete with fellow treasure hunters!
        </text>
      </vstack>

      {/* Tab Navigation */}
      <hstack gap="small" alignment="center">
        {['weekly', 'monthly', 'alltime'].map(tab => (
          <button
            key={tab}
            appearance={activeTab === tab ? 'primary' : 'secondary'}
            size="small"
            onPress={() => handleTabChange(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </hstack>

      {/* Search Bar */}
      <hstack gap="small" alignment="center">
        <text size="medium">🔍</text>
        <textField
          placeholder="Search users..."
          value={searchQuery}
          onTextChange={(value) => {
            setSearchQuery(value);
            setCurrentPage(1);
          }}
        />
      </hstack>

      {/* User's Current Rank (if not in top entries) */}
      {userRank && userRank.rank > ENTRIES_PER_PAGE && (
        <vstack 
          backgroundColor="secondary" 
          cornerRadius="medium" 
          padding="medium"
          gap="small"
        >
          <text size="medium" weight="bold" alignment="center">
            Your Current Position
          </text>
          <LeaderboardEntryRow 
            entry={userRank.entry!} 
            isCurrentUser={true}
            showFullRank={true}
          />
        </vstack>
      )}

      {/* Leaderboard Stats */}
      <hstack gap="large" alignment="center">
        <vstack alignment="center" gap="xsmall">
          <text size="small" color="secondary">Total Players</text>
          <text size="medium" weight="bold">{currentLeaderboard.totalParticipants}</text>
        </vstack>
        <vstack alignment="center" gap="xsmall">
          <text size="small" color="secondary">Top Score</text>
          <text size="medium" weight="bold">
            {currentLeaderboard.entries[0]?.points || 0} pts
          </text>
        </vstack>
        <vstack alignment="center" gap="xsmall">
          <text size="small" color="secondary">Last Updated</text>
          <text size="small" color="secondary">
            {new Date(currentLeaderboard.lastUpdated).toLocaleTimeString()}
          </text>
        </vstack>
      </hstack>

      {/* Leaderboard Entries */}
      <vstack gap="small">
        {paginatedEntries.length === 0 ? (
          <vstack alignment="center middle" padding="large">
            <text size="medium" color="secondary">
              {searchQuery ? 'No users found matching your search' : 'No entries available'}
            </text>
          </vstack>
        ) : (
          paginatedEntries.map((entry, index) => (
            <LeaderboardEntryRow
              key={entry.username}
              entry={entry}
              isCurrentUser={userRank?.entry?.username === entry.username}
              showFullRank={false}
            />
          ))
        )}
      </vstack>

      {/* Pagination */}
      {totalPages > 1 && (
        <hstack gap="small" alignment="center">
          <button
            size="small"
            disabled={currentPage === 1}
            onPress={() => setCurrentPage(currentPage - 1)}
          >
            ← Previous
          </button>
          
          <text size="small" color="secondary">
            Page {currentPage} of {totalPages}
          </text>
          
          <button
            size="small"
            disabled={currentPage === totalPages}
            onPress={() => setCurrentPage(currentPage + 1)}
          >
            Next →
          </button>
        </hstack>
      )}

      {/* Refresh Button */}
      <hstack alignment="center">
        <button
          size="small"
          appearance="secondary"
          onPress={() => loadLeaderboards()}
        >
          🔄 Refresh Rankings
        </button>
      </hstack>
    </vstack>
  );
};

// Individual leaderboard entry component
interface LeaderboardEntryRowProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  showFullRank: boolean;
}

const LeaderboardEntryRow: Devvit.BlockComponent<LeaderboardEntryRowProps> = (
  { entry, isCurrentUser, showFullRank },
  context
) => {
  const getRankDisplay = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number): string => {
    if (rank <= 3) return 'gold';
    if (rank <= 10) return 'primary';
    return 'secondary';
  };

  return (
    <hstack
      backgroundColor={isCurrentUser ? 'primary-background' : 'secondary-background'}
      cornerRadius="small"
      padding="medium"
      gap="medium"
      alignment="center middle"
    >
      {/* Rank */}
      <vstack alignment="center" minWidth="60px">
        <text 
          size="large" 
          weight="bold" 
          color={getRankColor(entry.rank)}
        >
          {getRankDisplay(entry.rank)}
        </text>
        {showFullRank && entry.rank > 3 && (
          <text size="small" color="secondary">
            Rank {entry.rank}
          </text>
        )}
      </vstack>

      {/* User Info */}
      <vstack grow>
        <hstack gap="small" alignment="center">
          <text size="medium" weight="bold">
            u/{entry.username}
          </text>
          {isCurrentUser && (
            <text size="small" color="primary">(You)</text>
          )}
        </hstack>
        
        <hstack gap="large">
          <text size="small" color="secondary">
            {entry.points} points
          </text>
          <text size="small" color="secondary">
            {entry.completedChallenges} challenges
          </text>
          <text size="small" color="secondary">
            {entry.badgeCount} badges
          </text>
        </hstack>
      </vstack>

      {/* Achievement Indicator */}
      {entry.rank <= 3 && (
        <vstack alignment="center">
          <text size="small" color="gold">
            Top 3
          </text>
        </vstack>
      )}
    </hstack>
  );
};

// Export the main component and utilities
export const renderLeaderboard = (props: LeaderboardProps = {}) => {
  return <LeaderboardComponent {...props} />;
};
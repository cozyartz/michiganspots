/**
 * User Profile Stats Component
 * A compact component showing key user statistics that can be embedded in other views
 */

import { Devvit } from '@devvit/public-api';
import { UserProfile } from '../types/core.js';
import { PointsService } from '../services/pointsService.js';

interface UserProfileStatsProps {
  userProfile: UserProfile;
  compact?: boolean;
  showBadges?: boolean;
}

export const UserProfileStats = (props: UserProfileStatsProps) => {
  const { userProfile, compact = false, showBadges = true } = props;
  const pointsService = new PointsService({} as any); // Context would be passed in real implementation

  const nextMilestone = pointsService.getPointsToNextMilestone(userProfile.totalPoints);
  const recentBadges = userProfile.badges.slice(-3); // Show last 3 badges

  if (compact) {
    return (
      <hstack gap="medium" alignment="center" padding="small">
        <vstack gap="none">
          <text size="small" weight="bold">{userProfile.redditUsername}</text>
          <text size="small" color="neutral-content-weak">{userProfile.totalPoints} pts</text>
        </vstack>
        
        {showBadges && userProfile.badges.length > 0 && (
          <hstack gap="small">
            <text size="small">🏆</text>
            <text size="small">{userProfile.badges.length}</text>
          </hstack>
        )}
        
        <text size="small" color="neutral-content-weak">
          {userProfile.completedChallenges.length} completed
        </text>
      </hstack>
    );
  }

  return (
    <vstack gap="small" padding="medium" backgroundColor="#f8f9fa" cornerRadius="small">
      {/* User Header */}
      <hstack alignment="space-between">
        <text size="large" weight="bold">{userProfile.redditUsername}</text>
        <text size="medium" color="blue" weight="bold">{userProfile.totalPoints} pts</text>
      </hstack>

      {/* Progress to Next Milestone */}
      {nextMilestone && (
        <vstack gap="small">
          <hstack alignment="space-between">
            <text size="small">Next: {nextMilestone.milestoneType}</text>
            <text size="small">{nextMilestone.pointsNeeded} to go</text>
          </hstack>
          
          {/* Progress Bar (simplified) */}
          <hstack>
            <text size="small" color="neutral-content-weak">
              {Math.round(((nextMilestone.nextMilestone - nextMilestone.pointsNeeded) / nextMilestone.nextMilestone) * 100)}% complete
            </text>
          </hstack>
        </vstack>
      )}

      {/* Quick Stats */}
      <hstack alignment="space-between">
        <vstack gap="none">
          <text size="small" color="neutral-content-weak">Completed</text>
          <text size="medium" weight="bold">{userProfile.completedChallenges.length}</text>
        </vstack>
        
        <vstack gap="none">
          <text size="small" color="neutral-content-weak">Success Rate</text>
          <text size="medium" weight="bold">
            {userProfile.statistics.totalSubmissions > 0 
              ? Math.round((userProfile.statistics.successfulSubmissions / userProfile.statistics.totalSubmissions) * 100)
              : 0}%
          </text>
        </vstack>
        
        {showBadges && (
          <vstack gap="none">
            <text size="small" color="neutral-content-weak">Badges</text>
            <text size="medium" weight="bold">{userProfile.badges.length}</text>
          </vstack>
        )}
      </hstack>

      {/* Recent Badges */}
      {showBadges && recentBadges.length > 0 && (
        <vstack gap="small">
          <text size="small" weight="bold">Recent Badges</text>
          <hstack gap="small">
            {recentBadges.map((badge) => (
              <hstack key={badge.id} gap="small" alignment="center">
                <text size="small">🏆</text>
                <text size="small">{badge.name}</text>
              </hstack>
            ))}
          </hstack>
        </vstack>
      )}
    </vstack>
  );
};

/**
 * User Profile Quick View - Even more compact for headers/navigation
 */
export const UserProfileQuickView = (props: { userProfile: UserProfile }) => {
  const { userProfile } = props;
  
  return (
    <hstack gap="small" alignment="center">
      <text size="medium" weight="bold">{userProfile.redditUsername}</text>
      <text size="small" color="blue">{userProfile.totalPoints}pts</text>
      {userProfile.badges.length > 0 && (
        <hstack gap="none">
          <text size="small">🏆</text>
          <text size="small">{userProfile.badges.length}</text>
        </hstack>
      )}
    </hstack>
  );
};

/**
 * User Achievement Notification - For showing when badges are earned
 */
export const UserAchievementNotification = (props: { 
  badge: { name: string; description: string; iconUrl: string };
  points?: number;
}) => {
  const { badge, points } = props;
  
  return (
    <vstack 
      gap="medium" 
      padding="medium" 
      backgroundColor="#fff3cd" 
      cornerRadius="medium"
      alignment="center"
    >
      <text size="large">🎉</text>
      <text size="large" weight="bold">Achievement Unlocked!</text>
      
      <vstack gap="small" alignment="center">
        <text size="large">🏆</text>
        <text size="medium" weight="bold">{badge.name}</text>
        <text size="small" color="neutral-content-weak" alignment="center">
          {badge.description}
        </text>
      </vstack>
      
      {points && (
        <text size="small" color="blue">+{points} bonus points!</text>
      )}
    </vstack>
  );
};

/**
 * Leaderboard Entry Component - For displaying user in leaderboard
 */
export const LeaderboardUserEntry = (props: {
  userProfile: UserProfile;
  rank: number;
  isCurrentUser?: boolean;
}) => {
  const { userProfile, rank, isCurrentUser = false } = props;
  
  return (
    <hstack 
      gap="medium" 
      padding="medium" 
      backgroundColor={isCurrentUser ? "#e3f2fd" : "transparent"}
      cornerRadius="small"
      alignment="center"
    >
      <text size="medium" weight="bold" color={rank <= 3 ? "gold" : "neutral-content"}>
        #{rank}
      </text>
      
      <vstack gap="none">
        <text size="medium" weight={isCurrentUser ? "bold" : "normal"}>
          {userProfile.redditUsername}
        </text>
        <text size="small" color="neutral-content-weak">
          {userProfile.completedChallenges.length} challenges
        </text>
      </vstack>
      
      <spacer />
      
      <vstack gap="none" alignment="end">
        <text size="medium" weight="bold" color="blue">
          {userProfile.totalPoints}
        </text>
        <text size="small" color="neutral-content-weak">points</text>
      </vstack>
      
      {userProfile.badges.length > 0 && (
        <hstack gap="none">
          <text size="small">🏆</text>
          <text size="small">{userProfile.badges.length}</text>
        </hstack>
      )}
    </hstack>
  );
};
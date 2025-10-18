/**
 * User Profile Component
 * Displays user profile information, statistics, badges, and privacy controls
 */

import { Devvit } from '@devvit/public-api';
import { UserProfile, Badge, Challenge } from '../types/core.js';
import { UserProfileService } from '../services/userProfileService.js';
import { BadgeService } from '../services/badgeService.js';
import { PointsService } from '../services/pointsService.js';

interface UserProfileProps {
  userProfile: UserProfile;
  challenges: Challenge[];
  onPreferencesUpdate?: (preferences: Partial<UserProfile['preferences']>) => void;
}

export const UserProfileComponent: Devvit.CustomPostComponent = (context) => {
  const { useState, useAsync } = context;
  const userProfileService = new UserProfileService(context);
  const badgeService = new BadgeService(context);
  const pointsService = new PointsService(context);

  // State for profile data
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);

  // Load user profile data
  const loadUserProfile = useAsync(async () => {
    try {
      const currentUser = await context.reddit.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const profile = await userProfileService.getUserProfile(currentUser.username);
      setUserProfile(profile);

      // Load challenges for statistics
      // In a real implementation, this would come from a challenge service
      setChallenges([]);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setLoading(false);
    }
  });

  // Update user preferences
  const updatePreferences = async (newPreferences: Partial<UserProfile['preferences']>) => {
    if (!userProfile) return;

    try {
      const updatedProfile = await userProfileService.updateUserPreferences(
        userProfile.redditUsername,
        newPreferences
      );
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  // Calculate completion rate
  const getCompletionRate = () => {
    if (!userProfile || challenges.length === 0) return 0;
    return Math.round((userProfile.completedChallenges.length / challenges.length) * 100);
  };

  // Get points to next milestone
  const getNextMilestone = () => {
    if (!userProfile) return null;
    return pointsService.getPointsToNextMilestone(userProfile.totalPoints);
  };

  // Format badge for display
  const formatBadge = (badge: Badge) => {
    return badgeService.formatBadgeForDisplay(badge);
  };

  // Render loading state
  if (loading) {
    return (
      <vstack alignment="center middle" padding="large">
        <text size="large">Loading profile...</text>
      </vstack>
    );
  }

  // Render error state
  if (!userProfile) {
    return (
      <vstack alignment="center middle" padding="large">
        <text size="large" color="red">Error loading profile</text>
        <button onPress={loadUserProfile}>Retry</button>
      </vstack>
    );
  }

  const nextMilestone = getNextMilestone();
  const completionRate = getCompletionRate();

  return (
    <vstack gap="medium" padding="medium">
      {/* Profile Header */}
      <vstack gap="small" padding="medium" backgroundColor="#f8f9fa" cornerRadius="medium">
        <hstack alignment="space-between">
          <text size="xxlarge" weight="bold">{userProfile.redditUsername}</text>
          <button 
            appearance="secondary" 
            size="small"
            onPress={() => setShowPrivacySettings(!showPrivacySettings)}
          >
            Settings
          </button>
        </hstack>
        
        <text size="small" color="neutral-content-weak">
          Member since {userProfile.joinedAt.toLocaleDateString()}
        </text>
      </vstack>

      {/* Points and Progress */}
      <vstack gap="small" padding="medium" backgroundColor="#e3f2fd" cornerRadius="medium">
        <hstack alignment="space-between">
          <text size="large" weight="bold">Total Points</text>
          <text size="large" weight="bold" color="blue">{userProfile.totalPoints}</text>
        </hstack>
        
        {nextMilestone && (
          <vstack gap="small">
            <hstack alignment="space-between">
              <text size="medium">Next: {nextMilestone.milestoneType}</text>
              <text size="medium">{nextMilestone.pointsNeeded} points to go</text>
            </hstack>
            <hstack>
              <text size="small" color="neutral-content-weak">
                Progress: {userProfile.totalPoints}/{nextMilestone.nextMilestone}
              </text>
            </hstack>
          </vstack>
        )}
      </vstack>

      {/* Statistics */}
      <vstack gap="small" padding="medium" backgroundColor="#f3e5f5" cornerRadius="medium">
        <text size="large" weight="bold">Statistics</text>
        
        <hstack alignment="space-between">
          <text>Challenges Completed</text>
          <text weight="bold">{userProfile.completedChallenges.length}</text>
        </hstack>
        
        <hstack alignment="space-between">
          <text>Completion Rate</text>
          <text weight="bold">{completionRate}%</text>
        </hstack>
        
        <hstack alignment="space-between">
          <text>Success Rate</text>
          <text weight="bold">
            {userProfile.statistics.totalSubmissions > 0 
              ? Math.round((userProfile.statistics.successfulSubmissions / userProfile.statistics.totalSubmissions) * 100)
              : 0}%
          </text>
        </hstack>
        
        <hstack alignment="space-between">
          <text>Total Submissions</text>
          <text weight="bold">{userProfile.statistics.totalSubmissions}</text>
        </hstack>
      </vstack>

      {/* Badges */}
      <vstack gap="small" padding="medium" backgroundColor="#fff3e0" cornerRadius="medium">
        <hstack alignment="space-between">
          <text size="large" weight="bold">Badges ({userProfile.badges.length})</text>
        </hstack>
        
        {userProfile.badges.length > 0 ? (
          <vstack gap="small">
            {userProfile.badges.slice(0, 6).map((badge) => {
              const formattedBadge = formatBadge(badge);
              return (
                <hstack key={badge.id} gap="medium" alignment="center">
                  <text size="large">🏆</text>
                  <vstack gap="none">
                    <text weight="bold">{formattedBadge.name}</text>
                    <text size="small" color="neutral-content-weak">
                      {formattedBadge.description}
                    </text>
                    <text size="small" color="neutral-content-weak">
                      Earned: {formattedBadge.earnedAt}
                    </text>
                  </vstack>
                </hstack>
              );
            })}
            
            {userProfile.badges.length > 6 && (
              <text size="small" color="neutral-content-weak">
                +{userProfile.badges.length - 6} more badges
              </text>
            )}
          </vstack>
        ) : (
          <text color="neutral-content-weak">No badges earned yet. Complete challenges to earn your first badge!</text>
        )}
      </vstack>

      {/* Favorite Partners */}
      {userProfile.statistics.favoritePartners.length > 0 && (
        <vstack gap="small" padding="medium" backgroundColor="#e8f5e8" cornerRadius="medium">
          <text size="large" weight="bold">Favorite Partners</text>
          <vstack gap="small">
            {userProfile.statistics.favoritePartners.slice(0, 3).map((partnerId, index) => (
              <hstack key={partnerId} alignment="space-between">
                <text>Partner {partnerId}</text>
                <text size="small" color="neutral-content-weak">#{index + 1}</text>
              </hstack>
            ))}
          </vstack>
        </vstack>
      )}

      {/* Privacy Settings */}
      {showPrivacySettings && (
        <vstack gap="medium" padding="medium" backgroundColor="#f5f5f5" cornerRadius="medium">
          <text size="large" weight="bold">Privacy Settings</text>
          
          <vstack gap="small">
            <hstack alignment="space-between">
              <text>Show on Leaderboard</text>
              <button
                appearance={userProfile.preferences.leaderboardVisible ? "primary" : "secondary"}
                size="small"
                onPress={() => updatePreferences({ 
                  leaderboardVisible: !userProfile.preferences.leaderboardVisible 
                })}
              >
                {userProfile.preferences.leaderboardVisible ? "Visible" : "Hidden"}
              </button>
            </hstack>
            
            <hstack alignment="space-between">
              <text>Notifications</text>
              <button
                appearance={userProfile.preferences.notifications ? "primary" : "secondary"}
                size="small"
                onPress={() => updatePreferences({ 
                  notifications: !userProfile.preferences.notifications 
                })}
              >
                {userProfile.preferences.notifications ? "On" : "Off"}
              </button>
            </hstack>
            
            <hstack alignment="space-between">
              <text>Location Sharing</text>
              <button
                appearance={userProfile.preferences.locationSharing ? "primary" : "secondary"}
                size="small"
                onPress={() => updatePreferences({ 
                  locationSharing: !userProfile.preferences.locationSharing 
                })}
              >
                {userProfile.preferences.locationSharing ? "Enabled" : "Disabled"}
              </button>
            </hstack>
          </vstack>
          
          <text size="small" color="neutral-content-weak">
            Privacy settings control how your information is displayed to other users and what data is collected.
          </text>
        </vstack>
      )}

      {/* Action Buttons */}
      <vstack gap="small">
        <button appearance="primary" onPress={() => {
          // Navigate to challenges
          context.ui.navigateTo('challenges');
        }}>
          Browse Challenges
        </button>
        
        <button appearance="secondary" onPress={() => {
          // Navigate to leaderboard
          context.ui.navigateTo('leaderboard');
        }}>
          View Leaderboard
        </button>
      </vstack>
    </vstack>
  );
};

// Export the component configuration
export const UserProfile = Devvit.addCustomPostType({
  name: 'UserProfile',
  height: 'tall',
  render: UserProfileComponent,
});
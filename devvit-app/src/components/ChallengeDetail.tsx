/**
 * Challenge Detail Component for displaying detailed challenge information
 * and handling proof submissions
 */

import { Devvit } from '@devvit/public-api';
import { Challenge, GPSCoordinate, ProofType } from '../types/core.js';
import { getAnalyticsClient } from '../services/analytics.js';
import { EngagementEvent } from '../types/analytics.js';
import { ProofSubmissionComponent } from './ProofSubmission.js';

export interface ChallengeDetailProps {
  challenge: Challenge;
  userLocation?: GPSCoordinate;
  userCompletedChallenges: string[];
  onSubmissionStart?: (challengeId: string) => void;
}

/**
 * Challenge Detail Component
 * Displays comprehensive challenge information and handles view tracking
 */
export class ChallengeDetailComponent {
  
  /**
   * Track view event when challenge detail is displayed
   */
  static async trackChallengeView(
    challengeId: string,
    userRedditUsername: string,
    postId: string
  ): Promise<void> {
    try {
      const analyticsClient = getAnalyticsClient();
      
      const viewEvent: EngagementEvent = {
        eventType: 'view',
        challengeId: parseInt(challengeId),
        userRedditUsername,
        postId,
        timestamp: new Date().toISOString()
      };

      await analyticsClient.trackEngagement(viewEvent);
    } catch (error) {
      console.error('Failed to track challenge view:', error);
      // Don't throw - analytics failures shouldn't break the UI
    }
  }

  /**
   * Get challenge status display information
   */
  static getChallengeStatus(challenge: Challenge, userCompletedChallenges: string[]) {
    const isCompleted = userCompletedChallenges.includes(challenge.id);
    const now = new Date();
    const isExpired = now > challenge.endDate;
    const isActive = now >= challenge.startDate && now <= challenge.endDate;

    if (isCompleted) {
      return {
        status: 'completed',
        text: '✅ Completed',
        color: '#059669',
        canSubmit: false
      };
    }

    if (isExpired) {
      return {
        status: 'expired',
        text: '⏰ Challenge Expired',
        color: '#dc2626',
        canSubmit: false
      };
    }

    if (!isActive) {
      return {
        status: 'upcoming',
        text: '🔜 Coming Soon',
        color: '#f59e0b',
        canSubmit: false
      };
    }

    return {
      status: 'active',
      text: '🎯 Active Challenge',
      color: '#059669',
      canSubmit: true
    };
  }

  /**
   * Format challenge expiration information
   */
  static getExpirationInfo(challenge: Challenge): string {
    const now = new Date();
    const timeUntilEnd = challenge.endDate.getTime() - now.getTime();
    
    if (timeUntilEnd <= 0) {
      return 'Expired';
    }

    const days = Math.floor(timeUntilEnd / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeUntilEnd % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    } else {
      return 'Less than 1 hour remaining';
    }
  }

  /**
   * Get difficulty display information
   */
  static getDifficultyInfo(difficulty: 'easy' | 'medium' | 'hard') {
    const difficultyMap = {
      easy: { emoji: '🟢', color: '#059669', label: 'Easy' },
      medium: { emoji: '🟡', color: '#f59e0b', label: 'Medium' },
      hard: { emoji: '🔴', color: '#dc2626', label: 'Hard' }
    };

    return difficultyMap[difficulty];
  }

  /**
   * Format proof requirements for display
   */
  static formatProofRequirements(proofTypes: ProofType[]): string {
    const typeMap: Record<ProofType, string> = {
      photo: '📸 Photo of business',
      receipt: '🧾 Receipt/purchase proof',
      gps_checkin: '📍 GPS check-in',
      location_question: '❓ Answer location question'
    };

    return proofTypes.map(type => typeMap[type]).join(' OR ');
  }

  /**
   * Create the challenge detail view blocks
   */
  static createChallengeDetailBlocks(props: ChallengeDetailProps): any[] {
    const { challenge, userCompletedChallenges } = props;
    const statusInfo = this.getChallengeStatus(challenge, userCompletedChallenges);
    const expirationInfo = this.getExpirationInfo(challenge);
    const difficultyInfo = this.getDifficultyInfo(challenge.difficulty);
    const proofRequirementsText = this.formatProofRequirements(challenge.proofRequirements.types);

    return [
      // Header with partner branding
      {
        type: 'vstack',
        padding: 'medium',
        backgroundColor: challenge.partnerBranding.primaryColor || '#f8fafc',
        cornerRadius: 'medium',
        children: [
          {
            type: 'text',
            size: 'xxlarge',
            weight: 'bold',
            color: 'black',
            text: challenge.title
          },
          {
            type: 'text',
            size: 'large',
            color: '#374151',
            text: challenge.partnerName
          }
        ]
      },

      // Status and basic info
      {
        type: 'vstack',
        gap: 'small',
        padding: 'medium',
        backgroundColor: 'white',
        cornerRadius: 'medium',
        border: 'thin',
        borderColor: '#e5e7eb',
        children: [
          {
            type: 'hstack',
            gap: 'medium',
            children: [
              {
                type: 'text',
                size: 'medium',
                weight: 'bold',
                color: statusInfo.color,
                text: statusInfo.text
              },
              {
                type: 'text',
                size: 'medium',
                color: '#6b7280',
                text: expirationInfo
              }
            ]
          },
          {
            type: 'hstack',
            gap: 'medium',
            children: [
              {
                type: 'text',
                size: 'medium',
                color: difficultyInfo.color,
                text: `${difficultyInfo.emoji} ${difficultyInfo.label}`
              },
              {
                type: 'text',
                size: 'medium',
                weight: 'bold',
                color: '#059669',
                text: `${challenge.points} Points`
              }
            ]
          }
        ]
      },

      // Challenge description
      {
        type: 'vstack',
        gap: 'small',
        padding: 'medium',
        backgroundColor: 'white',
        cornerRadius: 'medium',
        border: 'thin',
        borderColor: '#e5e7eb',
        children: [
          {
            type: 'text',
            size: 'large',
            weight: 'bold',
            color: 'black',
            text: 'Challenge Description'
          },
          {
            type: 'text',
            size: 'medium',
            color: '#374151',
            text: challenge.description
          }
        ]
      },

      // Location information
      {
        type: 'vstack',
        gap: 'small',
        padding: 'medium',
        backgroundColor: 'white',
        cornerRadius: 'medium',
        border: 'thin',
        borderColor: '#e5e7eb',
        children: [
          {
            type: 'text',
            size: 'large',
            weight: 'bold',
            color: 'black',
            text: '📍 Location'
          },
          {
            type: 'text',
            size: 'medium',
            color: '#374151',
            text: challenge.location.businessName
          },
          {
            type: 'text',
            size: 'small',
            color: '#6b7280',
            text: challenge.location.address
          },
          {
            type: 'text',
            size: 'small',
            color: '#6b7280',
            text: `GPS: ${challenge.location.coordinates.latitude.toFixed(6)}, ${challenge.location.coordinates.longitude.toFixed(6)}`
          }
        ]
      },

      // Proof requirements
      {
        type: 'vstack',
        gap: 'small',
        padding: 'medium',
        backgroundColor: 'white',
        cornerRadius: 'medium',
        border: 'thin',
        borderColor: '#e5e7eb',
        children: [
          {
            type: 'text',
            size: 'large',
            weight: 'bold',
            color: 'black',
            text: '📋 Proof Requirements'
          },
          {
            type: 'text',
            size: 'medium',
            color: '#374151',
            text: proofRequirementsText
          },
          {
            type: 'text',
            size: 'medium',
            color: '#6b7280',
            text: challenge.proofRequirements.instructions
          },
          ...(challenge.proofRequirements.examples ? challenge.proofRequirements.examples.map(example => ({
            type: 'text',
            size: 'small',
            color: '#9ca3af',
            text: `• ${example}`
          })) : [])
        ]
      },

      // Submit proof button (if challenge is active and not completed)
      ...(statusInfo.canSubmit ? [{
        type: 'vstack',
        padding: 'medium',
        children: [
          {
            type: 'button',
            text: '📤 Submit Proof',
            appearance: 'primary' as const,
            size: 'large' as const,
            onPress: () => {
              if (props.onSubmissionStart) {
                props.onSubmissionStart(challenge.id);
              }
            }
          }
        ]
      }] : [])
    ];
  }
}

/**
 * Render function for challenge detail component
 */
export function renderChallengeDetail(
  context: Devvit.Context,
  props: ChallengeDetailProps
): any {
  // Track view event when component renders
  const currentUser = context.reddit.getCurrentUser();
  if (currentUser) {
    currentUser.then(user => {
      if (user) {
        ChallengeDetailComponent.trackChallengeView(
          props.challenge.id,
          user.username,
          context.postId || 'unknown'
        );
      }
    }).catch(error => {
      console.error('Failed to get current user for analytics:', error);
    });
  }

  const blocks = ChallengeDetailComponent.createChallengeDetailBlocks(props);

  return {
    type: 'vstack',
    gap: 'medium',
    padding: 'medium',
    children: blocks
  };
}
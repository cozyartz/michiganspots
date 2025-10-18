/**
 * Comprehensive Challenge Detail View Component
 * Combines challenge detail display with proof submission interface
 */

import { Devvit } from '@devvit/public-api';
import { Challenge, GPSCoordinate, ProofType, Submission } from '../types/core.js';
import { ChallengeDetailComponent, ChallengeDetailProps } from './ChallengeDetail.js';
import { ProofSubmissionComponent, ProofSubmissionProps } from './ProofSubmission.js';

export interface ChallengeDetailViewProps {
  challenge: Challenge;
  userLocation?: GPSCoordinate;
  userCompletedChallenges: string[];
  showSubmissionForm?: boolean;
}

export interface ChallengeDetailViewState {
  currentView: 'detail' | 'submission' | 'success';
  userLocation?: GPSCoordinate;
  submissionResult?: Submission;
  error?: string;
}

/**
 * Challenge Detail View Component
 * Manages the complete flow from viewing challenge details to submitting proof
 */
export class ChallengeDetailViewComponent {

  /**
   * Create the main challenge detail view with integrated submission flow
   */
  static createChallengeDetailView(
    context: Devvit.Context,
    props: ChallengeDetailViewProps,
    state: ChallengeDetailViewState = { currentView: 'detail' }
  ): any {
    
    switch (state.currentView) {
      case 'detail':
        return this.createDetailView(context, props, state);
      
      case 'submission':
        return this.createSubmissionView(context, props, state);
      
      case 'success':
        return this.createSuccessView(context, props, state);
      
      default:
        return this.createDetailView(context, props, state);
    }
  }

  /**
   * Create the challenge detail view
   */
  private static createDetailView(
    context: Devvit.Context,
    props: ChallengeDetailViewProps,
    state: ChallengeDetailViewState
  ): any {
    const { challenge, userCompletedChallenges } = props;
    const statusInfo = ChallengeDetailComponent.getChallengeStatus(challenge, userCompletedChallenges);
    
    // Get the challenge detail blocks
    const detailBlocks = ChallengeDetailComponent.createChallengeDetailBlocks({
      challenge,
      userLocation: state.userLocation,
      userCompletedChallenges,
      onSubmissionStart: (challengeId: string) => {
        // In a real implementation, this would update the component state
        console.log(`Starting submission for challenge: ${challengeId}`);
      }
    });

    // Add navigation and action buttons
    const actionBlocks = [];

    if (statusInfo.canSubmit) {
      actionBlocks.push({
        type: 'vstack',
        gap: 'small',
        padding: 'medium',
        children: [
          {
            type: 'button',
            text: '📤 Submit Proof',
            appearance: 'primary' as const,
            size: 'large' as const,
            onPress: async () => {
              // Get user location before proceeding to submission
              const location = await ProofSubmissionComponent.getCurrentLocation();
              if (location) {
                // In a real implementation, this would update state to show submission view
                console.log('Proceeding to submission with location:', location);
              } else {
                console.log('Location required for submission');
              }
            }
          },
          {
            type: 'text',
            size: 'small',
            color: '#6b7280',
            text: 'Location verification required'
          }
        ]
      });
    }

    return {
      type: 'vstack',
      gap: 'medium',
      padding: 'medium',
      children: [
        ...detailBlocks,
        ...actionBlocks,
        
        // Back to challenges button
        {
          type: 'button',
          text: '← Back to Challenges',
          appearance: 'secondary' as const,
          onPress: () => {
            console.log('Navigating back to challenge list');
          }
        }
      ]
    };
  }

  /**
   * Create the proof submission view
   */
  private static createSubmissionView(
    context: Devvit.Context,
    props: ChallengeDetailViewProps,
    state: ChallengeDetailViewState
  ): any {
    const submissionProps: ProofSubmissionProps = {
      challenge: props.challenge,
      userLocation: state.userLocation,
      onSubmissionComplete: (submission: Submission) => {
        // In a real implementation, this would update state to show success view
        console.log('Submission completed:', submission);
      },
      onCancel: () => {
        // In a real implementation, this would return to detail view
        console.log('Submission cancelled');
      }
    };

    // Get the proof submission blocks
    const submissionBlocks = ProofSubmissionComponent.createProofTypeSelectionBlocks(
      props.challenge,
      (proofType: ProofType) => {
        console.log(`Selected proof type: ${proofType}`);
        // In a real implementation, this would proceed to proof capture
      }
    );

    const gpsBlocks = ProofSubmissionComponent.createGPSVerificationBlocks(
      props.challenge,
      state.userLocation,
      (location: GPSCoordinate) => {
        console.log('Location captured:', location);
        // In a real implementation, this would update state with location
      },
      () => {
        console.log('Retrying location capture');
      }
    );

    return {
      type: 'vstack',
      gap: 'medium',
      padding: 'medium',
      children: [
        {
          type: 'text',
          size: 'xxlarge',
          weight: 'bold',
          color: 'black',
          text: '📤 Submit Proof'
        },
        {
          type: 'text',
          size: 'medium',
          color: '#6b7280',
          text: `Challenge: ${props.challenge.title}`
        },
        
        // GPS Verification Section
        {
          type: 'vstack',
          gap: 'small',
          padding: 'medium',
          backgroundColor: '#f8fafc',
          cornerRadius: 'medium',
          border: 'thin',
          borderColor: '#e2e8f0',
          children: gpsBlocks
        },

        // Proof Type Selection Section
        {
          type: 'vstack',
          gap: 'medium',
          children: submissionBlocks
        },

        // Navigation buttons
        {
          type: 'hstack',
          gap: 'medium',
          children: [
            {
              type: 'button',
              text: '← Back to Details',
              appearance: 'secondary' as const,
              onPress: () => {
                console.log('Returning to challenge details');
              }
            },
            {
              type: 'button',
              text: 'Cancel',
              appearance: 'secondary' as const,
              onPress: () => {
                console.log('Cancelling submission');
              }
            }
          ]
        }
      ]
    };
  }

  /**
   * Create the success view after submission
   */
  private static createSuccessView(
    context: Devvit.Context,
    props: ChallengeDetailViewProps,
    state: ChallengeDetailViewState
  ): any {
    const { challenge } = props;
    const { submissionResult } = state;

    return {
      type: 'vstack',
      gap: 'medium',
      padding: 'medium',
      children: [
        {
          type: 'text',
          size: 'xxlarge',
          weight: 'bold',
          color: '#059669',
          text: '🎉 Challenge Completed!'
        },
        
        {
          type: 'vstack',
          gap: 'small',
          padding: 'medium',
          backgroundColor: '#f0f9ff',
          cornerRadius: 'medium',
          border: 'thin',
          borderColor: '#0ea5e9',
          children: [
            {
              type: 'text',
              size: 'large',
              weight: 'bold',
              color: 'black',
              text: challenge.title
            },
            {
              type: 'text',
              size: 'medium',
              color: '#374151',
              text: `You earned ${challenge.points} points!`
            },
            {
              type: 'text',
              size: 'medium',
              color: '#6b7280',
              text: `Business: ${challenge.partnerName}`
            }
          ]
        },

        // Submission details
        ...(submissionResult ? [{
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
              size: 'medium',
              weight: 'bold',
              color: 'black',
              text: 'Submission Details'
            },
            {
              type: 'text',
              size: 'small',
              color: '#6b7280',
              text: `Proof Type: ${submissionResult.proofType}`
            },
            {
              type: 'text',
              size: 'small',
              color: '#6b7280',
              text: `Submitted: ${submissionResult.submittedAt.toLocaleString()}`
            },
            ...(submissionResult.redditPostUrl ? [{
              type: 'text',
              size: 'small',
              color: '#0ea5e9',
              text: 'Reddit post created successfully'
            }] : []),
            ...(submissionResult.redditCommentUrl ? [{
              type: 'text',
              size: 'small',
              color: '#0ea5e9',
              text: 'Reddit comment created successfully'
            }] : [])
          ]
        }] : []),

        // Action buttons
        {
          type: 'vstack',
          gap: 'small',
          children: [
            {
              type: 'button',
              text: '🏆 View My Progress',
              appearance: 'primary' as const,
              onPress: () => {
                console.log('Navigating to user progress');
              }
            },
            {
              type: 'button',
              text: '🎯 Find More Challenges',
              appearance: 'secondary' as const,
              onPress: () => {
                console.log('Navigating to challenge list');
              }
            }
          ]
        }
      ]
    };
  }

  /**
   * Handle proof type selection and proceed to capture interface
   */
  static async handleProofTypeSelection(
    context: Devvit.Context,
    challenge: Challenge,
    proofType: ProofType,
    userLocation: GPSCoordinate
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify location first
      const locationVerification = ProofSubmissionComponent.verifyGPSLocation(userLocation, challenge);
      if (!locationVerification.isValid) {
        return { success: false, error: locationVerification.message };
      }

      // In a real implementation, this would show the appropriate capture interface
      // based on the proof type (photo capture, receipt upload, etc.)
      console.log(`Proceeding with ${proofType} proof capture`);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Handle the complete submission flow
   */
  static async handleSubmissionFlow(
    context: Devvit.Context,
    challenge: Challenge,
    proofType: ProofType,
    proofData: any,
    userLocation: GPSCoordinate
  ): Promise<{ success: boolean; submission?: Submission; error?: string }> {
    try {
      const proofSubmission = {
        type: proofType,
        data: proofData,
        metadata: {
          timestamp: new Date(),
          location: userLocation,
          deviceInfo: 'Devvit App'
        }
      };

      return await ProofSubmissionComponent.submitProof(
        context,
        challenge,
        proofSubmission,
        userLocation
      );
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Submission failed' 
      };
    }
  }
}

/**
 * Main render function for the challenge detail view
 */
export function renderChallengeDetailView(
  context: Devvit.Context,
  props: ChallengeDetailViewProps
): any {
  // In a real Devvit app, this would use proper state management
  // For now, we'll always show the detail view
  const state: ChallengeDetailViewState = {
    currentView: 'detail',
    userLocation: props.userLocation
  };

  return ChallengeDetailViewComponent.createChallengeDetailView(context, props, state);
}
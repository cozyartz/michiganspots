import { Context } from '@devvit/public-api';
import { CloudflareAIService } from './aiService.js';
import { AIGameIntelligence, SocialDynamics } from './aiGameIntelligence.js';

export interface CommunityHealth {
  overallScore: number; // 0-1
  engagement: number;
  toxicity: number;
  growth: number;
  retention: number;
  diversity: number;
  recommendations: string[];
}

export interface AutoModeration {
  action: 'approve' | 'flag' | 'remove' | 'escalate';
  confidence: number;
  reason: string;
  suggestedResponse?: string;
  educationalContent?: string;
}

export interface CommunityEvent {
  id: string;
  type: 'tournament' | 'collaboration' | 'celebration' | 'education' | 'onboarding';
  title: string;
  description: string;
  targetAudience: string[];
  expectedParticipation: number;
  aiGeneratedContent: {
    announcements: string[];
    rules: string[];
    rewards: any;
  };
}

export interface InfluencerProgram {
  candidates: Array<{
    userId: string;
    influenceScore: number;
    specialties: string[];
    recommendedRole: 'ambassador' | 'mentor' | 'content_creator' | 'event_organizer';
    suggestedIncentives: string[];
  }>;
  campaigns: Array<{
    id: string;
    theme: string;
    targetInfluencers: string[];
    expectedReach: number;
    content: string[];
  }>;
}

export class AICommunityManager {
  private context: Context;
  private aiService: CloudflareAIService;
  private gameIntelligence: AIGameIntelligence;

  constructor(context: Context) {
    this.context = context;
    this.aiService = new CloudflareAIService(context);
    this.gameIntelligence = new AIGameIntelligence(context);
  }

  /**
   * Analyze overall community health and provide recommendations
   */
  async analyzeCommunityHealth(
    userActivity: any[],
    contentMetrics: any[],
    moderationEvents: any[]
  ): Promise<CommunityHealth> {
    try {
      // Calculate engagement score
      const engagement = this.calculateEngagementScore(userActivity);
      
      // Analyze toxicity levels
      const toxicity = await this.analyzeToxicity(contentMetrics, moderationEvents);
      
      // Calculate growth metrics
      const growth = this.calculateGrowthScore(userActivity);
      
      // Analyze retention
      const retention = this.calculateRetentionScore(userActivity);
      
      // Measure diversity
      const diversity = this.calculateDiversityScore(userActivity);
      
      // Overall health score
      const overallScore = (engagement + (1 - toxicity) + growth + retention + diversity) / 5;
      
      // Generate AI recommendations
      const recommendations = await this.generateHealthRecommendations({
        engagement,
        toxicity,
        growth,
        retention,
        diversity,
      });

      return {
        overallScore,
        engagement,
        toxicity,
        growth,
        retention,
        diversity,
        recommendations,
      };
    } catch (error) {
      console.error('Community health analysis failed:', error);
      return {
        overallScore: 0.7,
        engagement: 0.7,
        toxicity: 0.1,
        growth: 0.6,
        retention: 0.8,
        diversity: 0.7,
        recommendations: ['Monitor community metrics more closely'],
      };
    }
  }

  /**
   * AI-powered content moderation
   */
  async moderateContent(
    content: string,
    author: string,
    context: {
      isNewUser: boolean;
      previousViolations: number;
      communityStanding: number;
    }
  ): Promise<AutoModeration> {
    try {
      const prompt = `Analyze this community content for moderation:

Content: "${content}"
Author context: ${context.isNewUser ? 'New user' : 'Established user'}, ${context.previousViolations} previous violations, community standing: ${context.communityStanding}/10

Determine if this content should be approved, flagged, removed, or escalated.
Consider: toxicity, spam, off-topic, harassment, misinformation.

Respond with JSON: {
  "action": "approve|flag|remove|escalate",
  "confidence": 0.0-1.0,
  "reason": "explanation",
  "suggestedResponse": "optional response to user",
  "educationalContent": "optional educational message"
}`;

      const response = await fetch(`${this.aiService['baseUrl']}/@cf/meta/llama-2-7b-chat-int8`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.aiService['apiKey']}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          max_tokens: 512,
          temperature: 0.2,
        }),
      });

      const result = await response.json();
      return this.parseModerationResponse(result, context);
    } catch (error) {
      console.error('Content moderation failed:', error);
      return {
        action: 'flag',
        confidence: 0.5,
        reason: 'Unable to analyze content automatically',
        suggestedResponse: 'Your content has been flagged for manual review.',
      };
    }
  }

  /**
   * Generate community events based on current dynamics
   */
  async generateCommunityEvent(
    socialDynamics: SocialDynamics,
    communityHealth: CommunityHealth,
    seasonalContext?: string
  ): Promise<CommunityEvent> {
    try {
      const eventType = this.determineOptimalEventType(socialDynamics, communityHealth);
      
      const prompt = `Create a community event for a treasure hunt game.

Community Context:
- Mood: ${socialDynamics.communityMood}
- Trending topics: ${socialDynamics.trendingTopics.join(', ')}
- Health score: ${communityHealth.overallScore.toFixed(2)}
- Season: ${seasonalContext || 'current'}

Event type: ${eventType}

Create an engaging event that addresses community needs and boosts participation.

Respond with JSON: {
  "title": "",
  "description": "",
  "targetAudience": [],
  "expectedParticipation": 0,
  "announcements": [],
  "rules": [],
  "rewards": {}
}`;

      const response = await fetch(`${this.aiService['baseUrl']}/@cf/meta/llama-2-7b-chat-int8`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.aiService['apiKey']}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      const result = await response.json();
      return this.parseCommunityEventResponse(result, eventType);
    } catch (error) {
      console.error('Community event generation failed:', error);
      return this.getDefaultCommunityEvent();
    }
  }

  /**
   * Manage influencer program with AI insights
   */
  async manageInfluencerProgram(
    userProfiles: any[],
    socialDynamics: SocialDynamics,
    businessGoals: string[]
  ): Promise<InfluencerProgram> {
    try {
      // Identify potential influencers
      const candidates = await this.identifyInfluencerCandidates(userProfiles, socialDynamics);
      
      // Generate influencer campaigns
      const campaigns = await this.generateInfluencerCampaigns(candidates, businessGoals);

      return {
        candidates,
        campaigns,
      };
    } catch (error) {
      console.error('Influencer program management failed:', error);
      return {
        candidates: [],
        campaigns: [],
      };
    }
  }

  /**
   * AI-powered onboarding optimization
   */
  async optimizeOnboarding(
    newUserBehavior: any[],
    successfulUserPatterns: any[]
  ): Promise<{
    onboardingFlow: Array<{
      step: number;
      title: string;
      description: string;
      action: string;
      expectedCompletionRate: number;
    }>;
    personalizedWelcome: (userProfile: any) => string;
    retentionStrategies: string[];
  }> {
    try {
      const prompt = `Optimize user onboarding for a treasure hunt game.

New user behavior patterns:
- Average first session: ${this.calculateAverageSessionLength(newUserBehavior)} minutes
- Common drop-off points: ${this.identifyDropOffPoints(newUserBehavior).join(', ')}
- Successful completion rate: ${this.calculateCompletionRate(newUserBehavior)}%

Successful user patterns:
- Key success factors: ${this.identifySuccessFactors(successfulUserPatterns).join(', ')}

Create an optimized onboarding flow that maximizes new user retention.

Respond with JSON including onboarding steps and strategies.`;

      const response = await fetch(`${this.aiService['baseUrl']}/@cf/meta/llama-2-7b-chat-int8`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.aiService['apiKey']}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          max_tokens: 1024,
          temperature: 0.6,
        }),
      });

      const result = await response.json();
      return this.parseOnboardingResponse(result);
    } catch (error) {
      console.error('Onboarding optimization failed:', error);
      return this.getDefaultOnboarding();
    }
  }

  /**
   * Generate AI-powered community challenges
   */
  async createCommunityChallenge(
    theme: string,
    duration: number,
    targetParticipation: number
  ): Promise<{
    challengeId: string;
    title: string;
    description: string;
    rules: string[];
    phases: Array<{
      name: string;
      duration: number;
      objectives: string[];
      rewards: any;
    }>;
    socialElements: {
      hashtags: string[];
      shareableContent: string[];
      leaderboardCategories: string[];
    };
  }> {
    try {
      const prompt = `Create a community-wide challenge for a treasure hunt game.

Parameters:
- Theme: ${theme}
- Duration: ${duration} days
- Target participation: ${targetParticipation} users

Design a multi-phase challenge that encourages collaboration, competition, and community building.

Respond with JSON including challenge details, phases, and social elements.`;

      const response = await fetch(`${this.aiService['baseUrl']}/@cf/meta/llama-2-7b-chat-int8`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.aiService['apiKey']}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      const result = await response.json();
      return this.parseCommunityChallenge(result, theme);
    } catch (error) {
      console.error('Community challenge creation failed:', error);
      return this.getDefaultCommunityChallenge(theme);
    }
  }

  // Private helper methods

  private calculateEngagementScore(userActivity: any[]): number {
    if (userActivity.length === 0) return 0;
    
    const recentActivity = userActivity.filter(
      activity => activity.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000
    );
    
    const engagementRate = recentActivity.length / userActivity.length;
    const avgSessionLength = recentActivity.reduce((sum, activity) => 
      sum + (activity.sessionLength || 0), 0) / recentActivity.length;
    
    return Math.min((engagementRate * 0.6 + (avgSessionLength / 30) * 0.4), 1);
  }

  private async analyzeToxicity(contentMetrics: any[], moderationEvents: any[]): Promise<number> {
    const totalContent = contentMetrics.length;
    if (totalContent === 0) return 0;
    
    const flaggedContent = moderationEvents.filter(event => 
      event.action === 'flag' || event.action === 'remove'
    ).length;
    
    return Math.min(flaggedContent / totalContent, 1);
  }

  private calculateGrowthScore(userActivity: any[]): number {
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
    
    const thisWeek = userActivity.filter(activity => activity.timestamp > oneWeekAgo).length;
    const lastWeek = userActivity.filter(activity => 
      activity.timestamp > twoWeeksAgo && activity.timestamp <= oneWeekAgo
    ).length;
    
    if (lastWeek === 0) return thisWeek > 0 ? 1 : 0;
    return Math.min((thisWeek - lastWeek) / lastWeek + 0.5, 1);
  }

  private calculateRetentionScore(userActivity: any[]): number {
    const uniqueUsers = new Set(userActivity.map(activity => activity.userId));
    const recentUsers = new Set(
      userActivity
        .filter(activity => activity.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000)
        .map(activity => activity.userId)
    );
    
    return uniqueUsers.size > 0 ? recentUsers.size / uniqueUsers.size : 0;
  }

  private calculateDiversityScore(userActivity: any[]): number {
    const categories = new Set(userActivity.map(activity => activity.category || 'general'));
    const locations = new Set(userActivity.map(activity => activity.location || 'unknown'));
    const timeSlots = new Set(userActivity.map(activity => {
      const hour = new Date(activity.timestamp).getHours();
      return Math.floor(hour / 6); // 4 time slots per day
    }));
    
    // Normalize diversity score
    return (categories.size / 10 + locations.size / 20 + timeSlots.size / 4) / 3;
  }

  private async generateHealthRecommendations(healthMetrics: any): Promise<string[]> {
    const recommendations: string[] = [];
    
    if (healthMetrics.engagement < 0.6) {
      recommendations.push('Increase community events and interactive content');
    }
    
    if (healthMetrics.toxicity > 0.1) {
      recommendations.push('Strengthen moderation and community guidelines');
    }
    
    if (healthMetrics.growth < 0.3) {
      recommendations.push('Implement referral programs and viral mechanics');
    }
    
    if (healthMetrics.retention < 0.7) {
      recommendations.push('Improve onboarding and early user experience');
    }
    
    if (healthMetrics.diversity < 0.5) {
      recommendations.push('Expand content variety and accessibility');
    }
    
    return recommendations;
  }

  private parseModerationResponse(result: any, context: any): AutoModeration {
    try {
      const response = result.result?.response || result.response || '';
      const parsed = JSON.parse(response);
      
      return {
        action: parsed.action || 'flag',
        confidence: parsed.confidence || 0.5,
        reason: parsed.reason || 'Content requires review',
        suggestedResponse: parsed.suggestedResponse,
        educationalContent: parsed.educationalContent,
      };
    } catch (error) {
      return {
        action: 'flag',
        confidence: 0.5,
        reason: 'Unable to parse moderation response',
      };
    }
  }

  private determineOptimalEventType(
    socialDynamics: SocialDynamics,
    communityHealth: CommunityHealth
  ): string {
    if (communityHealth.engagement < 0.5) return 'onboarding';
    if (socialDynamics.communityMood === 'competitive') return 'tournament';
    if (socialDynamics.communityMood === 'collaborative') return 'collaboration';
    if (communityHealth.overallScore > 0.8) return 'celebration';
    return 'education';
  }

  private parseCommunityEventResponse(result: any, eventType: string): CommunityEvent {
    try {
      const response = result.result?.response || result.response || '';
      const parsed = JSON.parse(response);
      
      return {
        id: `event_${Date.now()}`,
        type: eventType as any,
        title: parsed.title || `Community ${eventType}`,
        description: parsed.description || 'Join the community for an exciting event!',
        targetAudience: parsed.targetAudience || ['all_users'],
        expectedParticipation: parsed.expectedParticipation || 50,
        aiGeneratedContent: {
          announcements: parsed.announcements || ['Event starting soon!'],
          rules: parsed.rules || ['Participate fairly', 'Have fun'],
          rewards: parsed.rewards || { points: 25, badge: 'Event Participant' },
        },
      };
    } catch (error) {
      return this.getDefaultCommunityEvent();
    }
  }

  private async identifyInfluencerCandidates(
    userProfiles: any[],
    socialDynamics: SocialDynamics
  ): Promise<Array<{
    userId: string;
    influenceScore: number;
    specialties: string[];
    recommendedRole: string;
    suggestedIncentives: string[];
  }>> {
    const candidates: any[] = [];
    
    for (const influencer of socialDynamics.influencerIdentification) {
      const profile = userProfiles.find(p => p.userId === influencer.userId);
      if (!profile) continue;
      
      const role = this.determineInfluencerRole(influencer, profile);
      const incentives = this.suggestInfluencerIncentives(role, influencer.specialties);
      
      candidates.push({
        userId: influencer.userId,
        influenceScore: influencer.influence,
        specialties: influencer.specialties,
        recommendedRole: role,
        suggestedIncentives: incentives,
      });
    }
    
    return candidates.sort((a, b) => b.influenceScore - a.influenceScore).slice(0, 10);
  }

  private async generateInfluencerCampaigns(
    candidates: any[],
    businessGoals: string[]
  ): Promise<Array<{
    id: string;
    theme: string;
    targetInfluencers: string[];
    expectedReach: number;
    content: string[];
  }>> {
    const campaigns: any[] = [];
    
    for (const goal of businessGoals.slice(0, 3)) {
      const relevantInfluencers = candidates
        .filter(candidate => candidate.influenceScore > 0.6)
        .slice(0, 5);
      
      campaigns.push({
        id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        theme: goal,
        targetInfluencers: relevantInfluencers.map(inf => inf.userId),
        expectedReach: relevantInfluencers.reduce((sum, inf) => sum + inf.influenceScore * 100, 0),
        content: [
          `Join our ${goal} initiative!`,
          `Share your experience with the community`,
          `Help others discover the fun of treasure hunting`,
        ],
      });
    }
    
    return campaigns;
  }

  private determineInfluencerRole(influencer: any, profile: any): string {
    if (influencer.specialties.includes('education')) return 'mentor';
    if (influencer.specialties.includes('content')) return 'content_creator';
    if (influencer.specialties.includes('events')) return 'event_organizer';
    return 'ambassador';
  }

  private suggestInfluencerIncentives(role: string, specialties: string[]): string[] {
    const baseIncentives = ['Exclusive badge', 'Early access to features'];
    
    switch (role) {
      case 'mentor':
        return [...baseIncentives, 'Mentorship recognition', 'Community impact metrics'];
      case 'content_creator':
        return [...baseIncentives, 'Content creation tools', 'Featured content placement'];
      case 'event_organizer':
        return [...baseIncentives, 'Event planning resources', 'Community event hosting'];
      default:
        return [...baseIncentives, 'Ambassador perks', 'Community leadership role'];
    }
  }

  private calculateAverageSessionLength(userBehavior: any[]): number {
    const sessions = userBehavior.filter(b => b.sessionLength);
    return sessions.length > 0 ? 
      sessions.reduce((sum, s) => sum + s.sessionLength, 0) / sessions.length : 0;
  }

  private identifyDropOffPoints(userBehavior: any[]): string[] {
    const dropOffs = new Map<string, number>();
    
    for (const behavior of userBehavior) {
      if (behavior.dropOffPoint) {
        dropOffs.set(behavior.dropOffPoint, (dropOffs.get(behavior.dropOffPoint) || 0) + 1);
      }
    }
    
    return Array.from(dropOffs.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([point]) => point);
  }

  private calculateCompletionRate(userBehavior: any[]): number {
    const completed = userBehavior.filter(b => b.completed).length;
    return userBehavior.length > 0 ? (completed / userBehavior.length) * 100 : 0;
  }

  private identifySuccessFactors(successfulUserPatterns: any[]): string[] {
    const factors = new Map<string, number>();
    
    for (const pattern of successfulUserPatterns) {
      for (const factor of pattern.successFactors || []) {
        factors.set(factor, (factors.get(factor) || 0) + 1);
      }
    }
    
    return Array.from(factors.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([factor]) => factor);
  }

  private parseOnboardingResponse(result: any): any {
    try {
      const response = result.result?.response || result.response || '';
      const parsed = JSON.parse(response);
      
      return {
        onboardingFlow: parsed.onboardingFlow || this.getDefaultOnboardingFlow(),
        personalizedWelcome: (userProfile: any) => 
          `Welcome ${userProfile.name || 'adventurer'}! Ready to start your treasure hunting journey?`,
        retentionStrategies: parsed.retentionStrategies || [
          'Send welcome series emails',
          'Assign beginner-friendly challenges',
          'Connect with community mentors',
        ],
      };
    } catch (error) {
      return this.getDefaultOnboarding();
    }
  }

  private parseCommunityChallenge(result: any, theme: string): any {
    try {
      const response = result.result?.response || result.response || '';
      const parsed = JSON.parse(response);
      
      return {
        challengeId: `community_${Date.now()}`,
        title: parsed.title || `Community ${theme} Challenge`,
        description: parsed.description || 'Join the community for an exciting challenge!',
        rules: parsed.rules || ['Participate fairly', 'Help others', 'Have fun'],
        phases: parsed.phases || [
          {
            name: 'Kickoff',
            duration: 2,
            objectives: ['Join the challenge', 'Complete first task'],
            rewards: { points: 10, badge: 'Challenge Starter' },
          }
        ],
        socialElements: {
          hashtags: parsed.socialElements?.hashtags || [`#${theme}Challenge`, '#TreasureHunt'],
          shareableContent: parsed.socialElements?.shareableContent || [
            'Just joined the community challenge!',
            'Making progress on the treasure hunt!',
          ],
          leaderboardCategories: parsed.socialElements?.leaderboardCategories || [
            'Most Active', 'Best Collaborator', 'Top Performer'
          ],
        },
      };
    } catch (error) {
      return this.getDefaultCommunityChallenge(theme);
    }
  }

  // Default fallback methods

  private getDefaultCommunityEvent(): CommunityEvent {
    return {
      id: `default_event_${Date.now()}`,
      type: 'collaboration',
      title: 'Community Collaboration Event',
      description: 'Join fellow treasure hunters for a collaborative adventure!',
      targetAudience: ['all_users'],
      expectedParticipation: 25,
      aiGeneratedContent: {
        announcements: ['Community event starting soon!', 'Join us for collaborative fun!'],
        rules: ['Work together', 'Share discoveries', 'Help newcomers'],
        rewards: { points: 30, badge: 'Community Collaborator' },
      },
    };
  }

  private getDefaultOnboarding(): any {
    return {
      onboardingFlow: this.getDefaultOnboardingFlow(),
      personalizedWelcome: (userProfile: any) => 
        `Welcome to the treasure hunt community! Let's get you started on your adventure.`,
      retentionStrategies: [
        'Provide clear first steps',
        'Assign a community buddy',
        'Send encouraging progress updates',
        'Offer beginner-friendly challenges',
      ],
    };
  }

  private getDefaultOnboardingFlow(): any[] {
    return [
      {
        step: 1,
        title: 'Welcome to Treasure Hunting!',
        description: 'Learn the basics of finding and completing challenges',
        action: 'Watch intro video',
        expectedCompletionRate: 0.9,
      },
      {
        step: 2,
        title: 'Find Your First Challenge',
        description: 'Discover challenges near your location',
        action: 'Browse nearby challenges',
        expectedCompletionRate: 0.8,
      },
      {
        step: 3,
        title: 'Complete Your First Challenge',
        description: 'Visit a location and submit proof',
        action: 'Complete beginner challenge',
        expectedCompletionRate: 0.6,
      },
      {
        step: 4,
        title: 'Join the Community',
        description: 'Connect with other treasure hunters',
        action: 'Join community discussion',
        expectedCompletionRate: 0.4,
      },
    ];
  }

  private getDefaultCommunityChallenge(theme: string): any {
    return {
      challengeId: `default_community_${Date.now()}`,
      title: `${theme} Community Challenge`,
      description: `Join the community for a ${theme}-themed adventure!`,
      rules: [
        'Participate respectfully',
        'Help fellow treasure hunters',
        'Share your discoveries',
        'Have fun exploring',
      ],
      phases: [
        {
          name: 'Discovery Phase',
          duration: 7,
          objectives: ['Find 3 new locations', 'Share photos with community'],
          rewards: { points: 50, badge: 'Explorer' },
        },
        {
          name: 'Collaboration Phase',
          duration: 7,
          objectives: ['Help 2 other participants', 'Join group activities'],
          rewards: { points: 75, badge: 'Community Helper' },
        },
      ],
      socialElements: {
        hashtags: [`#${theme}Challenge`, '#CommunityTreasureHunt', '#ExploreLocal'],
        shareableContent: [
          `Just started the ${theme} community challenge! 🗺️`,
          'Amazing discoveries in my neighborhood! #TreasureHunt',
          'Love this community of explorers! 🌟',
        ],
        leaderboardCategories: [
          'Most Discoveries',
          'Best Community Helper',
          'Most Creative Photos',
          'Longest Streak',
        ],
      },
    };
  }
}
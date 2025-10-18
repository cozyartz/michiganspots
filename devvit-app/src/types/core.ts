/**
 * Core type definitions for the Reddit Treasure Hunt Game
 */

// GPS and Location Types
export interface GPSCoordinate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: Date;
}

export interface LocationVerification {
  isValid: boolean;
  distance: number;
  accuracy: number;
  fraudRisk: 'low' | 'medium' | 'high';
  verificationMethod: 'gps' | 'network' | 'manual';
}

// Proof Types
export type ProofType = 'photo' | 'receipt' | 'gps_checkin' | 'location_question';

export interface ProofSubmission {
  type: ProofType;
  data: PhotoProof | ReceiptProof | GPSProof | QuestionProof;
  metadata: {
    timestamp: Date;
    location: GPSCoordinate;
    deviceInfo: string;
  };
}

export interface PhotoProof {
  imageUrl: string;
  hasBusinessSignage: boolean;
  hasInteriorView: boolean;
  gpsEmbedded: boolean;
}

export interface ReceiptProof {
  imageUrl: string;
  businessName: string;
  timestamp: Date;
  amount?: number;
}

export interface GPSProof {
  coordinates: GPSCoordinate;
  verificationRadius: number;
  checkInTime: Date;
}

export interface QuestionProof {
  question: string;
  answer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

// Challenge Types
export interface Challenge {
  id: string;
  title: string;
  description: string;
  partnerId: string;
  partnerName: string;
  partnerBranding: {
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  startDate: Date;
  endDate: Date;
  location: {
    coordinates: GPSCoordinate;
    address: string;
    businessName: string;
    verificationRadius: number; // meters
  };
  proofRequirements: {
    types: ProofType[];
    instructions: string;
    examples?: string[];
  };
  status: 'draft' | 'active' | 'expired' | 'completed';
  maxCompletions?: number;
  redditPostId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChallengeFilters {
  difficulty?: 'easy' | 'medium' | 'hard';
  status?: 'active' | 'expired' | 'completed';
  partnerId?: string;
  maxDistance?: number; // in meters from user location
  sortBy?: 'points' | 'difficulty' | 'distance' | 'endDate';
  sortOrder?: 'asc' | 'desc';
}

// User Profile Types
export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  earnedAt: Date;
  criteria: BadgeCriteria;
}

export interface BadgeCriteria {
  type: 'completion_count' | 'points_total' | 'streak' | 'partner_visits' | 'difficulty_master';
  threshold: number;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'alltime';
  additionalRequirements?: Record<string, any>;
}

export interface UserProfile {
  redditUsername: string;
  totalPoints: number;
  completedChallenges: string[];
  badges: Badge[];
  joinedAt: Date;
  lastActiveAt: Date;
  preferences: {
    notifications: boolean;
    leaderboardVisible: boolean;
    locationSharing: boolean;
  };
  statistics: {
    totalSubmissions: number;
    successfulSubmissions: number;
    averageCompletionTime: number;
    favoritePartners: string[];
  };
}

// Submission Types
export interface Submission {
  id: string;
  challengeId: string;
  userRedditUsername: string;
  proofType: ProofType;
  proofData: any;
  submittedAt: Date;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  verificationNotes?: string;
  redditPostUrl?: string;
  redditCommentUrl?: string;
  gpsCoordinates: GPSCoordinate;
  fraudRiskScore: number;
  reviewedBy?: string;
  reviewedAt?: Date;
}

export interface UserSubmissionHistory {
  userRedditUsername: string;
  submissions: Submission[];
  lastSubmissionAt?: Date;
  totalSubmissions: number;
  suspiciousActivityCount: number;
}

// Leaderboard Types
export interface LeaderboardEntry {
  rank: number;
  username: string;
  points: number;
  badgeCount: number;
  completedChallenges: number;
}

export interface LeaderboardData {
  type: 'individual' | 'city';
  timeframe: 'weekly' | 'monthly' | 'alltime';
  entries: LeaderboardEntry[];
  currentUserRank?: number;
  totalParticipants: number;
  lastUpdated: Date;
}
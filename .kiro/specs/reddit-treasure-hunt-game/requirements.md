# Requirements Document

## Introduction

Michigan Spots is a Reddit-based community treasure hunt game for r/michiganspots that connects local businesses with Reddit users through GPS-verified challenges. The game incentivizes real-world visits to Michigan businesses while providing partners with measurable analytics on foot traffic, engagement, and ROI. Players discover local businesses by completing location-based challenges, earning points and badges while helping businesses track the real value of their community engagement.

## Requirements

### Requirement 1

**User Story:** As a Reddit user on r/michiganspots, I want to browse active challenges so that I can discover interesting local businesses to visit.

#### Acceptance Criteria

1. WHEN a user visits r/michiganspots THEN the system SHALL display a list of active challenges
2. WHEN a user views the challenge list THEN the system SHALL show challenge title, partner business name, points value, and difficulty level for each challenge
3. WHEN a user clicks on a challenge THEN the system SHALL navigate to the detailed challenge view
4. WHEN a challenge is outside its active date range THEN the system SHALL NOT display it in the active challenges list
5. WHEN a user has already completed a challenge THEN the system SHALL mark it as "Completed" in the list

### Requirement 2

**User Story:** As a Reddit user, I want to view detailed challenge information so that I can understand what I need to do to complete it.

#### Acceptance Criteria

1. WHEN a user opens a challenge detail view THEN the system SHALL display the complete challenge description, partner branding, GPS location, and completion requirements
2. WHEN a user views challenge details THEN the system SHALL send a 'view' analytics event to the backend API
3. WHEN a challenge has specific proof requirements THEN the system SHALL clearly display what type of submission is needed (photo, receipt, GPS check-in, or location question)
4. WHEN a user views challenge details THEN the system SHALL show the points reward and difficulty level
5. WHEN a challenge is expired THEN the system SHALL display "Challenge Expired" status

### Requirement 3

**User Story:** As a Reddit user, I want to submit proof of challenge completion so that I can earn points and help businesses track my visit.

#### Acceptance Criteria

1. WHEN a user clicks "Submit Proof" THEN the system SHALL provide appropriate submission options based on challenge requirements
2. WHEN a user submits photo proof THEN the system SHALL verify GPS location is within 100 meters of the business location
3. WHEN a user submits proof THEN the system SHALL create a Reddit post or comment with the submission
4. WHEN proof submission is successful THEN the system SHALL send a 'completion' analytics event to the backend API
5. WHEN a user has already completed a challenge THEN the system SHALL prevent duplicate submissions
6. WHEN GPS verification fails THEN the system SHALL display an error message and prevent submission

### Requirement 4

**User Story:** As a Reddit user, I want to track my progress and achievements so that I can see my accomplishments and compete with others.

#### Acceptance Criteria

1. WHEN a user completes challenges THEN the system SHALL award points based on difficulty (Easy: 10, Medium: 25, Hard: 50 points)
2. WHEN a user accumulates points THEN the system SHALL update their total score and rank on leaderboards
3. WHEN a user reaches point milestones THEN the system SHALL award appropriate badges
4. WHEN a user views their profile THEN the system SHALL display completed challenges, total points, badges earned, and current rank
5. WHEN multiple users have the same score THEN the system SHALL rank by completion date (earlier completion ranks higher)

### Requirement 5

**User Story:** As a Reddit user, I want to engage with challenges through Reddit's social features so that I can share my experiences with the community.

#### Acceptance Criteria

1. WHEN a user comments on a challenge THEN the system SHALL send a 'comment' analytics event to the backend API
2. WHEN a user upvotes a challenge THEN the system SHALL send an 'upvote' analytics event to the backend API  
3. WHEN a user shares a challenge THEN the system SHALL send a 'share' analytics event to the backend API
4. WHEN a user gives an award to a challenge THEN the system SHALL send an 'award' analytics event to the backend API
5. WHEN any engagement event occurs THEN the system SHALL include challengeId, userRedditUsername, postId, and eventType in the analytics payload

### Requirement 6

**User Story:** As a business partner, I want accurate analytics data from challenge interactions so that I can measure the ROI of my community engagement.

#### Acceptance Criteria

1. WHEN any user interaction occurs THEN the system SHALL send real-time analytics events to https://michiganspots.com/api/analytics/track-engagement
2. WHEN a challenge is completed THEN the system SHALL send completion data to https://michiganspots.com/api/analytics/track-challenge
3. WHEN sending analytics events THEN the system SHALL include proper authentication headers with X-API-Key
4. WHEN analytics API calls fail THEN the system SHALL retry up to 3 times with exponential backoff
5. WHEN analytics data is sent THEN the system SHALL ensure all required fields are included and properly formatted

### Requirement 7

**User Story:** As a Reddit user, I want to see leaderboards so that I can compare my progress with other community members.

#### Acceptance Criteria

1. WHEN a user views leaderboards THEN the system SHALL display individual rankings by total points
2. WHEN displaying leaderboards THEN the system SHALL show username, total points, badges earned, and rank position
3. WHEN multiple leaderboard types exist THEN the system SHALL provide tabs for individual and city-based rankings
4. WHEN leaderboard data updates THEN the system SHALL refresh rankings in real-time or near real-time
5. WHEN a user is not on the leaderboard THEN the system SHALL show their current rank and points needed to advance

### Requirement 8

**User Story:** As a system administrator, I want fraud prevention measures so that the game maintains integrity and provides accurate business analytics.

#### Acceptance Criteria

1. WHEN a user attempts GPS spoofing THEN the system SHALL detect and reject the submission
2. WHEN a user submits duplicate proof for the same challenge THEN the system SHALL prevent the duplicate submission
3. WHEN suspicious activity is detected THEN the system SHALL flag the submission for manual review
4. WHEN photo submissions are made THEN the system SHALL verify business signage or interior is visible
5. WHEN rate limiting thresholds are exceeded THEN the system SHALL temporarily block further submissions from that user

### Requirement 9

**User Story:** As a Reddit user, I want the game to work seamlessly within Reddit's interface so that I have a native experience.

#### Acceptance Criteria

1. WHEN using the game THEN the system SHALL integrate with Devvit's Reddit OAuth for authentication
2. WHEN storing game data THEN the system SHALL use Devvit's KV store for user progress, leaderboards, and game state
3. WHEN displaying game content THEN the system SHALL follow Reddit's UI/UX patterns and guidelines
4. WHEN errors occur THEN the system SHALL display user-friendly error messages within Reddit's interface
5. WHEN the app loads THEN the system SHALL provide responsive performance suitable for Reddit's platform

### Requirement 10

**User Story:** As a business partner, I want different challenge types supported so that I can create engaging experiences appropriate for my business model.

#### Acceptance Criteria

1. WHEN creating single-location challenges THEN the system SHALL support individual business challenges with specific GPS coordinates
2. WHEN creating multi-location challenges THEN the system SHALL support chamber of commerce challenges spanning multiple businesses
3. WHEN setting challenge difficulty THEN the system SHALL support Easy (10 points), Medium (25 points), and Hard (50 points) levels
4. WHEN configuring proof requirements THEN the system SHALL support photo, receipt, GPS check-in, and location-specific question verification
5. WHEN setting challenge duration THEN the system SHALL enforce start_date and end_date boundaries for challenge availability
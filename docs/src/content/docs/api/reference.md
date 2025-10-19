---
title: API Reference
description: Complete API reference for Michigan Spots platform
---

# 🔌 API Reference

Complete API documentation for the Michigan Spots AI-powered treasure hunt platform.

## 🚀 Quick Start

### **Base URL**
```
https://api.michiganspots.com/v1
```

### **Authentication**
```typescript
// All API requests require authentication
headers: {
  'Authorization': 'Bearer YOUR_API_TOKEN',
  'Content-Type': 'application/json'
}
```

### **Rate Limits**
- **Standard**: 1,000 requests per hour
- **Premium**: 10,000 requests per hour
- **Enterprise**: Unlimited

## 👤 User Management API

### **User Registration**
```typescript
POST /users/register
{
  "username": "explorer123",
  "email": "user@example.com",
  "location": {
    "lat": 42.3314,
    "lng": -83.0458
  }
}

// Response
{
  "id": "user_abc123",
  "username": "explorer123",
  "points": 0,
  "level": 1,
  "badges": [],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### **Get User Profile**
```typescript
GET /users/{userId}

// Response
{
  "id": "user_abc123",
  "username": "explorer123",
  "points": 1250,
  "level": 8,
  "badges": [
    {
      "id": "detroit_explorer",
      "name": "Detroit Explorer",
      "description": "Completed 10 Detroit challenges",
      "earnedAt": "2024-01-20T15:45:00Z"
    }
  ],
  "stats": {
    "challengesCompleted": 45,
    "photosSubmitted": 52,
    "locationsVisited": 38,
    "friendsReferred": 3
  },
  "preferences": {
    "difficulty": "medium",
    "categories": ["food", "history", "nature"],
    "notifications": true
  }
}
```

### **Update User Profile**
```typescript
PATCH /users/{userId}
{
  "preferences": {
    "difficulty": "hard",
    "categories": ["food", "history", "nature", "art"],
    "notifications": false
  }
}
```

### **User Leaderboard**
```typescript
GET /users/leaderboard?timeframe=weekly&limit=50

// Response
{
  "leaderboard": [
    {
      "rank": 1,
      "userId": "user_xyz789",
      "username": "MichiganMaster",
      "points": 2850,
      "level": 15,
      "avatar": "https://cdn.michiganspots.com/avatars/xyz789.jpg"
    }
  ],
  "userRank": {
    "rank": 23,
    "points": 1250,
    "pointsToNextRank": 150
  },
  "metadata": {
    "totalUsers": 15420,
    "timeframe": "weekly",
    "updatedAt": "2024-01-15T12:00:00Z"
  }
}
```

## 🎯 Challenge Management API

### **Get Available Challenges**
```typescript
GET /challenges?location=42.3314,-83.0458&radius=10&difficulty=medium

// Response
{
  "challenges": [
    {
      "id": "challenge_det001",
      "title": "Detroit Riverfront Explorer",
      "description": "Discover the beauty of Detroit's waterfront and capture the perfect sunset shot",
      "category": "nature",
      "difficulty": "medium",
      "estimatedTime": "45 minutes",
      "points": 25,
      "location": {
        "lat": 42.3314,
        "lng": -83.0458,
        "name": "Detroit Riverfront",
        "address": "Detroit Riverfront, Detroit, MI"
      },
      "requirements": [
        "Visit Detroit Riverfront during golden hour (1 hour before sunset)",
        "Take a photo featuring both the river and Detroit skyline",
        "Include yourself or a friend in the photo",
        "Share what makes this view special to you"
      ],
      "rewards": {
        "points": 25,
        "badge": "Riverfront Explorer",
        "businessReward": {
          "partnerId": "partner_rivercafe",
          "offer": "10% off dinner at River Cafe",
          "validUntil": "2024-02-15T23:59:59Z"
        }
      },
      "aiPersonalization": {
        "matchScore": 0.92,
        "reasons": ["Matches photography interest", "Near user location", "Optimal difficulty"],
        "adaptations": ["Added photography tips", "Suggested best timing"]
      },
      "status": "available",
      "expiresAt": "2024-02-01T23:59:59Z",
      "completionCount": 1247,
      "averageRating": 4.7
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "hasMore": true
  }
}
```

### **Get Challenge Details**
```typescript
GET /challenges/{challengeId}

// Response includes full challenge details plus:
{
  "hints": [
    {
      "level": 1,
      "text": "Look for the iconic Renaissance Center in your shot",
      "cost": 5 // points
    }
  ],
  "submissions": {
    "total": 1247,
    "recent": [
      {
        "userId": "user_recent1",
        "username": "PhotoPro",
        "submittedAt": "2024-01-15T14:30:00Z",
        "rating": 5,
        "comment": "Amazing sunset views!"
      }
    ]
  },
  "tips": [
    "Best time to visit is 1 hour before sunset",
    "Parking available at Hart Plaza",
    "Consider bringing a wide-angle lens"
  ]
}
```

### **Submit Challenge Completion**
```typescript
POST /challenges/{challengeId}/submit
{
  "photos": [
    {
      "url": "https://user-uploads.michiganspots.com/photo123.jpg",
      "caption": "Beautiful sunset over the Detroit River with the skyline perfectly framed!",
      "location": {
        "lat": 42.3314,
        "lng": -83.0458,
        "accuracy": 5 // meters
      },
      "timestamp": "2024-01-15T18:45:00Z"
    }
  ],
  "story": "This was my first time seeing Detroit from this angle. The way the light reflected off the Renaissance Center was absolutely magical!",
  "rating": 5,
  "completionTime": 52 // minutes
}

// Response
{
  "submissionId": "submission_abc123",
  "status": "pending_validation",
  "aiValidation": {
    "confidence": 0.94,
    "locationMatch": true,
    "qualityScore": 0.89,
    "authenticity": 0.96,
    "estimatedProcessingTime": "2-3 minutes"
  },
  "pointsEarned": 0, // Pending validation
  "message": "Your submission is being validated by our AI system. You'll be notified once complete!"
}
```

### **Get Challenge Submission Status**
```typescript
GET /challenges/submissions/{submissionId}

// Response
{
  "submissionId": "submission_abc123",
  "challengeId": "challenge_det001",
  "status": "approved",
  "aiValidation": {
    "confidence": 0.94,
    "locationMatch": true,
    "qualityScore": 0.89,
    "authenticity": 0.96,
    "validatedAt": "2024-01-15T18:47:30Z"
  },
  "pointsEarned": 25,
  "badgesEarned": ["riverfront_explorer"],
  "rewards": [
    {
      "type": "business_offer",
      "partnerId": "partner_rivercafe",
      "offer": "10% off dinner at River Cafe",
      "code": "RIVER10-ABC123",
      "validUntil": "2024-02-15T23:59:59Z"
    }
  ],
  "feedback": {
    "aiComment": "Excellent composition and perfect timing! The lighting really captures the beauty of Detroit's waterfront.",
    "qualityTips": [
      "Great use of the golden hour lighting",
      "Nice framing of the skyline",
      "Consider experimenting with different angles next time"
    ]
  }
}
```

## 🤖 AI Services API

### **Photo Validation**
```typescript
POST /ai/validate-photo
{
  "imageUrl": "https://user-uploads.michiganspots.com/photo123.jpg",
  "challengeId": "challenge_det001",
  "location": {
    "lat": 42.3314,
    "lng": -83.0458
  },
  "timestamp": "2024-01-15T18:45:00Z"
}

// Response
{
  "validationId": "validation_xyz789",
  "isValid": true,
  "confidence": 0.94,
  "analysis": {
    "locationMatch": {
      "score": 0.96,
      "verified": true,
      "landmarks": ["Renaissance Center", "Detroit River"]
    },
    "qualityAssessment": {
      "score": 0.89,
      "factors": {
        "composition": 0.92,
        "lighting": 0.95,
        "clarity": 0.85,
        "authenticity": 0.96
      }
    },
    "requirementCheck": {
      "riverVisible": true,
      "skylineVisible": true,
      "personInPhoto": true,
      "goldenHour": true
    }
  },
  "feedback": {
    "strengths": [
      "Excellent timing during golden hour",
      "Clear view of required landmarks",
      "Good composition with person included"
    ],
    "improvements": [
      "Consider using a tripod for sharper images",
      "Try different angles for variety"
    ]
  },
  "processingTime": 2.3 // seconds
}
```

### **Generate Personalized Challenges**
```typescript
POST /ai/generate-challenges
{
  "userId": "user_abc123",
  "location": {
    "lat": 42.3314,
    "lng": -83.0458
  },
  "preferences": {
    "difficulty": "medium",
    "categories": ["food", "history"],
    "timeAvailable": 60 // minutes
  },
  "count": 3
}

// Response
{
  "challenges": [
    {
      "id": "ai_generated_001",
      "title": "Corktown Culinary Journey",
      "description": "Explore Detroit's oldest neighborhood and discover its culinary renaissance",
      "aiGenerated": true,
      "personalizationScore": 0.91,
      "reasoning": [
        "Matches user's food category preference",
        "Medium difficulty as requested",
        "Within 60-minute completion time",
        "Near user's current location"
      ]
      // ... rest of challenge structure
    }
  ],
  "generationMetadata": {
    "processingTime": 1.8,
    "modelVersion": "challenge-gen-v2.1",
    "personalizationFactors": [
      "User history analysis",
      "Location preferences",
      "Difficulty progression",
      "Social connections"
    ]
  }
}
```

### **Get AI Insights**
```typescript
GET /ai/insights/user/{userId}

// Response
{
  "personalizedRecommendations": [
    {
      "type": "challenge_suggestion",
      "title": "Try Photography Challenges",
      "reason": "Based on your high-quality photo submissions",
      "confidence": 0.87,
      "challenges": ["challenge_photo001", "challenge_photo002"]
    }
  ],
  "behaviorAnalysis": {
    "preferredDifficulty": "medium",
    "favoriteCategories": ["food", "history", "nature"],
    "optimalChallengeTime": "45-60 minutes",
    "socialEngagement": "high",
    "completionPatterns": {
      "bestDays": ["Saturday", "Sunday"],
      "bestTimes": ["10:00-12:00", "16:00-18:00"]
    }
  },
  "achievements": {
    "nextBadge": {
      "name": "History Buff",
      "progress": 0.7,
      "requirement": "Complete 10 history challenges",
      "current": 7
    },
    "levelProgress": {
      "currentLevel": 8,
      "pointsToNext": 150,
      "totalPoints": 1250
    }
  }
}
```

## 🏢 Business Partner API

### **Partner Registration**
```typescript
POST /partners/register
{
  "businessName": "Downtown Coffee Co",
  "category": "restaurant",
  "address": "123 Main St, Detroit, MI 48201",
  "location": {
    "lat": 42.3314,
    "lng": -83.0458
  },
  "contact": {
    "name": "John Smith",
    "email": "john@downtowncoffee.com",
    "phone": "+1-313-555-0123"
  },
  "businessHours": {
    "monday": {"open": "07:00", "close": "19:00"},
    "tuesday": {"open": "07:00", "close": "19:00"},
    // ... other days
  },
  "description": "Artisanal coffee shop in the heart of downtown Detroit",
  "website": "https://downtowncoffee.com",
  "socialMedia": {
    "instagram": "@downtowncoffeedet",
    "facebook": "DowntownCoffeeDetroit"
  }
}

// Response
{
  "partnerId": "partner_abc123",
  "status": "pending_verification",
  "verificationSteps": [
    "Business license verification",
    "Location confirmation",
    "Contact validation"
  ],
  "estimatedApprovalTime": "2-3 business days",
  "nextSteps": [
    "Upload business license",
    "Verify phone number",
    "Complete onboarding survey"
  ]
}
```

### **Partner Analytics**
```typescript
GET /partners/{partnerId}/analytics?timeframe=30d

// Response
{
  "summary": {
    "challengeViews": 15420,
    "challengeCompletions": 1247,
    "uniqueVisitors": 892,
    "repeatVisitors": 355,
    "conversionRate": 0.081,
    "averageRating": 4.7,
    "totalRewards": 1247,
    "rewardsRedeemed": 934
  },
  "demographics": {
    "ageGroups": {
      "18-24": 0.23,
      "25-34": 0.41,
      "35-44": 0.22,
      "45-54": 0.10,
      "55+": 0.04
    },
    "interests": [
      {"category": "food", "percentage": 0.78},
      {"category": "photography", "percentage": 0.45},
      {"category": "social", "percentage": 0.67}
    ]
  },
  "performance": {
    "dailyStats": [
      {
        "date": "2024-01-15",
        "views": 523,
        "completions": 42,
        "visitors": 38,
        "revenue": 1250.00
      }
    ],
    "topChallenges": [
      {
        "challengeId": "challenge_coffee001",
        "title": "Coffee Connoisseur Challenge",
        "completions": 456,
        "rating": 4.8,
        "revenue": 2280.00
      }
    ]
  },
  "insights": {
    "recommendations": [
      "Peak activity occurs on weekends between 10 AM - 2 PM",
      "Photography-focused challenges perform 40% better",
      "Consider seasonal menu challenges for higher engagement"
    ],
    "opportunities": [
      "Increase weekend staffing for higher visitor volume",
      "Create Instagram-worthy photo spots",
      "Partner with local photographers for events"
    ]
  }
}
```

### **Create Partner Challenge**
```typescript
POST /partners/{partnerId}/challenges
{
  "title": "Coffee Art Master Challenge",
  "description": "Learn the art of latte design and create your own masterpiece",
  "category": "food",
  "difficulty": "medium",
  "estimatedTime": 30,
  "requirements": [
    "Order any specialty coffee drink",
    "Watch our barista create latte art",
    "Try creating your own design",
    "Take a photo of your creation"
  ],
  "rewards": {
    "points": 20,
    "businessReward": {
      "type": "discount",
      "value": 0.15, // 15% off
      "description": "15% off your next visit",
      "validDays": 30
    }
  },
  "location": {
    "lat": 42.3314,
    "lng": -83.0458,
    "radius": 50 // meters
  },
  "schedule": {
    "startDate": "2024-01-20T00:00:00Z",
    "endDate": "2024-03-20T23:59:59Z",
    "availableDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "availableHours": {
      "start": "08:00",
      "end": "16:00"
    }
  }
}

// Response
{
  "challengeId": "challenge_coffee002",
  "status": "pending_review",
  "aiAnalysis": {
    "engagementPrediction": 0.78,
    "difficultyAssessment": "appropriate",
    "marketFit": 0.85,
    "suggestions": [
      "Consider adding beginner-friendly options",
      "Include tips for first-time latte art attempts"
    ]
  },
  "reviewProcess": {
    "estimatedTime": "24-48 hours",
    "criteria": [
      "Content quality and clarity",
      "Safety and feasibility",
      "Business policy compliance",
      "User experience optimization"
    ]
  }
}
```

## 📊 Analytics & Reporting API

### **Platform Analytics**
```typescript
GET /analytics/platform?timeframe=30d&metrics=engagement,growth,revenue

// Response
{
  "engagement": {
    "dailyActiveUsers": 12450,
    "monthlyActiveUsers": 45230,
    "averageSessionTime": 18.5, // minutes
    "challengeCompletionRate": 0.73,
    "userRetentionRate": {
      "day1": 0.85,
      "day7": 0.62,
      "day30": 0.41
    }
  },
  "growth": {
    "newUsers": 3420,
    "userGrowthRate": 0.08, // 8% monthly growth
    "newBusinessPartners": 23,
    "partnerGrowthRate": 0.12, // 12% monthly growth
    "viralCoefficient": 1.3
  },
  "revenue": {
    "totalRevenue": 234500.00,
    "revenueGrowthRate": 0.15,
    "averageRevenuePerUser": 5.18,
    "averageRevenuePerPartner": 599.00,
    "revenueByStream": {
      "subscriptions": 189600.00,
      "transactions": 28900.00,
      "dataServices": 16000.00
    }
  },
  "geographic": {
    "topCities": [
      {"city": "Detroit", "users": 15420, "revenue": 89200.00},
      {"city": "Grand Rapids", "users": 8930, "revenue": 52100.00},
      {"city": "Ann Arbor", "users": 6780, "revenue": 39800.00}
    ],
    "expansionOpportunities": [
      {"city": "Lansing", "potential": 0.87},
      {"city": "Kalamazoo", "potential": 0.72}
    ]
  }
}
```

### **Custom Reports**
```typescript
POST /analytics/reports/custom
{
  "name": "Q1 Business Performance Report",
  "timeframe": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-03-31T23:59:59Z"
  },
  "metrics": [
    "partner_roi",
    "user_engagement",
    "challenge_performance",
    "revenue_analysis"
  ],
  "filters": {
    "partnerTier": ["growth", "enterprise"],
    "userSegment": ["premium", "vip"],
    "geography": ["Detroit", "Grand Rapids"]
  },
  "format": "pdf",
  "schedule": {
    "frequency": "quarterly",
    "recipients": ["analytics@michiganspots.com"]
  }
}

// Response
{
  "reportId": "report_q1_2024",
  "status": "generating",
  "estimatedCompletion": "2024-01-16T10:30:00Z",
  "downloadUrl": null, // Available when complete
  "scheduledDelivery": "2024-04-01T09:00:00Z"
}
```

## 🔔 Webhooks API

### **Webhook Configuration**
```typescript
POST /webhooks
{
  "url": "https://your-app.com/webhooks/michigan-spots",
  "events": [
    "challenge.completed",
    "user.level_up",
    "partner.new_customer",
    "validation.completed"
  ],
  "secret": "your-webhook-secret",
  "active": true
}

// Response
{
  "webhookId": "webhook_abc123",
  "status": "active",
  "createdAt": "2024-01-15T10:30:00Z",
  "lastDelivery": null,
  "deliveryStats": {
    "successful": 0,
    "failed": 0,
    "totalAttempts": 0
  }
}
```

### **Webhook Events**
```typescript
// Example webhook payload for challenge completion
{
  "event": "challenge.completed",
  "timestamp": "2024-01-15T18:47:30Z",
  "data": {
    "challengeId": "challenge_det001",
    "userId": "user_abc123",
    "submissionId": "submission_xyz789",
    "pointsEarned": 25,
    "badgesEarned": ["riverfront_explorer"],
    "partnerId": "partner_rivercafe",
    "location": {
      "lat": 42.3314,
      "lng": -83.0458
    }
  },
  "signature": "sha256=abc123..." // HMAC signature for verification
}
```

## 🔒 Security & Authentication

### **API Key Management**
```typescript
POST /auth/api-keys
{
  "name": "Mobile App Production",
  "scopes": ["challenges:read", "users:write", "submissions:create"],
  "expiresAt": "2025-01-15T00:00:00Z"
}

// Response
{
  "keyId": "key_abc123",
  "apiKey": "ms_live_abc123def456...", // Only shown once
  "scopes": ["challenges:read", "users:write", "submissions:create"],
  "createdAt": "2024-01-15T10:30:00Z",
  "expiresAt": "2025-01-15T00:00:00Z",
  "lastUsed": null
}
```

### **Rate Limiting**
```typescript
// Rate limit headers included in all responses
{
  "X-RateLimit-Limit": "1000",
  "X-RateLimit-Remaining": "999",
  "X-RateLimit-Reset": "1642248000",
  "X-RateLimit-Window": "3600"
}

// Rate limit exceeded response
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 45 minutes.",
    "retryAfter": 2700 // seconds
  }
}
```

## 📚 SDKs & Libraries

### **JavaScript/TypeScript SDK**
```typescript
import { MichiganSpotsAPI } from '@michigan-spots/sdk';

const api = new MichiganSpotsAPI({
  apiKey: 'your-api-key',
  environment: 'production' // or 'sandbox'
});

// Get user profile
const user = await api.users.get('user_abc123');

// Submit challenge completion
const submission = await api.challenges.submit('challenge_det001', {
  photos: [{ url: 'photo.jpg', caption: 'Amazing view!' }],
  story: 'Great experience!',
  rating: 5
});

// Get personalized challenges
const challenges = await api.ai.generateChallenges({
  userId: 'user_abc123',
  location: { lat: 42.3314, lng: -83.0458 },
  preferences: { difficulty: 'medium', categories: ['food'] }
});
```

### **Python SDK**
```python
from michigan_spots import MichiganSpotsAPI

api = MichiganSpotsAPI(
    api_key='your-api-key',
    environment='production'
)

# Get partner analytics
analytics = api.partners.get_analytics(
    partner_id='partner_abc123',
    timeframe='30d'
)

# Create partner challenge
challenge = api.partners.create_challenge(
    partner_id='partner_abc123',
    title='Coffee Art Master Challenge',
    description='Learn latte art...',
    difficulty='medium'
)
```

## 🔧 Error Handling

### **Error Response Format**
```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "location.lat",
        "message": "Latitude must be between -90 and 90"
      }
    ],
    "requestId": "req_abc123",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### **Common Error Codes**
```typescript
interface ErrorCodes {
  // Authentication & Authorization
  UNAUTHORIZED: "Invalid or missing API key";
  FORBIDDEN: "Insufficient permissions";
  
  // Validation
  VALIDATION_ERROR: "Request validation failed";
  INVALID_PARAMETER: "Invalid parameter value";
  
  // Resources
  NOT_FOUND: "Resource not found";
  CONFLICT: "Resource conflict";
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: "Rate limit exceeded";
  
  // Server Errors
  INTERNAL_ERROR: "Internal server error";
  SERVICE_UNAVAILABLE: "Service temporarily unavailable";
  
  // AI Services
  AI_PROCESSING_ERROR: "AI service error";
  AI_TIMEOUT: "AI processing timeout";
}
```

## 📋 API Changelog

### **Version 1.2.0** (Latest)
- Added AI-powered challenge generation
- Enhanced photo validation with confidence scores
- New partner analytics endpoints
- Improved error handling and validation

### **Version 1.1.0**
- Added webhook support
- Enhanced user personalization
- New business partner endpoints
- Performance improvements

### **Version 1.0.0**
- Initial API release
- Core user and challenge management
- Basic AI validation
- Partner registration

## 📞 Support & Resources

### **API Support**
- **Documentation**: docs.michiganspots.com/api
- **Support Email**: api-support@michiganspots.com
- **Status Page**: status.michiganspots.com
- **Community Forum**: community.michiganspots.com

### **Development Resources**
- **Postman Collection**: Available in developer portal
- **OpenAPI Specification**: docs.michiganspots.com/openapi.json
- **Code Examples**: github.com/michiganspots/api-examples
- **SDK Documentation**: docs.michiganspots.com/sdks

**Build amazing location-based experiences with the Michigan Spots API!** 🚀🔌
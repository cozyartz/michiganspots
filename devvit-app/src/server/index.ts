import express from 'express';
import { InitResponse, IncrementResponse, DecrementResponse } from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';

const app = express();

// Middleware for JSON body parsing with size limits
app.use(express.json({ limit: '1mb' }));
// Middleware for URL-encoded body parsing with size limits
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
// Middleware for plain text body parsing with size limits
app.use(express.text({ limit: '1mb' }));

const router = express.Router();

// Simple health check endpoint
router.get('/api/health', async (_req, res): Promise<void> => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    message: 'Michigan Spots server is running',
  });
});

router.get<{ postId: string }, InitResponse | { status: string; message: string }>(
  '/api/init',
  async (_req, res): Promise<void> => {
    try {
      // Get context data
      const { postId, subredditName } = context;
      
      console.log('Init API called - context:', { postId, subredditName });

      // If no postId in context, try to get username anyway and return default data
      let username = 'anonymous';
      try {
        username = await reddit.getCurrentUsername() || 'anonymous';
      } catch (userError) {
        console.warn('Failed to get username:', userError);
      }

      if (!postId) {
        console.warn('No postId in context, returning default arcade data');
        res.json({
          type: 'init',
          postId: 'default',
          count: 0,
          username: username,
          postType: 'arcade',
          postData: { postType: 'arcade', gameMode: 'splash', score: 0, gamesPlayed: 0 },
        });
        return;
      }

      // Try to get stored post data
      let postData = null;
      try {
        const storedData = await redis.get(`post:${postId}:data`);
        postData = storedData ? JSON.parse(storedData) : null;
      } catch (redisError) {
        console.warn('Failed to get post data from Redis:', redisError);
      }

      // Get count
      let count = 0;
      try {
        const countData = await redis.get('count');
        count = countData ? parseInt(countData) : 0;
      } catch (countError) {
        console.warn('Failed to get count:', countError);
      }

      const response = {
        type: 'init',
        postId: postId,
        count: count,
        username: username,
        postType: postData?.postType || 'arcade',
        postData: postData || { postType: 'arcade', gameMode: 'splash', score: 0, gamesPlayed: 0 },
      };

      console.log('Sending init response:', response);
      res.json(response);
    } catch (error) {
      console.error('API Init Error:', error);
      
      // Always return something, even if there's an error
      res.json({
        type: 'init',
        postId: 'error-fallback',
        count: 0,
        username: 'anonymous',
        postType: 'arcade',
        postData: { postType: 'arcade', gameMode: 'splash', score: 0, gamesPlayed: 0 },
      });
    }
  }
);

router.post<{ postId: string }, IncrementResponse | { status: string; message: string }, unknown>(
  '/api/increment',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', 1),
      postId,
      type: 'increment',
    });
  }
);

router.post<{ postId: string }, DecrementResponse | { status: string; message: string }, unknown>(
  '/api/decrement',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', -1),
      postId,
      type: 'decrement',
    });
  }
);

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

// Michigan Arcade - Interactive Games Post
router.post('/internal/menu/create-arcade', async (_req, res): Promise<void> => {
  try {
    const { subredditName } = context;
    if (!subredditName) {
      throw new Error('subredditName is required');
    }

    const post = await reddit.submitCustomPost({
      splash: {
        appDisplayName: 'Michigan Spots',
        backgroundUri: 'michigan-arcade-bg.png',
        buttonLabel: '🎮 Start Playing',
        description: 'Discover Michigan through Memory Match, Photo Hunt, Trivia & Word Search. Test your knowledge, compete for the top spot, and become a legendary treasure hunter!',
        entryUri: 'default',
        heading: 'Your Michigan Adventure Awaits',
        appIconUri: 'michiganspots-logo.png',
        height: 'tall',
      },
      postData: {
        postType: 'arcade',
        gameMode: 'splash',
        score: 0,
        gamesPlayed: 0,
      },
      subredditName: subredditName,
      title: '🎮 Michigan Spots - Interactive Arcade Games!',
    });

    // Store post data in Redis
    await redis.set(
      `post:${post.id}:data`,
      JSON.stringify({ postType: 'arcade', gameMode: 'splash', score: 0, gamesPlayed: 0 })
    );

    res.json({
      navigateTo: `https://reddit.com/r/${subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating arcade post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create arcade post',
    });
  }
});

// Leaderboard Post
router.post('/internal/menu/create-leaderboard', async (_req, res): Promise<void> => {
  try {
    const { subredditName } = context;
    if (!subredditName) {
      throw new Error('subredditName is required');
    }

    const post = await reddit.submitCustomPost({
      splash: {
        appDisplayName: 'Treasure Hunters Leaderboard',
        backgroundUri: 'leaderboard-bg.png',
        buttonLabel: '🏆 View Rankings',
        description: 'See the top treasure hunters in Michigan!',
        entryUri: 'default',
        heading: '⚓ Top Treasure Hunters',
        appIconUri: 'leaderboard-icon.png',
        height: 'tall',
      },
      postData: {
        postType: 'leaderboard',
        refreshTimestamp: Date.now(),
      },
      subredditName: subredditName,
      title: '🏆 Michigan Treasure Hunters - Leaderboard',
    });

    // Store post data in Redis
    await redis.set(
      `post:${post.id}:data`,
      JSON.stringify({ postType: 'leaderboard', refreshTimestamp: Date.now() })
    );

    res.json({
      navigateTo: `https://reddit.com/r/${subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating leaderboard post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create leaderboard post',
    });
  }
});

// AI Mod Tools Post (Moderators Only)
router.post('/internal/menu/create-ai-tools', async (_req, res): Promise<void> => {
  try {
    const { subredditName } = context;
    if (!subredditName) {
      throw new Error('subredditName is required');
    }

    const post = await reddit.submitCustomPost({
      splash: {
        appDisplayName: 'Challenge Generator',
        backgroundUri: 'ai-mod-bg.png',
        buttonLabel: 'Generate Challenges',
        description: 'AI-powered treasure hunt challenge generator for businesses',
        entryUri: 'default',
        heading: 'Challenge Generator 🎯',
        appIconUri: 'ai-mod-icon.png',
        height: 'tall',
      },
      postData: {
        postType: 'ai-mod-tools',
        toolsVersion: '2.0',
        features: ['challenge-generator'],
      },
      subredditName: subredditName,
      title: '🎯 Challenge Generator - AI-Powered Treasure Hunt Creator',
    });

    // Store post data in Redis
    await redis.set(
      `post:${post.id}:data`,
      JSON.stringify({
        postType: 'ai-mod-tools',
        toolsVersion: '2.0',
        features: ['challenge-generator'],
      })
    );

    res.json({
      navigateTo: `https://reddit.com/r/${subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating AI mod tools post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create AI mod tools post',
    });
  }
});

// Analytics endpoint - Track game completion and forward to Cloudflare
router.post('/api/analytics/game-complete', async (req, res): Promise<void> => {
  try {
    const gameData = req.body;

    // Validate required fields
    if (!gameData.username || !gameData.game || typeof gameData.score !== 'number') {
      res.status(400).json({
        status: 'error',
        message: 'Username, game, and score are required',
      });
      return;
    }

    // Ensure score is positive and reasonable (prevent cheating)
    const maxScores = {
      'photo-hunt': 120,    // Max 30+40+30+20
      'trivia': 1000,       // Reasonable trivia max
      'word-search': 1000,  // Reasonable word search max
      'memory-match': 1000, // Reasonable memory match max
    };

    const maxScore = maxScores[gameData.game as keyof typeof maxScores] || 1000;
    if (gameData.score < 0 || gameData.score > maxScore) {
      console.warn(`Suspicious score: ${gameData.score} for ${gameData.game} by ${gameData.username}`);
      // Still record but cap the score
      gameData.score = Math.max(0, Math.min(gameData.score, maxScore));
    }

    const scoreData = JSON.stringify({
      username: gameData.username,
      score: gameData.score,
      game: gameData.game,
      timestamp: Date.now(),
      postId: gameData.postId,
      // Include additional game-specific data for analytics
      ...(gameData.quality && { quality: gameData.quality }),
      ...(gameData.michiganRelevance && { michiganRelevance: gameData.michiganRelevance }),
      ...(gameData.landmarkBonus && { landmarkBonus: gameData.landmarkBonus }),
      ...(gameData.creativity && { creativity: gameData.creativity }),
    });

    // Store in all time leaderboard
    const allTimeKey = `leaderboard:alltime:${gameData.game}`;
    await redis.zAdd(allTimeKey, { member: scoreData, score: gameData.score });
    await redis.zRemRangeByRank(allTimeKey, 0, -101); // Keep top 100

    // Store in time-period specific leaderboards
    const periods = ['daily', 'weekly', 'quarterly'];
    for (const period of periods) {
      const periodKey = getTimePeriodKey(period);
      const scoreKey = `leaderboard:${periodKey}:${gameData.game}`;
      await redis.zAdd(scoreKey, { member: scoreData, score: gameData.score });
      await redis.zRemRangeByRank(scoreKey, 0, -101); // Keep top 100

      // Set expiration for period-specific keys (30 days for daily, 90 days for weekly, 365 days for quarterly)
      let expirySeconds: number;
      if (period === 'daily') {
        expirySeconds = 30 * 24 * 60 * 60; // 30 days
      } else if (period === 'weekly') {
        expirySeconds = 90 * 24 * 60 * 60; // 90 days
      } else {
        expirySeconds = 365 * 24 * 60 * 60; // 365 days for quarterly
      }
      await redis.expire(scoreKey, expirySeconds);
    }

    // Update user's total stats
    const userStatsKey = `user:stats:${gameData.username}`;
    const currentStats = await redis.get(userStatsKey);
    let stats = currentStats ? JSON.parse(currentStats) : {
      totalScore: 0,
      gamesPlayed: 0,
      gameBreakdown: {},
      lastPlayed: 0,
    };

    stats.totalScore += gameData.score;
    stats.gamesPlayed += 1;
    stats.lastPlayed = Date.now();
    
    if (!stats.gameBreakdown[gameData.game]) {
      stats.gameBreakdown[gameData.game] = { plays: 0, totalScore: 0, bestScore: 0 };
    }
    
    stats.gameBreakdown[gameData.game].plays += 1;
    stats.gameBreakdown[gameData.game].totalScore += gameData.score;
    stats.gameBreakdown[gameData.game].bestScore = Math.max(
      stats.gameBreakdown[gameData.game].bestScore,
      gameData.score
    );

    await redis.set(userStatsKey, JSON.stringify(stats));

    // Store in global user leaderboard (total scores across all games)
    await redis.zAdd('leaderboard:global:total', {
      member: JSON.stringify({ username: gameData.username, totalScore: stats.totalScore, gamesPlayed: stats.gamesPlayed }),
      score: stats.totalScore,
    });
    await redis.zRemRangeByRank('leaderboard:global:total', 0, -101); // Keep top 100

    // Forward essential data to Cloudflare API if DEVVIT_API_KEY is configured
    const apiKey = process.env.DEVVIT_API_KEY;
    const enableCloudflareSync = process.env.ENABLE_CLOUDFLARE_SYNC !== 'false';
    
    if (apiKey && apiKey !== 'DEVVIT_API_KEY_PLACEHOLDER' && enableCloudflareSync) {
      try {
        // Send only essential game completion data (reduced payload)
        const essentialData = {
          username: gameData.username,
          game: gameData.game,
          score: gameData.score,
          timestamp: Date.now(),
          source: 'reddit-devvit',
          postId: gameData.postId,
        };

        const response = await fetch('https://michiganspots.com/api/analytics/game-complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
          },
          body: JSON.stringify(essentialData),
        });

        if (!response.ok) {
          console.warn(`Cloudflare sync failed with status: ${response.status}`);
        }
      } catch (err) {
        console.error('Failed to sync data to Cloudflare:', err);
        // Don't fail the request if Cloudflare sync fails
      }
    }

    res.json({
      status: 'success',
      message: 'Score recorded',
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to record analytics',
    });
  }
});

// AI Mod Tools - Batch Content Analysis
router.post('/api/ai-mod/batch-analyze', async (req, res): Promise<void> => {
  try {
    const { items, tool } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0 || !tool) {
      res.status(400).json({
        status: 'error',
        message: 'Items array and tool type are required',
      });
      return;
    }

    if (items.length > 50) {
      res.status(400).json({
        status: 'error',
        message: 'Maximum 50 items per batch',
      });
      return;
    }

    const aiApiKey = process.env.CLOUDFLARE_AI_API_KEY;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

    const results: any[] = [];

    // Process each item
    for (const item of items) {
      if (!item.text || !item.id) continue;

      try {
        let analysisResult;

        // Fallback simulation if Cloudflare AI not configured
        if (!aiApiKey || aiApiKey === 'PLACEHOLDER' || !accountId || accountId === 'PLACEHOLDER') {
          if (tool === 'content-analysis') {
            analysisResult = {
              tool: 'Content Analysis',
              toxicity: Math.random() * 0.3,
              profanity: Math.random() * 0.2,
              spam: Math.random() * 0.25,
              recommendation: Math.random() > 0.7 ? 'Remove' : 'Approve',
              simulated: true,
            };
          } else if (tool === 'sentiment') {
            analysisResult = {
              tool: 'Sentiment Analysis',
              positive: Math.random() * 0.8,
              negative: Math.random() * 0.4,
              neutral: Math.random() * 0.5,
              overall: Math.random() > 0.5 ? 'Positive' : 'Neutral',
              simulated: true,
            };
          } else if (tool === 'spam-detection') {
            analysisResult = {
              tool: 'Spam Detection',
              spamScore: Math.random() * 0.4,
              isSpam: Math.random() > 0.8,
              confidence: 0.85 + Math.random() * 0.14,
              simulated: true,
            };
          }
        } else {
          // Real Cloudflare AI implementation (simplified for batch)
          let prompt = '';
          if (tool === 'content-analysis') {
            prompt = `Analyze this text for content moderation. Rate toxicity (0-1), profanity (0-1), and spam likelihood (0-1). Provide a recommendation (Approve/Review/Remove).

Text: "${item.text.substring(0, 500)}"

Respond in JSON format:
{
  "toxicity": <number 0-1>,
  "profanity": <number 0-1>,
  "spam": <number 0-1>,
  "recommendation": "<Approve/Review/Remove>"
}`;
          }

          const aiResponse = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3-8b-instruct`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${aiApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                prompt,
                max_tokens: 256,
              }),
            }
          );

          if (aiResponse.ok) {
            const aiResult = await aiResponse.json();
            const responseText = aiResult.result?.response || aiResult.result;
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              analysisResult = JSON.parse(jsonMatch[0]);
            }
          }
        }

        results.push({
          id: item.id,
          text: item.text.substring(0, 100),
          result: analysisResult || { error: 'Failed to analyze' },
        });
      } catch (itemError) {
        console.error(`Error analyzing item ${item.id}:`, itemError);
        results.push({
          id: item.id,
          text: item.text.substring(0, 100),
          result: { error: 'Analysis failed' },
        });
      }
    }

    res.json({
      status: 'success',
      total: items.length,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('Batch analysis error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process batch analysis',
    });
  }
});

// AI Mod Tools - Content Analysis
router.post('/api/ai-mod/analyze', async (req, res): Promise<void> => {
  try {
    const { text, tool } = req.body;

    if (!text || !tool) {
      res.status(400).json({
        status: 'error',
        message: 'Text and tool type are required',
      });
      return;
    }

    const aiApiKey = process.env.CLOUDFLARE_AI_API_KEY;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

    // Fallback simulation if Cloudflare AI not configured
    if (!aiApiKey || aiApiKey === 'PLACEHOLDER' || !accountId || accountId === 'PLACEHOLDER') {
      console.warn('Cloudflare AI not configured for mod tools, using simulated analysis');

      // Simulated responses
      if (tool === 'content-analysis') {
        res.json({
          tool: 'Content Analysis',
          toxicity: Math.random() * 0.3,
          profanity: Math.random() * 0.2,
          spam: Math.random() * 0.25,
          recommendation: Math.random() > 0.7 ? 'Remove' : 'Approve',
          simulated: true,
        });
      } else if (tool === 'sentiment') {
        res.json({
          tool: 'Sentiment Analysis',
          positive: Math.random() * 0.8,
          negative: Math.random() * 0.4,
          neutral: Math.random() * 0.5,
          overall: Math.random() > 0.5 ? 'Positive' : 'Neutral',
          simulated: true,
        });
      } else if (tool === 'spam-detection') {
        res.json({
          tool: 'Spam Detection',
          spamScore: Math.random() * 0.4,
          isSpam: Math.random() > 0.8,
          confidence: 0.85 + Math.random() * 0.14,
          flags: ['Suspicious links', 'Repeated content'].filter(() => Math.random() > 0.5),
          simulated: true,
        });
      }
      return;
    }

    // Real Cloudflare AI implementation
    try {
      let prompt = '';
      if (tool === 'content-analysis') {
        prompt = `Analyze this text for content moderation. Rate toxicity (0-1), profanity (0-1), and spam likelihood (0-1). Provide a recommendation (Approve/Review/Remove).

Text: "${text}"

Respond in JSON format:
{
  "toxicity": <number 0-1>,
  "profanity": <number 0-1>,
  "spam": <number 0-1>,
  "recommendation": "<Approve/Review/Remove>"
}`;
      } else if (tool === 'sentiment') {
        prompt = `Analyze the sentiment of this text. Rate positive (0-1), negative (0-1), and neutral (0-1) sentiment. Determine overall sentiment (Positive/Negative/Neutral).

Text: "${text}"

Respond in JSON format:
{
  "positive": <number 0-1>,
  "negative": <number 0-1>,
  "neutral": <number 0-1>,
  "overall": "<Positive/Negative/Neutral>"
}`;
      } else if (tool === 'spam-detection') {
        prompt = `Detect if this text is spam. Rate spam score (0-1), determine if spam (true/false), confidence (0-1), and list any red flags.

Text: "${text}"

Respond in JSON format:
{
  "spamScore": <number 0-1>,
  "isSpam": <boolean>,
  "confidence": <number 0-1>,
  "flags": [<array of strings>]
}`;
      }

      const aiResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3-8b-instruct`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${aiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            max_tokens: 256,
          }),
        }
      );

      if (!aiResponse.ok) {
        throw new Error('Cloudflare AI request failed');
      }

      const aiResult = await aiResponse.json();

      // Parse AI response
      let parsedResult;
      try {
        const responseText = aiResult.result?.response || aiResult.result;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON in AI response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        // Fallback to simulated response
        if (tool === 'content-analysis') {
          parsedResult = {
            toxicity: 0.1,
            profanity: 0.05,
            spam: 0.1,
            recommendation: 'Approve',
          };
        } else if (tool === 'sentiment') {
          parsedResult = {
            positive: 0.6,
            negative: 0.2,
            neutral: 0.2,
            overall: 'Positive',
          };
        } else if (tool === 'spam-detection') {
          parsedResult = {
            spamScore: 0.1,
            isSpam: false,
            confidence: 0.9,
            flags: [],
          };
        }
      }

      const analysisResult = {
        tool: tool === 'content-analysis' ? 'Content Analysis' :
              tool === 'sentiment' ? 'Sentiment Analysis' : 'Spam Detection',
        ...parsedResult,
        simulated: false,
      };

      // Store moderation history in Redis
      try {
        const timestamp = Date.now();
        const historyEntry = JSON.stringify({
          tool,
          result: analysisResult,
          textPreview: text.substring(0, 100), // First 100 chars
          timestamp,
          moderator: context.userId || 'unknown',
        });

        // Store in multiple keys for different query patterns
        await redis.set(`mod:history:${timestamp}`, historyEntry);
        await redis.zAdd('mod:history:timeline', {
          member: historyEntry,
          score: timestamp,
        });

        // Keep only last 1000 entries
        await redis.zRemRangeByRank('mod:history:timeline', 0, -1001);
      } catch (historyError) {
        console.error('Failed to store moderation history:', historyError);
        // Don't fail the request if history storage fails
      }

      res.json(analysisResult);
    } catch (aiError) {
      console.error('Cloudflare AI error:', aiError);

      // Fallback on AI error
      if (tool === 'content-analysis') {
        res.json({
          tool: 'Content Analysis',
          toxicity: 0.1,
          profanity: 0.05,
          spam: 0.1,
          recommendation: 'Review',
          simulated: true,
          error: 'AI temporarily unavailable',
        });
      } else if (tool === 'sentiment') {
        res.json({
          tool: 'Sentiment Analysis',
          positive: 0.5,
          negative: 0.3,
          neutral: 0.2,
          overall: 'Neutral',
          simulated: true,
          error: 'AI temporarily unavailable',
        });
      } else {
        res.json({
          tool: 'Spam Detection',
          spamScore: 0.2,
          isSpam: false,
          confidence: 0.7,
          flags: [],
          simulated: true,
          error: 'AI temporarily unavailable',
        });
      }
    }
  } catch (error) {
    console.error('Mod tools analysis error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to analyze content',
    });
  }
});

// Photo Hunt - AI Photo Rating
router.post('/api/photo-hunt/analyze', async (req, res): Promise<void> => {
  try {
    const { image, username, gps, location } = req.body;

    if (!image) {
      res.status(400).json({
        status: 'error',
        message: 'Image is required',
      });
      return;
    }

    // Location is now OPTIONAL - Photo Hunt doesn't require it
    // Challenges feature (separate) will use GPS verification
    const locationData = location || gps;

    if (locationData && locationData.latitude && locationData.longitude) {
      // Import location validation
      const { isLocationInMichigan } = await import('../shared/types/challenges.js');

      // If location provided, log it (but don't validate)
      const tier = locationData.tier || 'gps';
      const source = locationData.source || 'device-gps';

      console.log(`Photo submission from ${username} at [${locationData.latitude}, ${locationData.longitude}]`);
      console.log(`Location tier: ${tier} (${source}) with accuracy ±${locationData.accuracy}m`);

      // Optional: Check if in Michigan (for logging/analytics only)
      if (isLocationInMichigan(locationData.latitude, locationData.longitude)) {
        console.log('Location is in Michigan');
      } else {
        console.log('Location is outside Michigan (but accepting submission)');
      }
    } else {
      console.log(`Photo submission from ${username} (no location data provided)`);
    }

    // Extract base64 data from data URI
    const base64Match = image.match(/^data:image\/[a-z]+;base64,(.+)$/);
    if (!base64Match) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid image format',
      });
      return;
    }

    const base64Image = base64Match[1];

    // Call Cloudflare AI for image analysis
    // NOTE: This requires CLOUDFLARE_AI_API_KEY and CLOUDFLARE_ACCOUNT_ID environment variables
    const aiApiKey = process.env.CLOUDFLARE_AI_API_KEY;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

    if (!aiApiKey || aiApiKey === 'PLACEHOLDER' || !accountId || accountId === 'PLACEHOLDER') {
      console.warn('Cloudflare AI not configured, using simulated ratings');

      // Simulated response (fallback for development/testing)
      const simulatedRating = {
        quality: Math.floor(Math.random() * 15) + 15, // 15-30
        michiganRelevance: Math.floor(Math.random() * 20) + 20, // 20-40
        landmarkBonus: Math.random() > 0.5 ? Math.floor(Math.random() * 20) + 10 : 0, // 0 or 10-30
        creativity: Math.floor(Math.random() * 10) + 10, // 10-20
      };

      simulatedRating.totalScore = simulatedRating.quality + simulatedRating.michiganRelevance +
                                   simulatedRating.landmarkBonus + simulatedRating.creativity;

      res.json({
        rating: {
          ...simulatedRating,
          feedback: 'Great photo! Keep exploring Michigan treasures!',
          detectedLandmark: simulatedRating.landmarkBonus > 0 ? 'Possible Michigan landmark detected' : undefined,
        },
      });
      return;
    }

    // Real Cloudflare AI implementation
    try {
      // Use Cloudflare AI Vision API for image analysis
      const aiResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/llava-hf/llava-1.5-7b-hf`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${aiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: `Analyze this photo and provide a detailed assessment for a Michigan treasure hunt game.
Rate the photo on:
1. Photo quality and composition (0-30 points): lighting, focus, framing
2. Michigan relevance (0-40 points): Does this show Michigan landmarks, nature, culture, or scenes?
3. Landmark identification (0-30 points bonus): Is this a recognizable Michigan landmark like Mackinac Island, Sleeping Bear Dunes, Detroit landmarks, University of Michigan, etc?
4. Creativity and uniqueness (0-20 points): Original perspective or interesting angle

Provide your response in this exact JSON format:
{
  "quality": <number 0-30>,
  "michiganRelevance": <number 0-40>,
  "landmarkBonus": <number 0-30>,
  "creativity": <number 0-20>,
  "feedback": "<brief encouraging feedback>",
  "detectedLandmark": "<landmark name or null>"
}`,
            image: [base64Image],
            max_tokens: 512,
          }),
        }
      );

      if (!aiResponse.ok) {
        throw new Error('Cloudflare AI request failed');
      }

      const aiResult = await aiResponse.json();

      // Parse AI response
      let parsedRating;
      try {
        // Extract JSON from AI response text
        const responseText = aiResult.result?.response || aiResult.result;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedRating = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI response, using defaults:', parseError);
        parsedRating = {
          quality: 20,
          michiganRelevance: 25,
          landmarkBonus: 0,
          creativity: 15,
          feedback: 'Nice photo! Our AI had trouble analyzing it, but we appreciate your submission!',
          detectedLandmark: null,
        };
      }

      // Calculate total score
      const totalScore = (parsedRating.quality || 0) +
                        (parsedRating.michiganRelevance || 0) +
                        (parsedRating.landmarkBonus || 0) +
                        (parsedRating.creativity || 0);

      // Check for challenge matches if landmark detected
      let matchedChallenges: any[] = [];
      if (parsedRating.detectedLandmark && username) {
        try {
          const { findChallengesForLandmark } = await import('../shared/types/challenges.js');
          matchedChallenges = findChallengesForLandmark(parsedRating.detectedLandmark);

          // Auto-update challenge progress for matched challenges
          if (matchedChallenges.length > 0 && gps) {
            const progressKey = `challenges:progress:${username}`;
            const progressData = await redis.get(progressKey);
            const progress = progressData ? JSON.parse(progressData) : {};

            for (const challenge of matchedChallenges) {
              if (!progress[challenge.id]) {
                progress[challenge.id] = {
                  challengeId: challenge.id,
                  completedLandmarks: [],
                  totalScore: 0,
                };
              }

              if (!progress[challenge.id].completedLandmarks.includes(parsedRating.detectedLandmark)) {
                progress[challenge.id].completedLandmarks.push(parsedRating.detectedLandmark);
                progress[challenge.id].totalScore += totalScore;

                const { isChallengeCompleted } = await import('../shared/types/challenges.js');
                if (isChallengeCompleted(challenge, progress[challenge.id].completedLandmarks)) {
                  progress[challenge.id].completedAt = Date.now();
                  progress[challenge.id].totalScore += challenge.bonusPoints;
                }
              }
            }

            await redis.set(progressKey, JSON.stringify(progress));
          }
        } catch (challengeError) {
          console.error('Challenge matching error:', challengeError);
          // Don't fail the photo analysis if challenge matching fails
        }
      }

      res.json({
        rating: {
          quality: parsedRating.quality || 0,
          michiganRelevance: parsedRating.michiganRelevance || 0,
          landmarkBonus: parsedRating.landmarkBonus || 0,
          creativity: parsedRating.creativity || 0,
          totalScore,
          feedback: parsedRating.feedback || 'Great Michigan photo!',
          detectedLandmark: parsedRating.detectedLandmark || undefined,
          matchedChallenges: matchedChallenges.map(c => ({
            id: c.id,
            name: c.name,
            icon: c.icon,
            bonusPoints: c.bonusPoints,
          })),
        },
      });
    } catch (aiError) {
      console.error('Cloudflare AI error:', aiError);

      // Fallback to simulated response if AI fails
      const fallbackRating = {
        quality: 22,
        michiganRelevance: 30,
        landmarkBonus: 0,
        creativity: 16,
      };

      res.json({
        rating: {
          ...fallbackRating,
          totalScore: 68,
          feedback: 'Beautiful photo! (AI analysis temporarily unavailable)',
          detectedLandmark: undefined,
        },
      });
    }
  } catch (error) {
    console.error('Photo analysis error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to analyze photo',
    });
  }
});

// Geocaching API Endpoints - OpenCaching.us Integration

// Search for geocaches near a location
router.get('/api/geocaches/search', async (req, res): Promise<void> => {
  try {
    const { latitude, longitude, radius, limit } = req.query;

    if (!latitude || !longitude) {
      res.status(400).json({
        status: 'error',
        message: 'Latitude and longitude are required',
      });
      return;
    }

    const {
      searchNearbyGeocaches,
    } = await import('./services/geocaching.js');

    const lat = parseFloat(latitude as string);
    const lon = parseFloat(longitude as string);
    const radiusMeters = radius ? parseInt(radius as string) : 10000; // Default 10km
    const limitNum = limit ? parseInt(limit as string) : 20;

    const caches = await searchNearbyGeocaches(lat, lon, radiusMeters, limitNum);

    res.json({
      status: 'success',
      caches,
      count: caches.length,
    });
  } catch (error) {
    console.error('Geocache search error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to search geocaches',
      caches: [],
    });
  }
});

// Get all Michigan geocaches (or filtered subset)
router.get('/api/geocaches/michigan', async (req, res): Promise<void> => {
  try {
    const { limit, minDifficulty, maxDifficulty, minTerrain, maxTerrain, type } = req.query;

    const {
      searchMichiganGeocaches,
    } = await import('./services/geocaching.js');

    const params: any = {};
    if (limit) params.limit = parseInt(limit as string);
    if (minDifficulty) params.minDifficulty = parseFloat(minDifficulty as string);
    if (maxDifficulty) params.maxDifficulty = parseFloat(maxDifficulty as string);
    if (minTerrain) params.minTerrain = parseFloat(minTerrain as string);
    if (maxTerrain) params.maxTerrain = parseFloat(maxTerrain as string);
    if (type) params.type = type as string;

    const caches = await searchMichiganGeocaches(params);

    res.json({
      status: 'success',
      caches,
      count: caches.length,
    });
  } catch (error) {
    console.error('Michigan geocache search error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to search Michigan geocaches',
      caches: [],
    });
  }
});

// Get details for a specific geocache
router.get('/api/geocaches/:code', async (req, res): Promise<void> => {
  try {
    const { code } = req.params;

    if (!code) {
      res.status(400).json({
        status: 'error',
        message: 'Cache code is required',
      });
      return;
    }

    const {
      getCacheDetails,
    } = await import('./services/geocaching.js');

    const cache = await getCacheDetails(code);

    if (!cache) {
      res.status(404).json({
        status: 'error',
        message: 'Geocache not found',
      });
      return;
    }

    res.json({
      status: 'success',
      cache,
    });
  } catch (error) {
    console.error(`Geocache details error for ${req.params.code}:`, error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get geocache details',
    });
  }
});

// Verify geocache visit and award points
router.post('/api/geocaches/visit', async (req, res): Promise<void> => {
  try {
    const { username, cacheCode, userLocation, photoScore } = req.body;

    if (!username || !cacheCode || !userLocation) {
      res.status(400).json({
        status: 'error',
        message: 'Username, cache code, and user location are required',
      });
      return;
    }

    const {
      getCacheDetails,
      verifyGeocacheProximity,
      calculateGeocacheBonus,
    } = await import('./services/geocaching.js');

    // Get cache details
    const cache = await getCacheDetails(cacheCode);
    if (!cache) {
      res.status(404).json({
        status: 'error',
        message: 'Geocache not found',
      });
      return;
    }

    // Verify proximity (161 meters / 0.1 miles)
    const verified = verifyGeocacheProximity(
      userLocation.latitude,
      userLocation.longitude,
      cache.location.latitude,
      cache.location.longitude,
      161
    );

    // Calculate geocache bonus
    const geocacheBonus = calculateGeocacheBonus(cache, verified);

    // Calculate total score (photo score + geocache bonus)
    const totalScore = (photoScore || 0) + geocacheBonus;

    // Record geocache visit
    const visit = {
      username,
      cacheCode: cache.code,
      cacheName: cache.name,
      visitedAt: Date.now(),
      photoSubmitted: !!photoScore,
      pointsEarned: totalScore,
      location: userLocation,
      verified,
    };

    // Save visit to Redis
    const visitsKey = `geocache:visits:${username}`;
    const visitsData = await redis.get(visitsKey);
    const visits = visitsData ? JSON.parse(visitsData) : [];
    visits.push(visit);
    await redis.set(visitsKey, JSON.stringify(visits));

    // Track unique caches visited
    const uniqueCachesKey = `geocache:unique:${username}`;
    await redis.sAdd(uniqueCachesKey, cacheCode);

    // Update user's total geocaching score
    const scoreKey = `geocache:score:${username}`;
    const currentScore = await redis.get(scoreKey);
    const newScore = (currentScore ? parseInt(currentScore) : 0) + totalScore;
    await redis.set(scoreKey, newScore.toString());

    res.json({
      status: 'success',
      visit,
      geocacheBonus,
      totalScore,
      verified,
      message: verified
        ? 'Geocache visit verified!'
        : 'Visit recorded (location not verified)',
    });
  } catch (error) {
    console.error('Geocache visit error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to record geocache visit',
    });
  }
});

// Get user geocaching statistics
router.get('/api/geocaches/stats/:username', async (req, res): Promise<void> => {
  try {
    const { username } = req.params;

    // Get all visits
    const visitsKey = `geocache:visits:${username}`;
    const visits = await redis.lRange(visitsKey, 0, -1);
    const parsedVisits = visits.map((v) => JSON.parse(v));

    // Get unique caches
    const uniqueKey = `geocache:unique:${username}`;
    const uniqueCaches = await redis.sMembers(uniqueKey);

    // Get total score
    const scoreKey = `geocache:score:${username}`;
    const totalScore = parseInt((await redis.get(scoreKey)) || '0');

    // Calculate difficulty and terrain statistics
    const difficultyStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const terrainStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    parsedVisits.forEach((visit) => {
      const difficulty = Math.round(visit.cache.difficulty);
      const terrain = Math.round(visit.cache.terrain);

      if (difficulty >= 1 && difficulty <= 5) {
        difficultyStats[difficulty as keyof typeof difficultyStats]++;
      }
      if (terrain >= 1 && terrain <= 5) {
        terrainStats[terrain as keyof typeof terrainStats]++;
      }
    });

    res.json({
      status: 'success',
      data: {
        username,
        totalFinds: parsedVisits.length,
        uniqueCaches: uniqueCaches.length,
        totalPoints: totalScore,
        difficultyStats,
        terrainStats,
        recentVisits: parsedVisits.slice(0, 10),
      },
    });
  } catch (error) {
    console.error('Geocache stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch geocache statistics',
    });
  }
});

// Log a geocache find or DNF
router.post('/api/geocaches/log', async (req, res): Promise<void> => {
  try {
    const { username, cacheCode, logType, comment, latitude, longitude } = req.body;

    if (!username || !cacheCode || !logType) {
      res.status(400).json({
        status: 'error',
        message: 'Missing required fields: username, cacheCode, logType',
      });
      return;
    }

    if (!['found', 'dnf'].includes(logType)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid logType. Must be "found" or "dnf"',
      });
      return;
    }

    // Get cache details
    const cache = await getCacheDetails(cacheCode);
    if (!cache) {
      res.status(404).json({
        status: 'error',
        message: 'Cache not found',
      });
      return;
    }

    // Verify GPS proximity if coordinates provided
    let verified = false;
    if (latitude && longitude) {
      verified = verifyGeocacheProximity(
        latitude,
        longitude,
        cache.location.latitude,
        cache.location.longitude
      );
    }

    // Calculate points (only for "found" logs)
    let points = 0;
    if (logType === 'found') {
      points = calculateGeocacheBonus(cache, verified);
    }

    // Create log entry
    const logEntry = {
      username,
      cacheCode,
      cacheName: cache.name,
      logType,
      comment: comment || '',
      verified,
      points,
      timestamp: new Date().toISOString(),
      latitude: latitude || null,
      longitude: longitude || null,
    };

    // Store log in Redis
    const logsKey = `geocache:logs:${username}`;
    await redis.lPush(logsKey, JSON.stringify(logEntry));

    // Update statistics if "found"
    if (logType === 'found') {
      // Add to unique caches set
      const uniqueKey = `geocache:unique:${username}`;
      await redis.sAdd(uniqueKey, cacheCode);

      // Update total score
      const scoreKey = `geocache:score:${username}`;
      await redis.incrBy(scoreKey, points);
    }

    res.json({
      status: 'success',
      data: {
        logEntry,
        points,
        verified,
        message: logType === 'found'
          ? `Congratulations! You found ${cache.name}!`
          : `Better luck next time at ${cache.name}!`,
      },
    });
  } catch (error) {
    console.error('Geocache log error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to log geocache find',
    });
  }
});

// Get moderation history
router.get('/api/mod-history', async (req, res): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    // Get recent moderation history from Redis sorted set
    const historyEntries = await redis.zRange('mod:history:timeline', 0, limit - 1, {
      reverse: true,
      by: 'score',
    });

    const parsedHistory = historyEntries.map((entry) => JSON.parse(entry.member));

    // Calculate summary statistics
    const stats = {
      totalAnalyses: parsedHistory.length,
      byTool: {
        'content-analysis': 0,
        'sentiment': 0,
        'spam-detection': 0,
      },
      averageToxicity: 0,
      averageSpamScore: 0,
      recommendations: {
        Approve: 0,
        Review: 0,
        Remove: 0,
      },
    };

    let toxicitySum = 0;
    let toxicityCount = 0;
    let spamSum = 0;
    let spamCount = 0;

    parsedHistory.forEach((entry) => {
      stats.byTool[entry.tool as keyof typeof stats.byTool]++;

      if (entry.result.toxicity !== undefined) {
        toxicitySum += entry.result.toxicity;
        toxicityCount++;
      }

      if (entry.result.spamScore !== undefined) {
        spamSum += entry.result.spamScore;
        spamCount++;
      }

      if (entry.result.recommendation) {
        stats.recommendations[entry.result.recommendation as keyof typeof stats.recommendations]++;
      }
    });

    stats.averageToxicity = toxicityCount > 0 ? toxicitySum / toxicityCount : 0;
    stats.averageSpamScore = spamCount > 0 ? spamSum / spamCount : 0;

    res.json({
      history: parsedHistory,
      stats,
    });
  } catch (error) {
    console.error('Mod history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to load moderation history',
      history: [],
      stats: null,
    });
  }
});

// Helper function to get time period key suffix
function getTimePeriodKey(period: string): string {
  const now = new Date();
  switch (period) {
    case 'daily':
      return `daily:${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    case 'weekly':
      const weekNum = Math.ceil((now.getDate() + 6 - now.getDay()) / 7);
      return `weekly:${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
    case 'quarterly':
      // Q1: Jan-Mar (months 0-2), Q2: Apr-Jun (3-5), Q3: Jul-Sep (6-8), Q4: Oct-Dec (9-11)
      const quarter = Math.floor(now.getMonth() / 3) + 1;
      return `quarterly:${now.getFullYear()}-Q${quarter}`;
    case 'monthly':
      return `monthly:${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    default:
      return 'alltime';
  }
}

// Get leaderboard data with time periods
router.get('/api/leaderboard/:game', async (req, res): Promise<void> => {
  try {
    const game = req.params.game === 'all' ? '*' : req.params.game;
    const period = (req.query.period as string) || 'alltime'; // daily, weekly, monthly, alltime
    const limit = parseInt(req.query.limit as string) || 10;

    const periodKey = getTimePeriodKey(period);
    const scoreKey = game === '*'
      ? `leaderboard:${periodKey}:*`
      : `leaderboard:${periodKey}:${game}`;

    // Get top scores for the period
    const topScores = await redis.zRange(scoreKey, 0, limit - 1, { reverse: true, by: 'score' });

    const parsedScores = topScores.map((score) => JSON.parse(score.member));

    res.json({
      topScores: parsedScores,
      period,
      periodKey,
      total: parsedScores.length,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to load leaderboard',
      topScores: [],
    });
  }
});

// Get all-time and period leaderboards combined
router.get('/api/leaderboard/:game/combined', async (req, res): Promise<void> => {
  try {
    const game = req.params.game === 'all' ? '*' : req.params.game;
    const periods = ['daily', 'weekly', 'quarterly', 'alltime'];

    const leaderboards: any = {};

    for (const period of periods) {
      try {
        const periodKey = getTimePeriodKey(period);
        const scoreKey = game === '*'
          ? `leaderboard:${periodKey}:*`
          : `leaderboard:${periodKey}:${game}`;

        const scores = await redis.zRange(scoreKey, 0, 9, { reverse: true, by: 'score' });
        leaderboards[period] = scores.map((score) => JSON.parse(score.member));
      } catch (periodError) {
        console.error(`Error loading ${period} leaderboard:`, periodError);
        leaderboards[period] = [];
      }
    }

    res.json({
      leaderboards,
      currentPeriod: {
        daily: getTimePeriodKey('daily'),
        weekly: getTimePeriodKey('weekly'),
        quarterly: getTimePeriodKey('quarterly'),
      },
    });
  } catch (error) {
    console.error('Combined leaderboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to load combined leaderboards',
    });
  }
});

// Get all challenges
router.get('/api/challenges', async (_req, res): Promise<void> => {
  try {
    // Import challenges dynamically to avoid build issues
    const { MICHIGAN_CHALLENGES } = await import('../shared/types/challenges.js');
    res.json({ challenges: MICHIGAN_CHALLENGES });
  } catch (error) {
    console.error('Failed to load challenges:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to load challenges',
      challenges: [],
    });
  }
});

// Get daily trivia questions
router.get('/api/trivia/daily', async (req, res): Promise<void> => {
  try {
    // Fallback questions if import fails
    const fallbackQuestions = [
      {
        id: 'capital-1',
        question: 'What is the capital of Michigan?',
        options: ['Detroit', 'Lansing', 'Grand Rapids', 'Ann Arbor'],
        correctIndex: 1,
        explanation: 'Lansing has been Michigan\'s capital since 1847.',
        category: 'Geography',
        difficulty: 'easy'
      },
      {
        id: 'great-lakes-1',
        question: 'Which Great Lake does NOT border Michigan?',
        options: ['Lake Superior', 'Lake Michigan', 'Lake Erie', 'Lake Ontario'],
        correctIndex: 3,
        explanation: 'Michigan borders Lakes Superior, Michigan, Huron, and Erie.',
        category: 'Geography',
        difficulty: 'medium'
      },
      {
        id: 'largest-city-1',
        question: 'What is Michigan\'s largest city?',
        options: ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights'],
        correctIndex: 0,
        explanation: 'Detroit is Michigan\'s largest city and was once the 4th largest in the US.',
        category: 'Geography',
        difficulty: 'easy'
      },
      {
        id: 'university-1',
        question: 'Which university is located in Ann Arbor?',
        options: ['Michigan State', 'University of Michigan', 'Wayne State', 'Western Michigan'],
        correctIndex: 1,
        explanation: 'The University of Michigan is located in Ann Arbor.',
        category: 'Education',
        difficulty: 'easy'
      },
      {
        id: 'nickname-1',
        question: 'What is Michigan\'s most common nickname?',
        options: ['The Great Lake State', 'The Wolverine State', 'The Mitten State', 'The Motor State'],
        correctIndex: 1,
        explanation: 'Michigan is commonly known as the Wolverine State.',
        category: 'General',
        difficulty: 'medium'
      }
    ];

    try {
      const { getDailyQuestionSet, MICHIGAN_TRIVIA_QUESTIONS } = await import('../shared/types/trivia.js');
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      const dailyQuestions = getDailyQuestionSet(date);
      
      res.json({
        status: 'success',
        date: date.toISOString().split('T')[0],
        questions: dailyQuestions,
        totalAvailable: MICHIGAN_TRIVIA_QUESTIONS.length,
      });
    } catch (importError) {
      console.warn('Trivia import failed, using fallback questions:', importError);
      res.json({
        status: 'success',
        date: new Date().toISOString().split('T')[0],
        questions: fallbackQuestions,
        totalAvailable: fallbackQuestions.length,
        fallback: true,
      });
    }
  } catch (error) {
    console.error('Failed to load daily trivia:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to load daily trivia questions',
      questions: [],
    });
  }
});

// Generate new trivia questions using AI
router.post('/api/trivia/generate', async (req, res): Promise<void> => {
  try {
    const { category, difficulty, count = 1, theme } = req.body;
    
    const aiApiKey = process.env.CLOUDFLARE_AI_API_KEY;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

    if (!aiApiKey || aiApiKey === 'PLACEHOLDER' || !accountId || accountId === 'PLACEHOLDER') {
      console.warn('Cloudflare AI not configured, using fallback questions');
      
      // Fallback: return basic questions if import fails
      let questions = [];
      try {
        const { getQuestionsByCategory, getQuestionsByDifficulty, getRandomQuestions } = await import('../shared/types/trivia.js');
        
        if (category) {
          questions = getQuestionsByCategory(category);
        } else if (difficulty) {
          questions = getQuestionsByDifficulty(difficulty);
        } else {
          questions = getRandomQuestions(count);
        }
      } catch (importError) {
        console.warn('Trivia import failed in generation, using basic fallback:', importError);
        questions = [
          {
            id: 'fallback-1',
            question: 'What is the capital of Michigan?',
            options: ['Detroit', 'Lansing', 'Grand Rapids', 'Ann Arbor'],
            correctIndex: 1,
            explanation: 'Lansing has been Michigan\'s capital since 1847.',
            category: 'Geography',
            difficulty: 'easy'
          }
        ];
      }

      
      res.json({
        status: 'success',
        questions: questions.slice(0, count),
        generated: false,
        message: 'Using existing question database',
      });
      return;
    }

    // AI-powered question generation
    const prompt = `Generate ${count} Michigan trivia question(s) in JSON format. 

Requirements:
- Category: ${category || 'any Michigan topic'}
- Difficulty: ${difficulty || 'medium'}
- Theme: ${theme || 'general Michigan knowledge'}

Each question should follow this exact JSON structure:
{
  "id": "unique-id",
  "question": "Question text ending with ?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "explanation": "Detailed explanation of the correct answer",
  "category": "${category || 'General'}",
  "difficulty": "${difficulty || 'medium'}"
}

Focus on interesting, lesser-known Michigan facts. Include specific details like dates, numbers, and locations. Make questions engaging and educational.

Topics to consider:
- Michigan history and founding
- Great Lakes geography and facts
- Famous Michigan landmarks and attractions
- Michigan industries (automotive, agriculture, tourism)
- Michigan universities and education
- Michigan sports teams and achievements
- Michigan culture, food, and traditions
- Michigan nature, wildlife, and parks
- Famous people from Michigan
- Unique Michigan laws or customs

Return only valid JSON array of question objects.`;

    try {
      const aiResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3-8b-instruct`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${aiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            max_tokens: 1024,
          }),
        }
      );

      if (!aiResponse.ok) {
        throw new Error('Cloudflare AI request failed');
      }

      const aiResult = await aiResponse.json();
      const responseText = aiResult.result?.response || aiResult.result;
      
      // Extract JSON from AI response
      let generatedQuestions = [];
      try {
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          generatedQuestions = JSON.parse(jsonMatch[0]);
        } else {
          // Try to find individual question objects
          const questionMatches = responseText.match(/\{[\s\S]*?\}/g);
          if (questionMatches) {
            generatedQuestions = questionMatches.map(match => JSON.parse(match));
          }
        }
      } catch (parseError) {
        console.error('Failed to parse AI-generated questions:', parseError);
        throw new Error('Invalid AI response format');
      }

      // Validate and store generated questions
      const validQuestions = generatedQuestions.filter(q => 
        q.question && q.options && Array.isArray(q.options) && 
        q.options.length === 4 && typeof q.correctIndex === 'number' &&
        q.correctIndex >= 0 && q.correctIndex < 4 && q.explanation
      );

      if (validQuestions.length === 0) {
        throw new Error('No valid questions generated');
      }

      // Store generated questions in Redis for future use
      const timestamp = Date.now();
      for (const question of validQuestions) {
        question.id = question.id || `ai-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
        question.dateAdded = new Date().toISOString();
        question.source = 'ai-generated';
        
        await redis.set(`trivia:generated:${question.id}`, JSON.stringify(question));
        await redis.zAdd('trivia:generated:timeline', {
          member: JSON.stringify(question),
          score: timestamp,
        });
      }

      // Keep only last 1000 generated questions
      await redis.zRemRangeByRank('trivia:generated:timeline', 0, -1001);

      res.json({
        status: 'success',
        questions: validQuestions,
        generated: true,
        count: validQuestions.length,
        message: `Generated ${validQuestions.length} new Michigan trivia questions`,
      });

    } catch (aiError) {
      console.error('AI question generation error:', aiError);
      
      // Fallback to basic questions
      let fallbackQuestions = [];
      try {
        const { getRandomQuestions } = await import('../shared/types/trivia.js');
        fallbackQuestions = getRandomQuestions(count);
      } catch (importError) {
        console.warn('Trivia import failed in AI fallback:', importError);
        fallbackQuestions = [
          {
            id: 'ai-fallback-1',
            question: 'What is Michigan\'s largest city?',
            options: ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights'],
            correctIndex: 0,
            explanation: 'Detroit is Michigan\'s largest city.',
            category: 'Geography',
            difficulty: 'easy'
          }
        ];
      }
      
      res.json({
        status: 'success',
        questions: fallbackQuestions,
        generated: false,
        message: 'AI temporarily unavailable, using existing questions',
        error: aiError.message,
      });
    }
  } catch (error) {
    console.error('Trivia generation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate trivia questions',
    });
  }
});

// Get AI-generated questions from storage
router.get('/api/trivia/generated', async (req, res): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    
    const generatedQuestions = await redis.zRange('trivia:generated:timeline', 0, limit - 1, {
      reverse: true,
      by: 'score',
    });

    const questions = generatedQuestions.map(entry => JSON.parse(entry.member));

    res.json({
      status: 'success',
      questions,
      total: questions.length,
    });
  } catch (error) {
    console.error('Failed to get generated questions:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to load generated questions',
      questions: [],
    });
  }
});

// Get user's challenge progress
router.get('/api/challenges/progress/:username', async (req, res): Promise<void> => {
  try {
    const { username } = req.params;
    const progressKey = `challenges:progress:${username}`;

    const progressData = await redis.get(progressKey);
    const progress = progressData ? JSON.parse(progressData) : {};

    res.json({ progress });
  } catch (error) {
    console.error('Failed to load challenge progress:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to load challenge progress',
      progress: {},
    });
  }
});

// Update challenge progress
router.post('/api/challenges/progress', async (req, res): Promise<void> => {
  try {
    const { username, challengeId, landmarkName, photoScore, gps } = req.body;

    if (!username || !challengeId || !landmarkName) {
      res.status(400).json({
        status: 'error',
        message: 'Missing required fields',
      });
      return;
    }

    const progressKey = `challenges:progress:${username}`;
    const progressData = await redis.get(progressKey);
    const progress = progressData ? JSON.parse(progressData) : {};

    // Initialize challenge progress if it doesn't exist
    if (!progress[challengeId]) {
      progress[challengeId] = {
        challengeId,
        completedLandmarks: [],
        totalScore: 0,
      };
    }

    // Add landmark if not already completed
    if (!progress[challengeId].completedLandmarks.includes(landmarkName)) {
      progress[challengeId].completedLandmarks.push(landmarkName);
      progress[challengeId].totalScore += photoScore || 0;

      // Check if challenge is completed
      const { MICHIGAN_CHALLENGES, isChallengeCompleted } = await import('../shared/types/challenges.js');
      const challenge = MICHIGAN_CHALLENGES.find(c => c.id === challengeId);

      if (challenge && isChallengeCompleted(challenge, progress[challengeId].completedLandmarks)) {
        progress[challengeId].completedAt = Date.now();
        progress[challengeId].totalScore += challenge.bonusPoints;
      }

      // Save progress
      await redis.set(progressKey, JSON.stringify(progress));

      // Store completion event in timeline
      const completionEvent = {
        username,
        challengeId,
        landmarkName,
        timestamp: Date.now(),
        gps,
      };
      await redis.zAdd('challenges:completions', {
        member: JSON.stringify(completionEvent),
        score: Date.now(),
      });

      // Sync essential challenge progress to Cloudflare (reduced payload)
      const apiKey = process.env.DEVVIT_API_KEY;
      const enableCloudflareSync = process.env.ENABLE_CLOUDFLARE_SYNC !== 'false';
      
      if (apiKey && apiKey !== 'DEVVIT_API_KEY_PLACEHOLDER' && enableCloudflareSync) {
        try {
          const essentialProgress = {
            username,
            challengeId,
            landmarkName,
            photoScore: photoScore || 0,
            challengeCompleted: !!progress[challengeId].completedAt,
            timestamp: Date.now(),
            source: 'reddit-devvit',
          };

          const response = await fetch('https://michiganspots.com/api/challenges/sync-progress', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': apiKey,
            },
            body: JSON.stringify(essentialProgress),
          });

          if (!response.ok) {
            console.warn(`Challenge sync failed with status: ${response.status}`);
          }
        } catch (err) {
          console.error('Failed to sync challenge progress to Cloudflare:', err);
        }
      }

      res.json({
        status: 'success',
        progress: progress[challengeId],
        challengeCompleted: !!progress[challengeId].completedAt,
      });
    } else {
      res.json({
        status: 'already_completed',
        message: 'Landmark already completed for this challenge',
        progress: progress[challengeId],
      });
    }
  } catch (error) {
    console.error('Failed to update challenge progress:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update challenge progress',
    });
  }
});

// Get challenge leaderboard
router.get('/api/challenges/leaderboard', async (_req, res): Promise<void> => {
  try {
    const { MICHIGAN_CHALLENGES } = await import('../shared/types/challenges.js');

    // Get all users with challenge progress
    const keys = await redis.keys('challenges:progress:*');
    const leaderboard: Array<{ username: string; totalChallenges: number; totalScore: number }> = [];

    for (const key of keys) {
      const username = key.replace('challenges:progress:', '');
      const progressData = await redis.get(key);
      if (progressData) {
        const progress = JSON.parse(progressData);
        const completedChallenges = Object.values(progress).filter((p: any) => p.completedAt);
        const totalScore = completedChallenges.reduce((sum: number, p: any) => sum + p.totalScore, 0);

        leaderboard.push({
          username,
          totalChallenges: completedChallenges.length,
          totalScore,
        });
      }
    }

    // Sort by total score descending
    leaderboard.sort((a, b) => b.totalScore - a.totalScore);

    res.json({
      leaderboard: leaderboard.slice(0, 50), // Top 50
      totalChallenges: MICHIGAN_CHALLENGES.length,
    });
  } catch (error) {
    console.error('Failed to load challenge leaderboard:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to load challenge leaderboard',
      leaderboard: [],
    });
  }
});

// Challenge Matching endpoint - finds which challenges a landmark contributes to
router.post('/api/challenges/match', async (req, res): Promise<void> => {
  try {
    const { landmarkName, username } = req.body;

    if (!landmarkName || !username) {
      res.status(400).json({
        status: 'error',
        message: 'Landmark name and username are required',
      });
      return;
    }

    // Find matching challenges (imported from challenges.ts)
    const { findChallengesForLandmark, MICHIGAN_CHALLENGES } = await import('../shared/types/challenges.js');
    const matchedChallenges = findChallengesForLandmark(landmarkName);

    if (matchedChallenges.length === 0) {
      res.json({
        status: 'success',
        matchedChallenges: [],
      });
      return;
    }

    // Get user's current progress
    const progressKey = `challenge:progress:${username}`;
    const progressData = await redis.get(progressKey);
    let userProgress: any[] = [];

    if (progressData) {
      try {
        userProgress = JSON.parse(progressData as string);
      } catch {
        userProgress = [];
      }
    }

    // Update progress for each matched challenge
    const challengeResults = matchedChallenges.map((challenge) => {
      // Find existing progress or create new
      let progress = userProgress.find((p) => p.challengeId === challenge.id);

      if (!progress) {
        progress = {
          challengeId: challenge.id,
          completedLandmarks: [],
          totalScore: 0,
        };
        userProgress.push(progress);
      }

      // Add landmark if not already completed
      if (!progress.completedLandmarks.includes(landmarkName)) {
        progress.completedLandmarks.push(landmarkName);

        // Check if challenge is now complete
        if (progress.completedLandmarks.length >= challenge.requiredCount && !progress.completedAt) {
          progress.completedAt = Date.now();
          progress.totalScore += challenge.bonusPoints;
        }
      }

      return {
        challengeId: challenge.id,
        challengeName: challenge.name,
        challengeIcon: challenge.icon,
        progress: progress.completedLandmarks.length,
        required: challenge.requiredCount,
        completed: !!progress.completedAt,
        bonusPoints: challenge.bonusPoints,
      };
    });

    // Save updated progress
    await redis.set(progressKey, JSON.stringify(userProgress));

    res.json({
      status: 'success',
      matchedChallenges: challengeResults,
    });
  } catch (error) {
    console.error('Failed to match challenges:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to match challenges',
    });
  }
});

// Challenge proximity verification endpoint - Verify user is at landmark
router.post('/api/challenges/verify-location', async (req, res): Promise<void> => {
  try {
    const { username, latitude, longitude, landmarkName, radiusMeters } = req.body;

    if (!username || !latitude || !longitude || !landmarkName) {
      res.status(400).json({
        status: 'error',
        message: 'Username, latitude, longitude, and landmarkName are required',
      });
      return;
    }

    // Import proximity verification utilities
    const { verifyProximity, findChallengesForLandmark, MICHIGAN_CHALLENGES } = await import(
      '../shared/types/challenges.js'
    );

    // Verify user is within proximity of landmark (default 1000m = 1km)
    const verification = verifyProximity(
      parseFloat(latitude),
      parseFloat(longitude),
      landmarkName,
      radiusMeters ? parseInt(radiusMeters) : 1000
    );

    if (!verification.verified) {
      res.json({
        status: 'not_verified',
        verified: false,
        distance: verification.distance,
        message: verification.message,
        landmark: verification.landmark,
      });
      return;
    }

    // User is verified at the landmark - update challenge progress
    const progressKey = `challenges:progress:${username}`;
    const progressData = await redis.get(progressKey);
    let userProgress: any[] = [];

    if (progressData) {
      try {
        userProgress = JSON.parse(progressData as string);
      } catch {
        userProgress = [];
      }
    }

    // Find challenges that include this landmark
    const matchedChallenges = findChallengesForLandmark(landmarkName);

    const challengeResults = matchedChallenges.map((challenge) => {
      // Find existing progress or create new
      let progress = userProgress.find((p) => p.challengeId === challenge.id);

      if (!progress) {
        progress = {
          challengeId: challenge.id,
          completedLandmarks: [],
          totalScore: 0,
        };
        userProgress.push(progress);
      }

      // Add landmark if not already completed
      let newlyCompleted = false;
      let challengeCompleted = false;

      if (!progress.completedLandmarks.includes(landmarkName)) {
        progress.completedLandmarks.push(landmarkName);
        newlyCompleted = true;

        // Check if challenge is now complete
        if (progress.completedLandmarks.length >= challenge.requiredCount && !progress.completedAt) {
          progress.completedAt = Date.now();
          progress.totalScore += challenge.bonusPoints;
          challengeCompleted = true;
        }
      }

      return {
        challengeId: challenge.id,
        challengeName: challenge.name,
        challengeIcon: challenge.icon,
        progress: progress.completedLandmarks.length,
        required: challenge.requiredCount,
        completed: !!progress.completedAt,
        bonusPoints: challenge.bonusPoints,
        newlyCompleted,
        challengeCompleted,
      };
    });

    // Save updated progress
    await redis.set(progressKey, JSON.stringify(userProgress));

    res.json({
      status: 'success',
      verified: true,
      distance: verification.distance,
      message: verification.message,
      landmark: verification.landmark,
      matchedChallenges: challengeResults,
    });
  } catch (error) {
    console.error('Failed to verify location:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify location',
    });
  }
});

// IP Geolocation fallback endpoint (Tier 2 location verification)
router.post('/api/location/verify-ip', async (req, res): Promise<void> => {
  try {
    // Get client IP address from request
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    // For development/testing, allow override
    const testIP = req.body.testIP;
    const ipToCheck = testIP || (Array.isArray(clientIP) ? clientIP[0] : clientIP);

    console.log('IP geolocation request for:', ipToCheck);

    // Call free IP geolocation service (ip-api.com - no key required)
    // Rate limit: 45 requests per minute
    const geoResponse = await fetch(`http://ip-api.com/json/${ipToCheck}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,query`);

    if (!geoResponse.ok) {
      res.status(500).json({
        status: 'error',
        message: 'IP geolocation service unavailable',
        tier: 'ip',
      });
      return;
    }

    const geoData = await geoResponse.json();

    if (geoData.status === 'fail') {
      res.status(400).json({
        status: 'error',
        message: geoData.message || 'Invalid IP address',
        tier: 'ip',
      });
      return;
    }

    // Check if location is in United States and Michigan
    const isUSA = geoData.countryCode === 'US';
    const isMichigan = geoData.region === 'MI' || geoData.regionName === 'Michigan';

    // Import location validation
    const { isLocationInMichigan } = await import('../shared/types/challenges.js');

    // Validate coordinates are in Michigan bounds
    const inMichiganBounds = isLocationInMichigan(geoData.lat, geoData.lon);

    if (!isUSA || !isMichigan || !inMichiganBounds) {
      res.json({
        status: 'not_verified',
        verified: false,
        tier: 'ip',
        message: `IP location detected: ${geoData.city}, ${geoData.regionName}. You must be in Michigan to participate.`,
        location: {
          city: geoData.city,
          region: geoData.regionName,
          country: geoData.country,
          latitude: geoData.lat,
          longitude: geoData.lon,
        },
      });
      return;
    }

    // User is in Michigan (based on IP)
    res.json({
      status: 'success',
      verified: true,
      tier: 'ip',
      message: `Approximate location verified: ${geoData.city}, Michigan`,
      location: {
        city: geoData.city,
        region: geoData.regionName,
        latitude: geoData.lat,
        longitude: geoData.lon,
        accuracy: 10000, // ~10km accuracy for IP geolocation
        source: 'ip-geolocation',
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error('IP geolocation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify location via IP',
      tier: 'ip',
    });
  }
});

// Manual city verification endpoint (Tier 3 location verification)
router.post('/api/location/verify-manual', async (req, res): Promise<void> => {
  try {
    const { cityName, username } = req.body;

    if (!cityName || !username) {
      res.status(400).json({
        status: 'error',
        message: 'City name and username are required',
      });
      return;
    }

    // Import city validation utilities
    const { isMichiganCity, getCityApproximateCoords, getRegionForCity } = await import(
      '../shared/types/challenges.js'
    );

    // Validate city is in Michigan
    if (!isMichiganCity(cityName)) {
      res.status(400).json({
        status: 'error',
        message: `"${cityName}" is not a recognized Michigan city`,
        tier: 'manual',
      });
      return;
    }

    // Get approximate coordinates and region
    const coords = getCityApproximateCoords(cityName);
    const region = getRegionForCity(cityName);

    if (!coords || !region) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to get location data for city',
        tier: 'manual',
      });
      return;
    }

    res.json({
      status: 'success',
      verified: true,
      tier: 'manual',
      message: `Location verified: ${cityName}, ${region.name}`,
      location: {
        cityName,
        regionName: region.name,
        latitude: coords.lat,
        longitude: coords.lon,
        accuracy: 25000, // ~25km accuracy for city-level
        source: 'user-selected',
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error('Manual city verification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify city',
      tier: 'manual',
    });
  }
});

// Achievements endpoint - Check and unlock achievements
router.post('/api/achievements/check', async (req, res): Promise<void> => {
  try {
    const { username } = req.body;

    if (!username) {
      res.status(400).json({
        status: 'error',
        message: 'Username is required',
      });
      return;
    }

    // Import achievement utilities
    const { ACHIEVEMENTS, isAchievementUnlocked, calculateAchievementProgress } = await import('../shared/types/achievements.js');

    // Get user's current achievements
    const achievementsKey = `achievements:${username}`;
    const achievementsData = await redis.get(achievementsKey);
    let unlockedAchievements: any[] = [];

    if (achievementsData) {
      try {
        unlockedAchievements = JSON.parse(achievementsData as string);
      } catch {
        unlockedAchievements = [];
      }
    }

    // Get user stats for checking achievements
    const games = ['photo-hunt', 'trivia', 'word-search', 'memory-match'];
    const gameStats: Record<string, any> = {};
    let totalScore = 0;
    let gamesPlayed = 0;

    for (const game of games) {
      const allTimeKey = `leaderboard:alltime:${game}`;
      const userScores = await redis.zRange(allTimeKey, 0, -1, {
        byScore: true,
        withScores: true,
      });

      const userEntries = userScores.filter((entry: any) => {
        try {
          const data = JSON.parse(entry.member);
          return data.username === username;
        } catch {
          return false;
        }
      });

      if (userEntries.length > 0) {
        const bestScore = Math.max(...userEntries.map((e: any) => e.score));
        const totalGameScore = userEntries.reduce((sum: number, e: any) => sum + e.score, 0);

        gameStats[game] = {
          bestScore,
          totalScore: totalGameScore,
          timesPlayed: userEntries.length,
        };

        totalScore += totalGameScore;
        gamesPlayed += userEntries.length;
      }
    }

    // Get challenge progress
    const challengeKey = `challenge:progress:${username}`;
    const challengeData = await redis.get(challengeKey);
    let challengesCompleted = 0;
    let completedChallengeIds: string[] = [];
    let landmarksVisited = new Set<string>();

    if (challengeData) {
      try {
        const challengeProgress = JSON.parse(challengeData as string);
        challengesCompleted = challengeProgress.filter((c: any) => c.completedAt).length;
        completedChallengeIds = challengeProgress
          .filter((c: any) => c.completedAt)
          .map((c: any) => c.challengeId);

        // Count unique landmarks visited
        challengeProgress.forEach((c: any) => {
          c.completedLandmarks?.forEach((landmark: string) => landmarksVisited.add(landmark));
        });
      } catch {}
    }

    const userStats = {
      totalScore,
      gamesPlayed,
      challengesCompleted,
      landmarksVisited: landmarksVisited.size,
      gameStats,
      completedChallengeIds,
    };

    // Check for newly unlocked achievements
    const newlyUnlocked: any[] = [];
    const achievementProgress: any[] = [];

    for (const achievement of ACHIEVEMENTS) {
      const alreadyUnlocked = unlockedAchievements.some(
        (ua: any) => ua.achievementId === achievement.id
      );

      if (!alreadyUnlocked && isAchievementUnlocked(achievement, userStats)) {
        // Achievement unlocked!
        const unlockedAchievement = {
          achievementId: achievement.id,
          unlockedAt: Date.now(),
        };

        newlyUnlocked.push({
          ...achievement,
          unlockedAt: Date.now(),
        });

        unlockedAchievements.push(unlockedAchievement);
      }

      // Calculate progress for all achievements
      const progress = calculateAchievementProgress(achievement, userStats);
      achievementProgress.push({
        achievementId: achievement.id,
        progress,
        unlocked: alreadyUnlocked || newlyUnlocked.some((na) => na.id === achievement.id),
      });
    }

    // Save updated achievements
    if (newlyUnlocked.length > 0) {
      await redis.set(achievementsKey, JSON.stringify(unlockedAchievements));

      // Sync essential achievement data to Cloudflare (reduced payload)
      const apiKey = process.env.DEVVIT_API_KEY;
      const enableCloudflareSync = process.env.ENABLE_CLOUDFLARE_SYNC !== 'false';
      
      if (apiKey && apiKey !== 'DEVVIT_API_KEY_PLACEHOLDER' && enableCloudflareSync) {
        try {
          const essentialAchievements = {
            username,
            newlyUnlockedCount: newlyUnlocked.length,
            newlyUnlockedIds: newlyUnlocked.map(a => a.id),
            totalUnlocked: unlockedAchievements.length,
            timestamp: Date.now(),
            source: 'reddit-devvit',
          };

          const response = await fetch('https://michiganspots.com/api/achievements/sync-unlocked', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': apiKey,
            },
            body: JSON.stringify(essentialAchievements),
          });

          if (!response.ok) {
            console.warn(`Achievement sync failed with status: ${response.status}`);
          }
        } catch (err) {
          console.error('Failed to sync achievements to Cloudflare:', err);
        }
      }
    }

    res.json({
      status: 'success',
      newlyUnlocked,
      totalUnlocked: unlockedAchievements.length,
      totalAchievements: ACHIEVEMENTS.length,
      achievementProgress,
    });
  } catch (error) {
    console.error('Failed to check achievements:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check achievements',
    });
  }
});

// Get user's achievements
router.get('/api/achievements/:username', async (req, res): Promise<void> => {
  try {
    const { username } = req.params;

    if (!username) {
      res.status(400).json({
        status: 'error',
        message: 'Username is required',
      });
      return;
    }

    const { ACHIEVEMENTS } = await import('../shared/types/achievements.js');

    // Get unlocked achievements
    const achievementsKey = `achievements:${username}`;
    const achievementsData = await redis.get(achievementsKey);
    let unlockedAchievements: any[] = [];

    if (achievementsData) {
      try {
        unlockedAchievements = JSON.parse(achievementsData as string);
      } catch {
        unlockedAchievements = [];
      }
    }

    // Combine with achievement details
    const achievements = ACHIEVEMENTS.map((achievement) => {
      const unlocked = unlockedAchievements.find((ua: any) => ua.achievementId === achievement.id);
      return {
        ...achievement,
        unlocked: !!unlocked,
        unlockedAt: unlocked?.unlockedAt,
      };
    });

    // Calculate prestige points
    const prestigePoints = unlockedAchievements.reduce((sum, ua) => {
      const achievement = ACHIEVEMENTS.find((a) => a.id === ua.achievementId);
      return sum + (achievement?.points || 0);
    }, 0);

    res.json({
      status: 'success',
      achievements,
      unlockedCount: unlockedAchievements.length,
      totalCount: ACHIEVEMENTS.length,
      prestigePoints,
    });
  } catch (error) {
    console.error('Failed to get achievements:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get achievements',
    });
  }
});

// Get user statistics
router.get('/api/user/stats/:username', async (req, res): Promise<void> => {
  try {
    const { username } = req.params;

    if (!username) {
      res.status(400).json({
        status: 'error',
        message: 'Username is required',
      });
      return;
    }

    // Get user stats
    const userStatsKey = `user:stats:${username}`;
    const statsData = await redis.get(userStatsKey);
    
    if (!statsData) {
      res.json({
        status: 'success',
        stats: {
          totalScore: 0,
          gamesPlayed: 0,
          gameBreakdown: {},
          lastPlayed: 0,
          globalRank: null,
        },
      });
      return;
    }

    const stats = JSON.parse(statsData);

    // Get user's global rank
    const globalRank = await redis.zRevRank('leaderboard:global:total', 
      JSON.stringify({ username, totalScore: stats.totalScore, gamesPlayed: stats.gamesPlayed })
    );

    res.json({
      status: 'success',
      stats: {
        ...stats,
        globalRank: globalRank !== null ? globalRank + 1 : null,
      },
    });
  } catch (error) {
    console.error('Failed to get user stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get user stats',
    });
  }
});

// Get global leaderboard (total scores across all games)
router.get('/api/leaderboard/global', async (req, res): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const topUsers = await redis.zRange('leaderboard:global:total', 0, limit - 1, { 
      reverse: true, 
      withScores: true 
    });

    const leaderboard = topUsers.map((entry, index) => {
      const userData = JSON.parse(entry.member);
      return {
        rank: index + 1,
        username: userData.username,
        totalScore: entry.score,
        gamesPlayed: userData.gamesPlayed,
      };
    });

    res.json({
      status: 'success',
      leaderboard,
      total: topUsers.length,
    });
  } catch (error) {
    console.error('Failed to get global leaderboard:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get global leaderboard',
      leaderboard: [],
    });
  }
});

// User Profile endpoint
router.get('/api/profile/:username', async (req, res): Promise<void> => {
  try {
    const { username } = req.params;

    if (!username) {
      res.status(400).json({
        status: 'error',
        message: 'Username is required',
      });
      return;
    }

    // Fetch Reddit user data
    let redditUser: any = null;
    try {
      const user = await reddit.getUserByUsername(username);
      if (user) {
        // Try multiple possible avatar properties
        const avatarUrl = user.snoovatarUrl || (user as any).iconImg || (user as any).icon_img || `https://www.redditstatic.com/avatars/avatar_default_02_A5A4A4.png`;

        console.log('Reddit user avatar data for', username, ':', {
          snoovatarUrl: user.snoovatarUrl,
          iconImg: (user as any).iconImg,
          icon_img: (user as any).icon_img,
          finalUrl: avatarUrl
        });

        redditUser = {
          id: user.id,
          username: user.username,
          createdAt: user.createdAt.getTime(),
          karma: {
            total: (user.linkKarma || 0) + (user.commentKarma || 0),
            link: user.linkKarma || 0,
            comment: user.commentKarma || 0,
          },
          iconUrl: avatarUrl,
        };
      }
    } catch (redditError) {
      console.warn(`Failed to fetch Reddit profile for ${username}:`, redditError);
      // Continue without Reddit data
    }

    // Get user's game scores across all games
    const games = ['photo-hunt', 'trivia', 'word-search', 'memory-match'];
    const gameStats: Record<string, any> = {};
    let totalScore = 0;
    let gamesPlayed = 0;

    for (const game of games) {
      const allTimeKey = `leaderboard:alltime:${game}`;
      const userScores = await redis.zRange(allTimeKey, 0, -1, {
        byScore: true,
        withScores: true,
      });

      // Find user's scores
      const userEntries = userScores.filter((entry: any) => {
        try {
          const data = JSON.parse(entry.member);
          return data.username === username;
        } catch {
          return false;
        }
      });

      if (userEntries.length > 0) {
        const bestScore = Math.max(...userEntries.map((e: any) => e.score));
        const totalGameScore = userEntries.reduce((sum: number, e: any) => sum + e.score, 0);

        gameStats[game] = {
          bestScore,
          totalScore: totalGameScore,
          timesPlayed: userEntries.length,
        };

        totalScore += totalGameScore;
        gamesPlayed += userEntries.length;
      } else {
        gameStats[game] = {
          bestScore: 0,
          totalScore: 0,
          timesPlayed: 0,
        };
      }
    }

    // Get challenge progress
    const challengeKey = `challenge:progress:${username}`;
    const challengeData = await redis.get(challengeKey);
    let challengeProgress: any[] = [];
    let challengesCompleted = 0;

    if (challengeData) {
      try {
        challengeProgress = JSON.parse(challengeData as string);
        challengesCompleted = challengeProgress.filter((c: any) => c.completedAt).length;
      } catch {
        challengeProgress = [];
      }
    }

    // Get user's rank across all games
    const rankings: Record<string, number> = {};
    for (const game of games) {
      const allTimeKey = `leaderboard:alltime:${game}`;
      const leaderboard = await redis.zRange(allTimeKey, 0, -1, {
        reverse: true,
        withScores: true,
      });

      // Find user's rank
      let rank = 0;
      const uniqueUsers = new Set<string>();

      for (const entry of leaderboard) {
        try {
          const data = JSON.parse(entry.member);
          if (!uniqueUsers.has(data.username)) {
            uniqueUsers.add(data.username);
            rank++;
            if (data.username === username) {
              rankings[game] = rank;
              break;
            }
          }
        } catch {
          continue;
        }
      }

      if (!rankings[game]) {
        rankings[game] = 0; // Not ranked
      }
    }

    // Get recent activity (last 10 plays)
    const recentActivity: any[] = [];
    for (const game of games) {
      const allTimeKey = `leaderboard:alltime:${game}`;
      const scores = await redis.zRange(allTimeKey, 0, -1, {
        withScores: true,
      });

      for (const entry of scores) {
        try {
          const data = JSON.parse(entry.member);
          if (data.username === username) {
            recentActivity.push({
              game,
              score: entry.score,
              timestamp: data.timestamp,
            });
          }
        } catch {
          continue;
        }
      }
    }

    // Sort by timestamp and take last 10
    recentActivity.sort((a, b) => b.timestamp - a.timestamp);
    const recentPlays = recentActivity.slice(0, 10);

    res.json({
      status: 'success',
      profile: {
        username,
        redditUser,
        stats: {
          totalScore,
          gamesPlayed,
          challengesCompleted,
          totalChallenges: 10, // Based on MICHIGAN_CHALLENGES array
        },
        gameStats,
        rankings,
        challengeProgress,
        recentActivity: recentPlays,
      },
    });
  } catch (error) {
    console.error('Failed to load user profile:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to load user profile',
    });
  }
});

// Comprehensive data sync to Cloudflare endpoint
router.post('/api/sync/cloudflare', async (req, res): Promise<void> => {
  try {
    const { syncType = 'full', username } = req.body;
    const apiKey = process.env.DEVVIT_API_KEY;
    const enableCloudflareSync = process.env.ENABLE_CLOUDFLARE_SYNC !== 'false';

    if (!apiKey || apiKey === 'DEVVIT_API_KEY_PLACEHOLDER') {
      res.status(400).json({
        status: 'error',
        message: 'Cloudflare API key not configured',
      });
      return;
    }

    if (!enableCloudflareSync) {
      res.json({
        status: 'success',
        message: 'Cloudflare sync is disabled',
        results: { users: 0, scores: 0, challenges: 0, achievements: 0, errors: [] },
      });
      return;
    }

    const syncResults = {
      users: 0,
      scores: 0,
      challenges: 0,
      achievements: 0,
      errors: [],
    };

    try {
      if (syncType === 'full' || syncType === 'users') {
        // Sync all user statistics
        const userKeys = await redis.keys('user:stats:*');
        
        for (const key of userKeys) {
          try {
            const userData = await redis.get(key);
            if (userData) {
              const stats = JSON.parse(userData);
              const user = key.replace('user:stats:', '');

              // Get global rank
              const globalRank = await redis.zRevRank('leaderboard:global:total', 
                JSON.stringify({ username: user, totalScore: stats.totalScore, gamesPlayed: stats.gamesPlayed })
              );

              await fetch('https://michiganspots.com/api/users/sync-stats', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-API-Key': apiKey,
                },
                body: JSON.stringify({
                  username: user,
                  stats: {
                    ...stats,
                    globalRank: globalRank !== null ? globalRank + 1 : null,
                    lastSynced: Date.now(),
                    source: 'reddit-devvit-bulk',
                  },
                }),
              });

              syncResults.users++;
            }
          } catch (userError) {
            console.error(`Failed to sync user ${key}:`, userError);
            syncResults.errors.push(`User sync failed: ${key}`);
          }
        }
      }

      if (syncType === 'full' || syncType === 'leaderboards') {
        // Sync leaderboard data
        const games = ['photo-hunt', 'trivia', 'word-search', 'memory-match'];
        const periods = ['alltime', 'daily', 'weekly', 'quarterly'];

        for (const game of games) {
          for (const period of periods) {
            try {
              const periodKey = period === 'alltime' ? 'alltime' : getTimePeriodKey(period);
              const scoreKey = `leaderboard:${periodKey}:${game}`;
              
              const scores = await redis.zRange(scoreKey, 0, 49, { reverse: true, withScores: true });
              
              if (scores.length > 0) {
                await fetch('https://michiganspots.com/api/leaderboard/sync-bulk', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey,
                  },
                  body: JSON.stringify({
                    game,
                    period,
                    periodKey,
                    scores: scores.map((entry, index) => {
                      const data = JSON.parse(entry.member);
                      return {
                        rank: index + 1,
                        username: data.username,
                        score: entry.score,
                        timestamp: data.timestamp,
                        game: data.game,
                      };
                    }),
                    lastSynced: Date.now(),
                    source: 'reddit-devvit-bulk',
                  }),
                });

                syncResults.scores += scores.length;
              }
            } catch (leaderboardError) {
              console.error(`Failed to sync leaderboard ${game}:${period}:`, leaderboardError);
              syncResults.errors.push(`Leaderboard sync failed: ${game}:${period}`);
            }
          }
        }
      }

      if (syncType === 'full' || syncType === 'challenges') {
        // Sync challenge progress
        const challengeKeys = await redis.keys('challenges:progress:*');
        
        for (const key of challengeKeys) {
          try {
            const progressData = await redis.get(key);
            if (progressData) {
              const progress = JSON.parse(progressData);
              const user = key.replace('challenges:progress:', '');

              await fetch('https://michiganspots.com/api/challenges/sync-user-progress', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-API-Key': apiKey,
                },
                body: JSON.stringify({
                  username: user,
                  progress,
                  lastSynced: Date.now(),
                  source: 'reddit-devvit-bulk',
                }),
              });

              syncResults.challenges++;
            }
          } catch (challengeError) {
            console.error(`Failed to sync challenge progress ${key}:`, challengeError);
            syncResults.errors.push(`Challenge sync failed: ${key}`);
          }
        }
      }

      if (syncType === 'full' || syncType === 'achievements') {
        // Sync achievements
        const achievementKeys = await redis.keys('achievements:*');
        
        for (const key of achievementKeys) {
          try {
            const achievementData = await redis.get(key);
            if (achievementData) {
              const achievements = JSON.parse(achievementData);
              const user = key.replace('achievements:', '');

              await fetch('https://michiganspots.com/api/achievements/sync-user-achievements', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-API-Key': apiKey,
                },
                body: JSON.stringify({
                  username: user,
                  achievements,
                  lastSynced: Date.now(),
                  source: 'reddit-devvit-bulk',
                }),
              });

              syncResults.achievements++;
            }
          } catch (achievementError) {
            console.error(`Failed to sync achievements ${key}:`, achievementError);
            syncResults.errors.push(`Achievement sync failed: ${key}`);
          }
        }
      }

      // Send sync summary to Cloudflare
      await fetch('https://michiganspots.com/api/sync/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          syncType,
          results: syncResults,
          timestamp: Date.now(),
          source: 'reddit-devvit',
        }),
      });

      res.json({
        status: 'success',
        message: 'Data synced to Cloudflare successfully',
        results: syncResults,
      });
    } catch (syncError) {
      console.error('Cloudflare sync error:', syncError);
      res.status(500).json({
        status: 'error',
        message: 'Failed to sync data to Cloudflare',
        results: syncResults,
      });
    }
  } catch (error) {
    console.error('Sync endpoint error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process sync request',
    });
  }
});

// Cloudflare health check endpoint
router.get('/api/sync/status', async (req, res): Promise<void> => {
  try {
    const apiKey = process.env.DEVVIT_API_KEY;
    
    if (!apiKey || apiKey === 'DEVVIT_API_KEY_PLACEHOLDER') {
      res.json({
        status: 'warning',
        message: 'Cloudflare API key not configured',
        cloudflareSync: false,
        redisConnected: true,
      });
      return;
    }

    // Test Cloudflare connectivity
    try {
      const testResponse = await fetch('https://michiganspots.com/api/health', {
        method: 'GET',
        headers: {
          'X-API-Key': apiKey,
        },
      });

      const cloudflareHealthy = testResponse.ok;

      // Get sync statistics
      const userCount = (await redis.keys('user:stats:*')).length;
      const challengeCount = (await redis.keys('challenges:progress:*')).length;
      const achievementCount = (await redis.keys('achievements:*')).length;

      res.json({
        status: 'success',
        message: 'Sync system operational',
        cloudflareSync: cloudflareHealthy,
        redisConnected: true,
        dataStats: {
          users: userCount,
          challengeProgress: challengeCount,
          achievements: achievementCount,
        },
        lastChecked: Date.now(),
      });
    } catch (cloudflareError) {
      res.json({
        status: 'warning',
        message: 'Cloudflare connectivity issues',
        cloudflareSync: false,
        redisConnected: true,
        error: cloudflareError.message,
      });
    }
  } catch (error) {
    console.error('Sync status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check sync status',
    });
  }
});

// Use router middleware
app.use(router);

// Error handling middleware for payload size (must be after routes)
app.use((error: any, req: any, res: any, next: any) => {
  if (error && error.type === 'entity.too.large') {
    res.status(413).json({
      status: 'error',
      message: 'Request payload too large. Please reduce the size of your request.',
    });
  } else if (error) {
    console.error('Server error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  } else {
    next();
  }
});

// Get port from environment variable with fallback
const port = getServerPort();

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);

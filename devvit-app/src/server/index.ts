import express from 'express';
import { InitResponse, IncrementResponse, DecrementResponse } from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

router.get<{ postId: string }, InitResponse | { status: string; message: string }>(
  '/api/init',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      console.error('API Init Error: postId not found in devvit context');
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    try {
      const [count, username, postData] = await Promise.all([
        redis.get('count'),
        reddit.getCurrentUsername(),
        redis.get(`post:${postId}:data`),
      ]);

      let parsedPostData = null;
      try {
        parsedPostData = postData ? JSON.parse(postData) : null;
      } catch (e) {
        console.error('Failed to parse post data:', e);
      }

      res.json({
        type: 'init',
        postId: postId,
        count: count ? parseInt(count) : 0,
        username: username ?? 'anonymous',
        postType: parsedPostData?.postType || 'arcade',
        postData: parsedPostData || {},
      });
    } catch (error) {
      console.error(`API Init Error for post ${postId}:`, error);
      let errorMessage = 'Unknown error during initialization';
      if (error instanceof Error) {
        errorMessage = `Initialization failed: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
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
        appDisplayName: 'AI Moderator Tools',
        backgroundUri: 'ai-mod-bg.png',
        buttonLabel: 'Open Tools',
        description: 'AI-powered moderation tools for subreddit management',
        entryUri: 'default',
        heading: 'AI Moderator Tools 🤖',
        appIconUri: 'ai-mod-icon.png',
        height: 'tall',
      },
      postData: {
        postType: 'ai-mod-tools',
        toolsVersion: '1.0',
        features: ['content-analysis', 'sentiment-detection', 'spam-detection'],
      },
      subredditName: subredditName,
      title: '🤖 AI Moderator Tools - Moderation Dashboard',
    });

    // Store post data in Redis
    await redis.set(
      `post:${post.id}:data`,
      JSON.stringify({
        postType: 'ai-mod-tools',
        toolsVersion: '1.0',
        features: ['content-analysis', 'sentiment-detection', 'spam-detection'],
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

    const scoreData = JSON.stringify({
      username: gameData.username,
      score: gameData.score,
      game: gameData.game,
      timestamp: Date.now(),
    });

    // Store in all time leaderboard
    const allTimeKey = `leaderboard:alltime:${gameData.game}`;
    await redis.zAdd(allTimeKey, { member: scoreData, score: gameData.score });
    await redis.zRemRangeByRank(allTimeKey, 0, -101); // Keep top 100

    // Store in time-period specific leaderboards
    const periods = ['daily', 'weekly', 'monthly'];
    for (const period of periods) {
      const periodKey = getTimePeriodKey(period);
      const scoreKey = `leaderboard:${periodKey}:${gameData.game}`;
      await redis.zAdd(scoreKey, { member: scoreData, score: gameData.score });
      await redis.zRemRangeByRank(scoreKey, 0, -101); // Keep top 100

      // Set expiration for period-specific keys (30 days for daily, 90 days for weekly/monthly)
      const expirySeconds = period === 'daily' ? 30 * 24 * 60 * 60 : 90 * 24 * 60 * 60;
      await redis.expire(scoreKey, expirySeconds);
    }

    // Forward to Cloudflare API if DEVVIT_API_KEY is configured
    const apiKey = process.env.DEVVIT_API_KEY;
    if (apiKey && apiKey !== 'DEVVIT_API_KEY_PLACEHOLDER') {
      try {
        await fetch('https://michiganspots.com/api/analytics/game-complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
          },
          body: JSON.stringify(gameData),
        });
      } catch (err) {
        console.error('Failed to forward analytics to Cloudflare:', err);
        // Don't fail the request if Cloudflare tracking fails
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
    const { image, username, gps } = req.body;

    if (!image) {
      res.status(400).json({
        status: 'error',
        message: 'Image is required',
      });
      return;
    }

    // Validate GPS data
    if (!gps || typeof gps.latitude !== 'number' || typeof gps.longitude !== 'number') {
      res.status(400).json({
        status: 'error',
        message: 'GPS location is required for treasure hunt submissions',
      });
      return;
    }

    // Verify location is in Michigan
    const MICHIGAN_BOUNDS = {
      minLat: 41.7,
      maxLat: 48.3,
      minLon: -90.4,
      maxLon: -82.1,
    };

    if (
      gps.latitude < MICHIGAN_BOUNDS.minLat ||
      gps.latitude > MICHIGAN_BOUNDS.maxLat ||
      gps.longitude < MICHIGAN_BOUNDS.minLon ||
      gps.longitude > MICHIGAN_BOUNDS.maxLon
    ) {
      res.status(400).json({
        status: 'error',
        message: 'Photo must be taken in Michigan',
      });
      return;
    }

    console.log(`Photo submission from ${username} at [${gps.latitude}, ${gps.longitude}] with accuracy ±${gps.accuracy}m`);

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
    const periods = ['daily', 'weekly', 'monthly', 'alltime'];

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
        monthly: getTimePeriodKey('monthly'),
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

// Use router middleware
app.use(router);

// Get port from environment variable with fallback
const port = getServerPort();

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);

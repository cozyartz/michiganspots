import type { APIRoute } from 'astro';
import { checkRateLimit, detectBot, RATE_LIMITS } from '../../../lib/security/rate-limiter';
import { getSecurityHeaders, getClientIP } from '../../../lib/security/headers';
import { z } from 'zod';
import { initErrorTracking, captureError, addBreadcrumb, startTransaction } from '../../../lib/error-tracking';

// Validation schema for chat messages
const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(1000), // Limit message length
});

const chatRequestSchema = z.object({
  sessionId: z.string().min(1).max(100),
  messages: z.array(messageSchema).min(1).max(20), // Limit conversation history
});

export const POST: APIRoute = async ({ request, locals }) => {
  // Initialize error tracking
  const sentry = initErrorTracking(request, locals.runtime?.env || {}, locals.runtime?.ctx);
  const transaction = startTransaction(sentry, 'http.server', 'POST /api/directory/ai-chat');

  try {
    // Get client info
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('User-Agent') || '';

    addBreadcrumb(sentry, 'AI chat request started', { clientIP });

    // Bot detection
    const botCheck = detectBot(userAgent, clientIP);
    if (botCheck.isBot) {
      console.warn(`[Security] Bot detected on AI chat: ${botCheck.reason} - IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...getSecurityHeaders(),
          },
        }
      );
    }

    // Rate limiting - VERY strict for AI chat (expensive operation)
    const rateLimit = await checkRateLimit(clientIP, RATE_LIMITS.STRICT);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. Please try again later.',
          message: "I'm currently at capacity. Please try again in a minute.",
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            ...getSecurityHeaders(),
          },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = chatRequestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request',
          details: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...getSecurityHeaders() },
        }
      );
    }

    const { sessionId, messages } = validation.data;

    const runtime = locals.runtime;
    const db = runtime.env.DB;
    const ai = runtime.env.AI;

    if (!db || !ai) {
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable' }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json', ...getSecurityHeaders() },
        }
      );
    }

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user') {
      return new Response(
        JSON.stringify({ error: 'Last message must be from user' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...getSecurityHeaders() },
        }
      );
    }

    addBreadcrumb(sentry, 'Searching for relevant businesses', { query: lastMessage.content });

    // Search for relevant businesses based on the user's question
    const relevantBusinesses = await searchBusinesses(db, lastMessage.content);

    addBreadcrumb(sentry, 'Generating AI response', {
      businessesFound: relevantBusinesses.length,
      messageCount: messages.length,
    });

    // Generate AI response using Cloudflare AI
    const aiResponse = await generateChatResponse(ai, messages, relevantBusinesses);

    addBreadcrumb(sentry, 'Logging chat interaction');

    // Log the interaction
    await logChatInteraction(db, sessionId, lastMessage.content, aiResponse);

    addBreadcrumb(sentry, 'AI chat completed successfully');

    transaction?.finish();

    return new Response(
      JSON.stringify({
        message: aiResponse.message,
        businessIds: aiResponse.businessIds || [],
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          ...getSecurityHeaders(),
        },
      }
    );
  } catch (error) {
    // Capture error in Sentry
    captureError(sentry, error, {
      endpoint: '/api/directory/ai-chat',
      method: 'POST',
      url: request.url,
    });

    transaction?.finish();

    console.error('[Error] AI chat error:', error);
    return new Response(
      JSON.stringify({
        message: "I'm sorry, I'm having trouble right now. Please try again in a moment.",
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...getSecurityHeaders(),
        },
      }
    );
  }
};

async function searchBusinesses(db: any, query: string) {
  try {
    // Extract keywords from query
    const keywords = query.toLowerCase().match(/\b\w+\b/g) || [];

    // Search for businesses matching keywords in name, category, or description
    const searchResults = await db
      .prepare(
        `SELECT
          id,
          business_name,
          business_category,
          city,
          short_description,
          ai_quality_score,
          directory_tier
         FROM business_directory
         WHERE is_ai_verified = 1
           AND (
             business_name LIKE ? OR
             business_category LIKE ? OR
             city LIKE ? OR
             short_description LIKE ?
           )
         ORDER BY
           CASE
             WHEN directory_tier = 'pro' THEN 4
             WHEN directory_tier = 'growth' THEN 3
             WHEN directory_tier = 'starter' THEN 2
             ELSE 1
           END DESC,
           ai_quality_score DESC
         LIMIT 5`
      )
      .bind(`%${keywords[0]}%`, `%${keywords[0]}%`, `%${keywords[0]}%`, `%${keywords[0]}%`)
      .all();

    return searchResults.results || [];
  } catch (error) {
    console.error('Business search error:', error);
    return [];
  }
}

async function generateChatResponse(ai: any, messages: any[], businesses: any[]) {
  try {
    // Build context with business information
    let businessContext = '';
    if (businesses.length > 0) {
      businessContext = '\n\nRelevant Michigan businesses I found:\n';
      businesses.forEach((biz, idx) => {
        businessContext += `${idx + 1}. ${biz.business_name} - ${biz.business_category} in ${biz.city}`;
        if (biz.short_description) {
          businessContext += ` (${biz.short_description})`;
        }
        businessContext += `\n`;
      });
    }

    // Build conversation history
    const conversationHistory = messages
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    // Create AI prompt
    const prompt = `You are a helpful AI assistant for Michigan Spots, a business directory platform for Michigan businesses.
Your job is to help users find local businesses based on their questions.

${businessContext}

Conversation history:
${conversationHistory}

Instructions:
- Be friendly, conversational, and helpful
- If relevant businesses were found, mention them naturally in your response
- Provide specific recommendations when possible
- If you don't have enough information, ask clarifying questions
- Keep responses concise (2-4 sentences typically)
- Focus on Michigan businesses only
- If no businesses match, suggest broader or related searches

Respond naturally to the user's last message:`;

    const response = await ai.run('@cf/meta/llama-2-7b-chat-int8', {
      prompt,
      max_tokens: 300,
    });

    // Extract business IDs that were mentioned
    const businessIds = businesses.map((b) => b.id);

    return {
      message: response.response || "I'm here to help you find Michigan businesses. What are you looking for?",
      businessIds,
    };
  } catch (error) {
    console.error('AI response generation error:', error);
    return {
      message: "I can help you find Michigan businesses. Try asking about restaurants, shops, or services in specific cities!",
      businessIds: [],
    };
  }
}

async function logChatInteraction(db: any, sessionId: string, userMessage: string, aiResponse: any) {
  try {
    // Log user message
    await db
      .prepare(
        `INSERT INTO ai_chat_interactions
         (session_id, message_role, message_content, model_used)
         VALUES (?, ?, ?, ?)`
      )
      .bind(sessionId, 'user', userMessage, '@cf/meta/llama-2-7b-chat-int8')
      .run();

    // Log assistant response
    await db
      .prepare(
        `INSERT INTO ai_chat_interactions
         (session_id, message_role, message_content, model_used)
         VALUES (?, ?, ?, ?)`
      )
      .bind(sessionId, 'assistant', aiResponse.message, '@cf/meta/llama-2-7b-chat-int8')
      .run();
  } catch (error) {
    console.error('Error logging chat interaction:', error);
  }
}

import type { APIRoute } from 'astro';

/**
 * AI Moderation Dashboard API
 *
 * Provides moderation statistics and recent analysis results
 * for the SuperAdmin AI Moderation Panel
 *
 * Usage:
 * GET /api/dashboard/ai-moderation?days=7
 *
 * Returns:
 * {
 *   success: boolean,
 *   stats: {
 *     total_analyzed: number,
 *     toxic_detected: number,
 *     spam_detected: number,
 *     auto_rejected: number,
 *     flagged: number,
 *     approved: number,
 *     sentiment: { positive, neutral, negative }
 *   },
 *   recent_analysis: Array<{...}>,
 *   moderation_actions: Array<{...}>
 * }
 */

interface ModerationStats {
  total_analyzed: number;
  toxic_detected: number;
  spam_detected: number;
  auto_rejected: number;
  flagged: number;
  approved: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '7', 10);

    const runtime = locals.runtime as {
      env: {
        DB: D1Database;
      };
    };

    if (!runtime?.env?.DB) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database not available',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const db = runtime.env.DB;

    // Calculate date threshold
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    const dateStr = dateThreshold.toISOString().split('T')[0];

    // Get aggregate statistics
    const statsResult = await db
      .prepare(
        `SELECT
          COUNT(*) as total_analyzed,
          SUM(CASE WHEN toxicity_score > 0.7 THEN 1 ELSE 0 END) as toxic_detected,
          SUM(CASE WHEN spam_score > 0.6 THEN 1 ELSE 0 END) as spam_detected,
          SUM(CASE WHEN action_taken = 'auto_rejected' THEN 1 ELSE 0 END) as auto_rejected,
          SUM(CASE WHEN action_taken = 'flagged' THEN 1 ELSE 0 END) as flagged,
          SUM(CASE WHEN action_taken = 'approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as positive_sentiment,
          SUM(CASE WHEN sentiment = 'neutral' THEN 1 ELSE 0 END) as neutral_sentiment,
          SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative_sentiment
        FROM content_moderation_log
        WHERE DATE(analyzed_at) >= ?`
      )
      .bind(dateStr)
      .first();

    const stats: ModerationStats = {
      total_analyzed: (statsResult?.total_analyzed as number) || 0,
      toxic_detected: (statsResult?.toxic_detected as number) || 0,
      spam_detected: (statsResult?.spam_detected as number) || 0,
      auto_rejected: (statsResult?.auto_rejected as number) || 0,
      flagged: (statsResult?.flagged as number) || 0,
      approved: (statsResult?.approved as number) || 0,
      sentiment: {
        positive: (statsResult?.positive_sentiment as number) || 0,
        neutral: (statsResult?.neutral_sentiment as number) || 0,
        negative: (statsResult?.negative_sentiment as number) || 0,
      },
    };

    // Get recent analysis results
    const recentAnalysisResult = await db
      .prepare(
        `SELECT
          id,
          content_type,
          content_text,
          classification_label,
          confidence_score,
          sentiment,
          toxicity_score,
          spam_score,
          action_taken,
          action_reason,
          auto_moderated,
          analyzed_at
        FROM content_moderation_log
        WHERE DATE(analyzed_at) >= ?
        ORDER BY analyzed_at DESC
        LIMIT 50`
      )
      .bind(dateStr)
      .all();

    const recent_analysis = recentAnalysisResult.results || [];

    // Get moderation actions (manual + auto)
    const actionsResult = await db
      .prepare(
        `SELECT
          id,
          content_type,
          action_taken,
          action_reason,
          auto_moderated,
          moderator_id,
          action_at
        FROM content_moderation_log
        WHERE DATE(action_at) >= ?
        AND action_taken IN ('auto_rejected', 'flagged', 'removed')
        ORDER BY action_at DESC
        LIMIT 100`
      )
      .bind(dateStr)
      .all();

    const moderation_actions = actionsResult.results || [];

    // Get stats by content type
    const contentTypeStatsResult = await db
      .prepare(
        `SELECT
          content_type,
          COUNT(*) as count,
          SUM(CASE WHEN action_taken = 'auto_rejected' THEN 1 ELSE 0 END) as rejected,
          SUM(CASE WHEN action_taken = 'flagged' THEN 1 ELSE 0 END) as flagged,
          AVG(toxicity_score) as avg_toxicity,
          AVG(spam_score) as avg_spam
        FROM content_moderation_log
        WHERE DATE(analyzed_at) >= ?
        GROUP BY content_type`
      )
      .bind(dateStr)
      .all();

    const content_type_stats = contentTypeStatsResult.results || [];

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        recent_analysis,
        moderation_actions,
        content_type_stats,
        date_range: {
          from: dateStr,
          to: new Date().toISOString().split('T')[0],
          days,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, no-cache',
        },
      }
    );
  } catch (error) {
    console.error('AI moderation dashboard API error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * Moderate Content Endpoint
 *
 * POST /api/dashboard/ai-moderation
 * Body: {
 *   content_type: string,
 *   content_text: string,
 *   user_id?: number,
 *   content_id?: number
 * }
 *
 * Analyzes content using Cloudflare AI and logs the result
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { content_type, content_text, user_id, content_id } = body;

    const runtime = locals.runtime as {
      env: {
        DB: D1Database;
        AI?: any;
      };
    };

    if (!runtime?.env?.DB || !runtime?.env?.AI) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database or AI not available',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const db = runtime.env.DB;
    const ai = runtime.env.AI;

    // Validate input
    if (!content_type || !content_text) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'content_type and content_text are required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Run AI classification
    const classificationResult = await ai.run('@cf/huggingface/distilbert-sst-2-int8', {
      text: content_text,
    });

    // DistilBERT SST-2 returns sentiment (POSITIVE/NEGATIVE)
    const classification_label = classificationResult.label || 'UNKNOWN';
    const confidence_score = classificationResult.score || 0;

    // Calculate sentiment
    const sentiment =
      classification_label === 'POSITIVE' ? 'positive' : classification_label === 'NEGATIVE' ? 'negative' : 'neutral';

    // Estimate toxicity (negative sentiment with high confidence)
    const toxicity_score = classification_label === 'NEGATIVE' ? confidence_score : 0;

    // Spam detection (very negative or very positive with extreme confidence)
    const spam_score = confidence_score > 0.95 ? 0.7 : 0;

    // Get moderation rules for this content type
    const rulesResult = await db
      .prepare('SELECT * FROM moderation_rules WHERE content_type = ? AND enabled = 1 LIMIT 1')
      .bind(content_type)
      .first();

    const rules = rulesResult || {
      toxicity_threshold: 0.8,
      spam_threshold: 0.7,
      auto_reject_enabled: 0,
      auto_flag_enabled: 1,
    };

    // Determine action
    let action_taken = 'approved';
    let action_reason = '';

    if (rules.auto_reject_enabled) {
      if (toxicity_score > rules.toxicity_threshold) {
        action_taken = 'auto_rejected';
        action_reason = 'High toxicity score detected';
      } else if (spam_score > rules.spam_threshold) {
        action_taken = 'auto_rejected';
        action_reason = 'Spam detected';
      }
    }

    if (action_taken === 'approved' && rules.auto_flag_enabled) {
      if (toxicity_score > rules.toxicity_threshold * 0.7) {
        action_taken = 'flagged';
        action_reason = 'Moderate toxicity detected - manual review recommended';
      } else if (spam_score > rules.spam_threshold * 0.7) {
        action_taken = 'flagged';
        action_reason = 'Potential spam - manual review recommended';
      }
    }

    // Log to database
    const logResult = await db
      .prepare(
        `INSERT INTO content_moderation_log (
          content_type,
          content_id,
          content_text,
          ai_model,
          classification_label,
          confidence_score,
          sentiment,
          toxicity_score,
          spam_score,
          action_taken,
          action_reason,
          auto_moderated,
          user_id,
          analyzed_at,
          action_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id`
      )
      .bind(
        content_type,
        content_id || null,
        content_text.substring(0, 1000), // Store first 1000 chars
        '@cf/huggingface/distilbert-sst-2-int8',
        classification_label,
        confidence_score,
        sentiment,
        toxicity_score,
        spam_score,
        action_taken,
        action_reason,
        user_id || null
      )
      .first();

    return new Response(
      JSON.stringify({
        success: true,
        moderation_id: logResult?.id,
        classification: {
          label: classification_label,
          confidence: Math.round(confidence_score * 100) / 100,
          sentiment,
          toxicity_score: Math.round(toxicity_score * 100) / 100,
          spam_score: Math.round(spam_score * 100) / 100,
        },
        action: {
          action_taken,
          action_reason,
          should_block: action_taken === 'auto_rejected',
          requires_review: action_taken === 'flagged',
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('AI moderation POST error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { sessionId, messages } = await request.json();

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No messages provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const runtime = locals.runtime;
    const db = runtime.env.DB;
    const ai = runtime.env.AI;

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user') {
      return new Response(
        JSON.stringify({ error: 'Last message must be from user' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Search for relevant businesses based on the user's question
    const relevantBusinesses = await searchBusinesses(db, lastMessage.content);

    // Generate AI response using Cloudflare AI
    const aiResponse = await generateChatResponse(ai, messages, relevantBusinesses);

    // Log the interaction
    await logChatInteraction(db, sessionId, lastMessage.content, aiResponse);

    return new Response(
      JSON.stringify({
        message: aiResponse.message,
        businessIds: aiResponse.businessIds || [],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('AI chat error:', error);
    return new Response(
      JSON.stringify({
        message: "I'm sorry, I'm having trouble right now. Please try again in a moment.",
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
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

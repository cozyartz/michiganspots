/**
 * Import Blog Post from NeuronWriter
 * Fetches content from NeuronWriter and creates a blog post
 */

import { createNeuronWriterService } from '../../../lib/neuronwriter';

interface Env {
  DB: D1Database;
  NEURONWRITER_API_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // TODO: Add admin authentication check
    const body = await context.request.json() as {
      query_id: string;
      project_id: string;
      author_email: string;
      author_name: string;
      category?: string;
      status?: string; // draft or published
      featured_image_url?: string;
    };

    if (!body.query_id || !body.project_id) {
      return new Response(
        JSON.stringify({ error: 'query_id and project_id are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize NeuronWriter service
    const neuronWriter = createNeuronWriterService(context.env.NEURONWRITER_API_KEY);

    // Import content from NeuronWriter
    const importedContent = await neuronWriter.importToBlogPost(body.query_id);

    // Generate slug
    const slug = neuronWriter.generateSlug(importedContent.title);

    // Check if post already exists with this query_id
    const existingPost = await context.env.DB
      .prepare('SELECT id FROM blog_posts WHERE neuronwriter_query_id = ?')
      .bind(body.query_id)
      .first();

    if (existingPost) {
      return new Response(
        JSON.stringify({
          error: 'A post already exists for this NeuronWriter query',
          existing_post_id: existingPost.id
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date().toISOString();
    const status = body.status || 'draft';
    const publishedAt = status === 'published' ? now : null;

    // Insert blog post
    const result = await context.env.DB
      .prepare(`
        INSERT INTO blog_posts (
          title, slug, excerpt, content, featured_image_url,
          meta_title, meta_description, keywords,
          category, status, published_at,
          author_email, author_name,
          neuronwriter_query_id, neuronwriter_project_id,
          neuronwriter_score, neuronwriter_last_sync,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        importedContent.title,
        slug,
        importedContent.excerpt,
        importedContent.content,
        body.featured_image_url || null,
        importedContent.title,
        importedContent.meta_description,
        importedContent.keywords.join(', '),
        body.category || null,
        status,
        publishedAt,
        body.author_email,
        body.author_name,
        body.query_id,
        body.project_id,
        importedContent.score,
        now,
        now,
        now
      )
      .run();

    // Log the sync
    await context.env.DB
      .prepare(`
        INSERT INTO neuronwriter_sync_log (
          query_id, project_id, sync_type, success,
          score, initiated_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        body.query_id,
        body.project_id,
        'import',
        1,
        importedContent.score,
        body.author_email,
        now
      )
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        post_id: result.meta.last_row_id,
        slug,
        title: importedContent.title,
        score: importedContent.score,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error importing from NeuronWriter:', error);

    // Log failed sync
    try {
      const body = await context.request.json() as any;
      await context.env.DB
        .prepare(`
          INSERT INTO neuronwriter_sync_log (
            query_id, project_id, sync_type, success,
            error_message, initiated_by, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          body.query_id,
          body.project_id,
          'import',
          0,
          error.message,
          body.author_email,
          new Date().toISOString()
        )
        .run();
    } catch (logError) {
      console.error('Failed to log sync error:', logError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

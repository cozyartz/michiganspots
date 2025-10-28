/**
 * Blog Posts API
 * CRUD operations for blog posts with NeuronWriter integration
 */

import { createNeuronWriterService } from '../../../lib/neuronwriter';

interface Env {
  DB: D1Database;
  NEURONWRITER_API_KEY: string;
}

// GET /api/blog/posts - List blog posts (public)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const category = url.searchParams.get('category');
    const status = url.searchParams.get('status') || 'published';
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = `
      SELECT
        id, title, slug, excerpt, featured_image_url,
        category, tags, author_name, published_at,
        view_count, share_count
      FROM blog_posts
      WHERE status = ?
    `;

    const params: any[] = [status];

    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    query += ` ORDER BY published_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const posts = await context.env.DB
      .prepare(query)
      .bind(...params)
      .all();

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM blog_posts WHERE status = ?`;
    const countParams: any[] = [status];

    if (category) {
      countQuery += ` AND category = ?`;
      countParams.push(category);
    }

    const countResult = await context.env.DB
      .prepare(countQuery)
      .bind(...countParams)
      .first<{ total: number }>();

    return new Response(
      JSON.stringify({
        posts: posts.results,
        total: countResult?.total || 0,
        limit,
        offset,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error listing blog posts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST /api/blog/posts - Create new blog post (admin only)
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // TODO: Add admin authentication check
    const body = await context.request.json() as {
      title: string;
      content: string;
      excerpt?: string;
      category?: string;
      tags?: string[];
      status?: string;
      featured_image_url?: string;
      meta_title?: string;
      meta_description?: string;
      keywords?: string;
      author_email: string;
      author_name: string;
      scheduled_for?: string;
      neuronwriter_query_id?: string;
    };

    // Generate slug from title
    const slug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug exists
    const existingPost = await context.env.DB
      .prepare('SELECT id FROM blog_posts WHERE slug = ?')
      .bind(slug)
      .first();

    if (existingPost) {
      return new Response(
        JSON.stringify({ error: 'A post with this title already exists' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date().toISOString();
    const status = body.status || 'draft';
    const publishedAt = status === 'published' ? now : body.scheduled_for || null;

    const result = await context.env.DB
      .prepare(`
        INSERT INTO blog_posts (
          title, slug, excerpt, content, featured_image_url,
          meta_title, meta_description, keywords,
          category, tags, status, published_at, scheduled_for,
          author_email, author_name, neuronwriter_query_id,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        body.title,
        slug,
        body.excerpt || null,
        body.content,
        body.featured_image_url || null,
        body.meta_title || body.title,
        body.meta_description || body.excerpt || null,
        body.keywords || null,
        body.category || null,
        body.tags ? JSON.stringify(body.tags) : null,
        status,
        publishedAt,
        body.scheduled_for || null,
        body.author_email,
        body.author_name,
        body.neuronwriter_query_id || null,
        now,
        now
      )
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        id: result.meta.last_row_id,
        slug,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error creating blog post:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

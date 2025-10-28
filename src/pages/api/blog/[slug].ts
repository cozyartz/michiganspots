/**
 * Individual Blog Post API
 * Get single blog post by slug
 */

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const slug = context.params.slug as string;

    if (!slug) {
      return new Response(
        JSON.stringify({ error: 'Slug parameter is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const post = await context.env.DB
      .prepare(`
        SELECT
          id, title, slug, excerpt, content, featured_image_url,
          meta_title, meta_description, keywords,
          category, tags, status, published_at,
          author_email, author_name,
          view_count, share_count,
          neuronwriter_score,
          created_at, updated_at
        FROM blog_posts
        WHERE slug = ? AND status = 'published'
      `)
      .bind(slug)
      .first();

    if (!post) {
      return new Response(
        JSON.stringify({ error: 'Post not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Increment view count
    await context.env.DB
      .prepare('UPDATE blog_posts SET view_count = view_count + 1 WHERE id = ?')
      .bind(post.id)
      .run();

    return new Response(
      JSON.stringify({ post }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error fetching blog post:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

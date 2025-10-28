/**
 * Blog Categories API
 * Lists all blog categories
 */

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const categories = await context.env.DB
      .prepare(`
        SELECT id, name, slug, description, icon, post_count
        FROM blog_categories
        ORDER BY display_order ASC
      `)
      .all();

    return new Response(
      JSON.stringify({
        categories: categories.results,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error listing categories:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

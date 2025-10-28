/**
 * List NeuronWriter Queries
 * Lists available queries from NeuronWriter project for import
 */

import { createNeuronWriterService } from '../../../src/lib/neuronwriter';

interface Env {
  DB: D1Database;
  NEURONWRITER_API_KEY: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    // TODO: Add admin authentication check

    const url = new URL(context.request.url);
    const projectId = url.searchParams.get('project_id');

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'project_id parameter is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize NeuronWriter service
    const neuronWriter = createNeuronWriterService(context.env.NEURONWRITER_API_KEY);

    // List queries from the project
    const queries = await neuronWriter.listQueries({
      project_id: projectId,
      status: 'done', // Only show completed queries
    });

    // Check which queries are already imported
    const queryIds = queries.map(q => q.query_id);

    let existingPosts: any[] = [];
    if (queryIds.length > 0) {
      const placeholders = queryIds.map(() => '?').join(',');
      const existing = await context.env.DB
        .prepare(`
          SELECT neuronwriter_query_id, id, title, slug, status
          FROM blog_posts
          WHERE neuronwriter_query_id IN (${placeholders})
        `)
        .bind(...queryIds)
        .all();

      existingPosts = existing.results || [];
    }

    // Add import status to each query
    const queriesWithStatus = queries.map(query => {
      const existingPost = existingPosts.find(
        (p: any) => p.neuronwriter_query_id === query.query_id
      );

      return {
        ...query,
        is_imported: !!existingPost,
        blog_post_id: existingPost?.id || null,
        blog_post_title: existingPost?.title || null,
        blog_post_slug: existingPost?.slug || null,
        blog_post_status: existingPost?.status || null,
      };
    });

    return new Response(
      JSON.stringify({
        project_id: projectId,
        queries: queriesWithStatus,
        total: queriesWithStatus.length,
        imported: queriesWithStatus.filter(q => q.is_imported).length,
        available: queriesWithStatus.filter(q => !q.is_imported).length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error listing NeuronWriter queries:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

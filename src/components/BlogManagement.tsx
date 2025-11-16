/**
 * Copyright (c) 2025 Cozyartz Media Group d/b/a State Spots
 * Licensed under AGPL-3.0-or-later OR Commercial
 * See LICENSE and LICENSE-COMMERCIAL.md for details
 */

/**
 * Blog Management Component
 * Admin interface for importing and managing blog posts from NeuronWriter
 */

import { useState, useEffect } from 'react';
import { Download, ExternalLink, FileText, Check, Clock, Eye } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

interface NeuronWriterQuery {
  query_id: string;
  keyword: string;
  language: string;
  status: string;
  share_url: string;
  readonly_url: string;
  created_at: string;
  is_imported: boolean;
  blog_post_id: number | null;
  blog_post_title: string | null;
  blog_post_slug: string | null;
  blog_post_status: string | null;
}

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  status: string;
  published_at: string | null;
  author_name: string;
  view_count: number;
}

export function BlogManagement({ userEmail, userName }: { userEmail: string; userName: string }) {
  const [queries, setQueries] = useState<NeuronWriterQuery[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'import' | 'manage'>('import');

  // Your NeuronWriter project ID
  const PROJECT_ID = '256705550a406d91';

  // Load available queries from NeuronWriter
  const loadQueries = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/blog/list-neuronwriter-queries?project_id=${PROJECT_ID}`);

      if (!response.ok) {
        throw new Error('Failed to load queries from NeuronWriter');
      }

      const data = await response.json();
      setQueries(data.queries || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load existing blog posts
  const loadPosts = async () => {
    try {
      const response = await fetch('/api/blog/posts?status=draft&limit=50');

      if (!response.ok) {
        throw new Error('Failed to load blog posts');
      }

      const data = await response.json();
      setPosts(data.posts || []);
    } catch (err: any) {
      console.error('Error loading posts:', err);
    }
  };

  // Import query as blog post
  const importQuery = async (queryId: string, category: string = 'michigan-travel') => {
    setImporting(queryId);
    setError(null);

    try {
      const response = await fetch('/api/blog/import-from-neuronwriter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query_id: queryId,
          project_id: PROJECT_ID,
          author_email: userEmail,
          author_name: userName,
          category,
          status: 'draft', // Import as draft for review
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import post');
      }

      const data = await response.json();

      alert(`Successfully imported: ${data.title}
SEO Score: ${data.score}/100`);

      // Reload queries and posts
      await loadQueries();
      await loadPosts();
    } catch (err: any) {
      setError(err.message);
      alert(`Import failed: ${err.message}`);
    } finally {
      setImporting(null);
    }
  };

  // Publish a draft post
  const publishPost = async (postId: number) => {
    try {
      const response = await fetch(`/api/blog/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });

      if (!response.ok) {
        throw new Error('Failed to publish post');
      }

      alert('Post published successfully!');
      await loadPosts();
    } catch (err: any) {
      alert(`Publish failed: ${err.message}`);
    }
  };

  useEffect(() => {
    if (activeTab === 'import') {
      loadQueries();
    } else {
      loadPosts();
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink-primary">Blog Management</h2>
          <p className="text-ink-secondary mt-1">Import and manage blog posts from NeuronWriter</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-ink-faded/30">
        <button
          onClick={() => setActiveTab('import')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'import'
              ? 'text-copper-orange border-b-2 border-copper-orange'
              : 'text-ink-secondary hover:text-ink-primary'
          }`}
        >
          <Download className="inline w-4 h-4 mr-2" />
          Import from NeuronWriter
        </button>
        <button
          onClick={() => setActiveTab('manage')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'manage'
              ? 'text-copper-orange border-b-2 border-copper-orange'
              : 'text-ink-secondary hover:text-ink-primary'
          }`}
        >
          <FileText className="inline w-4 h-4 mr-2" />
          Manage Posts
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="bg-sunset-red/10 border-sunset-red">
          <p className="text-sunset-red">{error}</p>
        </Card>
      )}

      {/* Import Tab */}
      {activeTab === 'import' && (
        <div className="space-y-4">
          {loading ? (
            <Card>
              <p className="text-center text-ink-secondary">Loading queries from NeuronWriter...</p>
            </Card>
          ) : queries.length === 0 ? (
            <Card>
              <p className="text-center text-ink-secondary">
                No completed queries found in your NeuronWriter project.
              </p>
              <p className="text-center text-ink-faded text-sm mt-2">
                Create and complete queries in{' '}
                <a
                  href={`https://app.neuronwriter.com/project/view/${PROJECT_ID}/optimisation`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lakes-blue hover:underline"
                >
                  NeuronWriter <ExternalLink className="inline w-3 h-3" />
                </a>
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {queries.map((query) => (
                <Card key={query.query_id} className={query.is_imported ? 'opacity-60' : ''}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-heading text-lg font-bold text-ink-primary">
                        {query.keyword}
                      </h3>
                      <p className="text-sm text-ink-secondary mt-1">
                        Language: {query.language} • Status: {query.status}
                      </p>
                      {query.is_imported && (
                        <div className="mt-2 flex items-center text-sm text-forest-green">
                          <Check className="w-4 h-4 mr-1" />
                          Already imported as: {query.blog_post_title} ({query.blog_post_status})
                        </div>
                      )}
                      <div className="mt-2 flex space-x-2">
                        <a
                          href={query.readonly_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-lakes-blue hover:underline"
                        >
                          View in NeuronWriter <ExternalLink className="inline w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    <div>
                      {query.is_imported ? (
                        <a
                          href={`/blog/${query.blog_post_slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="secondary" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View Post
                          </Button>
                        </a>
                      ) : (
                        <Button
                          onClick={() => importQuery(query.query_id)}
                          disabled={importing === query.query_id}
                          size="sm"
                        >
                          {importing === query.query_id ? (
                            <>
                              <Clock className="w-4 h-4 mr-2 animate-spin" />
                              Importing...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Import as Draft
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manage Tab */}
      {activeTab === 'manage' && (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <Card>
              <p className="text-center text-ink-secondary">No blog posts yet. Import your first post from NeuronWriter!</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {posts.map((post) => (
                <Card key={post.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-heading text-lg font-bold text-ink-primary">{post.title}</h3>
                      <p className="text-sm text-ink-secondary mt-1">{post.excerpt}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-ink-faded">
                        <span>Category: {post.category || 'Uncategorized'}</span>
                        <span>•</span>
                        <span>Status: {post.status}</span>
                        <span>•</span>
                        <span>Views: {post.view_count}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <a href={`/admin/blog/edit/${post.id}`}>
                        <Button variant="secondary" size="sm">Edit</Button>
                      </a>
                      {post.status === 'draft' && (
                        <Button onClick={() => publishPost(post.id)} size="sm">
                          Publish
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

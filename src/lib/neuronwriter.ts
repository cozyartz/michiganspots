/**
 * NeuronWriter API Integration
 * Handles content import and synchronization from NeuronWriter
 */

interface NeuronWriterConfig {
  apiKey: string;
  baseUrl?: string;
}

interface NeuronWriterQuery {
  query_id: string;
  keyword: string;
  language: string;
  status: string;
  share_url: string;
  readonly_url: string;
  created_at: string;
}

interface NeuronWriterContent {
  content: string; // HTML content
  title: string;
  description: string;
  created_at: string;
  revision_type: 'manual' | 'autosave';
}

interface NeuronWriterQueryDetails {
  query_id: string;
  keyword: string;
  status: string;
  score?: number;
  terms?: Array<{
    term: string;
    usage: number;
    recommended: number;
  }>;
  questions?: string[];
  competitors?: Array<{
    url: string;
    title: string;
    score: number;
  }>;
}

interface NeuronWriterProject {
  project_id: string;
  name: string;
  created_at: string;
  queries_count: number;
}

export class NeuronWriterService {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: NeuronWriterConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://app.neuronwriter.com/neuron-api/0.5/writer';
  }

  /**
   * Make authenticated request to NeuronWriter API
   */
  private async request<T>(endpoint: string, data?: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': this.apiKey,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NeuronWriter API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * List all projects
   */
  async listProjects(): Promise<NeuronWriterProject[]> {
    return this.request<NeuronWriterProject[]>('/list-projects');
  }

  /**
   * List queries in a project
   */
  async listQueries(params: {
    project_id?: string;
    status?: 'new' | 'in_progress' | 'done';
    source?: string;
    tags?: string[];
  }): Promise<NeuronWriterQuery[]> {
    return this.request<NeuronWriterQuery[]>('/list-queries', params);
  }

  /**
   * Get query details including SEO recommendations
   */
  async getQuery(queryId: string): Promise<NeuronWriterQueryDetails> {
    return this.request<NeuronWriterQueryDetails>('/get-query', {
      query_id: queryId,
    });
  }

  /**
   * Get content for a specific query
   */
  async getContent(queryId: string, revisionType: 'manual' | 'all' = 'manual'): Promise<NeuronWriterContent> {
    return this.request<NeuronWriterContent>('/get-content', {
      query_id: queryId,
      revision_type: revisionType,
    });
  }

  /**
   * Create a new query (for future use)
   */
  async createQuery(params: {
    project_id: string;
    keyword: string;
    search_engine?: string;
    language?: string;
  }): Promise<{
    query_id: string;
    query_url: string;
    share_url: string;
    readonly_url: string;
  }> {
    return this.request('/new-query', {
      project: params.project_id,
      keyword: params.keyword,
      se: params.search_engine || 'google.com',
      lang: params.language || 'en',
    });
  }

  /**
   * Import content to blog post format
   */
  async importToBlogPost(queryId: string): Promise<{
    title: string;
    content: string;
    excerpt: string;
    meta_description: string;
    keywords: string[];
    score: number;
  }> {
    // Get both content and query details
    const [content, query] = await Promise.all([
      this.getContent(queryId),
      this.getQuery(queryId),
    ]);

    // Extract keywords from NeuronWriter terms
    const keywords = query.terms
      ?.slice(0, 10) // Top 10 terms
      .map(term => term.term) || [];

    // Generate excerpt from description or first 200 chars of content
    const excerpt = content.description ||
      this.stripHtml(content.content).substring(0, 200) + '...';

    return {
      title: content.title,
      content: content.content,
      excerpt,
      meta_description: content.description || excerpt,
      keywords,
      score: query.score || 0,
    };
  }

  /**
   * Strip HTML tags from content
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * Generate slug from title
   */
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

/**
 * Factory function to create NeuronWriter service
 */
export function createNeuronWriterService(apiKey: string): NeuronWriterService {
  return new NeuronWriterService({ apiKey });
}

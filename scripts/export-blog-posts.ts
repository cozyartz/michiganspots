/**
 * Export blog posts from D1 database to MDX files
 * Run with: npx tsx scripts/export-blog-posts.ts
 */

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url: string | null;
  category: string;
  tags: string; // JSON string
  author_name: string;
  author_email: string;
  published_at: string;
  updated_at: string;
  neuronwriter_query_id: string | null;
  neuronwriter_project_id: string | null;
  neuronwriter_score: number | null;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string | null;
}

async function exportBlogPosts() {
  console.log('🔄 Exporting blog posts from D1...\n');

  // Query all published blog posts from D1
  const { stdout } = await execAsync(
    `npx wrangler d1 execute michiganspot-db --local --command "SELECT * FROM blog_posts WHERE status='published' ORDER BY published_at DESC;" --json`
  );

  const result = JSON.parse(stdout);
  const posts: BlogPost[] = result[0].results;

  console.log(`📦 Found ${posts.length} blog posts to export\n`);

  const contentDir = path.join(process.cwd(), 'src', 'content', 'blog');

  // Ensure directory exists
  await fs.mkdir(contentDir, { recursive: true });

  // Export each post
  for (const post of posts) {
    console.log(`📝 Exporting: ${post.title}`);

    // Parse tags from JSON
    let tags: string[] = [];
    try {
      tags = JSON.parse(post.tags || '[]');
    } catch (e) {
      console.warn(`  ⚠️  Could not parse tags for ${post.slug}`);
    }

    // Parse keywords
    let keywords: string[] = [];
    if (post.keywords) {
      keywords = post.keywords.split(',').map(k => k.trim());
    }

    // Create frontmatter
    const frontmatter: Record<string, any> = {
      title: post.title,
      excerpt: post.excerpt,
      publishedAt: new Date(post.published_at).toISOString().split('T')[0],
      status: 'published',
      category: post.category,
      tags: tags,
      authorName: post.author_name,
      authorEmail: post.author_email,
      featuredImage: post.featured_image_url,
      featuredImageAlt: post.title,
      hasAffiliateLinks: post.content.includes('amazon.com') || post.content.includes('tag=cozyartz'),
      affiliateDisclosure: true,
    };

    // Only add optional fields if they have non-null values
    if (post.updated_at && post.updated_at !== 'null') {
      frontmatter.updatedAt = new Date(post.updated_at).toISOString().split('T')[0];
    }
    if (post.meta_title && post.meta_title !== 'null' && post.meta_title !== null) {
      frontmatter.seoTitle = post.meta_title;
    }
    if (post.meta_description && post.meta_description !== 'null' && post.meta_description !== null) {
      frontmatter.seoDescription = post.meta_description;
    }
    if (keywords.length > 0 && keywords[0] !== 'null') {
      frontmatter.keywords = keywords;
    }
    if (post.neuronwriter_query_id && post.neuronwriter_query_id !== 'null' && post.neuronwriter_query_id !== null) {
      frontmatter.neuronwriterQueryId = post.neuronwriter_query_id;
    }
    if (post.neuronwriter_project_id && post.neuronwriter_project_id !== 'null' && post.neuronwriter_project_id !== null) {
      frontmatter.neuronwriterProjectId = post.neuronwriter_project_id;
    }
    if (post.neuronwriter_score && post.neuronwriter_score !== 'null' && post.neuronwriter_score !== null) {
      frontmatter.neuronwriterScore = post.neuronwriter_score;
    }

    // Create MDX content
    const mdxContent = `---
${Object.entries(frontmatter)
  .map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${key}: [${value.map(v => `"${v}"`).join(', ')}]`;
    } else if (typeof value === 'string' && !['publishedAt', 'updatedAt'].includes(key)) {
      // Escape quotes in strings (except dates)
      const escaped = value.replace(/"/g, '\\"');
      return `${key}: "${escaped}"`;
    } else if (typeof value === 'string' && ['publishedAt', 'updatedAt'].includes(key)) {
      // Don't quote dates - they should be parsed as Date objects
      return `${key}: ${value}`;
    } else {
      // Numbers and booleans
      return `${key}: ${value}`;
    }
  })
  .join('\n')}
---

${post.content}
`;

    // Write to file
    const filename = `${post.slug}.mdx`;
    const filepath = path.join(contentDir, filename);
    await fs.writeFile(filepath, mdxContent, 'utf-8');

    console.log(`  ✅ Exported to: src/content/blog/${filename}`);
  }

  console.log(`\n✨ Successfully exported ${posts.length} blog posts!`);
  console.log(`\n📁 Blog posts are now in: src/content/blog/`);
  console.log(`\n🎯 Next steps:`);
  console.log(`   1. Review the exported MDX files`);
  console.log(`   2. Update blog pages to use Content Collections`);
  console.log(`   3. Test with: npm run dev`);
}

exportBlogPosts().catch(console.error);

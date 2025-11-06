import { defineCollection, z } from 'astro:content';

// Legal documents collection (existing)
const legalCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    lastUpdated: z.date().optional(),
  }),
});

// Blog posts collection
const blogCollection = defineCollection({
  type: 'content', // MDX/Markdown content
  schema: z.object({
    // Core content
    title: z.string(),
    excerpt: z.string(),

    // Publishing
    publishedAt: z.date(),
    updatedAt: z.date().optional(),
    status: z.enum(['draft', 'published', 'scheduled']).default('draft'),

    // Organization
    category: z.string(),
    tags: z.array(z.string()).default([]),

    // Author
    authorName: z.string().default('Michigan Spots Team'),
    authorEmail: z.string().default('admin@michiganspots.com'),

    // Images
    featuredImage: z.string().optional(),
    featuredImageAlt: z.string().optional(),

    // SEO
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    keywords: z.array(z.string()).default([]),

    // Affiliate
    hasAffiliateLinks: z.boolean().default(false),
    affiliateDisclosure: z.boolean().default(true),

    // NeuronWriter integration
    neuronwriterQueryId: z.string().optional(),
    neuronwriterProjectId: z.string().optional(),
    neuronwriterScore: z.union([z.number(), z.string().transform((val) => {
      const num = parseInt(val, 10);
      return isNaN(num) ? undefined : num;
    })]).optional(),

    // Engagement (will be stored in D1)
    viewCount: z.number().default(0),
    shareCount: z.number().default(0),
  }),
});

export const collections = {
  blog: blogCollection,
  legal: legalCollection,
};

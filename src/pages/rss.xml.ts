import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const blog = await getCollection('blog', ({ data }) => {
    return data.status === 'published';
  });

  // Sort by published date (newest first)
  const sortedPosts = blog.sort((a, b) =>
    new Date(b.data.publishedAt).getTime() - new Date(a.data.publishedAt).getTime()
  );

  return rss({
    title: 'Michigan Spots Blog',
    description: 'Discover hidden gems, explore local businesses, and dive into Michigan\'s vibrant communities',
    site: context.site || 'https://michiganspots.com',
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      pubDate: new Date(post.data.publishedAt),
      description: post.data.excerpt,
      link: `/blog/${post.slug}/`,
      categories: [post.data.category, ...post.data.tags],
      author: post.data.authorEmail,
      customData: post.data.featuredImage
        ? `<enclosure url="${post.data.featuredImage}" type="image/jpeg" />`
        : '',
    })),
    customData: `<language>en-us</language>`,
  });
}

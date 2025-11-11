import type { APIRoute } from 'astro';

// Cache storage
const cache = {
  data: null as any,
  timestamp: 0,
  CACHE_DURATION: 12 * 60 * 60 * 1000 // 12 hours (2 calls per day)
};

export const GET: APIRoute = async () => {
  try {
    // Check if we have valid cached data
    const now = Date.now();
    if (cache.data && (now - cache.timestamp) < cache.CACHE_DURATION) {
      return new Response(JSON.stringify(cache.data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=43200', // 12 hours browser cache
        }
      });
    }

    // Fetch fresh data from Reddit
    // Try multiple subreddits to ensure we get content
    const subreddits = [
      'michiganspots',
      'Michigan',
      'Detroit',
      'funny',
      'memes'
    ];

    let allPosts: any[] = [];

    // Fetch from multiple subreddits
    for (const subreddit of subreddits.slice(0, 3)) { // Only first 3 to avoid rate limits
      try {
        const response = await fetch(
          `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`,
          {
            headers: {
              'User-Agent': 'MichiganSpots/1.0.0 (https://michiganspots.com)'
            }
          }
        );

        if (!response.ok) continue;

        const data = await response.json() as any;
        const posts = data.data.children
          .map((child: any) => child.data)
          .filter((post: any) => {
            // Filter for images and GIFs only
            const isImage = post.post_hint === 'image' ||
                           post.url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
            const hasValidThumbnail = post.thumbnail &&
                                      post.thumbnail !== 'self' &&
                                      post.thumbnail !== 'default' &&
                                      post.thumbnail.startsWith('http');

            return isImage && hasValidThumbnail && !post.over_18;
          })
          .map((post: any) => ({
            id: post.id,
            title: post.title,
            url: post.url,
            thumbnail: post.thumbnail,
            author: post.author,
            ups: post.ups,
            permalink: post.permalink,
            subreddit: post.subreddit,
            created_utc: post.created_utc
          }));

        allPosts = [...allPosts, ...posts];
      } catch (err) {
        console.error(`Error fetching from r/${subreddit}:`, err);
      }
    }

    // Remove duplicates by ID
    const uniquePosts = Array.from(
      new Map(allPosts.map(post => [post.id, post])).values()
    );

    // Shuffle for randomness
    const shuffled = uniquePosts.sort(() => Math.random() - 0.5);

    const result = {
      posts: shuffled.slice(0, 50), // Max 50 posts
      cached_at: now,
      ttl: cache.CACHE_DURATION
    };

    // Update cache
    cache.data = result;
    cache.timestamp = now;

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=43200',
      }
    });

  } catch (error: any) {
    console.error('Error in reddit-memes API:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch Reddit memes',
        message: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};

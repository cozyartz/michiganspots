import { ArrowRight, Clock, Calendar } from 'lucide-react';

interface RelatedPost {
  slug: string;
  title: string;
  excerpt: string;
  category?: string;
  featuredImage?: string;
  publishedAt: string;
  readingTime?: number;
}

interface RelatedPostsProps {
  posts: RelatedPost[];
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section className="my-16 py-12 border-t-2 border-parchment-dark dark:border-ink-faded">
      <div className="mb-10">
        <h2 className="font-display font-bold text-3xl md:text-4xl text-ink-primary dark:text-parchment-light mb-3">
          Continue Your Michigan Adventure
        </h2>
        <p className="text-lg text-ink-secondary dark:text-parchment-light/70">
          Discover more amazing spots and experiences across Pure Michigan
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {posts.map((post) => {
          const formattedDate = new Date(post.publishedAt).toLocaleDateString(
            'en-US',
            {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }
          );

          return (
            <article
              key={post.slug}
              className="group bg-parchment-light dark:bg-ink-secondary rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
            >
              {/* Image */}
              <a
                href={`/blog/${post.slug}`}
                className="block relative h-48 overflow-hidden"
              >
                {post.featuredImage ? (
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-forest-green via-lakes-blue to-ink-primary" />
                )}

                {/* Category badge */}
                {post.category && (
                  <span className="absolute top-3 left-3 px-3 py-1 bg-copper-orange text-parchment-light text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
                    {post.category}
                  </span>
                )}
              </a>

              {/* Content */}
              <div className="p-5">
                {/* Meta info */}
                <div className="flex items-center gap-4 text-xs text-ink-faded dark:text-parchment-light/60 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formattedDate}
                  </span>
                  {post.readingTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readingTime} min
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-heading font-bold text-lg md:text-xl text-ink-primary dark:text-parchment-light mb-3 line-clamp-2 group-hover:text-copper-orange dark:group-hover:text-gold-treasure transition-colors">
                  <a href={`/blog/${post.slug}`}>{post.title}</a>
                </h3>

                {/* Excerpt */}
                <p className="text-sm text-ink-secondary dark:text-parchment-light/80 mb-4 line-clamp-3 leading-relaxed">
                  {post.excerpt}
                </p>

                {/* Read more link */}
                <a
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-copper-orange dark:text-gold-treasure hover:gap-3 transition-all duration-300 group/link"
                >
                  Read Article
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/link:translate-x-1" />
                </a>
              </div>
            </article>
          );
        })}
      </div>

      {/* View all link */}
      <div className="mt-10 text-center">
        <a
          href="/blog"
          className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-copper-orange to-sunset-red text-parchment-light font-heading font-bold text-lg rounded-xl shadow-lg hover:shadow-2xl hover:from-sunset-red hover:to-copper-orange transition-all duration-300 transform hover:scale-105"
        >
          Explore All Articles
          <ArrowRight className="w-5 h-5" />
        </a>
      </div>
    </section>
  );
}

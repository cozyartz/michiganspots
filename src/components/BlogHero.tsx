import type { CollectionEntry } from 'astro:content';

interface BlogHeroProps {
  featuredPost: CollectionEntry<'blog'>;
}

export function BlogHero({ featuredPost }: BlogHeroProps) {
  const { data } = featuredPost;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-forest-green via-lakes-blue to-ink-primary rounded-2xl shadow-2xl">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        {data.featuredImage && (
          <img
            src={data.featuredImage}
            alt={data.featuredImageAlt || data.title}
            className="w-full h-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-primary via-ink-primary/50 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-8 py-16 md:px-16 md:py-24">
        {/* Category badge */}
        {data.category && (
          <span className="inline-block px-4 py-1.5 bg-copper-orange text-parchment-light font-bold text-sm uppercase tracking-wider rounded-full mb-6 animate-fade-in">
            {data.category}
          </span>
        )}

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-display font-bold text-parchment-light mb-6 leading-tight animate-slide-up">
          {data.title}
        </h1>

        {/* Excerpt */}
        <p className="text-lg md:text-xl text-parchment-light/90 mb-8 max-w-3xl leading-relaxed animate-slide-up-delay">
          {data.excerpt}
        </p>

        {/* Meta info */}
        <div className="flex items-center gap-6 text-parchment-light/80 text-sm animate-fade-in-delay">
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date(data.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {data.authorName}
          </span>
        </div>

        {/* CTA Button */}
        <a
          href={`/blog/${featuredPost.slug}`}
          className="inline-flex items-center gap-2 mt-10 px-8 py-4 bg-copper-orange hover:bg-sunset-red text-parchment-light font-bold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl group"
        >
          Read Full Story
          <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </a>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-copper-orange/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-lakes-blue/20 rounded-full blur-3xl"></div>
    </div>
  );
}

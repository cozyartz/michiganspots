/**
 * Copyright (c) 2025 Cozyartz Media Group d/b/a State Spots
 * Licensed under AGPL-3.0-or-later OR Commercial
 * See LICENSE and LICENSE-COMMERCIAL.md for details
 */

import type { CollectionEntry } from 'astro:content';

interface BlogCardProps {
  post: CollectionEntry<'blog'>;
}

export function BlogCard({ post }: BlogCardProps) {
  const { data, slug } = post;

  return (
    <article className="group bg-parchment-light dark:bg-ink-primary rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
      {/* Image container */}
      <a href={`/blog/${slug}`} className="block relative h-64 overflow-hidden">
        {data.featuredImage && (
          <img
            src={data.featuredImage}
            alt={data.featuredImageAlt || data.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-primary/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Category badge */}
        {data.category && (
          <span className="absolute top-4 left-4 px-3 py-1.5 bg-copper-orange text-parchment-light font-bold text-xs uppercase tracking-wider rounded-full shadow-lg">
            {data.category}
          </span>
        )}

        {/* Date badge */}
        <div className="absolute bottom-4 right-4 px-3 py-2 bg-parchment-light/95 dark:bg-ink-primary/95 rounded-lg shadow-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <time className="text-xs font-semibold text-ink-primary dark:text-parchment-light flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date(data.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </time>
        </div>
      </a>

      {/* Content */}
      <div className="p-6">
        {/* Title */}
        <a href={`/blog/${slug}`}>
          <h3 className="text-2xl font-display font-bold text-ink-primary dark:text-parchment-light mb-3 line-clamp-2 group-hover:text-copper-orange transition-colors duration-300">
            {data.title}
          </h3>
        </a>

        {/* Excerpt */}
        <p className="text-ink-secondary dark:text-parchment/80 mb-4 line-clamp-3 leading-relaxed">
          {data.excerpt}
        </p>

        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {data.tags.slice(0, 3).map((tag: string) => (
              <span
                key={tag}
                className="px-2 py-1 bg-lakes-blue/10 dark:bg-lakes-blue/20 text-lakes-blue dark:text-lakes-blue/90 text-xs font-medium rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Read more link */}
        <a
          href={`/blog/${slug}`}
          className="inline-flex items-center gap-2 text-copper-orange font-semibold text-sm hover:gap-3 transition-all duration-300 group/link"
        >
          Read Article
          <svg className="w-4 h-4 transform group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </article>
  );
}

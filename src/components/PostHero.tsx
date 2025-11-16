/**
 * Copyright (c) 2025 Cozyartz Media Group d/b/a State Spots
 * Licensed under AGPL-3.0-or-later OR Commercial
 * See LICENSE and LICENSE-COMMERCIAL.md for details
 */

import { Calendar, User, Clock } from 'lucide-react';

interface PostHeroProps {
  title: string;
  excerpt?: string;
  category?: string;
  authorName: string;
  publishedAt: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  readingTime?: number;
}

export function PostHero({
  title,
  excerpt,
  category,
  authorName,
  publishedAt,
  featuredImage,
  featuredImageAlt,
  readingTime = 8,
}: PostHeroProps) {
  const formattedDate = new Date(publishedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="relative w-full min-h-[70vh] flex items-end overflow-hidden">
      {/* Background image with parallax effect */}
      <div className="absolute inset-0">
        {featuredImage ? (
          <img
            src={featuredImage}
            alt={featuredImageAlt || title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-forest-green via-lakes-blue to-ink-primary" />
        )}
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-primary via-ink-primary/80 to-ink-primary/30 dark:from-black dark:via-black/90 dark:to-black/40" />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 w-full">
        <div className="container mx-auto px-4 pb-12 md:pb-16">
          <div className="max-w-4xl">
            {/* Category badge */}
            {category && (
              <a
                href={`/blog/category/${category.toLowerCase().replace(/\s+/g, '-')}`}
                className="inline-block px-4 py-2 bg-copper-orange text-parchment-light font-bold text-sm uppercase tracking-wider rounded-full mb-6 hover:bg-sunset-red transition-all duration-300 transform hover:scale-105 animate-fade-in"
              >
                {category}
              </a>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-parchment-light mb-6 leading-tight animate-slide-up">
              {title}
            </h1>

            {/* Excerpt */}
            {excerpt && (
              <p className="text-lg md:text-xl text-parchment-light/90 mb-8 leading-relaxed max-w-3xl animate-slide-up-delay">
                {excerpt}
              </p>
            )}

            {/* Meta information */}
            <div className="flex flex-wrap items-center gap-6 text-parchment-light/80 animate-fade-in-delay">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <span className="font-medium">{authorName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{readingTime} min read</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative scroll indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg
            className="w-6 h-6 text-parchment-light/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

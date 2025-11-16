/**
 * Copyright (c) 2025 Cozyartz Media Group d/b/a State Spots
 * Licensed under AGPL-3.0-or-later OR Commercial
 * See LICENSE and LICENSE-COMMERCIAL.md for details
 */

import { FileText, Clock } from 'lucide-react';
import type { ReactNode } from 'react';

interface TLDRSummaryProps {
  children: ReactNode;
  readingTime?: number;
}

export function TLDRSummary({ children, readingTime }: TLDRSummaryProps) {
  return (
    <div className="my-12 max-w-4xl mx-auto">
      <div
        className="
          relative p-8 md:p-10
          bg-gradient-to-br from-lakes-blue/20 via-cyan-primary/15 to-forest-green/20
          dark:from-lakes-blue/30 dark:via-cyan-primary/25 dark:to-forest-green/30
          border-2 border-lakes-blue/40 dark:border-cyan-primary/50
          rounded-2xl shadow-2xl
          transform transition-all duration-300 hover:-translate-y-1 hover:shadow-3xl
        "
      >
        {/* Decorative gradient orbs */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-cyan-primary/30 to-transparent rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-lakes-blue/30 to-transparent rounded-full blur-3xl -z-10" />

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-lakes-blue dark:bg-cyan-primary rounded-xl shadow-lg">
              <FileText className="w-6 h-6 text-parchment-light" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-2xl md:text-3xl text-ink-primary dark:text-parchment-light">
                TL;DR
              </h2>
              <p className="text-sm text-ink-secondary dark:text-parchment-light/70">
                Quick Summary
              </p>
            </div>
          </div>

          {readingTime && (
            <div className="flex items-center gap-2 px-4 py-2 bg-parchment-light dark:bg-ink-primary rounded-full text-sm text-ink-secondary dark:text-parchment-light/80">
              <Clock className="w-4 h-4" />
              <span>{readingTime} min read</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="text-ink-primary dark:text-parchment-light/90 leading-relaxed space-y-3">
          {children}
        </div>

        {/* Bottom accent line */}
        <div className="mt-6 h-1 bg-gradient-to-r from-lakes-blue via-cyan-primary to-forest-green rounded-full" />
      </div>
    </div>
  );
}

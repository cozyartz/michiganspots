/**
 * Copyright (c) 2025 Cozyartz Media Group d/b/a State Spots
 * Licensed under AGPL-3.0-or-later OR Commercial
 * See LICENSE and LICENSE-COMMERCIAL.md for details
 */

import React from 'react';
import { Info } from 'lucide-react';

interface AffiliateDisclosureProps {
  variant?: 'banner' | 'inline' | 'footer';
  className?: string;
}

export const AffiliateDisclosure: React.FC<AffiliateDisclosureProps> = ({
  variant = 'inline',
  className = '',
}) => {
  if (variant === 'banner') {
    return (
      <div className={`bg-gold/10 border-2 border-gold/30 rounded-lg p-4 mb-6 ${className}`}>
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
          <div className="text-sm text-ink-secondary">
            <strong className="text-ink-primary">Affiliate Disclosure:</strong> Michigan Spots
            participates in the Amazon Services LLC Associates Program. We may earn a commission
            when you click through and make a purchase, at no additional cost to you. This helps us
            keep Michigan Spots free and support local discovery.
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <div className={`text-xs text-ink-secondary/80 ${className}`}>
        As an Amazon Associate, Michigan Spots earns from qualifying purchases.
      </div>
    );
  }

  // inline variant (default)
  return (
    <p className={`text-xs text-ink-secondary italic border-l-2 border-gold/50 pl-3 py-2 ${className}`}>
      Note: Some links on this page are affiliate links. If you make a purchase through them, we may
      earn a small commission at no extra cost to you.
    </p>
  );
};

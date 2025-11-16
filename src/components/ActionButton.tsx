/**
 * Copyright (c) 2025 Cozyartz Media Group d/b/a State Spots
 * Licensed under AGPL-3.0-or-later OR Commercial
 * See LICENSE and LICENSE-COMMERCIAL.md for details
 */

import { Trophy, Map, Package, ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';

interface ActionButtonProps {
  href: string;
  variant: 'challenge' | 'map' | 'gear' | 'custom';
  title: string;
  description?: string;
  icon?: ReactNode;
}

export function ActionButton({
  href,
  variant,
  title,
  description,
  icon,
}: ActionButtonProps) {
  const variants = {
    challenge: {
      icon: <Trophy className="w-8 h-8" />,
      gradient: 'from-amber-primary to-gold-treasure',
      hoverGradient: 'hover:from-gold-treasure hover:to-amber-dark',
      bgPattern: 'bg-gradient-to-br from-amber-primary/10 to-gold-treasure/10 dark:from-amber-primary/20 dark:to-gold-treasure/20',
      borderColor: 'border-amber-primary dark:border-gold-treasure',
    },
    map: {
      icon: <Map className="w-8 h-8" />,
      gradient: 'from-lakes-blue to-cyan-primary',
      hoverGradient: 'hover:from-cyan-primary hover:to-lakes-blue',
      bgPattern: 'bg-gradient-to-br from-lakes-blue/10 to-cyan-primary/10 dark:from-lakes-blue/20 dark:to-cyan-primary/20',
      borderColor: 'border-lakes-blue dark:border-cyan-primary',
    },
    gear: {
      icon: <Package className="w-8 h-8" />,
      gradient: 'from-copper-orange to-sunset-red',
      hoverGradient: 'hover:from-sunset-red hover:to-copper-orange',
      bgPattern: 'bg-gradient-to-br from-copper-orange/10 to-sunset-red/10 dark:from-copper-orange/20 dark:to-sunset-red/20',
      borderColor: 'border-copper-orange dark:border-sunset-red',
    },
    custom: {
      icon: icon || <ArrowRight className="w-8 h-8" />,
      gradient: 'from-forest-green to-lakes-blue',
      hoverGradient: 'hover:from-lakes-blue hover:to-forest-green',
      bgPattern: 'bg-gradient-to-br from-forest-green/10 to-lakes-blue/10 dark:from-forest-green/20 dark:to-lakes-blue/20',
      borderColor: 'border-forest-green dark:border-lakes-blue',
    },
  };

  const config = variants[variant];

  return (
    <a
      href={href}
      className={`
        group relative block p-6 md:p-8 rounded-2xl border-2
        ${config.bgPattern} ${config.borderColor}
        shadow-lg hover:shadow-2xl
        transition-all duration-300 transform hover:-translate-y-2
        overflow-hidden
      `}
    >
      {/* Decorative gradient orb */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-parchment-light/10 to-transparent dark:from-parchment-light/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10 flex items-start gap-6">
        {/* Icon */}
        <div
          className={`
            flex-shrink-0 p-4 rounded-xl
            bg-gradient-to-br ${config.gradient}
            text-parchment-light shadow-lg
            transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-6
          `}
        >
          {icon || config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-xl md:text-2xl text-ink-primary dark:text-parchment-light mb-2 flex items-center gap-2">
            {title}
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-2" />
          </h3>
          {description && (
            <p className="text-ink-secondary dark:text-parchment-light/70 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Animated border effect */}
      <div
        className={`
          absolute inset-0 rounded-2xl
          bg-gradient-to-r ${config.gradient}
          opacity-0 group-hover:opacity-20 dark:group-hover:opacity-30
          transition-opacity duration-300
        `}
      />
    </a>
  );
}

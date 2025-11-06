import type { ReactNode } from 'react';

interface SectionCardProps {
  children: ReactNode;
  title?: string;
  icon?: ReactNode;
  variant?: 'default' | 'highlight' | 'accent' | 'subtle';
  className?: string;
}

export function SectionCard({
  children,
  title,
  icon,
  variant = 'default',
  className = '',
}: SectionCardProps) {
  const variants = {
    default: {
      bg: 'bg-parchment-light dark:bg-ink-secondary',
      border: 'border-parchment-dark dark:border-ink-faded',
      titleColor: 'text-ink-primary dark:text-parchment-light',
    },
    highlight: {
      bg: 'bg-gradient-to-br from-copper-orange/10 to-gold-treasure/10 dark:from-copper-orange/20 dark:to-gold-treasure/20',
      border: 'border-copper-orange/30 dark:border-gold-treasure/40',
      titleColor: 'text-copper-orange dark:text-gold-treasure',
    },
    accent: {
      bg: 'bg-gradient-to-br from-lakes-blue/10 to-cyan-primary/10 dark:from-lakes-blue/20 dark:to-cyan-primary/20',
      border: 'border-lakes-blue/30 dark:border-cyan-primary/40',
      titleColor: 'text-lakes-blue dark:text-cyan-primary',
    },
    subtle: {
      bg: 'bg-parchment-mid dark:bg-ink-primary',
      border: 'border-transparent',
      titleColor: 'text-ink-primary dark:text-parchment-light',
    },
  };

  const config = variants[variant];

  return (
    <div
      className={`
        relative my-8 p-6 md:p-8 rounded-2xl border-2
        ${config.bg} ${config.border}
        shadow-lg hover:shadow-2xl transition-all duration-300
        transform hover:-translate-y-1
        ${className}
      `}
    >
      {/* Decorative gradient orb */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-parchment-light/10 to-transparent dark:from-parchment-light/5 rounded-full blur-3xl -z-10" />

      {/* Title with optional icon */}
      {(title || icon) && (
        <div className="flex items-center gap-3 mb-6">
          {icon && (
            <div className={`flex-shrink-0 ${config.titleColor}`}>
              {icon}
            </div>
          )}
          {title && (
            <h3 className={`font-heading font-bold text-2xl ${config.titleColor}`}>
              {title}
            </h3>
          )}
        </div>
      )}

      {/* Content */}
      <div className="text-ink-primary dark:text-parchment-light/90 leading-relaxed">
        {children}
      </div>
    </div>
  );
}

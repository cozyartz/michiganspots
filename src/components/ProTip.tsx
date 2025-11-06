import { Lightbulb, Zap, Star, AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';

interface ProTipProps {
  children: ReactNode;
  title?: string;
  variant?: 'tip' | 'pro' | 'warning' | 'info';
}

export function ProTip({ children, title, variant = 'tip' }: ProTipProps) {
  const variants = {
    tip: {
      icon: Lightbulb,
      gradient: 'from-amber-primary/20 to-gold-treasure/20 dark:from-amber-primary/30 dark:to-gold-treasure/30',
      borderColor: 'border-amber-primary dark:border-gold-treasure',
      iconColor: 'text-amber-primary dark:text-gold-treasure',
      titleColor: 'text-amber-dark dark:text-gold-treasure',
      defaultTitle: '💡 Pro Tip',
    },
    pro: {
      icon: Zap,
      gradient: 'from-copper-orange/20 to-sunset-red/20 dark:from-copper-orange/30 dark:to-sunset-red/30',
      borderColor: 'border-copper-orange dark:border-sunset-red',
      iconColor: 'text-copper-orange dark:text-sunset-red',
      titleColor: 'text-copper-orange dark:text-sunset-red',
      defaultTitle: '⚡ Pro Move',
    },
    warning: {
      icon: AlertCircle,
      gradient: 'from-sunset-red/20 to-copper-orange/20 dark:from-sunset-red/30 dark:to-copper-orange/30',
      borderColor: 'border-sunset-red dark:border-copper-orange',
      iconColor: 'text-sunset-red dark:text-copper-orange',
      titleColor: 'text-sunset-red dark:text-copper-orange',
      defaultTitle: '⚠️ Important',
    },
    info: {
      icon: Star,
      gradient: 'from-lakes-blue/20 to-cyan-primary/20 dark:from-lakes-blue/30 dark:to-cyan-primary/30',
      borderColor: 'border-lakes-blue dark:border-cyan-primary',
      iconColor: 'text-lakes-blue dark:text-cyan-primary',
      titleColor: 'text-lakes-blue dark:text-cyan-primary',
      defaultTitle: '⭐ Did You Know?',
    },
  };

  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div
      className={`
        relative my-8 p-6 rounded-xl border-l-4
        bg-gradient-to-br ${config.gradient} ${config.borderColor}
        shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1
        animate-fade-in
      `}
    >
      {/* Decorative blob */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-parchment-light/20 to-transparent dark:from-parchment-light/10 rounded-full blur-2xl -z-10" />

      <div className="flex gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className={`p-2 rounded-lg bg-parchment-light dark:bg-ink-primary shadow-md ${config.iconColor}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Title */}
          <h4 className={`font-heading font-bold text-lg mb-2 ${config.titleColor}`}>
            {title || config.defaultTitle}
          </h4>

          {/* Body content */}
          <div className="text-ink-primary dark:text-parchment-light/90 leading-relaxed prose-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

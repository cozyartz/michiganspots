import { Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface PricingTierCardProps {
  name: string;
  price: number | string;
  period?: string;
  description: string;
  features: string[];
  icon: LucideIcon;
  color: string;
  popular?: boolean;
  ctaText: string;
  ctaLink: string;
  priceOptions?: {
    monthly?: number;
    quarterly?: number;
    yearly?: number;
  };
}

export function PricingTierCard({
  name,
  price,
  period,
  description,
  features,
  icon: Icon,
  color,
  popular = false,
  ctaText,
  ctaLink,
  priceOptions
}: PricingTierCardProps) {
  return (
    <div className={`relative parchment-card p-8 hover:shadow-2xl transition-all duration-300 ${popular ? 'ring-4 ring-copper-orange transform scale-105' : ''}`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-copper-orange to-gold text-white rounded-full text-sm font-bold shadow-lg">
          MOST POPULAR
        </div>
      )}

      <div className="text-center mb-6">
        <div className={`w-16 h-16 bg-gradient-to-br ${color} rounded-2xl mx-auto mb-4 flex items-center justify-center`}>
          <Icon className="text-white" size={32} />
        </div>

        <h3 className="font-heading text-2xl font-bold text-ink-primary mb-2">
          {name}
        </h3>
        <p className="text-sm text-ink-secondary mb-4">{description}</p>

        {priceOptions ? (
          <div className="space-y-2">
            {priceOptions.monthly && (
              <div>
                <span className="text-3xl font-bold text-ink-primary">${priceOptions.monthly}</span>
                <span className="text-ink-secondary">/month</span>
              </div>
            )}
            {priceOptions.quarterly && (
              <div>
                <span className="text-3xl font-bold text-ink-primary">${priceOptions.quarterly}</span>
                <span className="text-ink-secondary">/quarter</span>
              </div>
            )}
            {priceOptions.yearly && (
              <div className="text-sm text-forest-green font-semibold">
                ${priceOptions.yearly}/year (save 2 months!)
              </div>
            )}
          </div>
        ) : (
          <div className="mb-2">
            <span className="text-5xl font-bold text-ink-primary">{typeof price === 'number' ? `$${price}` : price}</span>
            {period && <span className="text-ink-secondary">/{period}</span>}
          </div>
        )}
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm">
            <Check size={18} className="text-forest-green flex-shrink-0 mt-0.5" />
            <span className="text-ink-primary">{feature}</span>
          </li>
        ))}
      </ul>

      <a
        href={ctaLink}
        className={`block w-full text-center py-4 rounded-xl font-bold transition-all ${
          popular
            ? 'bg-gradient-to-r from-copper-orange to-gold text-white hover:shadow-xl hover:scale-105'
            : name === 'FREE'
            ? 'bg-white border-2 border-lakes-blue text-lakes-blue hover:bg-lakes-blue hover:text-white'
            : 'bg-gradient-to-r from-lakes-blue to-copper-orange text-white hover:shadow-xl'
        }`}
      >
        {ctaText}
      </a>
    </div>
  );
}

import { Check, TrendingUp, MapPin, Building2 } from 'lucide-react';

export function PricingComparison() {
  return (
    <section className="py-20 px-4 bg-parchment-light">
      <div className="container mx-auto max-w-5xl">
        <h2 className="font-display text-4xl font-bold text-ink-primary text-center mb-12">
          Which Option Is Right for You?
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Directory Card */}
          <div className="parchment-card p-8 border-4 border-copper-orange">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="text-copper-orange" size={32} />
              <h3 className="font-heading text-2xl font-bold text-ink-primary">
                Business Directory
              </h3>
            </div>

            <p className="text-ink-secondary mb-6">
              Best for businesses wanting simple, affordable online visibility without game participation.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <Check size={20} className="text-forest-green flex-shrink-0 mt-0.5" />
                <span className="text-sm">AI-powered search visibility</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={20} className="text-forest-green flex-shrink-0 mt-0.5" />
                <span className="text-sm">Always-on advertising presence (24/7)</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={20} className="text-forest-green flex-shrink-0 mt-0.5" />
                <span className="text-sm">No challenge creation required</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={20} className="text-forest-green flex-shrink-0 mt-0.5" />
                <span className="text-sm">Start FREE, scale when ready</span>
              </div>
            </div>

            <div className="bg-copper-orange/10 p-4 rounded-xl mb-6">
              <p className="text-sm font-semibold text-ink-primary mb-2">Perfect for:</p>
              <p className="text-sm text-ink-secondary">
                Restaurants, retailers, service businesses wanting online presence
              </p>
            </div>

            <a
              href="#directory"
              className="block w-full text-center py-3 bg-gradient-to-r from-copper-orange to-gold text-white rounded-xl font-bold hover:shadow-xl transition-all"
            >
              View Directory Options
            </a>
          </div>

          {/* Game Partnership Card */}
          <div className="parchment-card p-8 border-4 border-lakes-blue">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="text-lakes-blue" size={32} />
              <h3 className="font-heading text-2xl font-bold text-ink-primary">
                Game Partnership
              </h3>
            </div>

            <p className="text-ink-secondary mb-6">
              Best for businesses wanting to drive verified foot traffic through gamified challenges.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <Check size={20} className="text-forest-green flex-shrink-0 mt-0.5" />
                <span className="text-sm">GPS-verified customer visits</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={20} className="text-forest-green flex-shrink-0 mt-0.5" />
                <span className="text-sm">Monthly challenges drive engagement</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={20} className="text-forest-green flex-shrink-0 mt-0.5" />
                <span className="text-sm">Players compete for badges & prizes</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={20} className="text-forest-green flex-shrink-0 mt-0.5" />
                <span className="text-sm">Detailed analytics & reporting</span>
              </div>
            </div>

            <div className="bg-lakes-blue/10 p-4 rounded-xl mb-6">
              <p className="text-sm font-semibold text-ink-primary mb-2">Perfect for:</p>
              <p className="text-sm text-ink-secondary">
                Attractions, entertainment, experiential businesses wanting foot traffic
              </p>
            </div>

            <a
              href="#game"
              className="block w-full text-center py-3 bg-gradient-to-r from-lakes-blue to-forest-green text-white rounded-xl font-bold hover:shadow-xl transition-all"
            >
              View Game Partnerships
            </a>
          </div>
        </div>

        {/* Combined Option */}
        <div className="mt-8 p-8 bg-gradient-to-r from-lakes-blue/10 to-copper-orange/10 rounded-2xl border-2 border-forest-green">
          <div className="text-center">
            <h3 className="font-heading text-2xl font-bold text-ink-primary mb-4 flex items-center justify-center gap-2">
              <Building2 className="text-forest-green" size={32} />
              Get Both for Maximum Impact
            </h3>
            <p className="text-lg text-ink-secondary mb-6">
              Many businesses combine Directory advertising with Game partnerships for complete coverage:
              <br />
              <strong className="text-ink-primary">Always-on visibility + Game-driven foot traffic</strong>
            </p>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl treasure-border border-2">
                <p className="text-sm font-bold text-copper-orange mb-1">Budget-Friendly</p>
                <p className="text-lg font-bold text-ink-primary">FREE + $99/mo</p>
                <p className="text-xs text-ink-secondary mt-1">Directory + Spot Partner</p>
              </div>
              <div className="bg-white p-4 rounded-xl treasure-border border-2">
                <p className="text-sm font-bold text-copper-orange mb-1">Growth Package</p>
                <p className="text-lg font-bold text-ink-primary">$49 + $99/mo</p>
                <p className="text-xs text-ink-secondary mt-1">Starter + Spot Partner</p>
              </div>
              <div className="bg-white p-4 rounded-xl treasure-border border-2">
                <p className="text-sm font-bold text-copper-orange mb-1">Premium Package</p>
                <p className="text-lg font-bold text-ink-primary">$99 + $699/qtr</p>
                <p className="text-xs text-ink-secondary mt-1">Growth + Featured Partner</p>
              </div>
            </div>
            <p className="text-sm text-ink-secondary mb-6">
              💡 <strong>Pro Tip:</strong> Start with FREE directory listing, then add game partnerships when you're ready to drive foot traffic!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

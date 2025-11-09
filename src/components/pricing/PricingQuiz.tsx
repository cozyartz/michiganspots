import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, TrendingUp, MapPin, X, CheckCircle } from 'lucide-react';

type QuizStep = 'goal' | 'budget' | 'engagement' | 'result';

interface QuizAnswers {
  goal?: 'directory' | 'game' | 'both';
  budget?: 'free' | 'starter' | 'growth' | 'premium';
  engagement?: 'passive' | 'active' | 'decide';
}

interface Recommendation {
  tier: string;
  category: 'directory' | 'game';
  price: string;
  reason: string;
  anchor: string;
}

export function PricingQuiz({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<QuizStep>('goal');
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const handleAnswer = (question: keyof QuizAnswers, answer: any) => {
    const newAnswers = { ...answers, [question]: answer };
    setAnswers(newAnswers);

    // Progress to next step
    if (question === 'goal') {
      setStep('budget');
    } else if (question === 'budget') {
      setStep('engagement');
    } else if (question === 'engagement') {
      // Calculate recommendations
      const recs = calculateRecommendations(newAnswers);
      setRecommendations(recs);
      setStep('result');
    }
  };

  const calculateRecommendations = (ans: QuizAnswers): Recommendation[] => {
    const recs: Recommendation[] = [];

    // Directory recommendations
    if (ans.goal === 'directory' || ans.goal === 'both') {
      if (ans.budget === 'free') {
        recs.push({
          tier: 'FREE Directory',
          category: 'directory',
          price: '$0/forever',
          reason: 'Perfect starting point with zero cost. Get your business listed and visible in search.',
          anchor: 'directory'
        });
      } else if (ans.budget === 'starter') {
        recs.push({
          tier: 'STARTER Directory',
          category: 'directory',
          price: '$49/month',
          reason: 'AI-powered optimization and enhanced visibility at an affordable price point.',
          anchor: 'directory'
        });
      } else if (ans.budget === 'growth') {
        recs.push({
          tier: 'GROWTH Directory',
          category: 'directory',
          price: '$99/month',
          reason: 'Our most popular directory tier with featured badge and top AI recommendations.',
          anchor: 'directory'
        });
      } else if (ans.budget === 'premium') {
        recs.push({
          tier: 'PRO Directory',
          category: 'directory',
          price: '$199/month',
          reason: 'Full AI intelligence suite with dedicated support and multi-location management.',
          anchor: 'directory'
        });
      }
    }

    // Game partnership recommendations
    if (ans.goal === 'game' || ans.goal === 'both') {
      if (ans.budget === 'free' || ans.budget === 'starter') {
        recs.push({
          tier: 'SPOT PARTNER',
          category: 'game',
          price: '$99/month',
          reason: 'Drive verified foot traffic with GPS-based challenges. Great entry point for active engagement.',
          anchor: 'game'
        });
      } else if (ans.budget === 'growth') {
        recs.push({
          tier: 'FEATURED PARTNER',
          category: 'game',
          price: '$699/quarter',
          reason: 'Enhanced visibility with multiple challenges per month and featured game placement.',
          anchor: 'game'
        });
      } else if (ans.budget === 'premium') {
        recs.push({
          tier: 'PREMIUM SPONSOR',
          category: 'game',
          price: '$1,499/quarter',
          reason: 'Unlimited challenges, premium branding, and dedicated account management.',
          anchor: 'game'
        });
      }
    }

    // If both selected, add combined recommendation
    if (ans.goal === 'both' && recs.length >= 2) {
      const dirRec = recs.find(r => r.category === 'directory');
      const gameRec = recs.find(r => r.category === 'game');

      if (dirRec && gameRec) {
        recs.push({
          tier: 'COMBINED PACKAGE',
          category: 'directory',
          price: 'Best ROI',
          reason: `Combine ${dirRec.tier} + ${gameRec.tier} for always-on visibility PLUS verified foot traffic.`,
          anchor: 'directory'
        });
      }
    }

    return recs.length > 0 ? recs : [{
      tier: 'FREE Directory',
      category: 'directory',
      price: '$0/forever',
      reason: 'Start with our free directory listing - zero risk, immediate visibility.',
      anchor: 'directory'
    }];
  };

  const scrollToTier = (anchor: string) => {
    onClose();
    setTimeout(() => {
      const element = document.getElementById(anchor);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-parchment-light treasure-border border-4 rounded-2xl max-w-2xl w-full p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-secondary hover:text-ink-primary transition-colors"
        >
          <X size={24} />
        </button>

        <AnimatePresence mode="wait">
          {step === 'goal' && (
            <motion.div
              key="goal"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="font-display text-3xl font-bold text-ink-primary mb-3">
                What's your primary goal?
              </h2>
              <p className="text-ink-secondary mb-6">
                Help us recommend the best option for your business
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => handleAnswer('goal', 'directory')}
                  className="w-full text-left p-6 bg-white treasure-border border-2 hover:border-copper-orange transition-all rounded-xl group"
                >
                  <div className="flex items-start gap-4">
                    <TrendingUp className="text-copper-orange group-hover:scale-110 transition-transform" size={32} />
                    <div>
                      <h3 className="font-heading text-xl font-bold text-ink-primary mb-2">
                        Get found online by customers
                      </h3>
                      <p className="text-sm text-ink-secondary">
                        AI-powered search visibility • Always-on advertising • No game participation required
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleAnswer('goal', 'game')}
                  className="w-full text-left p-6 bg-white treasure-border border-2 hover:border-lakes-blue transition-all rounded-xl group"
                >
                  <div className="flex items-start gap-4">
                    <MapPin className="text-lakes-blue group-hover:scale-110 transition-transform" size={32} />
                    <div>
                      <h3 className="font-heading text-xl font-bold text-ink-primary mb-2">
                        Drive verified foot traffic
                      </h3>
                      <p className="text-sm text-ink-secondary">
                        GPS-verified challenges • Active customer engagement • Gamified discovery
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleAnswer('goal', 'both')}
                  className="w-full text-left p-6 bg-gradient-to-r from-copper-orange/10 to-lakes-blue/10 treasure-border border-2 border-forest-green hover:border-forest-green/80 transition-all rounded-xl group"
                >
                  <div className="flex items-start gap-4">
                    <CheckCircle className="text-forest-green group-hover:scale-110 transition-transform" size={32} />
                    <div>
                      <h3 className="font-heading text-xl font-bold text-ink-primary mb-2">
                        Both! Maximum visibility
                      </h3>
                      <p className="text-sm text-ink-secondary">
                        Combine directory advertising + game partnerships for complete market coverage
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {step === 'budget' && (
            <motion.div
              key="budget"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="font-display text-3xl font-bold text-ink-primary mb-3">
                What's your monthly marketing budget?
              </h2>
              <p className="text-ink-secondary mb-6">
                We'll match you with the right pricing tier
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => handleAnswer('budget', 'free')}
                  className="w-full text-left p-6 bg-white treasure-border border-2 hover:border-copper-orange transition-all rounded-xl"
                >
                  <h3 className="font-heading text-xl font-bold text-ink-primary mb-2">
                    $0 - $50 per month
                  </h3>
                  <p className="text-sm text-ink-secondary">
                    Start FREE with directory advertising
                  </p>
                </button>

                <button
                  onClick={() => handleAnswer('budget', 'starter')}
                  className="w-full text-left p-6 bg-white treasure-border border-2 hover:border-copper-orange transition-all rounded-xl"
                >
                  <h3 className="font-heading text-xl font-bold text-ink-primary mb-2">
                    $50 - $200 per month
                  </h3>
                  <p className="text-sm text-ink-secondary">
                    Enhanced visibility and AI features
                  </p>
                </button>

                <button
                  onClick={() => handleAnswer('budget', 'growth')}
                  className="w-full text-left p-6 bg-white treasure-border border-2 hover:border-copper-orange transition-all rounded-xl"
                >
                  <h3 className="font-heading text-xl font-bold text-ink-primary mb-2">
                    $200 - $500 per month
                  </h3>
                  <p className="text-sm text-ink-secondary">
                    Premium features and featured placement
                  </p>
                </button>

                <button
                  onClick={() => handleAnswer('budget', 'premium')}
                  className="w-full text-left p-6 bg-white treasure-border border-2 hover:border-copper-orange transition-all rounded-xl"
                >
                  <h3 className="font-heading text-xl font-bold text-ink-primary mb-2">
                    $500+ per month
                  </h3>
                  <p className="text-sm text-ink-secondary">
                    Enterprise features with dedicated support
                  </p>
                </button>
              </div>
            </motion.div>
          )}

          {step === 'engagement' && (
            <motion.div
              key="engagement"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="font-display text-3xl font-bold text-ink-primary mb-3">
                How hands-on do you want to be?
              </h2>
              <p className="text-ink-secondary mb-6">
                Different approaches for different business styles
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => handleAnswer('engagement', 'passive')}
                  className="w-full text-left p-6 bg-white treasure-border border-2 hover:border-copper-orange transition-all rounded-xl"
                >
                  <h3 className="font-heading text-xl font-bold text-ink-primary mb-2">
                    Set it and forget it
                  </h3>
                  <p className="text-sm text-ink-secondary">
                    Directory advertising works 24/7 without ongoing effort
                  </p>
                </button>

                <button
                  onClick={() => handleAnswer('engagement', 'active')}
                  className="w-full text-left p-6 bg-white treasure-border border-2 hover:border-copper-orange transition-all rounded-xl"
                >
                  <h3 className="font-heading text-xl font-bold text-ink-primary mb-2">
                    Active engagement with customers
                  </h3>
                  <p className="text-sm text-ink-secondary">
                    Game partnerships create interactive experiences and verified visits
                  </p>
                </button>

                <button
                  onClick={() => handleAnswer('engagement', 'decide')}
                  className="w-full text-left p-6 bg-white treasure-border border-2 hover:border-copper-orange transition-all rounded-xl"
                >
                  <h3 className="font-heading text-xl font-bold text-ink-primary mb-2">
                    Show me all options
                  </h3>
                  <p className="text-sm text-ink-secondary">
                    I want to see everything and decide for myself
                  </p>
                </button>
              </div>
            </motion.div>
          )}

          {step === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="font-display text-3xl font-bold text-ink-primary mb-3">
                We recommend these options
              </h2>
              <p className="text-ink-secondary mb-6">
                Based on your answers, here are the best fits for your business
              </p>

              <div className="space-y-4">
                {recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-6 bg-white treasure-border border-2 rounded-xl"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-heading text-xl font-bold text-ink-primary">
                          {rec.tier}
                        </h3>
                        <p className="text-2xl font-bold text-copper-orange mt-1">
                          {rec.price}
                        </p>
                      </div>
                      {rec.category === 'directory' && <TrendingUp className="text-copper-orange" size={32} />}
                      {rec.category === 'game' && <MapPin className="text-lakes-blue" size={32} />}
                    </div>
                    <p className="text-ink-secondary mb-4">{rec.reason}</p>
                    <button
                      onClick={() => scrollToTier(rec.anchor)}
                      className="w-full py-3 bg-gradient-to-r from-lakes-blue to-copper-orange text-white rounded-xl font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      View Details <ChevronRight size={20} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={onClose}
                className="w-full mt-6 py-3 bg-white treasure-border border-2 text-ink-primary rounded-xl font-bold hover:bg-parchment-light transition-all"
              >
                Browse All Options
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

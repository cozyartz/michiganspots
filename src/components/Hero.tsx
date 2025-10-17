import { motion } from 'framer-motion';
import { MapPin, Trophy, Users, Sparkles } from 'lucide-react';
import { Button } from './Button';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-20 px-4">
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="treasure-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="2" fill="#2C1810" />
              <path d="M 25 50 L 75 50 M 50 25 L 50 75" stroke="#2C1810" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#treasure-pattern)" />
        </svg>
      </div>

      <div className="container mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gold-treasure/20 treasure-border mb-6"
            >
              <Sparkles className="w-4 h-4 text-gold-treasure" />
              <span className="text-sm font-heading font-semibold text-ink-primary">
                Reddit Community Games 2025
              </span>
            </motion.div>

            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-ink-primary mb-6 leading-tight">
              Discover Michigan's
              <span className="text-copper-orange text-shadow-treasure"> Hidden Gems</span>
            </h1>

            <p className="text-lg md:text-xl text-ink-secondary mb-8 leading-relaxed">
              Be among the first explorers in a community-powered treasure hunt across the Great Lakes State.
              Find spots, complete challenges, earn badges, and compete with cities across Michigan.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Join the Hunt
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.location.href = '/about'}
              >
                Learn More
              </Button>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <MapPin className="w-8 h-8 text-lakes-blue" />
                </div>
                <div className="font-heading font-bold text-2xl text-ink-primary">Discover</div>
                <div className="text-sm text-ink-secondary">Hidden Spots</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Trophy className="w-8 h-8 text-gold-treasure" />
                </div>
                <div className="font-heading font-bold text-2xl text-ink-primary">Complete</div>
                <div className="text-sm text-ink-secondary">Challenges</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Users className="w-8 h-8 text-forest-green" />
                </div>
                <div className="font-heading font-bold text-2xl text-ink-primary">Compete</div>
                <div className="text-sm text-ink-secondary">With Your City</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden md:block"
          >
            <div className="relative">
              <div className="parchment-card p-8">
                <div className="aspect-square bg-gradient-to-br from-lakes-blue to-forest-green rounded-lg opacity-30"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="w-full h-full p-8"
                  >
                    <img
                      src="/MiSpot_logo.png"
                      alt="Michigan Spots Logo"
                      className="w-full h-full object-contain"
                    />
                  </motion.div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gold-treasure/20 treasure-border rounded-full"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-copper-orange/20 treasure-border rounded-full"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

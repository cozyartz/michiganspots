import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { useState, useEffect } from 'react';

const logoVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
      duration: 0.8
    }
  },
  poppedOut: {
    scale: 0,
    opacity: 0,
    transition: { duration: 0.5 }
  }
};

const badgeVariants = {
  hidden: { scale: 0, opacity: 0, rotate: -180 },
  visible: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
      delay: 0.2
    }
  }
};

export function Hero() {
  const [isLogoVisible, setIsLogoVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsLogoVisible(false);
      setTimeout(() => setIsLogoVisible(true), 2000); // 2 second delay before popping back in
    }, 8000); // 8 seconds between pops
    return () => clearInterval(interval);
  }, []);

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
              initial="hidden"
              animate="visible"
              variants={badgeVariants}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-cyan-light/30 treasure-border mb-6"
            >
              <Sparkles className="w-4 h-4 text-cyan-primary" />
              <span className="text-sm font-heading font-semibold text-ink-primary">
                Reddit Community Games 2025
              </span>
            </motion.div>

            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-ink-primary mb-6 leading-tight">
              Discover Hidden Treasures
              <br />
              <span className="text-cyan-primary text-shadow-treasure">Win Real Prizes</span>
              <br />Across Michigan
            </h1>

            <p className="text-lg md:text-xl text-ink-secondary mb-8 leading-relaxed">
              Join the ultimate Michigan treasure hunt! Explore 60+ locations across the Great Lakes State, find hidden treasures, and win exciting prizes. Every adventure brings you closer to rewards while discovering Michigan's beauty.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8 sm:flex sm:items-center sm:space-x-6">
              <div className="flex items-center space-x-2">
                <span className="font-display text-3xl font-bold text-lakes-blue">10</span>
                <span className="text-sm text-ink-secondary">Adventures</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-display text-3xl font-bold text-amber-primary">60+</span>
                <span className="text-sm text-ink-secondary">Locations</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-display text-3xl font-bold text-coral-primary">🏆</span>
                <span className="text-sm text-ink-secondary">Real Prizes</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-display text-3xl font-bold text-forest-green">FREE</span>
                <span className="text-sm text-ink-secondary">to Play</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Start Your Adventure
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.location.href = '/about'}
              >
                Explore Challenges
              </Button>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <MapPin className="w-8 h-8 text-cyan-primary" />
                </div>
                <div className="font-heading font-bold text-2xl text-ink-primary">Explore</div>
                <div className="text-sm text-ink-secondary">Real Locations</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Sparkles className="w-8 h-8 text-amber-primary" />
                </div>
                <div className="font-heading font-bold text-2xl text-ink-primary">Capture</div>
                <div className="text-sm text-ink-secondary">Your Memories</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Users className="w-8 h-8 text-coral-primary" />
                </div>
                <div className="font-heading font-bold text-2xl text-ink-primary">Share</div>
                <div className="text-sm text-ink-secondary">With Community</div>
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
                <div className="aspect-square bg-gradient-to-br from-cyan-primary via-cyan-glow to-amber-primary rounded-lg opacity-20"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {isLogoVisible && (
                      <motion.div
                        key="logo"
                        initial="hidden"
                        animate="visible"
                        exit="poppedOut"
                        variants={logoVariants}
                        className="w-full h-full p-8"
                      >
                        <img
                          src="/MI Spots Scribble Logo.png"
                          alt="Michigan Spots Logo"
                          className="w-full h-full object-contain"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 20 }}
                className="absolute -top-4 -right-4 w-24 h-24 bg-amber-primary/20 cyber-glow treasure-border rounded-full"
              ></motion.div>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.7, type: 'spring', stiffness: 300, damping: 20 }}
                className="absolute -bottom-4 -left-4 w-16 h-16 bg-coral-primary/20 cyber-glow treasure-border rounded-full"
              ></motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

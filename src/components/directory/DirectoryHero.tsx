import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Users } from 'lucide-react';

export function DirectoryHero() {
  return (
    <section className="relative py-20 px-4 bg-gradient-to-b from-parchment-light to-parchment-mid overflow-hidden">
      {/* Subtle Corner Gradient Accent */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-lakes-blue/20 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-forest-green/15 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] bg-gradient-to-bl from-copper-orange/10 to-transparent rounded-full blur-2xl" />
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center text-ink-primary"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-lakes-blue/10 backdrop-blur-sm rounded-full border border-lakes-blue/20 mb-6"
          >
            <Sparkles className="text-lakes-blue" size={20} />
            <span className="font-semibold text-lg text-ink-secondary">AI-Powered Business Discovery</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight"
          >
            Discover Michigan's
            <br />
            <span className="bg-gradient-to-r from-lakes-blue to-forest-green bg-clip-text text-transparent">Best Local Businesses</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto text-ink-secondary"
          >
            Smart search powered by AI. Find restaurants, shops, services, and attractions
            across the Great Lakes State with natural language search.
          </motion.p>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-8 text-ink-secondary"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-lakes-blue/20 to-lakes-blue/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-lakes-blue/20">
                <TrendingUp className="text-lakes-blue" size={24} />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-ink-primary">2,400+</div>
                <div className="text-sm">Businesses Listed</div>
              </div>
            </div>

            <div className="hidden sm:block w-px h-12 bg-ink-faded/20" />

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-forest-green/20 to-forest-green/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-forest-green/20">
                <Users className="text-forest-green" size={24} />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-ink-primary">150+</div>
                <div className="text-sm">Michigan Cities</div>
              </div>
            </div>

            <div className="hidden sm:block w-px h-12 bg-ink-faded/20" />

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-copper-orange/20 to-copper-orange/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-copper-orange/20">
                <Sparkles className="text-copper-orange" size={24} />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-ink-primary">98%</div>
                <div className="text-sm">AI Accuracy</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

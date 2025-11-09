import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Users } from 'lucide-react';

export function DirectoryHero() {
  return (
    <section className="relative py-20 px-4 bg-gradient-to-br from-lakes-blue via-copper-orange to-forest-green overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center text-white"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-6"
          >
            <Sparkles className="text-gold" size={20} />
            <span className="font-semibold text-lg">AI-Powered Business Discovery</span>
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
            <span className="text-gold">Best Local Businesses</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto opacity-95"
          >
            Smart search powered by AI. Find restaurants, shops, services, and attractions
            across the Great Lakes State with natural language search.
          </motion.p>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-8 text-white/90"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold">2,400+</div>
                <div className="text-sm opacity-80">Businesses Listed</div>
              </div>
            </div>

            <div className="hidden sm:block w-px h-12 bg-white/30" />

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Users size={24} />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold">150+</div>
                <div className="text-sm opacity-80">Michigan Cities</div>
              </div>
            </div>

            <div className="hidden sm:block w-px h-12 bg-white/30" />

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Sparkles size={24} />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold">98%</div>
                <div className="text-sm opacity-80">AI Accuracy</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Copyright (c) 2025 Cozyartz Media Group d/b/a State Spots
 * Licensed under AGPL-3.0-or-later OR Commercial
 * See LICENSE and LICENSE-COMMERCIAL.md for details
 */

import { motion } from 'framer-motion';
import { Heart, Users, Camera, Gift, MapPin, Shield } from 'lucide-react';

const reasons = [
  {
    icon: MapPin,
    title: 'Discover Places You Never Knew Existed',
    description: 'From hidden waterfalls to historic lighthouses, uncover the gems that make Michigan truly special. Our carefully curated challenges take you beyond the tourist spots to authentic local experiences.',
    color: 'text-lakes-blue',
    bgColor: 'bg-lakes-blue/10',
  },
  {
    icon: Users,
    title: 'Connect with Fellow Michigan Explorers',
    description: 'Join a vibrant community of Michiganders sharing their adventures, tips, and love for our state. Exchange stories, discover new perspectives, and make memories together.',
    color: 'text-forest-green',
    bgColor: 'bg-forest-green/10',
  },
  {
    icon: Camera,
    title: 'Preserve Your Pure Michigan Memories',
    description: 'Create a digital scrapbook of your Michigan journey. Every photo submission becomes part of your personal collection celebrating the beauty of our Great Lakes State.',
    color: 'text-amber-primary',
    bgColor: 'bg-amber-primary/10',
  },
  {
    icon: Gift,
    title: 'Support Local Communities',
    description: 'Many challenges partner with local businesses and attractions. Your visits help support Michigan\'s economy while you discover what makes each town and city unique.',
    color: 'text-coral-primary',
    bgColor: 'bg-coral-primary/10',
  },
];

export function WhyExplore() {
  return (
    <section className="py-20 px-4 bg-parchment-mid">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-ink-primary mb-4">
            Why Explore Michigan With Us?
          </h2>
          <p className="text-lg text-ink-secondary max-w-2xl mx-auto">
            More than just a game—it's a celebration of everything that makes Michigan home.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {reasons.map((reason, index) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="parchment-card p-6 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-14 h-14 ${reason.bgColor} treasure-border rounded-lg flex items-center justify-center`}>
                  <reason.icon className={`w-7 h-7 ${reason.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading text-xl font-bold text-ink-primary mb-3">
                    {reason.title}
                  </h3>
                  <p className="text-ink-secondary leading-relaxed">
                    {reason.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="parchment-card p-8"
        >
          <div className="flex flex-col md:flex-row items-center justify-around gap-8 text-center">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-forest-green" />
              <div className="text-left">
                <div className="font-heading font-bold text-ink-primary">Safe & Fair</div>
                <div className="text-sm text-ink-secondary">GPS verification ensures honest play</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Heart className="w-8 h-8 text-coral-primary" />
              <div className="text-left">
                <div className="font-heading font-bold text-ink-primary">Made in Michigan</div>
                <div className="text-sm text-ink-secondary">Built by Michiganders, for Michiganders</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-lakes-blue" />
              <div className="text-left">
                <div className="font-heading font-bold text-ink-primary">Community First</div>
                <div className="text-sm text-ink-secondary">Built on Reddit, powered by you</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

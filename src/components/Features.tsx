/**
 * Copyright (c) 2025 Cozyartz Media Group d/b/a State Spots
 * Licensed under AGPL-3.0-or-later OR Commercial
 * See LICENSE and LICENSE-COMMERCIAL.md for details
 */

import { motion } from 'framer-motion';
import { Map, Trophy, Award, Users, Zap, Heart } from 'lucide-react';
import { Card } from './Card';

const features = [
  {
    icon: Map,
    title: 'Spot Discovery',
    description: 'Explore hidden gems across Michigan. From secret trails to local legends, discover places you never knew existed.',
  },
  {
    icon: Trophy,
    title: 'Weekly Challenges',
    description: 'Complete themed challenges to earn exclusive badges. New adventures every week keep the hunt exciting.',
  },
  {
    icon: Users,
    title: 'City Rivalries',
    description: 'Battle Creek vs Detroit vs Ann Arbor. Team up with your city and compete for regional supremacy.',
  },
  {
    icon: Award,
    title: 'Earn Badges',
    description: 'Collect unique digital badges for your discoveries. Bronze to Legendary, show off your explorer status.',
  },
  {
    icon: Zap,
    title: 'Real-Time Leaderboards',
    description: 'Track your progress against other explorers. Rise through the ranks and claim your spot at the top.',
  },
  {
    icon: Heart,
    title: 'Community Powered',
    description: 'Built on Reddit with Michigan pride. Share stories, photos, and memories with fellow explorers.',
  },
];

export function Features() {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-ink-primary mb-4">
            How It Works
          </h2>
          <p className="text-lg text-ink-secondary max-w-2xl mx-auto">
            Michigan Spots combines exploration, gamification, and community to create
            an unforgettable adventure across the Great Lakes State.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-copper-orange/20 treasure-border rounded-lg flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-copper-orange" />
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-ink-primary mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-ink-secondary">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

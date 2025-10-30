import { motion } from 'framer-motion';
import { Card } from './Card';

const challenges = [
  {
    id: 'great-lakes-explorer',
    name: 'Great Lakes Explorer',
    description: 'Visit all five Great Lakes bordering our beautiful state',
    difficulty: 'hard',
    bonusPoints: 500,
    icon: '🌊',
    landmarks: 5,
    color: 'from-blue-400 to-cyan-500',
  },
  {
    id: 'upper-peninsula-adventure',
    name: 'Upper Peninsula Adventure',
    description: 'Explore the stunning natural wonders of the UP',
    difficulty: 'hard',
    bonusPoints: 400,
    icon: '⛰️',
    landmarks: 5,
    color: 'from-green-500 to-emerald-600',
  },
  {
    id: 'detroit-urban-explorer',
    name: 'Detroit Urban Explorer',
    description: 'Discover iconic landmarks in Motor City',
    difficulty: 'medium',
    bonusPoints: 300,
    icon: '🏙️',
    landmarks: 6,
    color: 'from-orange-400 to-red-500',
  },
  {
    id: 'lighthouse-seeker',
    name: 'Lighthouse Seeker',
    description: 'Find historic lighthouses along Michigan\'s coastline',
    difficulty: 'hard',
    bonusPoints: 350,
    icon: '🗼',
    landmarks: 6,
    color: 'from-purple-400 to-purple-600',
  },
  {
    id: 'west-michigan-beaches',
    name: 'West Michigan Beaches',
    description: 'Experience the beautiful beaches of Western Michigan',
    difficulty: 'easy',
    bonusPoints: 200,
    icon: '🏖️',
    landmarks: 5,
    color: 'from-cyan-400 to-blue-500',
  },
  {
    id: 'college-town-tour',
    name: 'College Town Tour',
    description: 'Visit Michigan\'s famous university campuses',
    difficulty: 'medium',
    bonusPoints: 250,
    icon: '🎓',
    landmarks: 5,
    color: 'from-amber-400 to-orange-500',
  },
  {
    id: 'fall-colors-tour',
    name: 'Fall Colors Tour',
    description: 'Capture Michigan\'s stunning autumn foliage',
    difficulty: 'medium',
    bonusPoints: 300,
    icon: '🍂',
    landmarks: 5,
    color: 'from-orange-500 to-red-600',
    seasonal: 'Fall',
  },
  {
    id: 'hidden-michigan',
    name: 'Hidden Michigan',
    description: 'Discover lesser-known gems across our state',
    difficulty: 'hard',
    bonusPoints: 400,
    icon: '💎',
    landmarks: 6,
    color: 'from-pink-500 to-rose-600',
  },
  {
    id: 'winter-wonderland',
    name: 'Winter Wonderland',
    description: 'Experience Michigan\'s magical winter beauty',
    difficulty: 'medium',
    bonusPoints: 350,
    icon: '❄️',
    landmarks: 5,
    color: 'from-blue-300 to-blue-500',
    seasonal: 'Winter',
  },
  {
    id: 'historic-michigan',
    name: 'Historic Michigan',
    description: 'Explore our state\'s rich historical heritage',
    difficulty: 'medium',
    bonusPoints: 300,
    icon: '🏛️',
    landmarks: 6,
    color: 'from-amber-600 to-amber-800',
  },
];

const difficultyColors = {
  easy: 'bg-green-500/20 text-green-700 border-green-500',
  medium: 'bg-amber-500/20 text-amber-700 border-amber-500',
  hard: 'bg-red-500/20 text-red-700 border-red-500',
};

export function MichiganAdventure() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-parchment-light to-parchment-mid">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-ink-primary mb-4">
            Your Michigan Adventure
          </h2>
          <p className="text-lg text-ink-secondary max-w-3xl mx-auto">
            Choose from 10 unique challenges celebrating the beauty and diversity of our state.
            Each adventure takes you to real Michigan locations, from bustling cities to hidden natural wonders.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {challenges.map((challenge, index) => (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <Card className="h-full hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="space-y-4">
                  {/* Icon and Title */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`text-4xl bg-gradient-to-br ${challenge.color} p-3 rounded-lg shadow-md`}>
                        {challenge.icon}
                      </div>
                      <div>
                        <h3 className="font-heading text-xl font-bold text-ink-primary">
                          {challenge.name}
                        </h3>
                        {challenge.seasonal && (
                          <span className="text-xs bg-cyan-light/50 text-cyan-primary px-2 py-1 treasure-border inline-block mt-1">
                            Seasonal: {challenge.seasonal}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-ink-secondary text-sm leading-relaxed">
                    {challenge.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-3 border-t-2 border-ink-primary/10">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`text-xs font-heading font-bold px-3 py-1 treasure-border ${
                          difficultyColors[challenge.difficulty as keyof typeof difficultyColors]
                        }`}
                      >
                        {challenge.difficulty.toUpperCase()}
                      </div>
                      <div className="text-sm text-ink-secondary">
                        <span className="font-bold text-ink-primary">{challenge.landmarks}</span> spots
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-ink-secondary">Bonus</div>
                      <div className="font-heading font-bold text-lg text-amber-primary">
                        +{challenge.bonusPoints}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-3xl mx-auto"
        >
          <div className="parchment-card p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="font-display text-4xl font-bold text-lakes-blue mb-2">10</div>
                <div className="text-sm text-ink-secondary font-heading">Unique Adventures</div>
              </div>
              <div>
                <div className="font-display text-4xl font-bold text-forest-green mb-2">60+</div>
                <div className="text-sm text-ink-secondary font-heading">Real Locations</div>
              </div>
              <div>
                <div className="font-display text-4xl font-bold text-amber-primary mb-2">3,300</div>
                <div className="text-sm text-ink-secondary font-heading">Bonus Points</div>
              </div>
              <div>
                <div className="font-display text-4xl font-bold text-coral-primary mb-2">FREE</div>
                <div className="text-sm text-ink-secondary font-heading">Always</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

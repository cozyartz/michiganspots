import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown, Trophy, MapPin } from 'lucide-react';

// Challenge data imported from the Devvit app
const MICHIGAN_CHALLENGES = [
  {
    id: 'great-lakes-explorer',
    name: 'Great Lakes Explorer',
    category: 'great-lakes',
    difficulty: 'hard',
    bonusPoints: 500,
    icon: '🌊',
    color: '#1E88E5',
    landmarks: [
      { name: 'Lake Superior', lat: 47.5979, lon: -87.5470 },
      { name: 'Lake Michigan', lat: 44.0931, lon: -86.4542 },
      { name: 'Lake Huron', lat: 44.8167, lon: -82.7333 },
      { name: 'Lake Erie', lat: 41.9784, lon: -83.2654 },
      { name: 'Lake St. Clair', lat: 42.5833, lon: -82.75 },
    ],
  },
  {
    id: 'upper-peninsula-adventure',
    name: 'Upper Peninsula Adventure',
    category: 'natural-wonders',
    difficulty: 'hard',
    bonusPoints: 400,
    icon: '⛰️',
    color: '#43A047',
    landmarks: [
      { name: 'Pictured Rocks', lat: 46.5656, lon: -86.3397 },
      { name: 'Tahquamenon Falls', lat: 46.5771, lon: -85.2561 },
      { name: 'Mackinac Island', lat: 45.8489, lon: -84.6175 },
      { name: 'Porcupine Mountains', lat: 46.7557, lon: -89.7845 },
      { name: 'Isle Royale', lat: 48.1063, lon: -88.5542 },
    ],
  },
  {
    id: 'detroit-urban-explorer',
    name: 'Detroit Urban Explorer',
    category: 'urban-landmarks',
    difficulty: 'medium',
    bonusPoints: 300,
    icon: '🏙️',
    color: '#FB8C00',
    landmarks: [
      { name: 'Guardian Building', lat: 42.3298, lon: -83.0458 },
      { name: 'Eastern Market', lat: 42.3471, lon: -83.0396 },
      { name: 'Belle Isle', lat: 42.3387, lon: -82.9853 },
      { name: 'Detroit Institute of Arts', lat: 42.3594, lon: -83.0645 },
      { name: 'Fox Theatre', lat: 42.3373, lon: -83.0504 },
      { name: 'Comerica Park', lat: 42.3390, lon: -83.0485 },
    ],
  },
  {
    id: 'lighthouse-seeker',
    name: 'Lighthouse Seeker',
    category: 'historical-sites',
    difficulty: 'hard',
    bonusPoints: 350,
    icon: '🗼',
    color: '#8E24AA',
    landmarks: [
      { name: 'Big Sable Point', lat: 44.0579, lon: -86.5122 },
      { name: 'Old Mackinac Point', lat: 45.7823, lon: -84.7275 },
      { name: 'Point Betsie', lat: 44.6947, lon: -86.2544 },
      { name: 'Sturgeon Point', lat: 44.7176, lon: -83.2732 },
      { name: 'Au Sable Light', lat: 46.6702, lon: -85.5449 },
      { name: 'Whitefish Point', lat: 46.7697, lon: -84.9567 },
    ],
  },
  {
    id: 'west-michigan-beaches',
    name: 'West Michigan Beaches',
    category: 'natural-wonders',
    difficulty: 'easy',
    bonusPoints: 200,
    icon: '🏖️',
    color: '#00ACC1',
    landmarks: [
      { name: 'Sleeping Bear Dunes', lat: 44.8833, lon: -86.0333 },
      { name: 'Grand Haven', lat: 43.0613, lon: -86.2286 },
      { name: 'Holland State Park', lat: 42.7752, lon: -86.2094 },
      { name: 'Warren Dunes', lat: 41.9095, lon: -86.5869 },
      { name: 'Silver Lake Dunes', lat: 43.6780, lon: -86.4925 },
    ],
  },
  {
    id: 'college-town-tour',
    name: 'College Town Tour',
    category: 'urban-landmarks',
    difficulty: 'medium',
    bonusPoints: 250,
    icon: '🎓',
    color: '#F4511E',
    landmarks: [
      { name: 'U of Michigan', lat: 42.2780, lon: -83.7382 },
      { name: 'Michigan State', lat: 42.7018, lon: -84.4822 },
      { name: 'Western Michigan', lat: 42.2844, lon: -85.6064 },
      { name: 'Michigan Tech', lat: 47.1176, lon: -88.5459 },
      { name: 'Grand Valley', lat: 42.9631, lon: -85.8891 },
    ],
  },
  {
    id: 'fall-colors-tour',
    name: 'Fall Colors Tour',
    category: 'seasonal',
    difficulty: 'medium',
    bonusPoints: 300,
    icon: '🍂',
    color: '#E65100',
    landmarks: [
      { name: 'Tunnel of Trees', lat: 45.6353, lon: -85.1004 },
      { name: 'Pictured Rocks', lat: 46.5656, lon: -86.3397 },
      { name: 'Porcupine Mountains', lat: 46.7557, lon: -89.7845 },
      { name: 'Sleeping Bear', lat: 44.8833, lon: -86.0333 },
      { name: 'Tahquamenon', lat: 46.5771, lon: -85.2561 },
    ],
  },
  {
    id: 'hidden-michigan',
    name: 'Hidden Michigan',
    category: 'hidden-gems',
    difficulty: 'hard',
    bonusPoints: 400,
    icon: '💎',
    color: '#D81B60',
    landmarks: [
      { name: 'Kitch-iti-kipi', lat: 46.0136, lon: -86.1825 },
      { name: 'Castle Rock', lat: 45.8672, lon: -84.7333 },
      { name: 'Mystery Spot', lat: 45.9889, lon: -85.6236 },
      { name: 'Dinosaur Gardens', lat: 45.2186, lon: -83.6253 },
      { name: 'Hartwick Pines', lat: 44.7381, lon: -84.6597 },
      { name: 'Bond Falls', lat: 46.4586, lon: -89.0892 },
    ],
  },
  {
    id: 'winter-wonderland',
    name: 'Winter Wonderland',
    category: 'seasonal',
    difficulty: 'medium',
    bonusPoints: 350,
    icon: '❄️',
    color: '#039BE5',
    landmarks: [
      { name: 'Ice Caves at Eben', lat: 46.4044, lon: -87.0286 },
      { name: 'Frozen Tahquamenon', lat: 46.5771, lon: -85.2561 },
      { name: 'Frankenmuth', lat: 43.3314, lon: -83.7380 },
      { name: 'Crystal Mountain', lat: 44.5914, lon: -85.9539 },
      { name: 'Boyne Mountain', lat: 45.1647, lon: -84.9294 },
    ],
  },
  {
    id: 'historic-michigan',
    name: 'Historic Michigan',
    category: 'historical-sites',
    difficulty: 'medium',
    bonusPoints: 300,
    icon: '🏛️',
    color: '#6D4C41',
    landmarks: [
      { name: 'Fort Mackinac', lat: 45.8517, lon: -84.6172 },
      { name: 'Henry Ford Museum', lat: 42.3034, lon: -83.2343 },
      { name: 'Greenfield Village', lat: 42.3075, lon: -83.2297 },
      { name: 'State Capitol', lat: 42.7337, lon: -84.5553 },
      { name: 'Soo Locks', lat: 46.5050, lon: -84.3489 },
      { name: 'Grand Hotel', lat: 45.8475, lon: -84.6250 },
    ],
  },
];

const difficultyStyles = {
  easy: { text: 'Easy', color: 'text-forest-green', bg: 'bg-forest-green/10' },
  medium: { text: 'Medium', color: 'text-amber-primary', bg: 'bg-amber-primary/10' },
  hard: { text: 'Hard', color: 'text-coral-primary', bg: 'bg-coral-primary/10' },
};

export function MichiganChallenges() {
  const [expandedChallenge, setExpandedChallenge] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredChallenges = selectedCategory
    ? MICHIGAN_CHALLENGES.filter(c => c.category === selectedCategory)
    : MICHIGAN_CHALLENGES;

  const totalLocations = MICHIGAN_CHALLENGES.reduce((sum, c) => sum + c.landmarks.length, 0);

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Category Filter */}
      <div className="mb-8 flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 treasure-border font-heading text-sm transition-colors ${
            selectedCategory === null
              ? 'bg-lakes-blue text-parchment-light'
              : 'bg-parchment-light text-ink-primary hover:bg-parchment-mid'
          }`}
        >
          All Challenges ({MICHIGAN_CHALLENGES.length})
        </button>
        {Array.from(new Set(MICHIGAN_CHALLENGES.map(c => c.category))).map(category => {
          const categoryCount = MICHIGAN_CHALLENGES.filter(c => c.category === category).length;
          const categoryName = category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 treasure-border font-heading text-sm transition-colors ${
                selectedCategory === category
                  ? 'bg-lakes-blue text-parchment-light'
                  : 'bg-parchment-light text-ink-primary hover:bg-parchment-mid'
              }`}
            >
              {categoryName} ({categoryCount})
            </button>
          );
        })}
      </div>

      {/* Stats Banner */}
      <div className="mb-8 parchment-card p-6 text-center">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-ink-primary mb-3">
          {filteredChallenges.length} Epic Michigan Adventures
        </h2>
        <p className="text-lg text-ink-secondary font-heading">
          Explore <span className="font-bold text-lakes-blue">{totalLocations} unique locations</span> across the Great Lakes State
        </p>
      </div>

      {/* Challenge Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredChallenges.map((challenge) => {
          const isExpanded = expandedChallenge === challenge.id;
          const difficultyStyle = difficultyStyles[challenge.difficulty as keyof typeof difficultyStyles];

          return (
            <motion.div
              key={challenge.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="parchment-card p-6 cursor-pointer transition-all hover:shadow-xl"
              style={{
                borderColor: challenge.color,
                borderWidth: '2px',
              }}
            >
              {/* Challenge Header */}
              <div className="text-center mb-4">
                <div className="text-6xl mb-3">{challenge.icon}</div>
                <h3 className="font-display text-xl font-bold text-ink-primary mb-2">
                  {challenge.name}
                </h3>
              </div>

              {/* Difficulty & Points */}
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-heading font-semibold ${difficultyStyle.bg} ${difficultyStyle.color}`}>
                  {difficultyStyle.text}
                </span>
                <div className="flex items-center gap-1 text-amber-primary">
                  <Trophy size={16} />
                  <span className="font-heading font-bold text-sm">+{challenge.bonusPoints}</span>
                </div>
              </div>

              {/* Location Count */}
              <div className="mb-4 flex items-center gap-2 text-ink-secondary">
                <MapPin size={18} />
                <span className="font-heading text-sm">
                  <strong className="text-ink-primary">{challenge.landmarks.length}</strong> Locations
                </span>
              </div>

              {/* Preview Locations (First 3) */}
              <div className="mb-4 space-y-2">
                {challenge.landmarks.slice(0, 3).map((landmark, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-ink-secondary">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: challenge.color }}
                    />
                    <span className="font-heading">{landmark.name}</span>
                  </div>
                ))}
                {challenge.landmarks.length > 3 && !isExpanded && (
                  <div className="text-xs text-ink-secondary font-heading italic">
                    +{challenge.landmarks.length - 3} more...
                  </div>
                )}
              </div>

              {/* Expand Button */}
              <button
                onClick={() => setExpandedChallenge(isExpanded ? null : challenge.id)}
                className="w-full py-2 treasure-border font-heading text-sm font-semibold transition-colors hover:bg-parchment-mid flex items-center justify-center gap-2"
                style={{
                  backgroundColor: isExpanded ? `${challenge.color}20` : 'transparent',
                  color: challenge.color,
                }}
              >
                {isExpanded ? 'Hide Locations' : 'View All Locations'}
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={16} />
                </motion.div>
              </button>

              {/* Expanded Location List */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 border-t-2 border-ink-primary/10 space-y-2">
                      {challenge.landmarks.slice(3).map((landmark, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-ink-secondary">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: challenge.color }}
                          />
                          <span className="font-heading">{landmark.name}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

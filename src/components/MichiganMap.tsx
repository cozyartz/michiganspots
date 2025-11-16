/**
 * Copyright (c) 2025 Cozyartz Media Group d/b/a State Spots
 * Licensed under AGPL-3.0-or-later OR Commercial
 * See LICENSE and LICENSE-COMMERCIAL.md for details
 */

import { motion } from 'framer-motion';
import { useState } from 'react';
import { MapPin } from 'lucide-react';

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

// Michigan bounds for coordinate conversion
const MICHIGAN_BOUNDS = {
  minLat: 41.7,
  maxLat: 48.3,
  minLon: -90.4,
  maxLon: -82.1,
};

// Convert lat/lon to SVG coordinates (for the clean SVG Michigan outline)
function latLonToSVG(lat: number, lon: number, width: number, height: number) {
  const x = ((lon - MICHIGAN_BOUNDS.minLon) / (MICHIGAN_BOUNDS.maxLon - MICHIGAN_BOUNDS.minLon)) * width;
  const y = height - ((lat - MICHIGAN_BOUNDS.minLat) / (MICHIGAN_BOUNDS.maxLat - MICHIGAN_BOUNDS.minLat)) * height;
  return { x, y };
}

interface LandmarkPin {
  name: string;
  lat: number;
  lon: number;
  challenge: string;
  icon: string;
  color: string;
}

// Flatten all landmarks from all challenges
const allLandmarks: LandmarkPin[] = MICHIGAN_CHALLENGES.flatMap(challenge =>
  challenge.landmarks.map(landmark => ({
    name: landmark.name,
    lat: landmark.lat,
    lon: landmark.lon,
    challenge: challenge.name,
    icon: challenge.icon,
    color: challenge.color,
  }))
);

export function MichiganMap() {
  const [hoveredLandmark, setHoveredLandmark] = useState<LandmarkPin | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const width = 600;
  const height = 800;

  const filteredLandmarks = selectedCategory
    ? allLandmarks.filter(l => MICHIGAN_CHALLENGES.find(c => c.name === l.challenge)?.category === selectedCategory)
    : allLandmarks;

  const totalCount = allLandmarks.length;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Category Filter */}
      <div className="mb-6 flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 treasure-border font-heading text-sm transition-colors ${
            selectedCategory === null
              ? 'bg-lakes-blue text-parchment-light'
              : 'bg-parchment-light text-ink-primary hover:bg-parchment-mid'
          }`}
        >
          All ({totalCount})
        </button>
        {Array.from(new Set(MICHIGAN_CHALLENGES.map(c => c.category))).map(category => {
          const categoryCount = allLandmarks.filter(
            l => MICHIGAN_CHALLENGES.find(c => c.name === l.challenge)?.category === category
          ).length;
          const categoryName = category.replace(/-/g, ' ').replace(/\w/g, l => l.toUpperCase());
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

      {/* Vintage 1916 Map - Decorative Hero Section */}
      <div className="mb-8 parchment-card p-4">
        <div className="text-center mb-3">
          <h3 className="font-display text-2xl font-bold text-ink-primary">
            Historic 1916 Michigan Roads Map
          </h3>
          <p className="text-sm text-ink-secondary font-heading">
            "Good Roads Everywhere" - Proposed National Highways System
          </p>
        </div>
        <div className="relative rounded-lg overflow-hidden" style={{ maxHeight: '500px' }}>
          <img
            src="/960px-Map_of_Proposed_National_Highways_for_Michigan,_1916_WDL11553.png"
            alt="1916 Michigan Roads Map - Map of Proposed National Highways"
            className="w-full h-auto object-contain"
            style={{
              filter: 'sepia(0.05) brightness(1.1) contrast(1.05)',
            }}
          />
        </div>
      </div>

      {/* Interactive Michigan Map with Pins */}
      <div className="relative parchment-card p-6">
        <div className="text-center mb-6">
          <h3 className="font-display text-2xl font-bold text-ink-primary mb-2">
            Explore 60+ Michigan Locations
          </h3>
          <p className="text-sm text-ink-secondary font-heading">
            Hover over pins to discover challenges across the Great Lakes State
          </p>
        </div>

        <div
          className="relative w-full"
          style={{
            aspectRatio: '3/4',
            maxHeight: '70vh',
            margin: '0 auto'
          }}
        >
          <svg
            viewBox="0 0 600 800"
            className="w-full h-full"
            style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.1))' }}
          >
            {/* Water background (Great Lakes) */}
            <rect width="600" height="800" fill="#A8D5E2" opacity="0.3" />

            {/* Vintage grid pattern */}
            <defs>
              <pattern id="vintage-grid" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#8B7355" strokeWidth="0.5" opacity="0.15" />
              </pattern>
            </defs>
            <rect width="600" height="800" fill="url(#vintage-grid)" />

            {/* Michigan State - Accurate SVG Path */}
            <g>
              {/* Upper Peninsula */}
              <path
                d="M 80,140 L 110,125 L 150,115 L 190,108 L 230,105 L 270,105 L 310,107 L 350,112 L 390,120 L 425,130 L 455,142 L 480,157 L 495,175 L 502,195 L 500,215 L 490,230 L 472,240 L 448,245 L 420,248 L 390,250 L 360,250 L 330,248 L 300,244 L 270,238 L 240,230 L 210,220 L 180,208 L 150,193 L 125,177 L 105,160 L 90,145 Z"
                fill="#E8DCC8"
                stroke="#8B7355"
                strokeWidth="2.5"
                opacity="0.95"
              />

              {/* Lower Peninsula (The Mitten) */}
              <path
                d="M 220,310 L 200,325 L 185,345 L 175,370 L 170,395 L 168,420 L 168,445 L 170,470 L 174,495 L 180,520 L 188,545 L 198,570 L 210,595 L 224,618 L 240,638 L 258,655 L 278,668 L 300,678 L 323,684 L 347,687 L 371,686 L 394,682 L 416,674 L 436,663 L 454,649 L 470,633 L 483,615 L 494,595 L 502,574 L 508,552 L 512,530 L 514,507 L 514,484 L 512,462 L 508,440 L 502,419 L 494,399 L 484,380 L 472,363 L 458,348 L 442,335 L 424,325 L 405,318 L 385,313 L 364,311 L 343,312 L 322,316 L 302,323 L 283,333 L 266,345 L 251,359 L 238,375 L 228,392 Z"
                fill="#E8DCC8"
                stroke="#8B7355"
                strokeWidth="2.5"
                opacity="0.95"
              />

              {/* The Thumb */}
              <path
                d="M 514,450 L 525,445 L 538,442 L 551,441 L 563,443 L 573,448 L 581,455 L 587,464 L 590,474 L 591,485 L 589,496 L 584,505 L 577,512 L 568,517 L 557,519 L 546,519 L 535,516 L 524,511 L 514,504 Z"
                fill="#E8DCC8"
                stroke="#8B7355"
                strokeWidth="2.5"
                opacity="0.95"
              />
            </g>

            {/* Vintage decorative elements */}
            <text x="300" y="40" fontFamily="serif" fontSize="24" fill="#8B7355" textAnchor="middle" opacity="0.6">
              MICHIGAN
            </text>
            <text x="300" y="780" fontFamily="serif" fontSize="14" fill="#8B7355" textAnchor="middle" opacity="0.5">
              The Great Lakes State
            </text>

            {/* Landmark pins positioned by lat/lon */}
            {filteredLandmarks.map((landmark, index) => {
              const { x, y } = latLonToSVG(landmark.lat, landmark.lon, 600, 800);
              const isHovered = hoveredLandmark?.name === landmark.name;

              return (
                <g
                  key={`${landmark.name}-${index}`}
                  onMouseEnter={() => setHoveredLandmark(landmark)}
                  onMouseLeave={() => setHoveredLandmark(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Pin shadow */}
                  <circle
                    cx={x}
                    cy={y + 2}
                    r={isHovered ? 12 : 8}
                    fill="#000"
                    opacity="0.25"
                    style={{ transition: 'all 0.2s' }}
                  />
                  {/* Pin */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 12 : 8}
                    fill={landmark.color}
                    stroke="#FFF"
                    strokeWidth="2.5"
                    style={{ transition: 'all 0.2s' }}
                    opacity="0.9"
                  />
                  {/* Glow effect on hover */}
                  {isHovered && (
                    <circle
                      cx={x}
                      cy={y}
                      r={20}
                      fill={landmark.color}
                      opacity="0.3"
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-6 text-center">
          <p className="text-sm text-ink-secondary font-heading">
            <span className="font-bold text-lakes-blue">{filteredLandmarks.length}</span> Michigan landmarks waiting to be discovered
          </p>
        </div>

        {/* Hovered Landmark Info */}
        {hoveredLandmark && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-ink-primary text-parchment-light px-6 py-3 treasure-border shadow-lg"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{hoveredLandmark.icon}</span>
              <div className="text-left">
                <div className="font-heading font-bold">{hoveredLandmark.name}</div>
                <div className="text-xs opacity-90">{hoveredLandmark.challenge}</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Challenge Legend */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
        {MICHIGAN_CHALLENGES.map(challenge => (
          <div key={challenge.id} className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: challenge.color }}
            />
            <span className="text-xs text-ink-secondary font-heading">
              {challenge.icon} {challenge.name.replace(/ (Tour|Explorer|Seeker|Adventure)/g, '')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

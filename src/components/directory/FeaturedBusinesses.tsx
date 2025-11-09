import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, Sparkles, TrendingUp, Phone, Globe, ChevronRight } from 'lucide-react';

interface Business {
  id: number;
  name: string;
  category: string;
  city: string;
  rating: number;
  reviewCount: number;
  aiQualityScore: number;
  aiHighlights: string[];
  imageUrl: string;
  distance?: number;
  isAIVerified: boolean;
  phone?: string;
  website?: string;
}

export function FeaturedBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedBusinesses();
  }, []);

  const fetchFeaturedBusinesses = async () => {
    try {
      const response = await fetch('/api/directory/featured');
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.businesses || []);
      }
    } catch (error) {
      console.error('Error fetching featured businesses:', error);
      // Use mock data for development
      setBusinesses(getMockBusinesses());
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="parchment-card p-6 animate-pulse">
            <div className="w-full h-48 bg-parchment-mid rounded-lg mb-4" />
            <div className="h-6 bg-parchment-mid rounded w-3/4 mb-2" />
            <div className="h-4 bg-parchment-mid rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {businesses.slice(0, 6).map((business, idx) => (
        <motion.div
          key={business.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1, duration: 0.4 }}
          className="parchment-card p-5 hover:shadow-xl transition-all duration-300 group cursor-pointer"
          onClick={() => (window.location.href = `/directory/business/${business.id}`)}
        >
          {/* AI Verification Badge */}
          {business.isAIVerified && (
            <div className="flex items-center gap-1 mb-3 text-xs font-semibold text-lakes-blue">
              <Sparkles size={14} />
              <span>AI-Verified</span>
            </div>
          )}

          {/* Business Image */}
          <div className="relative mb-4 overflow-hidden rounded-lg">
            <img
              src={business.imageUrl}
              alt={business.name}
              className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
            />
            {/* Quality Score Badge */}
            <div className="absolute top-3 right-3 px-3 py-1 bg-forest-green text-white rounded-full text-xs font-bold flex items-center gap-1">
              <TrendingUp size={12} />
              {business.aiQualityScore}/100
            </div>
          </div>

          {/* Business Info */}
          <div className="mb-4">
            <h3 className="font-heading text-xl font-bold text-ink-primary group-hover:text-lakes-blue transition-colors mb-1">
              {business.name}
            </h3>
            <p className="text-sm text-ink-secondary mb-3">{business.category}</p>

            {/* Location & Rating */}
            <div className="flex items-center justify-between text-sm mb-3">
              <div className="flex items-center gap-1 text-ink-secondary">
                <MapPin size={14} className="text-copper-orange" />
                <span>{business.city}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="fill-gold text-gold" size={16} />
                <span className="font-semibold text-ink-primary">{business.rating.toFixed(1)}</span>
                <span className="text-ink-secondary">({business.reviewCount})</span>
              </div>
            </div>
          </div>

          {/* AI Highlights */}
          {business.aiHighlights.length > 0 && (
            <div className="space-y-2 mb-4">
              {business.aiHighlights.slice(0, 2).map((highlight, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <Sparkles size={14} className="text-copper-orange mt-0.5 flex-shrink-0" />
                  <span className="text-ink-secondary line-clamp-1">{highlight}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {business.phone && (
              <a
                href={`tel:${business.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-lakes-blue text-lakes-blue rounded-lg hover:bg-lakes-blue hover:text-white transition-all"
              >
                <Phone size={16} />
                <span className="text-sm font-semibold">Call</span>
              </a>
            )}
            {business.website && (
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-copper-orange text-copper-orange rounded-lg hover:bg-copper-orange hover:text-white transition-all"
              >
                <Globe size={16} />
                <span className="text-sm font-semibold">Visit</span>
              </a>
            )}
          </div>

          {/* View Details Link */}
          <button className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-lakes-blue to-copper-orange text-white rounded-lg hover:shadow-lg transition-all group-hover:scale-105">
            <span className="font-semibold">View Details</span>
            <ChevronRight size={18} />
          </button>
        </motion.div>
      ))}
    </div>
  );
}

// Mock data for development
function getMockBusinesses(): Business[] {
  return [
    {
      id: 1,
      name: "The Breakfast Club Cafe",
      category: "Breakfast & Brunch",
      city: "Ann Arbor",
      rating: 4.8,
      reviewCount: 342,
      aiQualityScore: 94,
      aiHighlights: [
        "Known for creative pancake varieties and locally-sourced ingredients",
        "Cozy atmosphere perfect for weekend brunch gatherings"
      ],
      imageUrl: "https://images.unsplash.com/photo-1533777857889-4be7c70b0c5e?w=400",
      isAIVerified: true,
      phone: "(734) 555-0123",
      website: "https://example.com"
    },
    {
      id: 2,
      name: "Great Lakes Brewing Co.",
      category: "Brewery & Restaurant",
      city: "Grand Rapids",
      rating: 4.6,
      reviewCount: 578,
      aiQualityScore: 91,
      aiHighlights: [
        "Award-winning craft beers with outdoor beer garden",
        "Live music on weekends and extensive food menu"
      ],
      imageUrl: "https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=400",
      isAIVerified: true,
      phone: "(616) 555-0456",
      website: "https://example.com"
    },
    {
      id: 3,
      name: "Motor City Books",
      category: "Bookstore & Cafe",
      city: "Detroit",
      rating: 4.9,
      reviewCount: 267,
      aiQualityScore: 96,
      aiHighlights: [
        "Independent bookstore with rare Michigan history collection",
        "In-house cafe serving specialty coffee and pastries"
      ],
      imageUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400",
      isAIVerified: true,
      phone: "(313) 555-0789",
      website: "https://example.com"
    },
    {
      id: 4,
      name: "Traverse Bay Winery",
      category: "Winery & Tasting Room",
      city: "Traverse City",
      rating: 4.7,
      reviewCount: 423,
      aiQualityScore: 89,
      aiHighlights: [
        "Scenic vineyard views with outdoor seating",
        "Specializes in cherry wines unique to Northern Michigan"
      ],
      imageUrl: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400",
      isAIVerified: true,
      phone: "(231) 555-0234",
      website: "https://example.com"
    },
    {
      id: 5,
      name: "Artisan Pizza Kitchen",
      category: "Italian Restaurant",
      city: "Lansing",
      rating: 4.5,
      reviewCount: 198,
      aiQualityScore: 87,
      aiHighlights: [
        "Wood-fired pizzas with creative seasonal toppings",
        "Family-friendly atmosphere with gluten-free options"
      ],
      imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400",
      isAIVerified: false,
      phone: "(517) 555-0567",
      website: "https://example.com"
    },
    {
      id: 6,
      name: "Lakefront Yoga Studio",
      category: "Yoga & Wellness",
      city: "Marquette",
      rating: 5.0,
      reviewCount: 145,
      aiQualityScore: 98,
      aiHighlights: [
        "Stunning Lake Superior views during practice sessions",
        "Offers beginner to advanced classes plus meditation workshops"
      ],
      imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
      isAIVerified: true,
      phone: "(906) 555-0890",
      website: "https://example.com"
    }
  ];
}

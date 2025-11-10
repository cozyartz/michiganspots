import { useState, useEffect } from 'react';
import { Filter, MapPin, Star, Phone, Globe, TrendingUp, Sparkles, ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchResultsProps {
  initialQuery?: string;
  initialCategory?: string;
  initialCity?: string;
}

interface Business {
  id: string;
  name: string;
  category: string;
  city: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  ai_quality_score?: number;
  ai_generated_description?: string;
  ai_keywords?: string;
  tier: 'FREE' | 'STARTER' | 'GROWTH' | 'PRO';
  featured_image_url?: string;
  is_verified: boolean;
  hours?: string;
}

const CATEGORIES = [
  'All Categories',
  'Restaurants',
  'Coffee Shops',
  'Shopping',
  'Arts & Culture',
  'Services',
  'Health & Wellness',
  'Automotive',
  'Home & Garden',
  'Tourism',
  'Construction',
  'Education',
  'Real Estate',
];

export function SearchResults({ initialQuery = '', initialCategory = '', initialCity = '' }: SearchResultsProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<string[]>(['All Cities']);

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'All Categories');
  const [selectedCity, setSelectedCity] = useState(initialCity || 'All Cities');
  const [sortBy, setSortBy] = useState<'ai_score' | 'name' | 'newest'>('ai_score');
  const [showFilters, setShowFilters] = useState(false);

  // Load cities from database
  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, [query, selectedCategory, selectedCity, sortBy]);

  const fetchCities = async () => {
    try {
      const response = await fetch('/api/directory/cities');
      if (response.ok) {
        const data = await response.json();
        const cityList = ['All Cities', ...data.cities.map((c: any) => c.city)];
        setCities(cityList);
      }
    } catch (err) {
      console.error('Error fetching cities:', err);
      // Keep default cities list if fetch fails
    }
  };

  const fetchBusinesses = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (selectedCategory !== 'All Categories') params.append('category', selectedCategory);
      if (selectedCity !== 'All Cities') params.append('city', selectedCity);
      params.append('sort', sortBy);

      const response = await fetch(`/api/directory/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch businesses');
      }

      const data = await response.json();
      setBusinesses(data.businesses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  const getQualityBadgeColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-600';
    if (score >= 90) return 'bg-forest-green/10 text-forest-green';
    if (score >= 75) return 'bg-lakes-blue/10 text-lakes-blue';
    if (score >= 60) return 'bg-copper-orange/10 text-copper-orange';
    return 'bg-gray-100 text-gray-600';
  };

  const getQualityLabel = (score?: number) => {
    if (!score) return 'Not Rated';
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Great';
    if (score >= 60) return 'Good';
    return 'Fair';
  };

  return (
    <section className="py-12 px-4 bg-white">
      <div className="container mx-auto max-w-7xl">
        {/* Filters Bar */}
        <div className="bg-parchment-light p-6 rounded-xl border-2 border-parchment-mid mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Filter Toggle (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 px-4 py-2 bg-lakes-blue text-white rounded-lg font-semibold"
            >
              <Filter size={20} />
              Filters
              <ChevronDown className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} size={16} />
            </button>

            {/* Filters (Desktop always visible, mobile toggleable) */}
            <div className={`${showFilters ? 'flex' : 'hidden'} md:flex flex-col md:flex-row gap-4 w-full md:w-auto`}>
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border-2 border-parchment-mid rounded-lg focus:border-lakes-blue focus:outline-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* City Filter */}
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-4 py-2 border-2 border-parchment-mid rounded-lg focus:border-lakes-blue focus:outline-none"
              >
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-secondary">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border-2 border-parchment-mid rounded-lg focus:border-lakes-blue focus:outline-none"
              >
                <option value="ai_score">AI Quality Score</option>
                <option value="name">Name (A-Z)</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedCategory !== 'All Categories' || selectedCity !== 'All Cities' || query) && (
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-sm text-ink-secondary">Active filters:</span>
              {query && (
                <span className="px-3 py-1 bg-lakes-blue/10 text-lakes-blue text-sm rounded-full">
                  Query: "{query}"
                </span>
              )}
              {selectedCategory !== 'All Categories' && (
                <span className="px-3 py-1 bg-copper-orange/10 text-copper-orange text-sm rounded-full">
                  {selectedCategory}
                </span>
              )}
              {selectedCity !== 'All Cities' && (
                <span className="px-3 py-1 bg-forest-green/10 text-forest-green text-sm rounded-full flex items-center gap-1">
                  <MapPin size={12} />
                  {selectedCity}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-ink-secondary">
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={16} />
                Searching...
              </span>
            ) : (
              <span>
                Found <strong className="text-ink-primary">{businesses.length}</strong> businesses
              </span>
            )}
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-6 bg-red-50 border-2 border-red-200 rounded-xl text-center">
            <p className="text-red-600 font-semibold mb-2">Search Error</p>
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="parchment-card p-6 animate-pulse">
                <div className="h-48 bg-parchment-mid rounded-lg mb-4"></div>
                <div className="h-6 bg-parchment-mid rounded mb-2"></div>
                <div className="h-4 bg-parchment-mid rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-parchment-mid rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {/* Results Grid */}
        {!loading && !error && businesses.length > 0 && (
          <motion.div
            layout
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {businesses.map((business) => (
              <motion.a
                key={business.id}
                href={`/directory/business/${business.id}`}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="parchment-card p-6 hover:shadow-xl hover:scale-105 transition-all group"
              >
                {/* Featured Image */}
                {business.featured_image_url && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    <img
                      src={business.featured_image_url}
                      alt={business.name}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform"
                    />
                  </div>
                )}

                {/* Business Name & Verification */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-heading text-xl font-bold text-ink-primary group-hover:text-lakes-blue transition-colors">
                    {business.name}
                  </h3>
                  {business.is_verified && (
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-lakes-blue" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* AI Quality Score */}
                {business.ai_quality_score && (
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-copper-orange" />
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getQualityBadgeColor(business.ai_quality_score)}`}>
                      AI Score: {business.ai_quality_score}/100 - {getQualityLabel(business.ai_quality_score)}
                    </span>
                  </div>
                )}

                {/* Category & Location */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-3 py-1 bg-copper-orange/10 text-copper-orange text-xs font-semibold rounded-full">
                    {business.category}
                  </span>
                  <span className="px-3 py-1 bg-lakes-blue/10 text-lakes-blue text-xs font-semibold rounded-full flex items-center gap-1">
                    <MapPin size={12} />
                    {business.city}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-ink-secondary mb-4 line-clamp-3">
                  {business.ai_generated_description || business.description || 'No description available'}
                </p>

                {/* Contact Info */}
                <div className="space-y-2 text-sm">
                  {business.address && (
                    <div className="flex items-start gap-2 text-ink-secondary">
                      <MapPin size={16} className="flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{business.address}</span>
                    </div>
                  )}
                  {business.phone && (
                    <div className="flex items-center gap-2 text-ink-secondary">
                      <Phone size={16} />
                      <span>{business.phone}</span>
                    </div>
                  )}
                  {business.website && (
                    <div className="flex items-center gap-2 text-lakes-blue group-hover:text-copper-orange">
                      <Globe size={16} />
                      <span className="truncate">Visit Website</span>
                    </div>
                  )}
                </div>

                {/* Tier Badge */}
                <div className="mt-4 pt-4 border-t border-parchment-mid">
                  <span className={`text-xs font-bold ${
                    business.tier === 'PRO' ? 'text-gold' :
                    business.tier === 'GROWTH' ? 'text-copper-orange' :
                    business.tier === 'STARTER' ? 'text-lakes-blue' :
                    'text-ink-secondary'
                  }`}>
                    {business.tier} Listing
                  </span>
                </div>
              </motion.a>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && businesses.length === 0 && (
          <div className="text-center py-16">
            <div className="mb-6">
              <svg className="w-24 h-24 mx-auto text-ink-faded" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="font-heading text-2xl font-bold text-ink-primary mb-2">
              No Businesses Found
            </h3>
            <p className="text-ink-secondary mb-6">
              Try adjusting your search criteria or browse all categories
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setQuery('');
                  setSelectedCategory('All Categories');
                  setSelectedCity('All Cities');
                }}
                className="px-6 py-3 bg-lakes-blue text-white rounded-xl font-bold hover:bg-lakes-blue/90 transition-colors"
              >
                Clear Filters
              </button>
              <a
                href="/directory"
                className="px-6 py-3 border-2 border-lakes-blue text-lakes-blue rounded-xl font-bold hover:bg-lakes-blue/10 transition-colors"
              >
                Browse All
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

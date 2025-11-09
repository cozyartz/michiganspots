import { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, MapPin, Loader2, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchSuggestion {
  text: string;
  type: 'recent' | 'trending' | 'ai';
}

interface AIInsight {
  intent: string;
  location?: string;
  category?: string;
  features?: string[];
}

export function AISearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (query.length > 2) {
      // Debounce AI suggestions
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        fetchAISuggestions(query);
      }, 300);
    } else {
      setSuggestions([]);
      setAiInsight(null);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  const fetchAISuggestions = async (q: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/directory/ai-search-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setAiInsight(data.insight || null);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Navigate to search results page
    window.location.href = `/directory/search?q=${encodeURIComponent(searchQuery)}`;
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    handleSearch(suggestion.text);
  };

  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Main Search Bar */}
      <div className="relative">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-lakes-blue">
          <Search size={24} />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch(query)}
          onFocus={() => query.length > 2 && setShowSuggestions(true)}
          placeholder="Try: 'best coffee shops in Ann Arbor' or 'dog-friendly restaurants'"
          className="w-full pl-16 pr-16 py-5 rounded-2xl border-2 border-lakes-blue/30 focus:border-lakes-blue focus:outline-none text-lg shadow-lg"
        />

        <div className="absolute right-5 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="animate-spin text-copper-orange" size={24} />
          ) : (
            <Sparkles className="text-copper-orange" size={24} />
          )}
        </div>
      </div>

      {/* AI Insight Badge */}
      <AnimatePresence>
        {aiInsight && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 bg-gradient-to-r from-lakes-blue/10 to-copper-orange/10 rounded-xl border border-lakes-blue/20"
          >
            <div className="flex items-start gap-3">
              <Sparkles className="text-copper-orange mt-1 flex-shrink-0" size={20} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink-primary mb-2">
                  AI Understanding:
                </p>
                <div className="flex flex-wrap gap-2">
                  {aiInsight.intent && (
                    <span className="px-3 py-1 bg-lakes-blue/10 text-lakes-blue text-xs font-semibold rounded-full">
                      Intent: {aiInsight.intent}
                    </span>
                  )}
                  {aiInsight.location && (
                    <span className="px-3 py-1 bg-copper-orange/10 text-copper-orange text-xs font-semibold rounded-full flex items-center gap-1">
                      <MapPin size={12} />
                      {aiInsight.location}
                    </span>
                  )}
                  {aiInsight.category && (
                    <span className="px-3 py-1 bg-forest-green/10 text-forest-green text-xs font-semibold rounded-full">
                      {aiInsight.category}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute w-full mt-2 bg-white rounded-xl shadow-2xl border-2 border-parchment-mid overflow-hidden z-50"
          >
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-5 py-3 hover:bg-parchment-light transition-colors flex items-center gap-3 group"
              >
                {suggestion.type === 'trending' ? (
                  <TrendingUp size={18} className="text-copper-orange" />
                ) : suggestion.type === 'ai' ? (
                  <Sparkles size={18} className="text-lakes-blue" />
                ) : (
                  <Search size={18} className="text-ink-secondary" />
                )}
                <span className="text-ink-primary group-hover:text-lakes-blue font-medium">
                  {suggestion.text}
                </span>
                {suggestion.type === 'trending' && (
                  <span className="ml-auto text-xs text-copper-orange font-semibold">
                    Trending
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popular Searches */}
      <div className="mt-6 flex flex-wrap gap-2 justify-center">
        <span className="text-sm text-ink-secondary">Popular:</span>
        {[
          'Coffee shops',
          'Pizza near me',
          'Breweries',
          'Outdoor dining',
          'Boutique shopping',
        ].map((term) => (
          <button
            key={term}
            onClick={() => {
              setQuery(term);
              handleSearch(term);
            }}
            className="px-4 py-1.5 bg-white border border-parchment-mid rounded-full text-sm text-ink-primary hover:border-lakes-blue hover:text-lakes-blue hover:shadow-md transition-all"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}

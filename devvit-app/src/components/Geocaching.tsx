import { useState, useEffect } from 'react';
import { getTheme } from './theme';
import type { Geocache } from '../shared/types/geocache';
import { calculateDistance } from '../shared/types/geocache';

interface GeocachingProps {
  username: string;
  postId: string;
  isDark: boolean;
  onBack: () => void;
}

interface UserStats {
  totalFinds: number;
  uniqueCaches: number;
  totalPoints: number;
  difficultiesCompleted: Record<number, number>;
  terrainsCompleted: Record<number, number>;
}

type ViewMode = 'list' | 'details' | 'stats';
type FilterType = 'all' | 'Traditional' | 'Multi-cache' | 'Mystery' | 'Letterbox' | 'Event';

export const Geocaching = ({ username, postId, isDark, onBack }: GeocachingProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [caches, setCaches] = useState<Geocache[]>([]);
  const [filteredCaches, setFilteredCaches] = useState<Geocache[]>([]);
  const [selectedCache, setSelectedCache] = useState<Geocache | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [minDifficulty, setMinDifficulty] = useState(1);
  const [maxDifficulty, setMaxDifficulty] = useState(5);
  const [minTerrain, setMinTerrain] = useState(1);
  const [maxTerrain, setMaxTerrain] = useState(5);
  const [searchRadius, setSearchRadius] = useState(10); // km

  const theme = getTheme(isDark);

  useEffect(() => {
    loadUserStats();
  }, [username]);

  useEffect(() => {
    applyFilters();
  }, [caches, filterType, minDifficulty, maxDifficulty, minTerrain, maxTerrain]);

  const loadUserStats = async () => {
    try {
      // Load user's geocaching statistics
      const response = await fetch(`/api/geocaches/stats/${username}`);
      if (response.ok) {
        const data = await response.json();
        setUserStats(data.stats || {
          totalFinds: 0,
          uniqueCaches: 0,
          totalPoints: 0,
          difficultiesCompleted: {},
          terrainsCompleted: {},
        });
      }
    } catch (err) {
      console.error('Failed to load user stats:', err);
    }
  };

  const searchNearby = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      // Get user location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            // Handle specific geolocation errors
            let message = 'Location access denied';
            if (error.code === error.PERMISSION_DENIED) {
              message = 'Location permission denied. Please enable location access in your browser settings, then try "Search All Michigan" instead.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              message = 'Location information unavailable. Try "Search All Michigan" instead.';
            } else if (error.code === error.TIMEOUT) {
              message = 'Location request timed out. Try "Search All Michigan" instead.';
            }
            reject(new Error(message));
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      setUserLocation({ latitude: lat, longitude: lon });

      // Search for nearby caches
      const response = await fetch(
        `/api/geocaches/search?latitude=${lat}&longitude=${lon}&radius=${searchRadius * 1000}&limit=50`
      );

      if (!response.ok) {
        throw new Error('Failed to search geocaches');
      }

      const result = await response.json();
      setCaches(result.caches || []);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Unable to search for geocaches. Please enable location services or try "Search All Michigan".');
    } finally {
      setIsLoading(false);
    }
  };

  const searchAllMichigan = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/geocaches/michigan?limit=100');

      if (!response.ok) {
        throw new Error('Failed to load Michigan caches');
      }

      const result = await response.json();
      setCaches(result.caches || []);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Unable to load Michigan geocaches.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...caches];

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(c => c.type === filterType);
    }

    // Difficulty filter
    filtered = filtered.filter(c => c.difficulty >= minDifficulty && c.difficulty <= maxDifficulty);

    // Terrain filter
    filtered = filtered.filter(c => c.terrain >= minTerrain && c.terrain <= maxTerrain);

    setFilteredCaches(filtered);
  };

  const viewCacheDetails = (cache: Geocache) => {
    setSelectedCache(cache);
    setViewMode('details');
  };

  const logFind = async (cacheCode: string, logType: 'found' | 'dnf') => {
    try {
      const response = await fetch('/api/geocaches/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          cacheCode,
          logType,
          timestamp: Date.now(),
          location: userLocation,
        }),
      });

      if (response.ok) {
        await loadUserStats();
        alert(logType === 'found' ? '🎉 Cache logged as Found!' : '😔 Logged as Did Not Find');
      }
    } catch (err) {
      console.error('Log error:', err);
      alert('Failed to log cache');
    }
  };

  const getDirections = (cache: Geocache) => {
    const lat = cache.location.latitude;
    const lon = cache.location.longitude;
    // Open Google Maps or Apple Maps
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    window.open(url, '_blank');
  };

  const formatDistance = (meters: number | undefined) => {
    if (!meters) return 'Unknown';
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const getDifficultyStars = (rating: number) => {
    return '⭐'.repeat(Math.round(rating));
  };

  // List View
  const renderListView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Search Actions */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={searchNearby}
          disabled={isLoading}
          style={{
            flex: 1,
            minWidth: '140px',
            padding: '14px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${theme.colors.forest.primary} 0%, ${theme.colors.forest.dark} 100%)`,
            color: 'white',
            fontWeight: '700',
            fontSize: '15px',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            boxShadow: theme.shadows.md,
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          📍 Search Nearby
        </button>
        <button
          onClick={searchAllMichigan}
          disabled={isLoading}
          style={{
            flex: 1,
            minWidth: '140px',
            padding: '14px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${theme.colors.cyan.primary} 0%, ${theme.colors.cyan.dark} 100%)`,
            color: 'white',
            fontWeight: '700',
            fontSize: '15px',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            boxShadow: theme.shadows.md,
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          🗺️ All Michigan
        </button>
        <button
          onClick={() => setViewMode('stats')}
          style={{
            padding: '14px 20px',
            borderRadius: '12px',
            background: theme.colors.card,
            border: `2px solid ${theme.colors.copper}`,
            color: theme.colors.copper,
            fontWeight: '700',
            fontSize: '15px',
            cursor: 'pointer',
            boxShadow: theme.shadows.sm,
          }}
        >
          📊 My Stats
        </button>
      </div>

      {/* Filters */}
      {caches.length > 0 && (
        <div style={{
          padding: '16px',
          borderRadius: '12px',
          background: theme.colors.secondary,
          border: `1px solid ${theme.colors.border}`,
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: theme.colors.ink.primary, marginBottom: '12px' }}>
            Filters
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            {/* Type Filter */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: theme.colors.ink.secondary, display: 'block', marginBottom: '4px' }}>
                Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.colors.border}`,
                  background: theme.colors.card,
                  color: theme.colors.ink.primary,
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                <option value="all">All Types</option>
                <option value="Traditional">Traditional</option>
                <option value="Multi-cache">Multi-cache</option>
                <option value="Mystery">Mystery</option>
                <option value="Letterbox">Letterbox</option>
                <option value="Event">Event</option>
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: theme.colors.ink.secondary, display: 'block', marginBottom: '4px' }}>
                Difficulty
              </label>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.5"
                  value={minDifficulty}
                  onChange={(e) => setMinDifficulty(parseFloat(e.target.value))}
                  style={{
                    width: '50px',
                    padding: '8px 4px',
                    borderRadius: '8px',
                    border: `1px solid ${theme.colors.border}`,
                    background: theme.colors.card,
                    color: theme.colors.ink.primary,
                    fontSize: '13px',
                    fontWeight: '600',
                    textAlign: 'center',
                  }}
                />
                <span style={{ fontSize: '12px', color: theme.colors.ink.secondary }}>-</span>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.5"
                  value={maxDifficulty}
                  onChange={(e) => setMaxDifficulty(parseFloat(e.target.value))}
                  style={{
                    width: '50px',
                    padding: '8px 4px',
                    borderRadius: '8px',
                    border: `1px solid ${theme.colors.border}`,
                    background: theme.colors.card,
                    color: theme.colors.ink.primary,
                    fontSize: '13px',
                    fontWeight: '600',
                    textAlign: 'center',
                  }}
                />
              </div>
            </div>

            {/* Terrain Filter */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: theme.colors.ink.secondary, display: 'block', marginBottom: '4px' }}>
                Terrain
              </label>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.5"
                  value={minTerrain}
                  onChange={(e) => setMinTerrain(parseFloat(e.target.value))}
                  style={{
                    width: '50px',
                    padding: '8px 4px',
                    borderRadius: '8px',
                    border: `1px solid ${theme.colors.border}`,
                    background: theme.colors.card,
                    color: theme.colors.ink.primary,
                    fontSize: '13px',
                    fontWeight: '600',
                    textAlign: 'center',
                  }}
                />
                <span style={{ fontSize: '12px', color: theme.colors.ink.secondary }}>-</span>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.5"
                  value={maxTerrain}
                  onChange={(e) => setMaxTerrain(parseFloat(e.target.value))}
                  style={{
                    width: '50px',
                    padding: '8px 4px',
                    borderRadius: '8px',
                    border: `1px solid ${theme.colors.border}`,
                    background: theme.colors.card,
                    color: theme.colors.ink.primary,
                    fontSize: '13px',
                    fontWeight: '600',
                    textAlign: 'center',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cache List */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <p style={{ fontSize: '16px', fontWeight: '700', color: theme.colors.ink.primary }}>
            Searching for geocaches...
          </p>
        </div>
      )}

      {error && (
        <div style={{
          padding: '16px',
          borderRadius: '12px',
          background: `${theme.colors.coral.primary}15`,
          border: `2px solid ${theme.colors.coral.primary}`,
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '14px', fontWeight: '600', color: theme.colors.coral.dark, margin: 0 }}>
            {error}
          </p>
        </div>
      )}

      {!isLoading && filteredCaches.length === 0 && caches.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎯</div>
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: theme.colors.ink.primary, marginBottom: '8px' }}>
            Ready to Explore Michigan?
          </h3>
          <p style={{ fontSize: '14px', color: theme.colors.ink.secondary }}>
            Search nearby or browse all Michigan geocaches to start your adventure!
          </p>
        </div>
      )}

      {!isLoading && filteredCaches.length > 0 && (
        <div>
          <div style={{
            padding: '12px 16px',
            background: theme.colors.secondary,
            borderRadius: '12px 12px 0 0',
            borderBottom: `2px solid ${theme.colors.border}`,
          }}>
            <p style={{ fontSize: '14px', fontWeight: '700', color: theme.colors.ink.primary, margin: 0 }}>
              {filteredCaches.length} geocache{filteredCaches.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <div style={{
            maxHeight: '500px',
            overflowY: 'auto',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '0 0 12px 12px',
          }}>
            {filteredCaches.map((cache) => (
              <button
                key={cache.code}
                onClick={() => viewCacheDetails(cache)}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: theme.colors.card,
                  borderBottom: `1px solid ${theme.colors.border}`,
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.colors.secondary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = theme.colors.card;
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '700', color: theme.colors.ink.primary, marginBottom: '4px' }}>
                      {cache.name}
                    </h4>
                    <p style={{ fontSize: '12px', color: theme.colors.ink.secondary, marginBottom: '8px' }}>
                      {cache.code} • {cache.type}
                    </p>
                  </div>
                  {cache.distance && (
                    <div style={{
                      padding: '4px 12px',
                      borderRadius: '8px',
                      background: theme.colors.forest.primary + '20',
                      color: theme.colors.forest.primary,
                      fontSize: '12px',
                      fontWeight: '700',
                    }}>
                      📏 {formatDistance(cache.distance)}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: theme.colors.ink.secondary }}>
                  <span>D: {getDifficultyStars(cache.difficulty)}</span>
                  <span>T: {getDifficultyStars(cache.terrain)}</span>
                  <span>📦 {cache.size}</span>
                  {cache.michiganRegion && <span>🗺️ {cache.michiganRegion}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Details View
  const renderDetailsView = () => {
    if (!selectedCache) return null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Back Button */}
        <button
          onClick={() => setViewMode('list')}
          style={{
            alignSelf: 'flex-start',
            padding: '10px 16px',
            borderRadius: '10px',
            background: theme.colors.card,
            border: `2px solid ${theme.colors.border}`,
            color: theme.colors.ink.primary,
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ← Back to List
        </button>

        {/* Cache Header */}
        <div style={{
          padding: '20px',
          borderRadius: '16px',
          background: `linear-gradient(135deg, ${theme.colors.forest.primary}15 0%, ${theme.colors.cyan.primary}10 100%)`,
          border: `2px solid ${theme.colors.forest.primary}`,
        }}>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: theme.colors.ink.primary, marginBottom: '8px' }}>
            {selectedCache.name}
          </h2>
          <p style={{ fontSize: '13px', fontWeight: '600', color: theme.colors.ink.secondary, marginBottom: '12px' }}>
            {selectedCache.code}
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              fontSize: '12px',
              fontWeight: '700',
              color: theme.colors.ink.primary,
            }}>
              {selectedCache.type}
            </span>
            <span style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              fontSize: '12px',
              fontWeight: '700',
              color: theme.colors.amber.dark,
            }}>
              D{selectedCache.difficulty} {getDifficultyStars(selectedCache.difficulty)}
            </span>
            <span style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              fontSize: '12px',
              fontWeight: '700',
              color: theme.colors.coral.dark,
            }}>
              T{selectedCache.terrain} {getDifficultyStars(selectedCache.terrain)}
            </span>
            <span style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              fontSize: '12px',
              fontWeight: '700',
              color: theme.colors.ink.primary,
            }}>
              📦 {selectedCache.size}
            </span>
          </div>
        </div>

        {/* Coordinates & Navigation */}
        <div style={{
          padding: '16px',
          borderRadius: '12px',
          background: theme.colors.card,
          border: `1px solid ${theme.colors.border}`,
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: theme.colors.ink.primary, marginBottom: '12px' }}>
            📍 Location
          </h3>
          <div style={{ fontSize: '14px', fontWeight: '600', color: theme.colors.ink.secondary, marginBottom: '12px' }}>
            {selectedCache.location.latitude.toFixed(6)}, {selectedCache.location.longitude.toFixed(6)}
          </div>
          {selectedCache.distance && (
            <div style={{ fontSize: '13px', color: theme.colors.forest.primary, fontWeight: '700', marginBottom: '12px' }}>
              Distance: {formatDistance(selectedCache.distance)}
            </div>
          )}
          <button
            onClick={() => getDirections(selectedCache)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              background: `linear-gradient(135deg, ${theme.colors.cyan.primary} 0%, ${theme.colors.cyan.dark} 100%)`,
              color: 'white',
              fontWeight: '700',
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            🧭 Get Directions
          </button>
        </div>

        {/* Description */}
        {(selectedCache.short_description || selectedCache.description) && (
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            background: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: theme.colors.ink.primary, marginBottom: '8px' }}>
              📝 Description
            </h3>
            <p style={{ fontSize: '13px', color: theme.colors.ink.primary, lineHeight: '1.5' }}>
              {selectedCache.short_description || selectedCache.description}
            </p>
          </div>
        )}

        {/* Hint */}
        {selectedCache.hint && (
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            background: `${theme.colors.amber.primary}10`,
            border: `2px dashed ${theme.colors.amber.primary}`,
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: theme.colors.amber.dark, marginBottom: '8px' }}>
              💡 Hint
            </h3>
            <p style={{ fontSize: '13px', color: theme.colors.ink.primary, fontFamily: 'monospace' }}>
              {selectedCache.hint}
            </p>
          </div>
        )}

        {/* Log Actions */}
        <div style={{
          padding: '16px',
          borderRadius: '12px',
          background: theme.colors.secondary,
          border: `1px solid ${theme.colors.border}`,
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: theme.colors.ink.primary, marginBottom: '12px' }}>
            📋 Log Your Visit
          </h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => logFind(selectedCache.code, 'found')}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${theme.colors.forest.primary} 0%, ${theme.colors.forest.dark} 100%)`,
                color: 'white',
                fontWeight: '700',
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              ✅ Found It!
            </button>
            <button
              onClick={() => logFind(selectedCache.code, 'dnf')}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '10px',
                background: theme.colors.card,
                border: `2px solid ${theme.colors.coral.primary}`,
                color: theme.colors.coral.dark,
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              😔 Didn't Find
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Stats View
  const renderStatsView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Back Button */}
      <button
        onClick={() => setViewMode('list')}
        style={{
          alignSelf: 'flex-start',
          padding: '10px 16px',
          borderRadius: '10px',
          background: theme.colors.card,
          border: `2px solid ${theme.colors.border}`,
          color: theme.colors.ink.primary,
          fontWeight: '700',
          fontSize: '14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        ← Back to List
      </button>

      {/* Stats Header */}
      <div style={{
        padding: '20px',
        borderRadius: '16px',
        background: `linear-gradient(135deg, ${theme.colors.copper} 0%, ${theme.colors.amber.primary} 100%)`,
        color: 'white',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>
          {username}'s Geocaching Stats
        </h2>
        <p style={{ fontSize: '14px', opacity: 0.9 }}>
          Your Michigan geocaching journey
        </p>
      </div>

      {/* Overall Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        <div style={{
          padding: '20px',
          borderRadius: '12px',
          background: theme.colors.card,
          border: `2px solid ${theme.colors.forest.primary}`,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '32px', fontWeight: '800', color: theme.colors.forest.primary, marginBottom: '4px' }}>
            {userStats?.totalFinds || 0}
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.colors.ink.secondary }}>
            Total Finds
          </div>
        </div>
        <div style={{
          padding: '20px',
          borderRadius: '12px',
          background: theme.colors.card,
          border: `2px solid ${theme.colors.cyan.primary}`,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '32px', fontWeight: '800', color: theme.colors.cyan.primary, marginBottom: '4px' }}>
            {userStats?.uniqueCaches || 0}
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.colors.ink.secondary }}>
            Unique Caches
          </div>
        </div>
        <div style={{
          padding: '20px',
          borderRadius: '12px',
          background: theme.colors.card,
          border: `2px solid ${theme.colors.amber.primary}`,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '32px', fontWeight: '800', color: theme.colors.amber.dark, marginBottom: '4px' }}>
            {userStats?.totalPoints || 0}
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.colors.ink.secondary }}>
            Total Points
          </div>
        </div>
      </div>

      {/* Difficulty Progress */}
      <div style={{
        padding: '16px',
        borderRadius: '12px',
        background: theme.colors.card,
        border: `1px solid ${theme.colors.border}`,
      }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: theme.colors.ink.primary, marginBottom: '12px' }}>
          Difficulty Ratings Completed
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(diff => (
            <div key={diff} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: theme.colors.ink.primary, minWidth: '60px' }}>
                {getDifficultyStars(diff)}
              </span>
              <div style={{
                flex: 1,
                height: '8px',
                borderRadius: '4px',
                background: theme.colors.secondary,
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  background: theme.colors.amber.primary,
                  width: `${Math.min(((userStats?.difficultiesCompleted?.[diff] || 0) / 5) * 100, 100)}%`,
                  transition: 'width 0.3s',
                }} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: theme.colors.ink.secondary, minWidth: '30px' }}>
                {userStats?.difficultiesCompleted?.[diff] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Terrain Progress */}
      <div style={{
        padding: '16px',
        borderRadius: '12px',
        background: theme.colors.card,
        border: `1px solid ${theme.colors.border}`,
      }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: theme.colors.ink.primary, marginBottom: '12px' }}>
          Terrain Ratings Completed
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(terr => (
            <div key={terr} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: theme.colors.ink.primary, minWidth: '60px' }}>
                {getDifficultyStars(terr)}
              </span>
              <div style={{
                flex: 1,
                height: '8px',
                borderRadius: '4px',
                background: theme.colors.secondary,
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  background: theme.colors.coral.primary,
                  width: `${Math.min(((userStats?.terrainsCompleted?.[terr] || 0) / 5) * 100, 100)}%`,
                  transition: 'width 0.3s',
                }} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: theme.colors.ink.secondary, minWidth: '30px' }}>
                {userStats?.terrainsCompleted?.[terr] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: theme.colors.background,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: '900px' }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderRadius: '16px 16px 0 0',
          background: `linear-gradient(135deg, ${theme.colors.forest.primary} 0%, ${theme.colors.cyan.primary} 100%)`,
          color: 'white',
          marginBottom: '2px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <button
              onClick={onBack}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.2)',
                border: '2px solid rgba(255,255,255,0.3)',
                color: 'white',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              ← Back
            </button>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>
                🎯 Michigan Geocaching
              </h1>
              <p style={{ fontSize: '13px', opacity: 0.9 }}>
                Powered by OpenCaching.us
              </p>
            </div>
            <div style={{ width: '80px' }} />
          </div>
        </div>

        {/* Content Area */}
        <div style={{
          padding: '20px',
          background: theme.colors.card,
          borderRadius: '0 0 16px 16px',
          border: `1px solid ${theme.colors.border}`,
          boxShadow: theme.shadows.xl,
        }}>
          {viewMode === 'list' && renderListView()}
          {viewMode === 'details' && renderDetailsView()}
          {viewMode === 'stats' && renderStatsView()}
        </div>
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { getTheme } from './theme';

interface PhotoHuntProps {
  username: string;
  postId: string;
  isDark: boolean;
  onComplete: (score: number) => void;
  onBack: () => void;
}

interface PhotoRating {
  quality: number; // 0-30
  michiganRelevance: number; // 0-40
  landmarkBonus: number; // 0-30
  creativity: number; // 0-20
  totalScore: number;
  feedback: string;
  detectedLandmark?: string;
}

interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

// Michigan boundaries (approximate)
const MICHIGAN_BOUNDS = {
  minLat: 41.7,
  maxLat: 48.3,
  minLon: -90.4,
  maxLon: -82.1,
};

const isInMichigan = (lat: number, lon: number): boolean => {
  return (
    lat >= MICHIGAN_BOUNDS.minLat &&
    lat <= MICHIGAN_BOUNDS.maxLat &&
    lon >= MICHIGAN_BOUNDS.minLon &&
    lon <= MICHIGAN_BOUNDS.maxLon
  );
};

export const PhotoHunt = ({ username, postId, isDark, onComplete, onBack }: PhotoHuntProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rating, setRating] = useState<PhotoRating | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gpsCoordinates, setGpsCoordinates] = useState<GPSCoordinates | null>(null);
  const [locationStatus, setLocationStatus] = useState<'checking' | 'granted' | 'denied' | 'unavailable' | 'outside-michigan'>('checking');

  const theme = getTheme(isDark);

  // Request GPS location on component mount
  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      setError('Location services are not available on your device');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const coords: GPSCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      };

      // Check if location is in Michigan
      if (!isInMichigan(coords.latitude, coords.longitude)) {
        setLocationStatus('outside-michigan');
        setError('You must be in Michigan to submit photos for the treasure hunt! 🗺️');
        return;
      }

      setGpsCoordinates(coords);
      setLocationStatus('granted');
      setError(null);
    } catch (err) {
      console.error('Location error:', err);
      setLocationStatus('denied');
      setError('Location permission denied. Please enable location services to participate in the treasure hunt.');
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setError(null);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Request location on component mount
  useEffect(() => {
    requestLocation();
  }, []);

  const analyzePhoto = async () => {
    if (!selectedImage) return;

    // Verify GPS location before analysis
    if (!gpsCoordinates) {
      setError('Location verification required. Please enable location services.');
      return;
    }

    if (locationStatus !== 'granted') {
      setError('You must be in Michigan with location services enabled to submit photos.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/photo-hunt/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: selectedImage,
          username,
          postId,
          gps: gpsCoordinates,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze photo');
      }

      const result = await response.json();
      setRating(result.rating);

      // Track analytics
      await fetch('/api/analytics/game-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          postId,
          game: 'photo-hunt',
          score: result.rating.totalScore,
          quality: result.rating.quality,
          michiganRelevance: result.rating.michiganRelevance,
          landmarkBonus: result.rating.landmarkBonus,
          creativity: result.rating.creativity,
        }),
      });
    } catch (err) {
      console.error('Photo analysis error:', err);
      setError('Failed to analyze photo. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleComplete = () => {
    if (rating) {
      onComplete(rating.totalScore);
    }
  };

  const resetPhoto = () => {
    setSelectedImage(null);
    setRating(null);
    setError(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: theme.colors.background,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
        {/* Main Card */}
        <div
          style={{
            background: theme.colors.card,
            borderRadius: '24px',
            boxShadow: theme.shadows.lg,
            border: `1px solid ${theme.colors.border}`,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px',
              borderBottom: `1px solid ${theme.colors.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <button
              onClick={onBack}
              style={{
                padding: '8px 16px',
                borderRadius: '12px',
                background: theme.colors.card,
                border: `2px solid ${theme.colors.border}`,
                color: theme.colors.ink.primary,
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: theme.shadows.sm,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(-2px)';
                e.currentTarget.style.boxShadow = theme.shadows.md;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = theme.shadows.sm;
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.colors.ink.primary} strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back
            </button>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <h2
                style={{
                  fontSize: 'clamp(20px, 5vw, 28px)',
                  fontWeight: '800',
                  color: theme.colors.cyan.primary,
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.colors.cyan.primary} strokeWidth="2">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
                Photo Hunt
              </h2>
              <p style={{ fontSize: '14px', fontWeight: '600', color: theme.colors.ink.secondary }}>{username}</p>
            </div>
            <div style={{ width: '80px' }}></div>
          </div>

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Location Status */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: locationStatus === 'granted'
                  ? `${theme.colors.cyan.primary}15`
                  : locationStatus === 'checking'
                  ? `${theme.colors.amber}15`
                  : `${theme.colors.coral}15`,
                border: `2px solid ${
                  locationStatus === 'granted'
                    ? theme.colors.cyan.primary
                    : locationStatus === 'checking'
                    ? theme.colors.amber
                    : theme.colors.coral
                }40`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span style={{ fontSize: '24px' }}>
                {locationStatus === 'granted' && '📍'}
                {locationStatus === 'checking' && '🔍'}
                {(locationStatus === 'denied' || locationStatus === 'unavailable' || locationStatus === 'outside-michigan') && '⚠️'}
              </span>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: theme.colors.ink.primary,
                    marginBottom: '2px',
                  }}
                >
                  {locationStatus === 'granted' && '✓ Location Verified - In Michigan!'}
                  {locationStatus === 'checking' && 'Checking Location...'}
                  {locationStatus === 'denied' && 'Location Access Denied'}
                  {locationStatus === 'unavailable' && 'Location Unavailable'}
                  {locationStatus === 'outside-michigan' && 'Not in Michigan'}
                </p>
                <p
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: theme.colors.ink.secondary,
                  }}
                >
                  {locationStatus === 'granted' && `Accuracy: ±${Math.round(gpsCoordinates?.accuracy || 0)}m`}
                  {locationStatus === 'checking' && 'Requesting location permission...'}
                  {locationStatus === 'denied' && 'Please enable location services to submit photos'}
                  {locationStatus === 'unavailable' && 'Location services not available on this device'}
                  {locationStatus === 'outside-michigan' && 'You must be in Michigan to participate'}
                </p>
              </div>
              {locationStatus !== 'granted' && locationStatus !== 'checking' && (
                <button
                  onClick={requestLocation}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: theme.colors.cyan.primary,
                    color: 'white',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              )}
            </div>

            {/* Instructions */}
            {!selectedImage && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px',
                  borderRadius: '16px',
                  background: `${theme.colors.cyan.primary}10`,
                  border: `2px dashed ${theme.colors.cyan.primary}40`,
                }}
              >
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={theme.colors.cyan.primary}
                  strokeWidth="2"
                  style={{ margin: '0 auto 12px' }}
                >
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
                <h3
                  style={{
                    fontSize: 'clamp(18px, 4vw, 24px)',
                    fontWeight: '800',
                    color: theme.colors.ink.primary,
                    marginBottom: '8px',
                  }}
                >
                  Share Michigan Photos
                </h3>
                <p
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: theme.colors.ink.secondary,
                    marginBottom: '16px',
                  }}
                >
                  Upload photos of Michigan landmarks, nature, or culture
                </p>
                <p
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: theme.colors.ink.secondary,
                    opacity: 0.8,
                  }}
                >
                  AI analyzes quality, Michigan relevance, landmarks, and creativity
                </p>
              </div>
            )}

            {/* File upload */}
            {!selectedImage && (
              <div style={{ textAlign: 'center' }}>
                <label
                  htmlFor="photo-upload"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '16px 32px',
                    borderRadius: '16px',
                    background: `linear-gradient(135deg, ${theme.colors.cyan.primary} 0%, ${theme.colors.cyan.dark} 100%)`,
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '16px',
                    cursor: 'pointer',
                    border: 'none',
                    boxShadow: theme.shadows.lg,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = theme.shadows.xl;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = theme.shadows.lg;
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                  Select Photo
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>
            )}

            {/* Selected image preview */}
            {selectedImage && !rating && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  style={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: `2px solid ${theme.colors.border}`,
                    boxShadow: theme.shadows.md,
                  }}
                >
                  <img src={selectedImage} alt="Selected" style={{ width: '100%', display: 'block' }} />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={analyzePhoto}
                    disabled={isAnalyzing || locationStatus !== 'granted'}
                    style={{
                      flex: 1,
                      padding: '16px',
                      borderRadius: '16px',
                      background: (isAnalyzing || locationStatus !== 'granted')
                        ? theme.colors.border
                        : `linear-gradient(135deg, ${theme.colors.cyan.primary} 0%, ${theme.colors.cyan.dark} 100%)`,
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '16px',
                      border: 'none',
                      boxShadow: theme.shadows.md,
                      cursor: (isAnalyzing || locationStatus !== 'granted') ? 'not-allowed' : 'pointer',
                      opacity: (isAnalyzing || locationStatus !== 'granted') ? 0.6 : 1,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Photo'}
                  </button>
                  <button
                    onClick={resetPhoto}
                    disabled={isAnalyzing}
                    style={{
                      padding: '16px',
                      borderRadius: '16px',
                      background: theme.colors.card,
                      border: `2px solid ${theme.colors.border}`,
                      color: theme.colors.ink.primary,
                      fontWeight: '700',
                      cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                      boxShadow: theme.shadows.sm,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.colors.ink.primary} strokeWidth="2">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Rating results */}
            {rating && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Photo preview */}
                <div
                  style={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: `2px solid ${theme.colors.border}`,
                    boxShadow: theme.shadows.md,
                  }}
                >
                  <img src={selectedImage!} alt="Analyzed" style={{ width: '100%', display: 'block' }} />
                </div>

                {/* Total score */}
                <div
                  style={{
                    textAlign: 'center',
                    padding: '24px',
                    borderRadius: '16px',
                    background: `linear-gradient(135deg, ${theme.colors.amber.primary}20 0%, ${theme.colors.amber.light}10 100%)`,
                    border: `2px solid ${theme.colors.amber.primary}40`,
                    boxShadow: theme.shadows.md,
                  }}
                >
                  <p style={{ fontSize: '12px', fontWeight: '700', color: theme.colors.ink.secondary, marginBottom: '8px' }}>
                    YOUR SCORE
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill={theme.colors.amber.primary}>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <p style={{ fontSize: 'clamp(36px, 10vw, 48px)', fontWeight: '800', color: theme.colors.amber.dark, margin: 0 }}>
                      {rating.totalScore}
                    </p>
                  </div>
                  {rating.detectedLandmark && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        borderRadius: '100px',
                        background: `${theme.colors.copper}20`,
                        border: `1px solid ${theme.colors.copper}40`,
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.colors.copper} strokeWidth="2">
                        <path d="M3 21h18M6 18V9l6-6 6 6v9M9 21v-7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v7" />
                      </svg>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: theme.colors.copper }}>
                        {rating.detectedLandmark}
                      </span>
                    </div>
                  )}
                </div>

                {/* Detailed scores */}
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    background: theme.colors.card,
                    border: `1px solid ${theme.colors.border}`,
                    boxShadow: theme.shadows.sm,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.colors.cyan.primary} strokeWidth="2">
                        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                        <circle cx="12" cy="13" r="3" />
                      </svg>
                      <span style={{ fontWeight: '700', color: theme.colors.ink.primary }}>Quality</span>
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: theme.colors.ink.primary }}>{rating.quality}/30</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.colors.copper} strokeWidth="2">
                        <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
                      </svg>
                      <span style={{ fontWeight: '700', color: theme.colors.ink.primary }}>Michigan Relevance</span>
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: theme.colors.ink.primary }}>{rating.michiganRelevance}/40</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.colors.amber.primary} strokeWidth="2">
                        <path d="M3 21h18M6 18V9l6-6 6 6v9M9 21v-7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v7" />
                      </svg>
                      <span style={{ fontWeight: '700', color: theme.colors.ink.primary }}>Landmark Bonus</span>
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: theme.colors.ink.primary }}>{rating.landmarkBonus}/30</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.colors.coral.primary} strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <span style={{ fontWeight: '700', color: theme.colors.ink.primary }}>Creativity</span>
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: theme.colors.ink.primary }}>{rating.creativity}/20</span>
                  </div>
                </div>

                {/* Feedback */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '16px',
                    background: `${theme.colors.cyan.primary}10`,
                    border: `1px solid ${theme.colors.cyan.primary}30`,
                  }}
                >
                  <p style={{ fontSize: '14px', fontWeight: '600', color: theme.colors.ink.primary, margin: 0, textAlign: 'center' }}>
                    {rating.feedback}
                  </p>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleComplete}
                    style={{
                      flex: 1,
                      padding: '16px',
                      borderRadius: '16px',
                      background: `linear-gradient(135deg, ${theme.colors.copper} 0%, ${theme.colors.copperDark} 100%)`,
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '16px',
                      border: 'none',
                      boxShadow: theme.shadows.lg,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = theme.shadows.xl;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = theme.shadows.lg;
                    }}
                  >
                    Complete
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                  <button
                    onClick={resetPhoto}
                    style={{
                      padding: '16px 24px',
                      borderRadius: '16px',
                      background: theme.colors.card,
                      border: `2px solid ${theme.colors.border}`,
                      color: theme.colors.ink.primary,
                      fontWeight: '700',
                      fontSize: '16px',
                      cursor: 'pointer',
                      boxShadow: theme.shadows.sm,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.colors.ink.primary} strokeWidth="2">
                      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                      <circle cx="12" cy="13" r="3" />
                    </svg>
                    New
                  </button>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  borderRadius: '16px',
                  background: `${theme.colors.coral.primary}20`,
                  border: `2px solid ${theme.colors.coral.primary}`,
                  boxShadow: theme.shadows.md,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.colors.coral.primary} strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  <p style={{ fontWeight: '700', color: theme.colors.coral.primary, margin: 0 }}>{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import { useState } from 'react';
import { getTheme } from './theme';
import type { Geocache } from '../shared/types/geocache';

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
  landmarkName?: string;
  matchedChallenges?: any[];
}

export const PhotoHunt = ({ username, postId, isDark, onComplete, onBack }: PhotoHuntProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rating, setRating] = useState<PhotoRating | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Geocaching state
  const [nearbyGeocaches, setNearbyGeocaches] = useState<Geocache[]>([]);
  const [isSearchingCaches, setIsSearchingCaches] = useState(false);
  const [selectedGeocache, setSelectedGeocache] = useState<Geocache | null>(null);
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [geocacheBonus, setGeocacheBonus] = useState(0);

  const theme = getTheme(isDark);

  // Simple photo selection - no location verification
  const handleSelectPhotoClick = () => {
    document.getElementById('photo-upload')?.click();
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

  const analyzePhoto = async () => {
    if (!selectedImage) return;

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
          // No location data required - AI will detect Michigan content
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze photo');
      }

      const result = await response.json();
      setRating(result.rating);

      // Track analytics (Challenges are separate - no proximity verification here)
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

  const searchNearbyGeocaches = async () => {
    setIsSearchingCaches(true);
    setError(null);

    try {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      // Get user's location
      const location = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            // Handle specific geolocation errors
            let message = 'Location access denied';
            if (error.code === error.PERMISSION_DENIED) {
              message = 'Location permission denied. Geocache search unavailable.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              message = 'Location information unavailable. Geocache search unavailable.';
            } else if (error.code === error.TIMEOUT) {
              message = 'Location request timed out. Geocache search unavailable.';
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

      const lat = location.coords.latitude;
      const lon = location.coords.longitude;
      setUserLocation({ latitude: lat, longitude: lon });

      // Search for nearby geocaches
      const response = await fetch(
        `/api/geocaches/search?latitude=${lat}&longitude=${lon}&radius=10000&limit=20`
      );

      if (!response.ok) {
        throw new Error('Failed to search geocaches');
      }

      const result = await response.json();
      setNearbyGeocaches(result.caches || []);
    } catch (err: any) {
      console.error('Geocache search error:', err);
      setError(err.message || 'Unable to find nearby geocaches. Please enable location services.');
    } finally {
      setIsSearchingCaches(false);
    }
  };

  const selectGeocache = async (cache: Geocache) => {
    setSelectedGeocache(cache);

    // Calculate bonus based on cache attributes
    let bonus = 50; // Base geocache bonus
    if (cache.difficulty >= 3) bonus += 25;
    if (cache.terrain >= 3) bonus += 25;
    setGeocacheBonus(bonus);

    // Record the geocache visit
    if (rating && userLocation) {
      try {
        await fetch('/api/geocaches/visit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            cacheCode: cache.code,
            userLocation,
            photoScore: rating.totalScore,
          }),
        });
      } catch (err) {
        console.error('Error recording geocache visit:', err);
      }
    }
  };

  const handleComplete = () => {
    if (rating) {
      const finalScore = rating.totalScore + geocacheBonus;
      onComplete(finalScore);
    }
  };

  const resetPhoto = () => {
    setSelectedImage(null);
    setRating(null);
    setError(null);
    setNearbyGeocaches([]);
    setSelectedGeocache(null);
    setGeocacheBonus(0);
    setUserLocation(null);
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
                <button
                  onClick={handleSelectPhotoClick}
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
                </button>
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
                    disabled={isAnalyzing}
                    style={{
                      flex: 1,
                      padding: '16px',
                      borderRadius: '16px',
                      background: isAnalyzing
                        ? theme.colors.border
                        : `linear-gradient(135deg, ${theme.colors.cyan.primary} 0%, ${theme.colors.cyan.dark} 100%)`,
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '16px',
                      border: 'none',
                      boxShadow: theme.shadows.md,
                      cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                      opacity: isAnalyzing ? 0.6 : 1,
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

                {/* Proximity Verification Status */}
                {rating.landmarkName && rating.proximityDistance !== undefined && (
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: rating.proximityVerified
                        ? `${theme.colors.cyan.primary}15`
                        : `${theme.colors.coral}15`,
                      border: `2px solid ${rating.proximityVerified ? theme.colors.cyan.primary : theme.colors.coral}40`,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                    }}
                  >
                    <span style={{ fontSize: '24px', marginTop: '2px' }}>
                      {rating.proximityVerified ? '✅' : '📍'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: theme.colors.ink.primary,
                        margin: '0 0 4px 0'
                      }}>
                        {rating.proximityVerified ? 'Location Verified!' : 'Location Check'}
                      </h4>
                      <p style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: theme.colors.ink.secondary,
                        margin: 0
                      }}>
                        {rating.proximityMessage || (
                          rating.proximityVerified
                            ? `You are ${rating.proximityDistance}m from ${rating.landmarkName}. Challenge progress updated!`
                            : `You are ${rating.proximityDistance}m from ${rating.landmarkName}. Get within 1km to earn challenge credit.`
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Matched Challenges */}
                {rating.matchedChallenges && rating.matchedChallenges.length > 0 && (
                  <div
                    style={{
                      padding: '20px',
                      borderRadius: '16px',
                      background: `linear-gradient(135deg, ${theme.colors.amber.primary}10 0%, ${theme.colors.copper}10 100%)`,
                      border: `2px solid ${theme.colors.amber.primary}40`,
                      boxShadow: theme.shadows.md,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '32px' }}>🏆</span>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: theme.colors.ink.primary, margin: 0 }}>
                        Challenge Progress!
                      </h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {rating.matchedChallenges.map((challenge: any) => (
                        <div
                          key={challenge.challengeId}
                          style={{
                            padding: '16px',
                            borderRadius: '12px',
                            background: challenge.completed ? `${theme.colors.cyan.primary}20` : theme.colors.card,
                            border: challenge.completed
                              ? `2px solid ${theme.colors.cyan.primary}`
                              : `1px solid ${theme.colors.border}`,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '24px' }}>{challenge.challengeIcon}</span>
                              <span style={{ fontSize: '14px', fontWeight: '700', color: theme.colors.ink.primary }}>
                                {challenge.challengeName}
                              </span>
                            </div>
                            {challenge.completed && (
                              <span style={{ fontSize: '24px' }}>✅</span>
                            )}
                          </div>
                          <div style={{ marginBottom: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                              <span style={{ color: theme.colors.ink.secondary }}>Progress:</span>
                              <span style={{ fontWeight: '700', color: theme.colors.amber.dark }}>
                                {challenge.progress}/{challenge.required}
                              </span>
                            </div>
                            <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: `${theme.colors.border}`, overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${(challenge.progress / challenge.required) * 100}%`,
                                  height: '100%',
                                  background: challenge.completed
                                    ? `linear-gradient(90deg, ${theme.colors.cyan.primary}, ${theme.colors.cyan.dark})`
                                    : `linear-gradient(90deg, ${theme.colors.amber.primary}, ${theme.colors.amber.dark})`,
                                  transition: 'width 0.3s ease',
                                }}
                              />
                            </div>
                          </div>
                          {challenge.completed && (
                            <p style={{ fontSize: '12px', fontWeight: '700', color: theme.colors.cyan.dark, margin: 0 }}>
                              🎉 Challenge Complete! +{challenge.bonusPoints} bonus points
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Geocache Search & Selection */}
                {!selectedGeocache && nearbyGeocaches.length === 0 && (
                  <button
                    onClick={searchNearbyGeocaches}
                    disabled={isSearchingCaches}
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '16px',
                      background: `linear-gradient(135deg, ${theme.colors.forest.primary} 0%, ${theme.colors.forest.dark} 100%)`,
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '16px',
                      cursor: isSearchingCaches ? 'not-allowed' : 'pointer',
                      border: 'none',
                      boxShadow: theme.shadows.lg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: isSearchingCaches ? 0.6 : 1,
                    }}
                  >
                    {isSearchingCaches ? '🔍 Searching...' : '📍 Search Nearby Geocaches'}
                  </button>
                )}

                {/* Geocache List */}
                {nearbyGeocaches.length > 0 && !selectedGeocache && (
                  <div style={{
                    padding: '20px',
                    borderRadius: '16px',
                    background: theme.colors.card,
                    border: `2px solid ${theme.colors.forest.primary}`,
                    boxShadow: theme.shadows.md,
                  }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '800',
                      color: theme.colors.forest.primary,
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <span>🎯</span>
                      {nearbyGeocaches.length} Nearby Geocaches
                    </h3>
                    <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {nearbyGeocaches.map((cache) => (
                        <button
                          key={cache.code}
                          onClick={() => selectGeocache(cache)}
                          style={{
                            padding: '12px',
                            borderRadius: '12px',
                            background: theme.colors.secondary,
                            border: `1px solid ${theme.colors.border}`,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = theme.colors.forest.primary + '20';
                            e.currentTarget.style.borderColor = theme.colors.forest.primary;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = theme.colors.secondary;
                            e.currentTarget.style.borderColor = theme.colors.border;
                          }}
                        >
                          <div style={{ fontWeight: '700', color: theme.colors.ink.primary, marginBottom: '4px' }}>
                            {cache.name}
                          </div>
                          <div style={{ fontSize: '12px', color: theme.colors.ink.secondary, display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <span>📏 {cache.distance ? (cache.distance / 1000).toFixed(1) + ' km' : 'Unknown'}</span>
                            <span>⭐ D{cache.difficulty}/T{cache.terrain}</span>
                            <span>📦 {cache.size}</span>
                            <span>🗺️ {cache.type}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Geocache */}
                {selectedGeocache && (
                  <div style={{
                    padding: '20px',
                    borderRadius: '16px',
                    background: `linear-gradient(135deg, ${theme.colors.forest.primary}20 0%, ${theme.colors.forest.light}10 100%)`,
                    border: `2px solid ${theme.colors.forest.primary}`,
                    boxShadow: theme.shadows.lg,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '32px' }}>✅</span>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', color: theme.colors.forest.primary, marginBottom: '4px' }}>
                          Geocache Selected!
                        </h3>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: theme.colors.ink.primary }}>
                          {selectedGeocache.name}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '700',
                        background: theme.colors.forest.primary,
                        color: 'white',
                      }}>
                        +{geocacheBonus} Bonus Points
                      </span>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '700',
                        background: theme.colors.card,
                        color: theme.colors.ink.primary,
                        border: `1px solid ${theme.colors.border}`,
                      }}>
                        D{selectedGeocache.difficulty} / T{selectedGeocache.terrain}
                      </span>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '700',
                        background: theme.colors.card,
                        color: theme.colors.ink.primary,
                        border: `1px solid ${theme.colors.border}`,
                      }}>
                        {selectedGeocache.type}
                      </span>
                    </div>
                    {selectedGeocache.hint && (
                      <div style={{
                        padding: '12px',
                        borderRadius: '8px',
                        background: theme.colors.card,
                        border: `1px solid ${theme.colors.border}`,
                      }}>
                        <p style={{ fontSize: '12px', fontWeight: '600', color: theme.colors.ink.secondary, marginBottom: '4px' }}>
                          💡 Hint:
                        </p>
                        <p style={{ fontSize: '13px', color: theme.colors.ink.primary }}>
                          {selectedGeocache.hint}
                        </p>
                      </div>
                    )}
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      borderRadius: '8px',
                      background: theme.colors.forest.primary + '15',
                      textAlign: 'center',
                    }}>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: theme.colors.forest.primary, margin: 0 }}>
                        Total Score: {rating ? rating.totalScore + geocacheBonus : geocacheBonus} points
                      </p>
                    </div>
                  </div>
                )}

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

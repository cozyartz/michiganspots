import { useState } from 'react';
import { MemoryMatch } from './MemoryMatch';
import { Trivia } from './Trivia';
import { PhotoHunt } from './PhotoHunt';
import { getTheme, lightTheme, darkTheme } from './theme';

interface InteractiveGameHubProps {
  username: string;
  postId: string;
  isDark: boolean;
}

type GameMode = 'splash' | 'memory-match' | 'trivia' | 'photo-hunt';

export const InteractiveGameHub = ({ username, postId, isDark }: InteractiveGameHubProps) => {
  const [gameMode, setGameMode] = useState<GameMode>('splash');
  const [totalScore, setTotalScore] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const theme = getTheme(isDark);

  if (gameMode === 'memory-match') {
    return (
      <MemoryMatch
        username={username}
        postId={postId}
        isDark={isDark}
        onComplete={(score) => {
          setTotalScore((prev) => prev + score);
          setGameMode('splash');
        }}
        onBack={() => setGameMode('splash')}
      />
    );
  }

  if (gameMode === 'trivia') {
    return (
      <Trivia
        username={username}
        postId={postId}
        isDark={isDark}
        onComplete={(score) => {
          setTotalScore((prev) => prev + score);
          setGameMode('splash');
        }}
        onBack={() => setGameMode('splash')}
      />
    );
  }

  if (gameMode === 'photo-hunt') {
    return (
      <PhotoHunt
        username={username}
        postId={postId}
        isDark={isDark}
        onComplete={(score) => {
          setTotalScore((prev) => prev + score);
          setGameMode('splash');
        }}
        onBack={() => setGameMode('splash')}
      />
    );
  }

  // Modern Responsive Splash Screen
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
      {/* Main Container */}
      <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
        {/* Logo Card */}
        <div
          style={{
            background: theme.colors.card,
            borderRadius: '24px',
            padding: '24px',
            marginBottom: '16px',
            boxShadow: theme.shadows.lg,
            border: `1px solid ${theme.colors.border}`,
            textAlign: 'center',
          }}
        >
          {/* Logo */}
          <div style={{ marginBottom: '16px' }}>
            <img
              src="/michiganspots-logo.png"
              alt="Michigan Spots"
              style={{
                width: '80px',
                height: '80px',
                objectFit: 'contain',
                filter: isDark ? 'brightness(1.1)' : 'none',
              }}
            />
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: 'clamp(24px, 6vw, 32px)',
              fontWeight: '800',
              color: theme.colors.copper,
              marginBottom: '8px',
              letterSpacing: '0.02em',
            }}
          >
            MICHIGAN SPOTS
          </h1>
          <p
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: theme.colors.ink.secondary,
              marginBottom: '16px',
            }}
          >
            Discover Hidden Gems
          </p>

          {/* User Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '100px',
              background: `${theme.colors.cyan.primary}15`,
              border: `2px solid ${theme.colors.cyan.primary}40`,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.colors.cyan.primary} strokeWidth="2">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span style={{ fontSize: '14px', fontWeight: '700', color: theme.colors.cyan.dark }}>
              {username}
            </span>
          </div>
        </div>

        {/* Score Card */}
        <div
          style={{
            background: `linear-gradient(135deg, ${theme.colors.amber.primary}20 0%, ${theme.colors.amber.light}10 100%)`,
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '16px',
            border: `1px solid ${theme.colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: '700', color: theme.colors.ink.primary }}>
            Total Score
          </span>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '100px',
              background: `linear-gradient(135deg, ${theme.colors.amber.primary} 0%, ${theme.colors.amber.dark} 100%)`,
              boxShadow: theme.shadows.md,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span style={{ fontSize: '20px', fontWeight: '800', color: 'white' }}>
              {totalScore}
            </span>
          </div>
        </div>

        {/* Game Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Memory Match */}
          <button
            onClick={() => setGameMode('memory-match')}
            onMouseEnter={() => setHoveredCard('memory')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              width: '100%',
              background: theme.colors.card,
              borderRadius: '16px',
              padding: '20px',
              border: `2px solid ${hoveredCard === 'memory' ? theme.colors.copper : theme.colors.border}`,
              boxShadow: hoveredCard === 'memory' ? theme.shadows.xl : theme.shadows.md,
              transform: hoveredCard === 'memory' ? 'translateY(-2px)' : 'translateY(0)',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                flexShrink: 0,
                borderRadius: '12px',
                background: `${theme.colors.copper}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.colors.copper} strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 9h6v6H9z" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: theme.colors.ink.primary, marginBottom: '4px' }}>
                Memory Match
              </div>
              <div style={{ fontSize: '14px', color: theme.colors.ink.secondary }}>
                Match Michigan landmark pairs
              </div>
            </div>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.colors.copper}
              strokeWidth="2"
              style={{
                transform: hoveredCard === 'memory' ? 'translateX(4px)' : 'translateX(0)',
                transition: 'transform 0.2s',
              }}
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>

          {/* Trivia */}
          <button
            onClick={() => setGameMode('trivia')}
            onMouseEnter={() => setHoveredCard('trivia')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              width: '100%',
              background: theme.colors.card,
              borderRadius: '16px',
              padding: '20px',
              border: `2px solid ${hoveredCard === 'trivia' ? theme.colors.cyan.primary : theme.colors.border}`,
              boxShadow: hoveredCard === 'trivia' ? theme.shadows.xl : theme.shadows.md,
              transform: hoveredCard === 'trivia' ? 'translateY(-2px)' : 'translateY(0)',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                flexShrink: 0,
                borderRadius: '12px',
                background: `${theme.colors.cyan.primary}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.colors.cyan.primary} strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: theme.colors.ink.primary, marginBottom: '4px' }}>
                Michigan Trivia
              </div>
              <div style={{ fontSize: '14px', color: theme.colors.ink.secondary }}>
                Test your state knowledge
              </div>
            </div>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.colors.cyan.primary}
              strokeWidth="2"
              style={{
                transform: hoveredCard === 'trivia' ? 'translateX(4px)' : 'translateX(0)',
                transition: 'transform 0.2s',
              }}
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>

          {/* Photo Hunt - Featured */}
          <button
            onClick={() => setGameMode('photo-hunt')}
            onMouseEnter={() => setHoveredCard('photo')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              width: '100%',
              background: `linear-gradient(135deg, ${theme.colors.cyan.primary} 0%, ${theme.colors.cyan.dark} 100%)`,
              borderRadius: '16px',
              padding: '20px',
              border: 'none',
              boxShadow: hoveredCard === 'photo' ? theme.shadows.xl : theme.shadows.lg,
              transform: hoveredCard === 'photo' ? 'translateY(-2px) scale(1.01)' : 'translateY(0) scale(1)',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                flexShrink: 0,
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span>Photo Hunt</span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '4px 8px',
                    borderRadius: '100px',
                    background: 'rgba(255, 255, 255, 0.3)',
                    fontWeight: '700',
                  }}
                >
                  AI POWERED
                </span>
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)' }}>
                Share Michigan photos
              </div>
            </div>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              style={{
                transform: hoveredCard === 'photo' ? 'translateX(4px)' : 'translateX(0)',
                transition: 'transform 0.2s',
              }}
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: '20px',
            textAlign: 'center',
            padding: '16px',
          }}
        >
          <p style={{ fontSize: '12px', fontWeight: '600', color: theme.colors.ink.secondary, margin: 0 }}>
            Choose a game to start earning points
          </p>
        </div>
      </div>
    </div>
  );
};

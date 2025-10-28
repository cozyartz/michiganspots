import { useState, useEffect } from 'react';
import { getTheme } from './theme';

interface MemoryMatchProps {
  username: string;
  postId: string;
  isDark: boolean;
  onComplete: (score: number) => void;
  onBack: () => void;
}

interface Card {
  id: number;
  emoji: string;
  name: string;
  flipped: boolean;
  matched: boolean;
}

const MICHIGAN_ITEMS = [
  { emoji: '🏈', name: 'Football' },
  { emoji: '🏒', name: 'Hockey' },
  { emoji: '🚗', name: 'Cars' },
  { emoji: '🌊', name: 'Great Lakes' },
  { emoji: '🍎', name: 'Apples' },
  { emoji: '🦌', name: 'Deer' },
  { emoji: '🏔️', name: 'Mountains' },
  { emoji: '🍒', name: 'Cherries' },
];

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const generateCards = (): Card[] => {
  const pairs = MICHIGAN_ITEMS.flatMap((item, index) => [
    { id: index * 2, ...item, flipped: false, matched: false },
    { id: index * 2 + 1, ...item, flipped: false, matched: false },
  ]);
  return shuffleArray(pairs);
};

export const MemoryMatch = ({ username, postId, isDark, onComplete, onBack }: MemoryMatchProps) => {
  const [cards, setCards] = useState<Card[]>(generateCards());
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [isChecking, setIsChecking] = useState(false);

  const theme = getTheme(isDark);

  useEffect(() => {
    if (timeLeft <= 0 || matchedPairs === MICHIGAN_ITEMS.length) {
      handleComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, matchedPairs]);

  const handleComplete = async () => {
    const baseScore = matchedPairs * 100;
    const timeBonus = timeLeft * 5;
    const movesPenalty = Math.max(0, moves - matchedPairs * 2) * 10;
    const finalScore = Math.max(0, baseScore + timeBonus - movesPenalty);

    try {
      await fetch('/api/analytics/game-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          postId,
          game: 'memory-match',
          score: finalScore,
          matchedPairs,
          moves,
          timeRemaining: timeLeft,
        }),
      });
    } catch (err) {
      console.error('Failed to track analytics:', err);
    }

    setTimeout(() => onComplete(finalScore), 2000);
  };

  const handleCardClick = (index: number) => {
    if (isChecking || cards[index].flipped || cards[index].matched || flippedIndices.length >= 2) {
      return;
    }

    const newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);

    const newFlippedIndices = [...flippedIndices, index];
    setFlippedIndices(newFlippedIndices);

    if (newFlippedIndices.length === 2) {
      setMoves((prev) => prev + 1);
      setIsChecking(true);

      const [firstIndex, secondIndex] = newFlippedIndices;
      const firstCard = newCards[firstIndex];
      const secondCard = newCards[secondIndex];

      if (firstCard.name === secondCard.name) {
        // Match found!
        setTimeout(() => {
          const updatedCards = [...newCards];
          updatedCards[firstIndex].matched = true;
          updatedCards[secondIndex].matched = true;
          setCards(updatedCards);
          setMatchedPairs((prev) => prev + 1);
          setFlippedIndices([]);
          setIsChecking(false);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          const updatedCards = [...newCards];
          updatedCards[firstIndex].flipped = false;
          updatedCards[secondIndex].flipped = false;
          setCards(updatedCards);
          setFlippedIndices([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

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
              gap: '12px',
              flexWrap: 'wrap',
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
            <div style={{ flex: 1, textAlign: 'center', minWidth: '150px' }}>
              <h2
                style={{
                  fontSize: 'clamp(18px, 4vw, 24px)',
                  fontWeight: '800',
                  color: theme.colors.copper,
                  marginBottom: '4px',
                }}
              >
                Memory Match
              </h2>
              <p style={{ fontSize: '14px', fontWeight: '600', color: theme.colors.ink.secondary }}>{username}</p>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <div
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  background: `linear-gradient(135deg, ${theme.colors.amber.primary} 0%, ${theme.colors.amber.dark} 100%)`,
                  boxShadow: theme.shadows.md,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <p style={{ fontSize: '18px', fontWeight: '800', color: 'white', margin: 0 }}>
                  {minutes}:{seconds.toString().padStart(2, '0')}
                </p>
              </div>
              <p style={{ fontSize: '12px', fontWeight: '700', color: theme.colors.ink.secondary }}>{moves} moves</p>
            </div>
          </div>

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Stats */}
            <div
              style={{
                padding: '16px',
                borderRadius: '16px',
                background: `${theme.colors.copper}10`,
                border: `1px solid ${theme.colors.copper}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.colors.copper} strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="m9 11 3 3L22 4" />
              </svg>
              <p style={{ fontSize: '16px', fontWeight: '800', color: theme.colors.ink.primary, margin: 0 }}>
                Matched: {matchedPairs} / {MICHIGAN_ITEMS.length}
              </p>
            </div>

            {/* Card Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {cards.map((card, index) => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(index)}
                  disabled={card.matched || card.flipped || isChecking}
                  style={{
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    background: card.flipped || card.matched
                      ? card.matched
                        ? `linear-gradient(135deg, ${theme.colors.copper} 0%, ${theme.colors.copperDark} 100%)`
                        : `linear-gradient(135deg, ${theme.colors.cyan.primary} 0%, ${theme.colors.cyan.dark} 100%)`
                      : theme.colors.card,
                    borderRadius: '16px',
                    border: card.flipped || card.matched ? 'none' : `2px solid ${theme.colors.border}`,
                    boxShadow: card.matched
                      ? theme.shadows.lg
                      : card.flipped
                        ? theme.shadows.md
                        : theme.shadows.sm,
                    transition: 'all 0.3s',
                    cursor: card.matched || card.flipped || isChecking ? 'not-allowed' : 'pointer',
                    transform: card.flipped || card.matched ? 'scale(1)' : 'scale(0.98)',
                    opacity: card.matched ? 0.8 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!card.matched && !card.flipped && !isChecking) {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = theme.shadows.md;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!card.matched && !card.flipped) {
                      e.currentTarget.style.transform = 'scale(0.98)';
                      e.currentTarget.style.boxShadow = theme.shadows.sm;
                    }
                  }}
                >
                  {card.flipped || card.matched ? card.emoji : '?'}
                </button>
              ))}
            </div>

            {/* Completion */}
            {matchedPairs === MICHIGAN_ITEMS.length && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px',
                  borderRadius: '16px',
                  background: `linear-gradient(135deg, ${theme.colors.copper} 0%, ${theme.colors.copperDark} 100%)`,
                  boxShadow: theme.shadows.xl,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '12px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <p style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: '800', color: 'white', margin: 0 }}>
                    Perfect Match!
                  </p>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <p style={{ fontSize: '14px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '16px' }}>
                  {moves} moves • {120 - timeLeft}s
                </p>
                <button
                  onClick={handleComplete}
                  style={{
                    padding: '16px 32px',
                    background: 'white',
                    color: theme.colors.copper,
                    fontWeight: '800',
                    fontSize: '16px',
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: theme.shadows.md,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = theme.shadows.lg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = theme.shadows.md;
                  }}
                >
                  Finish
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.colors.copper} strokeWidth="2">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

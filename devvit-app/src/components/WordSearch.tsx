import { useState, useEffect } from 'react';

interface WordSearchProps {
  username: string;
  postId: string;
  onComplete: (score: number) => void;
  onBack: () => void;
}

const MICHIGAN_WORDS = [
  'DETROIT',
  'LANSING',
  'MICHIGAN',
  'LAKES',
  'SPARTAN',
  'WOLVERINE',
  'MACKINAC',
  'PETOSKEY',
];

const GRID_SIZE = 10;

const generateGrid = (): string[][] => {
  const grid: string[][] = Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(''));

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      grid[i][j] = letters[Math.floor(Math.random() * letters.length)];
    }
  }

  // Place MICHIGAN horizontally
  const word = 'MICHIGAN';
  const row = 4;
  const startCol = 1;
  for (let i = 0; i < word.length; i++) {
    grid[row][startCol + i] = word[i];
  }

  // Place LAKES vertically
  const word2 = 'LAKES';
  const col = 7;
  const startRow = 2;
  for (let i = 0; i < word2.length; i++) {
    grid[startRow + i][col] = word2[i];
  }

  return grid;
};

export const WordSearch = ({ username, postId, onComplete, onBack }: WordSearchProps) => {
  const [grid] = useState<string[][]>(generateGrid());
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(120);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleComplete = async () => {
    const finalScore = foundWords.size * 100 + timeLeft * 2;
    setScore(finalScore);

    try {
      await fetch('/api/analytics/game-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          postId,
          game: 'word-search',
          score: finalScore,
          wordsFound: foundWords.size,
          timeRemaining: timeLeft,
        }),
      });
    } catch (err) {
      console.error('Failed to track analytics:', err);
    }

    setTimeout(() => onComplete(finalScore), 2000);
  };

  const handleCellClick = (row: number, col: number) => {
    const cellKey = `${row}-${col}`;
    const newSelected = new Set(selectedCells);

    if (newSelected.has(cellKey)) {
      newSelected.delete(cellKey);
    } else {
      newSelected.add(cellKey);
    }

    setSelectedCells(newSelected);
    checkForWords(newSelected);
  };

  const checkForWords = (selected: Set<string>) => {
    const selectedLetters = Array.from(selected)
      .sort()
      .map((key) => {
        const [row, col] = key.split('-').map(Number);
        return grid[row][col];
      })
      .join('');

    MICHIGAN_WORDS.forEach((word) => {
      if (selectedLetters.includes(word) && !foundWords.has(word)) {
        setFoundWords((prev) => new Set([...prev, word]));
        setSelectedCells(new Set());
      }
    });
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div
      className="flex flex-col items-center justify-start min-h-screen p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-96 h-96 rounded-full -top-48 -right-48"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        ></div>
        <div
          className="absolute w-96 h-96 rounded-full bottom-1/4 -left-32"
          style={{
            background: 'radial-gradient(circle, rgba(147,51,234,0.2) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        ></div>
      </div>

      <div className="max-w-2xl w-full relative">
        {/* Glass card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '32px',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div className="p-6 flex items-center justify-between bg-white/10">
            <button
              onClick={onBack}
              className="px-4 py-2 bg-white/90 hover:bg-white text-gray-800 font-bold shadow-lg"
              style={{
                borderRadius: '20px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
            >
              ← Back
            </button>
            <div className="text-center">
              <h2 className="text-3xl font-black text-white flex items-center gap-2">
                <span>🔍</span>
                <span>WORD SEARCH</span>
              </h2>
              <p className="text-sm text-white/80 font-semibold">{username}</p>
            </div>
            <div
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
                boxShadow: '0 4px 20px rgba(251, 191, 36, 0.4), 0 2px 8px rgba(0, 0, 0, 0.1)',
              }}
            >
              <p className="text-2xl font-black text-white">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Words to find */}
            <div
              style={{
                padding: '16px',
                borderRadius: '28px',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <p className="font-black text-lg mb-3 text-white">🎯 FIND THESE WORDS:</p>
              <div className="flex flex-wrap gap-2">
                {MICHIGAN_WORDS.map((word) => (
                  <span
                    key={word}
                    className="px-4 py-2 text-sm font-bold"
                    style={{
                      borderRadius: '100px',
                      background: foundWords.has(word)
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : 'rgba(255, 255, 255, 0.9)',
                      color: foundWords.has(word) ? 'white' : '#764ba2',
                      textDecoration: foundWords.has(word) ? 'line-through' : 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
              {grid.map((row, rowIndex) =>
                row.map((letter, colIndex) => {
                  const cellKey = `${rowIndex}-${colIndex}`;
                  const isSelected = selectedCells.has(cellKey);

                  return (
                    <button
                      key={cellKey}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      className="aspect-square flex items-center justify-center text-xs sm:text-base font-bold"
                      style={{
                        background: isSelected
                          ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                          : 'rgba(255, 255, 255, 0.9)',
                        color: isSelected ? 'white' : '#764ba2',
                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                        borderRadius: '12px',
                        boxShadow: isSelected
                          ? '0 4px 16px rgba(251, 191, 36, 0.4), 0 2px 8px rgba(0, 0, 0, 0.1)'
                          : '0 2px 8px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        border: 'none',
                      }}
                    >
                      {letter}
                    </button>
                  );
                })
              )}
            </div>

            {/* Progress */}
            <div
              className="text-center p-4"
              style={{
                borderRadius: '28px',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <p className="text-2xl font-black text-white">
                ✨ Found: {foundWords.size} / {MICHIGAN_WORDS.length}
              </p>
            </div>

            {/* Completion */}
            {foundWords.size === MICHIGAN_WORDS.length && (
              <div
                className="text-center p-6"
                style={{
                  borderRadius: '28px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4), 0 2px 8px rgba(0, 0, 0, 0.1)',
                }}
              >
                <p className="text-3xl font-black text-white mb-4">🎉 PERFECT! 🎉</p>
                <button
                  onClick={handleComplete}
                  className="px-8 py-4 bg-white font-black text-purple-600"
                  style={{
                    borderRadius: '24px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  FINISH →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

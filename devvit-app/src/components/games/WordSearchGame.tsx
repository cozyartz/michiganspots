/**
 * Word Search Game Component
 */

import { Devvit } from '@devvit/public-api';

interface WordSearchGameProps {
  gameData: any;
  score: number;
  timeRemaining: number;
  onScoreUpdate: (score: number) => void;
  onGameEnd: () => void;
}

export const WordSearchGame = ({
  gameData,
  score,
  timeRemaining,
  onScoreUpdate,
  onGameEnd
}: WordSearchGameProps) => {
  const handleWordFound = (word: string) => {
    if (!gameData.found.includes(word)) {
      gameData.found.push(word);
      onScoreUpdate(score + word.length * 5);
      
      // Check if all words found
      if (gameData.found.length === gameData.words.length) {
        onGameEnd();
      }
    }
  };

  return {
    type: 'vstack',
    padding: 'medium',
    gap: 'medium',
    children: [
      {
        type: 'text',
        size: 'large',
        weight: 'bold',
        text: '🔤 Michigan Word Search'
      },
      {
        type: 'text',
        size: 'medium',
        text: `Score: ${score} | Time: ${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}`
      },
      {
        type: 'text',
        size: 'medium',
        text: `Found: ${gameData.found.length}/${gameData.words.length} words`
      },
      {
        type: 'vstack',
        gap: 'small',
        children: gameData.words.map((word: string) => ({
          type: 'button',
          size: 'small',
          appearance: gameData.found.includes(word) ? 'primary' as const : 'secondary' as const,
          text: `${gameData.found.includes(word) ? '✅' : '🔍'} ${word}`,
          disabled: gameData.found.includes(word),
          onPress: () => handleWordFound(word)
        }))
      },
      {
        type: 'button',
        appearance: 'secondary',
        text: 'End Game',
        onPress: onGameEnd
      }
    ]
  };
};
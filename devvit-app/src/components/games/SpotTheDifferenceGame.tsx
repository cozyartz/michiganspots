/**
 * Spot the Difference Game Component
 */

import { Devvit } from '@devvit/public-api';

interface SpotTheDifferenceGameProps {
  gameData: any;
  score: number;
  timeRemaining: number;
  onScoreUpdate: (score: number) => void;
  onGameEnd: () => void;
}

export const SpotTheDifferenceGame = ({
  gameData,
  score,
  timeRemaining,
  onScoreUpdate,
  onGameEnd
}: SpotTheDifferenceGameProps) => {
  const handleDifferenceClick = (differenceId: number) => {
    const difference = gameData.differences.find((d: any) => d.id === differenceId);
    if (difference && !difference.found) {
      difference.found = true;
      onScoreUpdate(score + 10);
      
      // Check if all differences found
      const allFound = gameData.differences.every((d: any) => d.found);
      if (allFound) {
        onGameEnd();
      }
    }
  };

  const foundCount = gameData.differences.filter((d: any) => d.found).length;
  const totalCount = gameData.differences.length;

  return {
    type: 'vstack',
    padding: 'medium',
    gap: 'medium',
    children: [
      // Header
      {
        type: 'hstack',
        alignment: 'space-between',
        children: [
          {
            type: 'text',
            size: 'large',
            weight: 'bold',
            text: '🔍 Spot the Difference'
          },
          {
            type: 'text',
            size: 'medium',
            text: `⏱️ ${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}`
          }
        ]
      },
      // Score and Progress
      {
        type: 'hstack',
        alignment: 'space-between',
        children: [
          {
            type: 'text',
            size: 'medium',
            text: `Score: ${score}`
          },
          {
            type: 'text',
            size: 'medium',
            text: `Found: ${foundCount}/${totalCount}`
          }
        ]
      },
      // Game Instructions
      {
        type: 'text',
        size: 'small',
        color: '#6b7280',
        alignment: 'center',
        text: 'Find the differences between these two Michigan landmark photos!'
      },
      // Game Area
      {
        type: 'vstack',
        gap: 'small',
        alignment: 'center',
        children: [
          {
            type: 'text',
            size: 'medium',
            weight: 'bold',
            text: '🏞️ Michigan Lighthouse Scene'
          },
          {
            type: 'vstack',
            gap: 'small',
            backgroundColor: '#f3f4f6',
            padding: 'large',
            cornerRadius: 'medium',
            children: gameData.differences.map((diff: any, index: number) => ({
              type: 'hstack',
              gap: 'medium',
              alignment: 'center',
              children: [
                {
                  type: 'text',
                  size: 'medium',
                  text: `${diff.found ? '✅' : '❓'} Difference ${index + 1}`
                },
                ...(diff.found ? [] : [{
                  type: 'button',
                  size: 'small',
                  appearance: 'secondary' as const,
                  text: 'Click to Find',
                  onPress: () => handleDifferenceClick(diff.id)
                }])
              ]
            }))
          },
          {
            type: 'text',
            size: 'small',
            color: '#6b7280',
            text: '💡 Hint: Look for changes in colors, missing objects, or added elements'
          }
        ]
      },
      // Game Controls
      {
        type: 'hstack',
        gap: 'small',
        alignment: 'center',
        children: [
          {
            type: 'button',
            appearance: 'secondary',
            text: 'End Game',
            onPress: onGameEnd
          }
        ]
      }
    ]
  };
};
/**
 * Virtual Treasure Hunt Game Component
 */

import { Devvit } from '@devvit/public-api';

interface VirtualTreasureHuntProps {
  gameData: any;
  score: number;
  timeRemaining: number;
  onScoreUpdate: (score: number) => void;
  onGameEnd: () => void;
}

export const VirtualTreasureHunt = ({
  gameData,
  score,
  timeRemaining,
  onScoreUpdate,
  onGameEnd
}: VirtualTreasureHuntProps) => {
  const currentClue = gameData.clues[gameData.currentClue];
  const isLastClue = gameData.currentClue >= gameData.clues.length - 1;

  const handleAnswer = (answer: string) => {
    const isCorrect = answer.toLowerCase().includes(currentClue.answer.toLowerCase());
    
    if (isCorrect) {
      gameData.foundItems.push({
        clueIndex: gameData.currentClue,
        answer: answer,
        correct: true
      });
      onScoreUpdate(score + 30);

      if (isLastClue) {
        onGameEnd();
      } else {
        gameData.currentClue++;
      }
    } else {
      // Wrong answer, show hint
      gameData.showHint = true;
    }
  };

  const showHint = () => {
    gameData.showHint = true;
  };

  if (!currentClue) {
    return {
      type: 'text',
      text: 'Loading clue...'
    };
  }

  return {
    type: 'vstack',
    padding: 'medium',
    gap: 'medium',
    children: [
      {
        type: 'text',
        size: 'large',
        weight: 'bold',
        text: '🗺️ Virtual Treasure Hunt'
      },
      {
        type: 'text',
        size: 'medium',
        text: `Score: ${score} | Clue: ${gameData.currentClue + 1}/${gameData.clues.length}`
      },
      {
        type: 'vstack',
        gap: 'medium',
        padding: 'medium',
        backgroundColor: '#fef3c7',
        cornerRadius: 'medium',
        border: 'thin',
        borderColor: '#f59e0b',
        children: [
          {
            type: 'text',
            size: 'medium',
            weight: 'bold',
            color: '#92400e',
            text: `🧩 Clue #${gameData.currentClue + 1}`
          },
          {
            type: 'text',
            size: 'medium',
            color: '#92400e',
            text: currentClue.clue
          },
          {
            type: 'text',
            size: 'small',
            color: '#a16207',
            text: `📍 Location: ${currentClue.location}`
          }
        ]
      },
      ...(gameData.showHint ? [{
        type: 'vstack',
        gap: 'small',
        padding: 'medium',
        backgroundColor: '#dbeafe',
        cornerRadius: 'medium',
        children: [
          {
            type: 'text',
            size: 'small',
            weight: 'bold',
            color: '#1e40af',
            text: '💡 Hint:'
          },
          {
            type: 'text',
            size: 'small',
            color: '#1e40af',
            text: currentClue.hint
          }
        ]
      }] : []),
      {
        type: 'vstack',
        gap: 'small',
        children: [
          {
            type: 'text',
            size: 'medium',
            weight: 'bold',
            text: 'What am I?'
          },
          {
            type: 'hstack',
            gap: 'small',
            children: [
              {
                type: 'button',
                appearance: 'primary',
                text: 'Submit Answer',
                onPress: () => handleAnswer(currentClue.answer)
              },
              ...(gameData.showHint ? [] : [{
                type: 'button',
                appearance: 'secondary',
                text: '💡 Show Hint',
                onPress: showHint
              }])
            ]
          }
        ]
      },
      {
        type: 'button',
        appearance: 'secondary',
        text: 'End Hunt',
        onPress: onGameEnd
      }
    ]
  };
};
/**
 * Drawing Challenge Game Component
 */

import { Devvit } from '@devvit/public-api';

interface DrawingChallengeProps {
  gameData: any;
  score: number;
  timeRemaining: number;
  onScoreUpdate: (score: number) => void;
  onGameEnd: () => void;
}

export const DrawingChallenge = ({
  gameData,
  score,
  timeRemaining,
  onScoreUpdate,
  onGameEnd
}: DrawingChallengeProps) => {
  const addStroke = (strokeType: string) => {
    gameData.strokes.push({
      type: strokeType,
      timestamp: Date.now()
    });
    onScoreUpdate(score + 1);
  };

  const clearDrawing = () => {
    gameData.strokes = [];
  };

  const submitDrawing = () => {
    // Award bonus points for completing the drawing
    onScoreUpdate(score + 50);
    onGameEnd();
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
        text: '🎨 Drawing Challenge'
      },
      {
        type: 'text',
        size: 'medium',
        text: `Score: ${score} | Strokes: ${gameData.strokes.length}`
      },
      {
        type: 'vstack',
        gap: 'small',
        padding: 'medium',
        backgroundColor: '#fef3c7',
        cornerRadius: 'medium',
        children: [
          {
            type: 'text',
            size: 'medium',
            weight: 'bold',
            color: '#92400e',
            text: '🎯 Your Challenge:'
          },
          {
            type: 'text',
            size: 'large',
            weight: 'bold',
            color: '#92400e',
            alignment: 'center',
            text: gameData.prompt
          }
        ]
      },
      {
        type: 'vstack',
        gap: 'small',
        children: [
          {
            type: 'text',
            size: 'medium',
            weight: 'bold',
            text: 'Drawing Tools'
          },
          {
            type: 'hstack',
            gap: 'small',
            wrap: true,
            alignment: 'center',
            children: [
              {
                type: 'button',
                size: 'small',
                appearance: 'secondary',
                text: '📏 Line',
                onPress: () => addStroke('line')
              },
              {
                type: 'button',
                size: 'small',
                appearance: 'secondary',
                text: '⭕ Circle',
                onPress: () => addStroke('circle')
              },
              {
                type: 'button',
                size: 'small',
                appearance: 'secondary',
                text: '⬜ Square',
                onPress: () => addStroke('square')
              },
              {
                type: 'button',
                size: 'small',
                appearance: 'secondary',
                text: '〰️ Curve',
                onPress: () => addStroke('curve')
              }
            ]
          }
        ]
      },
      {
        type: 'text',
        size: 'medium',
        text: `Drawing Progress: ${gameData.strokes.map((s: any) => s.type === 'line' ? '📏' : s.type === 'circle' ? '⭕' : s.type === 'square' ? '⬜' : '〰️').join(' ')}`
      },
      {
        type: 'hstack',
        gap: 'small',
        alignment: 'center',
        children: [
          {
            type: 'button',
            appearance: 'secondary',
            text: '🗑️ Clear',
            onPress: clearDrawing
          },
          {
            type: 'button',
            appearance: 'primary',
            text: '✅ Submit Drawing',
            disabled: gameData.strokes.length < 5,
            onPress: submitDrawing
          }
        ]
      },
      {
        type: 'button',
        appearance: 'secondary',
        text: 'End Challenge',
        onPress: onGameEnd
      }
    ]
  };
};
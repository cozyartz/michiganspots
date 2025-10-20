/**
 * Michigan Trivia Game Component
 */

import { Devvit } from '@devvit/public-api';

interface TriviaGameProps {
  gameData: any;
  score: number;
  timeRemaining: number;
  onScoreUpdate: (score: number) => void;
  onGameEnd: () => void;
}

export const TriviaGame = ({
  gameData,
  score,
  timeRemaining,
  onScoreUpdate,
  onGameEnd
}: TriviaGameProps) => {
  const currentQuestion = gameData.questions[gameData.currentQuestion];
  const isLastQuestion = gameData.currentQuestion >= gameData.questions.length - 1;

  const handleAnswer = (selectedIndex: number) => {
    const isCorrect = selectedIndex === currentQuestion.correct;
    gameData.answers.push({
      questionIndex: gameData.currentQuestion,
      selectedIndex,
      correct: isCorrect
    });

    if (isCorrect) {
      onScoreUpdate(score + 20);
    }

    if (isLastQuestion) {
      onGameEnd();
    } else {
      gameData.currentQuestion++;
    }
  };

  if (!currentQuestion) {
    return {
      type: 'text',
      text: 'Loading question...'
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
        text: '🧠 Michigan Trivia'
      },
      {
        type: 'text',
        size: 'medium',
        text: `Score: ${score} | Question: ${gameData.currentQuestion + 1}/${gameData.questions.length}`
      },
      {
        type: 'vstack',
        gap: 'medium',
        padding: 'medium',
        backgroundColor: '#f8fafc',
        cornerRadius: 'medium',
        children: [
          {
            type: 'text',
            size: 'large',
            weight: 'bold',
            alignment: 'center',
            text: currentQuestion.question
          }
        ]
      },
      {
        type: 'vstack',
        gap: 'small',
        children: currentQuestion.options.map((option: string, index: number) => ({
          type: 'button',
          appearance: 'secondary' as const,
          size: 'medium',
          text: `${String.fromCharCode(65 + index)}. ${option}`,
          onPress: () => handleAnswer(index)
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
/**
 * Interactive Game Hub Component
 * Provides various mini-games and interactive features for users
 */

import { Devvit } from '@devvit/public-api';
import { Challenge } from '../types/core.js';
import { SpotTheDifferenceGame } from './games/SpotTheDifferenceGame.js';
import { WordSearchGame } from './games/WordSearchGame.js';
import { TriviaGame } from './games/TriviaGame.js';
import { VirtualTreasureHunt } from './games/VirtualTreasureHunt.js';
import { DrawingChallenge } from './games/DrawingChallenge.js';

export interface InteractiveGameHubProps {
  challenge?: Challenge;
  onGameComplete?: (gameType: string, score: number) => void;
  onClose?: () => void;
}

export interface GameState {
  currentGame: string | null;
  score: number;
  timeRemaining: number;
  gameData: any;
  isPlaying: boolean;
  completed: boolean;
}

/**
 * Interactive Game Hub Component
 */
export const InteractiveGameHub: Devvit.CustomPostComponent = (context) => {
  const { useState, useInterval } = context;
  
  const [currentGame, setCurrentGame] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [gameData, setGameData] = useState<any>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Game timer
  const gameTimer = useInterval(() => {
    if (isPlaying && timeRemaining > 0) {
      setTimeRemaining(timeRemaining - 1);
    } else if (timeRemaining === 0 && isPlaying) {
      endGame();
    }
  }, 1000);

  const startGame = (gameType: string) => {
    setCurrentGame(gameType);
    setScore(0);
    setTimeRemaining(gameType === 'treasure_hunt' ? 300 : 60); // 5 min for treasure hunt, 1 min for others
    setIsPlaying(true);
    setCompleted(false);
    initializeGameData(gameType);
    gameTimer.start();
  };

  const endGame = () => {
    setIsPlaying(false);
    setCompleted(true);
    gameTimer.stop();
  };

  const initializeGameData = (gameType: string) => {
    switch (gameType) {
      case 'spot_the_difference':
        setGameData({
          differences: generateSpotTheDifferenceGame(),
          found: []
        });
        break;
      case 'word_search':
        setGameData({
          grid: generateWordSearchGrid(),
          words: ['MICHIGAN', 'SPOTS', 'TREASURE', 'HUNT', 'LOCAL'],
          found: []
        });
        break;
      case 'trivia':
        setGameData({
          questions: generateMichiganTrivia(),
          currentQuestion: 0,
          answers: []
        });
        break;
      case 'treasure_hunt':
        setGameData({
          clues: generateTreasureHuntClues(),
          currentClue: 0,
          foundItems: []
        });
        break;
      case 'drawing_challenge':
        setGameData({
          prompt: getRandomDrawingPrompt(),
          strokes: []
        });
        break;
    }
  };

  // Game selection screen
  if (!currentGame) {
    return {
      type: 'vstack',
      padding: 'medium',
      gap: 'medium',
      children: [
        {
          type: 'text',
          size: 'xxlarge',
          weight: 'bold',
          alignment: 'center',
          text: '🎮 Interactive Games'
        },
        {
          type: 'text',
          size: 'medium',
          color: '#6b7280',
          alignment: 'center',
          text: 'Play mini-games while exploring Michigan!'
        },
        {
          type: 'vstack',
          gap: 'small',
          children: [
            // Spot the Difference
            {
              type: 'vstack',
              padding: 'medium',
              backgroundColor: 'white',
              cornerRadius: 'medium',
              border: 'thin',
              borderColor: '#e5e7eb',
              gap: 'small',
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
                  color: '#6b7280',
                  text: 'Find differences between two Michigan landmark photos'
                },
                {
                  type: 'hstack',
                  gap: 'medium',
                  children: [
                    {
                      type: 'hstack',
                      gap: 'small',
                      children: [
                        {
                          type: 'text',
                          size: 'small',
                          color: '#10b981',
                          text: '●'
                        },
                        {
                          type: 'text',
                          size: 'small',
                          color: '#6b7280',
                          text: 'Easy'
                        }
                      ]
                    },
                    {
                      type: 'hstack',
                      gap: 'small',
                      children: [
                        {
                          type: 'text',
                          size: 'small',
                          text: '⏱️'
                        },
                        {
                          type: 'text',
                          size: 'small',
                          color: '#6b7280',
                          text: '1 min'
                        }
                      ]
                    }
                  ]
                },
                {
                  type: 'button',
                  appearance: 'primary',
                  text: 'Play Now',
                  onPress: () => startGame('spot_the_difference')
                }
              ]
            },
            // Word Search
            {
              type: 'vstack',
              padding: 'medium',
              backgroundColor: 'white',
              cornerRadius: 'medium',
              border: 'thin',
              borderColor: '#e5e7eb',
              gap: 'small',
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
                  color: '#6b7280',
                  text: 'Find hidden words related to Michigan attractions'
                },
                {
                  type: 'hstack',
                  gap: 'medium',
                  children: [
                    {
                      type: 'hstack',
                      gap: 'small',
                      children: [
                        {
                          type: 'text',
                          size: 'small',
                          color: '#f59e0b',
                          text: '●'
                        },
                        {
                          type: 'text',
                          size: 'small',
                          color: '#6b7280',
                          text: 'Medium'
                        }
                      ]
                    },
                    {
                      type: 'hstack',
                      gap: 'small',
                      children: [
                        {
                          type: 'text',
                          size: 'small',
                          text: '⏱️'
                        },
                        {
                          type: 'text',
                          size: 'small',
                          color: '#6b7280',
                          text: '1 min'
                        }
                      ]
                    }
                  ]
                },
                {
                  type: 'button',
                  appearance: 'primary',
                  text: 'Play Now',
                  onPress: () => startGame('word_search')
                }
              ]
            },
            // Trivia
            {
              type: 'vstack',
              padding: 'medium',
              backgroundColor: 'white',
              cornerRadius: 'medium',
              border: 'thin',
              borderColor: '#e5e7eb',
              gap: 'small',
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
                  color: '#6b7280',
                  text: 'Test your knowledge of Michigan history and culture'
                },
                {
                  type: 'hstack',
                  gap: 'medium',
                  children: [
                    {
                      type: 'hstack',
                      gap: 'small',
                      children: [
                        {
                          type: 'text',
                          size: 'small',
                          color: '#f59e0b',
                          text: '●'
                        },
                        {
                          type: 'text',
                          size: 'small',
                          color: '#6b7280',
                          text: 'Medium'
                        }
                      ]
                    },
                    {
                      type: 'hstack',
                      gap: 'small',
                      children: [
                        {
                          type: 'text',
                          size: 'small',
                          text: '⏱️'
                        },
                        {
                          type: 'text',
                          size: 'small',
                          color: '#6b7280',
                          text: '2 min'
                        }
                      ]
                    }
                  ]
                },
                {
                  type: 'button',
                  appearance: 'primary',
                  text: 'Play Now',
                  onPress: () => startGame('trivia')
                }
              ]
            },
            // Virtual Treasure Hunt
            {
              type: 'vstack',
              padding: 'medium',
              backgroundColor: 'white',
              cornerRadius: 'medium',
              border: 'thin',
              borderColor: '#e5e7eb',
              gap: 'small',
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
                  color: '#6b7280',
                  text: 'Follow clues to find hidden treasures around Michigan'
                },
                {
                  type: 'hstack',
                  gap: 'medium',
                  children: [
                    {
                      type: 'hstack',
                      gap: 'small',
                      children: [
                        {
                          type: 'text',
                          size: 'small',
                          color: '#ef4444',
                          text: '●'
                        },
                        {
                          type: 'text',
                          size: 'small',
                          color: '#6b7280',
                          text: 'Hard'
                        }
                      ]
                    },
                    {
                      type: 'hstack',
                      gap: 'small',
                      children: [
                        {
                          type: 'text',
                          size: 'small',
                          text: '⏱️'
                        },
                        {
                          type: 'text',
                          size: 'small',
                          color: '#6b7280',
                          text: '5 min'
                        }
                      ]
                    }
                  ]
                },
                {
                  type: 'button',
                  appearance: 'primary',
                  text: 'Play Now',
                  onPress: () => startGame('treasure_hunt')
                }
              ]
            },
            // Drawing Challenge
            {
              type: 'vstack',
              padding: 'medium',
              backgroundColor: 'white',
              cornerRadius: 'medium',
              border: 'thin',
              borderColor: '#e5e7eb',
              gap: 'small',
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
                  color: '#6b7280',
                  text: 'Draw Michigan landmarks and share with the community'
                },
                {
                  type: 'hstack',
                  gap: 'medium',
                  children: [
                    {
                      type: 'hstack',
                      gap: 'small',
                      children: [
                        {
                          type: 'text',
                          size: 'small',
                          color: '#8b5cf6',
                          text: '●'
                        },
                        {
                          type: 'text',
                          size: 'small',
                          color: '#6b7280',
                          text: 'Creative'
                        }
                      ]
                    },
                    {
                      type: 'hstack',
                      gap: 'small',
                      children: [
                        {
                          type: 'text',
                          size: 'small',
                          text: '⏱️'
                        },
                        {
                          type: 'text',
                          size: 'small',
                          color: '#6b7280',
                          text: '3 min'
                        }
                      ]
                    }
                  ]
                },
                {
                  type: 'button',
                  appearance: 'primary',
                  text: 'Play Now',
                  onPress: () => startGame('drawing_challenge')
                }
              ]
            }
          ]
        }
      ]
    };
  }

  // Game completion screen
  if (completed) {
    return {
      type: 'vstack',
      padding: 'medium',
      gap: 'medium',
      alignment: 'center',
      children: [
        {
          type: 'text',
          size: 'xxlarge',
          text: '🎉'
        },
        {
          type: 'text',
          size: 'large',
          weight: 'bold',
          text: 'Game Complete!'
        },
        {
          type: 'text',
          size: 'medium',
          text: `Final Score: ${score}`
        },
        {
          type: 'vstack',
          gap: 'small',
          alignment: 'center',
          children: [
            {
              type: 'button',
              appearance: 'primary',
              text: 'Play Another Game',
              onPress: () => setCurrentGame(null)
            },
            {
              type: 'button',
              appearance: 'secondary',
              text: 'Back to Hub',
              onPress: () => setCurrentGame(null)
            }
          ]
        }
      ]
    };
  }

  // Render specific game
  switch (currentGame) {
    case 'spot_the_difference':
      return SpotTheDifferenceGame({
        gameData,
        score,
        timeRemaining,
        onScoreUpdate: setScore,
        onGameEnd: endGame
      });
    case 'word_search':
      return WordSearchGame({
        gameData,
        score,
        timeRemaining,
        onScoreUpdate: setScore,
        onGameEnd: endGame
      });
    case 'trivia':
      return TriviaGame({
        gameData,
        score,
        timeRemaining,
        onScoreUpdate: setScore,
        onGameEnd: endGame
      });
    case 'treasure_hunt':
      return VirtualTreasureHunt({
        gameData,
        score,
        timeRemaining,
        onScoreUpdate: setScore,
        onGameEnd: endGame
      });
    case 'drawing_challenge':
      return DrawingChallenge({
        gameData,
        score,
        timeRemaining,
        onScoreUpdate: setScore,
        onGameEnd: endGame
      });
    default:
      return {
        type: 'text',
        text: 'Game not found'
      };
  }
};



// Helper functions for game generation
function generateSpotTheDifferenceGame() {
  return [
    { x: 20, y: 30, found: false, id: 1 },
    { x: 45, y: 60, found: false, id: 2 },
    { x: 70, y: 25, found: false, id: 3 },
    { x: 30, y: 80, found: false, id: 4 },
    { x: 85, y: 70, found: false, id: 5 }
  ];
}

function generateWordSearchGrid() {
  // Simplified 8x8 grid with embedded words
  return [
    ['M', 'I', 'C', 'H', 'I', 'G', 'A', 'N'],
    ['S', 'P', 'O', 'T', 'S', 'X', 'Y', 'Z'],
    ['T', 'R', 'E', 'A', 'S', 'U', 'R', 'E'],
    ['H', 'U', 'N', 'T', 'Q', 'W', 'E', 'R'],
    ['L', 'O', 'C', 'A', 'L', 'A', 'S', 'D'],
    ['F', 'G', 'H', 'J', 'K', 'L', 'Z', 'X'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K']
  ];
}

function generateMichiganTrivia() {
  return [
    {
      question: "What is Michigan's nickname?",
      options: ["The Great Lake State", "The Wolverine State", "Both A and B", "The Motor State"],
      correct: 2
    },
    {
      question: "Which city is known as the 'Motor City'?",
      options: ["Grand Rapids", "Detroit", "Lansing", "Ann Arbor"],
      correct: 1
    },
    {
      question: "How many Great Lakes border Michigan?",
      options: ["2", "3", "4", "5"],
      correct: 2
    },
    {
      question: "What is Michigan's state flower?",
      options: ["Rose", "Apple Blossom", "Lily", "Sunflower"],
      correct: 1
    }
  ];
}

function generateTreasureHuntClues() {
  return [
    {
      clue: "I stand tall where ships once docked, my light guides sailors through the fog. What am I?",
      answer: "lighthouse",
      hint: "Think about Michigan's maritime history",
      location: "Great Lakes shoreline"
    },
    {
      clue: "In autumn, I turn brilliant colors. Visitors come from far to see my sugar-sweet transformation. What am I?",
      answer: "maple tree",
      hint: "Think about fall foliage and syrup",
      location: "Michigan forests"
    },
    {
      clue: "I'm a bridge that connects two peninsulas, spanning waters blue and wide. What am I?",
      answer: "mackinac bridge",
      hint: "Think about Michigan's two main land masses",
      location: "Straits of Mackinac"
    }
  ];
}

function getRandomDrawingPrompt() {
  const prompts = [
    "Draw the Mackinac Bridge",
    "Draw a Michigan lighthouse",
    "Draw the Detroit skyline",
    "Draw a Great Lakes sunset",
    "Draw Michigan's state bird (Robin)",
    "Draw a Michigan cherry tree",
    "Draw Sleeping Bear Dunes"
  ];
  return prompts[Math.floor(Math.random() * prompts.length)];
}

export default InteractiveGameHub;
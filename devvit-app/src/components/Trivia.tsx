import { useState, useEffect } from 'react';
import { getTheme } from './theme';

interface TriviaProps {
  username: string;
  postId: string;
  isDark: boolean;
  onComplete: (score: number) => void;
  onBack: () => void;
}

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const TRIVIA_QUESTIONS: Question[] = [
  {
    question: 'What is the capital of Michigan?',
    options: ['Detroit', 'Lansing', 'Grand Rapids', 'Ann Arbor'],
    correctIndex: 1,
    explanation: 'Lansing has been Michigan\'s capital since 1847.',
  },
  {
    question: 'Which Great Lake does NOT border Michigan?',
    options: ['Lake Superior', 'Lake Michigan', 'Lake Erie', 'Lake Ontario'],
    correctIndex: 3,
    explanation: 'Michigan borders Lakes Superior, Michigan, Huron, and Erie.',
  },
  {
    question: 'What is Michigan\'s state nickname?',
    options: ['The Great Lake State', 'The Wolverine State', 'The Mitten State', 'All of the above'],
    correctIndex: 3,
    explanation: 'Michigan has several nicknames including all three listed!',
  },
  {
    question: 'Which university is located in Ann Arbor?',
    options: ['Michigan State', 'University of Michigan', 'Wayne State', 'Western Michigan'],
    correctIndex: 1,
    explanation: 'The University of Michigan is located in Ann Arbor.',
  },
  {
    question: 'What is Michigan\'s largest city?',
    options: ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights'],
    correctIndex: 0,
    explanation: 'Detroit is Michigan\'s largest city and was once the 4th largest in the US.',
  },
];

export const Trivia = ({ username, postId, isDark, onComplete, onBack }: TriviaProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);

  const theme = getTheme(isDark);

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
    const finalScore = score + timeLeft * 5;

    try {
      await fetch('/api/analytics/game-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          postId,
          game: 'trivia',
          score: finalScore,
          questionsAnswered: currentQuestion,
          correctAnswers: Math.floor(score / 100),
          timeRemaining: timeLeft,
        }),
      });
    } catch (err) {
      console.error('Failed to track analytics:', err);
    }

    onComplete(finalScore);
  };

  const handleAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answerIndex);
    setShowExplanation(true);

    if (answerIndex === TRIVIA_QUESTIONS[currentQuestion].correctIndex) {
      setScore((prev) => prev + 100);
    }

    setTimeout(() => {
      if (currentQuestion < TRIVIA_QUESTIONS.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
        setSelectedAnswer(null);
        setShowExplanation(false);
      } else {
        handleComplete();
      }
    }, 3000);
  };

  const question = TRIVIA_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / TRIVIA_QUESTIONS.length) * 100;

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
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                marginBottom: '16px',
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
                    color: theme.colors.cyan.primary,
                    marginBottom: '4px',
                  }}
                >
                  Michigan Trivia
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
                  <p style={{ fontSize: '18px', fontWeight: '800', color: 'white', margin: 0 }}>{timeLeft}s</p>
                </div>
                <p style={{ fontSize: '12px', fontWeight: '700', color: theme.colors.ink.secondary }}>{score} pts</p>
              </div>
            </div>

            {/* Progress bar */}
            <div
              style={{
                position: 'relative',
                height: '8px',
                overflow: 'hidden',
                background: theme.colors.border,
                borderRadius: '100px',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: `${progress}%`,
                  background: `linear-gradient(135deg, ${theme.colors.cyan.primary} 0%, ${theme.colors.cyan.dark} 100%)`,
                  transition: 'all 0.5s',
                  borderRadius: '100px',
                }}
              />
            </div>
          </div>

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Question */}
            <div
              style={{
                textAlign: 'center',
                padding: '24px 16px',
                borderRadius: '16px',
                background: `${theme.colors.copper}10`,
                border: `1px solid ${theme.colors.copper}30`,
              }}
            >
              <p style={{ fontSize: '12px', fontWeight: '700', color: theme.colors.ink.secondary, marginBottom: '12px' }}>
                Question {currentQuestion + 1} of {TRIVIA_QUESTIONS.length}
              </p>
              <h3 style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: '800', color: theme.colors.ink.primary, margin: 0 }}>
                {question.question}
              </h3>
            </div>

            {/* Answer options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {question.options.map((option, index) => {
                let bgStyle = theme.colors.card;
                let textColor = theme.colors.ink.primary;
                let shadow = theme.shadows.sm;
                let border = `2px solid ${theme.colors.border}`;

                if (selectedAnswer !== null) {
                  if (index === question.correctIndex) {
                    bgStyle = `linear-gradient(135deg, ${theme.colors.copper} 0%, ${theme.colors.copperDark} 100%)`;
                    textColor = 'white';
                    shadow = theme.shadows.lg;
                    border = 'none';
                  } else if (index === selectedAnswer) {
                    bgStyle = `linear-gradient(135deg, ${theme.colors.coral.primary} 0%, ${theme.colors.coral.light} 100%)`;
                    textColor = 'white';
                    shadow = theme.shadows.lg;
                    border = 'none';
                  } else {
                    bgStyle = theme.colors.card;
                    textColor = theme.colors.ink.secondary;
                    shadow = theme.shadows.sm;
                  }
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={selectedAnswer !== null}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '16px 20px',
                      fontWeight: '700',
                      fontSize: '15px',
                      background: bgStyle,
                      color: textColor,
                      transform: selectedAnswer === null ? 'scale(1)' : index === selectedAnswer || index === question.correctIndex ? 'scale(1.01)' : 'scale(0.99)',
                      borderRadius: '16px',
                      boxShadow: shadow,
                      transition: 'all 0.3s',
                      border,
                      cursor: selectedAnswer !== null ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedAnswer === null) {
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.boxShadow = theme.shadows.md;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedAnswer === null) {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = theme.shadows.sm;
                      }
                    }}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {showExplanation && (
              <div
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  borderRadius: '16px',
                  background: `${theme.colors.cyan.primary}10`,
                  border: `1px solid ${theme.colors.cyan.primary}30`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.colors.cyan.primary} strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: theme.colors.ink.primary, margin: 0 }}>
                    {question.explanation}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

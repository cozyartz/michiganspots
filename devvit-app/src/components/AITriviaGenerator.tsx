import { useState } from 'react';

interface AITriviaGeneratorProps {
  username: string;
  onBack: () => void;
}

interface GeneratedQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
  difficulty: string;
  source?: string;
}

const CATEGORIES = [
  'Geography', 'History', 'Culture', 'Education', 'Industry', 
  'Sports', 'Nature', 'Food', 'Agriculture', 'General'
];

const DIFFICULTIES = ['easy', 'medium', 'hard'];

const THEMES = [
  'Michigan Landmarks',
  'Great Lakes Facts',
  'Detroit History',
  'Michigan Universities',
  'Automotive Industry',
  'Michigan Sports',
  'Upper Peninsula',
  'Michigan Agriculture',
  'Famous Michiganders',
  'Michigan Nature & Parks',
  'Michigan Food & Culture',
  'Michigan Cities',
  'Michigan Economy',
  'Michigan Government'
];

export function AITriviaGenerator({ username, onBack }: AITriviaGeneratorProps) {
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [theme, setTheme] = useState('');
  const [count, setCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const generateQuestions = async () => {
    setGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/trivia/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: category || undefined,
          difficulty,
          theme: theme || undefined,
          count,
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setGeneratedQuestions(data.questions);
        setSuccess(`Generated ${data.questions.length} new questions! ${data.generated ? '(AI-powered)' : '(From database)'}`);
      } else {
        setError(data.message || 'Failed to generate questions');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError('Network error occurred while generating questions');
    } finally {
      setGenerating(false);
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FEF7ED 0%, #FED7AA 100%)',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #E5E7EB'
        }}>
          <button
            onClick={onBack}
            style={{
              marginBottom: '16px',
              padding: '8px 16px',
              background: '#F3F4F6',
              border: '2px solid #D1D5DB',
              color: '#374151',
              fontWeight: '700',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            ← Back to Mod Tools
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '24px' }}>🧠</span>
            </div>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1F2937', margin: 0 }}>AI Trivia Generator</h1>
              <p style={{ color: '#6B7280', margin: 0 }}>Create fresh Michigan trivia questions using AI</p>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #DBEAFE 0%, #FEF3C7 100%)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #3B82F6'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px' }}>✨</span>
              <span style={{ fontWeight: '700', color: '#1F2937' }}>AI-Powered Question Creation</span>
            </div>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
              Generate unique, educational Michigan trivia questions tailored to specific categories and difficulty levels.
              Questions are automatically stored and can be used in daily trivia rotations.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Generation Controls */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #E5E7EB'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1F2937', marginBottom: '16px' }}>Generation Settings</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1F2937', marginBottom: '8px' }}>
                  Category (Optional)
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #D1D5DB',
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Any Category</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1F2937', marginBottom: '8px' }}>
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #D1D5DB',
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    fontSize: '14px'
                  }}
                >
                  {DIFFICULTIES.map(diff => (
                    <option key={diff} value={diff}>
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1F2937', marginBottom: '8px' }}>
                  Theme (Optional)
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #D1D5DB',
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    fontSize: '14px'
                  }}
                >
                  <option value="">General Michigan Knowledge</option>
                  {THEMES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1F2937', marginBottom: '8px' }}>
                  Number of Questions
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #D1D5DB',
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    fontSize: '14px'
                  }}
                />
              </div>

              <button
                onClick={generateQuestions}
                disabled={generating}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  background: generating ? '#9CA3AF' : 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                  color: 'white',
                  fontWeight: '700',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: generating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '16px'
                }}
              >
                {generating ? (
                  <>
                    <span style={{ fontSize: '20px' }}>⏳</span>
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '20px' }}>✨</span>
                    Generate Questions
                  </>
                )}
              </button>

              {error && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '8px'
                }}>
                  <span style={{ fontSize: '20px' }}>⚠️</span>
                  <span style={{ color: '#EF4444', fontSize: '14px' }}>{error}</span>
                </div>
              )}

              {success && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: '8px'
                }}>
                  <span style={{ fontSize: '20px' }}>✅</span>
                  <span style={{ color: '#10B981', fontSize: '14px' }}>{success}</span>
                </div>
              )}
            </div>
          </div>

          {/* Generated Questions Preview */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #E5E7EB'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1F2937', marginBottom: '16px' }}>Generated Questions</h2>
            
            {generatedQuestions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: '64px', margin: '0 auto 16px' }}>🧠</div>
                <p style={{ color: '#6B7280' }}>
                  No questions generated yet. Use the controls on the left to create new trivia questions.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto' }}>
                {generatedQuestions.map((question, index) => (
                  <div key={question.id || index} style={{
                    background: '#F9FAFB',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #E5E7EB'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#1F2937',
                        background: '#E5E7EB',
                        padding: '4px 8px',
                        borderRadius: '4px'
                      }}>
                        Q{index + 1}
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {question.category && (
                          <span style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#F59E0B',
                            background: '#FEF3C7',
                            padding: '4px 8px',
                            borderRadius: '4px'
                          }}>
                            {question.category}
                          </span>
                        )}
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'white',
                          background: getDifficultyColor(question.difficulty),
                          padding: '4px 8px',
                          borderRadius: '4px'
                        }}>
                          {question.difficulty}
                        </span>
                      </div>
                    </div>
                    
                    <h3 style={{ fontWeight: '700', color: '#1F2937', marginBottom: '8px', fontSize: '14px', lineHeight: '1.4' }}>
                      {question.question}
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '8px' }}>
                      {question.options.map((option, optIndex) => (
                        <div 
                          key={optIndex}
                          style={{
                            fontSize: '12px',
                            padding: '8px',
                            borderRadius: '6px',
                            background: optIndex === question.correctIndex ? '#D1FAE5' : '#F3F4F6',
                            color: optIndex === question.correctIndex ? '#10B981' : '#6B7280',
                            border: optIndex === question.correctIndex ? '1px solid #10B981' : '1px solid #E5E7EB'
                          }}
                        >
                          {String.fromCharCode(65 + optIndex)}. {option}
                        </div>
                      ))}
                    </div>
                    
                    <p style={{ fontSize: '12px', color: '#6B7280', fontStyle: 'italic', margin: 0 }}>
                      {question.explanation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Usage Instructions */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #E5E7EB'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1F2937', marginBottom: '16px' }}>How It Works</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                color: 'white',
                fontWeight: '700'
              }}>
                1
              </div>
              <h3 style={{ fontWeight: '700', color: '#1F2937', marginBottom: '8px' }}>Configure Settings</h3>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>
                Choose category, difficulty, theme, and number of questions to generate
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                color: 'white',
                fontWeight: '700'
              }}>
                2
              </div>
              <h3 style={{ fontWeight: '700', color: '#1F2937', marginBottom: '8px' }}>AI Generation</h3>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>
                AI creates unique, factual questions with explanations based on your criteria
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                color: 'white',
                fontWeight: '700'
              }}>
                3
              </div>
              <h3 style={{ fontWeight: '700', color: '#1F2937', marginBottom: '8px' }}>Auto-Storage</h3>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>
                Questions are automatically saved and added to the daily trivia rotation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
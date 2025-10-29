import { useState } from 'react';
import { getTheme } from './theme';

interface AIModToolsProps {
  username: string;
  postId: string;
  onBack: () => void;
}

type Tool = 'content-analysis' | 'sentiment' | 'spam-detection' | 'business-onboarding' | 'challenge-generator' | null;

export const AIModTools = ({ username, postId, onBack }: AIModToolsProps) => {
  const theme = getTheme(false); // Always use light theme for mod tools
  const [activeTool, setActiveTool] = useState<Tool>(null);
  const [analysisText, setAnalysisText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Debug log to ensure component is rendering
  console.log('AIModTools rendering with:', { username, postId, activeTool });

  // Main AI Tools Splash Screen
  if (activeTool === null) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100%',
        background: '#FEFEFE',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{ maxWidth: '600px', width: '100%' }}>
          <button
            onClick={onBack}
            style={{
              padding: '12px 24px',
              background: '#FFFFFF',
              color: '#1E293B',
              fontWeight: '600',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              cursor: 'pointer',
              marginBottom: '24px',
            }}
          >
            ← Back to Hub
          </button>

          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: '40px 32px',
            marginBottom: '32px',
            border: '1px solid #E2E8F0',
            textAlign: 'center',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#7DD3C0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              margin: '0 auto 24px',
            }}>
              🛡️
            </div>

            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#1E293B',
              marginBottom: '12px',
            }}>
              Michigan Moderator Tools
            </h1>

            <p style={{
              fontSize: '18px',
              fontWeight: '500',
              color: '#64748B',
              marginBottom: '24px',
            }}>
              Welcome, Guardian {username}
            </p>

            <div style={{
              display: 'inline-block',
              padding: '8px 16px',
              borderRadius: '16px',
              background: '#7DD3C0',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: '600',
            }}>
              ⚠️ Moderators Only
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '24px',
              background: '#F8FAFC',
              borderRadius: '16px',
              border: '2px dashed #E2E8F0',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '16px',
              }}>
                🤖
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#64748B',
                marginBottom: '8px',
              }}>
                Automated AI Moderation
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#94A3B8',
                lineHeight: '1.5',
                margin: 0,
              }}>
                Content Analysis, Sentiment Detection, and Spam Detection are running automatically in the background. View results on the Super Admin Dashboard.
              </p>
            </div>

            <button
              onClick={() => setActiveTool('challenge-generator')}
              style={{
                textAlign: 'left',
                padding: '32px',
                background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                color: 'white',
                boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)',
              }}
            >
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                marginBottom: '20px',
              }}>
                🎯
              </div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                marginBottom: '12px',
              }}>
                Challenge Generator
              </h3>
              <p style={{
                fontSize: '16px',
                lineHeight: '1.5',
                margin: 0,
                opacity: 0.9,
              }}>
                Generate custom treasure hunt challenges and adventures for businesses using AI
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }



  // Challenge Generator Tool
  if (activeTool === 'challenge-generator') {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100%',
        background: '#FEFEFE',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{ maxWidth: '700px', width: '100%' }}>
          <button
            onClick={() => setActiveTool(null)}
            style={{
              padding: '12px 24px',
              background: '#FFFFFF',
              color: '#1E293B',
              fontWeight: '600',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              cursor: 'pointer',
              marginBottom: '24px',
            }}
          >
            ← Back to Tools
          </button>

          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: '40px 32px',
            marginBottom: '32px',
            border: '1px solid #E2E8F0',
            textAlign: 'center',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              margin: '0 auto 24px',
              boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)',
            }}>
              🎯
            </div>

            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#1E293B',
              marginBottom: '12px',
            }}>
              Challenge Generator
            </h1>

            <p style={{
              fontSize: '18px',
              fontWeight: '500',
              color: '#64748B',
              marginBottom: '24px',
            }}>
              Generate custom treasure hunt challenges and adventures for businesses
            </p>
          </div>

          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '32px',
            border: '1px solid #E2E8F0',
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1E293B',
              marginBottom: '20px',
            }}>
              Business Information
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1E293B',
                  marginBottom: '6px',
                }}>
                  Business Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Grand Rapids Coffee Co."
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '14px',
                    background: '#FEFEFE',
                    color: '#1E293B',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1E293B',
                  marginBottom: '6px',
                }}>
                  Business Type
                </label>
                <select
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '14px',
                    background: '#FEFEFE',
                    color: '#1E293B',
                    outline: 'none',
                  }}
                >
                  <option value="">Select type...</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="cafe">Cafe/Coffee Shop</option>
                  <option value="retail">Retail Store</option>
                  <option value="attraction">Tourist Attraction</option>
                  <option value="hotel">Hotel/Lodging</option>
                  <option value="brewery">Brewery/Bar</option>
                  <option value="museum">Museum/Gallery</option>
                  <option value="outdoor">Outdoor Activity</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1E293B',
                marginBottom: '6px',
              }}>
                Location
              </label>
              <input
                type="text"
                placeholder="e.g., 123 Main St, Grand Rapids, MI"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  fontSize: '14px',
                  background: '#FEFEFE',
                  color: '#1E293B',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1E293B',
                marginBottom: '6px',
              }}>
                Challenge Goals
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                {['Increase Foot Traffic', 'Promote Menu Items', 'Local History Education', 'Social Media Engagement', 'Customer Loyalty', 'Brand Awareness'].map((goal) => (
                  <button
                    key={goal}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: '1px solid #E2E8F0',
                      background: '#F8FAFC',
                      color: '#64748B',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}
                    onClick={(e) => {
                      const button = e.currentTarget;
                      if (button.style.background === 'rgb(125, 211, 192)') {
                        button.style.background = '#F8FAFC';
                        button.style.color = '#64748B';
                      } else {
                        button.style.background = '#7DD3C0';
                        button.style.color = 'white';
                      }
                    }}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1E293B',
                marginBottom: '6px',
              }}>
                Special Requirements & Business Details
              </label>
              <textarea
                value={analysisText}
                onChange={(e) => setAnalysisText(e.target.value)}
                placeholder="Describe unique aspects of the business, target audience, special features, historical significance, menu highlights, or any specific requirements for the treasure hunt challenge..."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  fontSize: '14px',
                  resize: 'vertical',
                  background: '#FEFEFE',
                  color: '#1E293B',
                  outline: 'none',
                  lineHeight: '1.6',
                }}
              />
            </div>

            <button
              onClick={async () => {
                if (!analysisText.trim()) {
                  alert('Please describe the challenge requirements');
                  return;
                }

                setLoading(true);
                try {
                  const response = await fetch('/api/ai-mod/analyze', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      text: analysisText,
                      tool: 'challenge-generator',
                    }),
                  });

                  if (!response.ok) {
                    throw new Error('Challenge generation failed');
                  }

                  const data = await response.json();
                  setResult(data);
                } catch (err) {
                  console.error('Challenge generation failed:', err);
                  setResult({
                    tool: 'Challenge Generator',
                    error: 'Failed to generate challenge. Please try again.',
                  });
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || !analysisText.trim()}
              style={{
                width: '100%',
                padding: '16px 24px',
                background: loading || !analysisText.trim() ? '#94A3B8' : 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
                color: 'white',
                fontWeight: '600',
                borderRadius: '12px',
                border: 'none',
                cursor: loading || !analysisText.trim() ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                opacity: loading || !analysisText.trim() ? 0.6 : 1,
                boxShadow: loading || !analysisText.trim() ? 'none' : '0 4px 20px rgba(245, 158, 11, 0.3)',
              }}
            >
              {loading ? '🔄 Generating Challenge...' : '🎯 Generate Challenge'}
            </button>

            {result && (
              <div style={{
                marginTop: '24px',
                padding: '24px',
                borderRadius: '12px',
                background: result.error ? '#FEF2F2' : 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)',
                border: '1px solid ' + (result.error ? '#FCA5A5' : '#86EFAC'),
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: result.error ? '#DC2626' : '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                  }}>
                    {result.error ? '❌' : '🎯'}
                  </div>
                  <h4 style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: result.error ? '#DC2626' : '#059669',
                    margin: 0,
                  }}>
                    {result.error ? 'Generation Failed' : 'Challenge Generated Successfully!'}
                  </h4>
                </div>

                {result.error ? (
                  <p style={{
                    fontSize: '14px',
                    color: '#DC2626',
                    lineHeight: '1.6',
                    margin: 0,
                  }}>
                    {result.error}
                  </p>
                ) : (
                  <div style={{ space: '16px' }}>
                    <div style={{
                      background: '#FFFFFF',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '16px',
                      border: '1px solid #D1FAE5',
                    }}>
                      <h5 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1E293B',
                        marginBottom: '8px',
                      }}>
                        📋 Challenge Overview
                      </h5>
                      <div style={{
                        fontSize: '14px',
                        color: '#1E293B',
                        lineHeight: '1.6',
                      }}>
                        {result.challenge_title && <p><strong>Title:</strong> {result.challenge_title}</p>}
                        {result.description && <p><strong>Description:</strong> {result.description}</p>}
                        {result.difficulty && <p><strong>Difficulty:</strong> {result.difficulty}</p>}
                        {result.estimated_time && <p><strong>Estimated Time:</strong> {result.estimated_time}</p>}
                      </div>
                    </div>

                    {result.tasks && (
                      <div style={{
                        background: '#FFFFFF',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '16px',
                        border: '1px solid #D1FAE5',
                      }}>
                        <h5 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1E293B',
                          marginBottom: '8px',
                        }}>
                          ✅ Challenge Tasks
                        </h5>
                        <div style={{
                          fontSize: '14px',
                          color: '#1E293B',
                          lineHeight: '1.6',
                        }}>
                          {Array.isArray(result.tasks) ? (
                            <ol style={{ paddingLeft: '20px', margin: 0 }}>
                              {result.tasks.map((task: string, index: number) => (
                                <li key={index} style={{ marginBottom: '8px' }}>{task}</li>
                              ))}
                            </ol>
                          ) : (
                            <p>{result.tasks}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {result.business_integration && (
                      <div style={{
                        background: '#FFFFFF',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '16px',
                        border: '1px solid #D1FAE5',
                      }}>
                        <h5 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1E293B',
                          marginBottom: '8px',
                        }}>
                          🏢 Business Integration Tips
                        </h5>
                        <div style={{
                          fontSize: '14px',
                          color: '#1E293B',
                          lineHeight: '1.6',
                        }}>
                          {result.business_integration}
                        </div>
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      marginTop: '20px',
                    }}>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                          alert('Challenge copied to clipboard!');
                        }}
                        style={{
                          padding: '12px 20px',
                          background: '#7DD3C0',
                          color: 'white',
                          fontWeight: '600',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        📋 Copy Challenge
                      </button>
                      <button
                        onClick={() => {
                          setResult(null);
                          setAnalysisText('');
                        }}
                        style={{
                          padding: '12px 20px',
                          background: '#F59E0B',
                          color: 'white',
                          fontWeight: '600',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        🎯 Generate New
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
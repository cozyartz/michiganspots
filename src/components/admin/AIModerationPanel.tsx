import { useState, useEffect } from 'react';
import { Shield, MessageSquare, TrendingUp, AlertTriangle, CheckCircle, XCircle, Clock, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ModerationData {
  stats: {
    totalAnalyzed: number;
    toxicContent: number;
    spamDetected: number;
    sentimentPositive: number;
    sentimentNegative: number;
    sentimentNeutral: number;
    actionsToday: number;
    accuracyRate: number;
  };
  recentAnalysis: Array<{
    id: string;
    content: string;
    type: 'content' | 'sentiment' | 'spam';
    result: any;
    timestamp: string;
    action: 'approved' | 'flagged' | 'removed' | 'pending';
  }>;
  trends: {
    toxicityTrend: number;
    spamTrend: number;
    sentimentTrend: number;
  };
}

export function AIModerationPanel() {
  const [data, setData] = useState<ModerationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'flagged' | 'approved'>('all');

  useEffect(() => {
    loadModerationData();
    // Refresh every 30 seconds
    const interval = setInterval(loadModerationData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadModerationData() {
    try {
      const response = await fetch('/api/dashboard/ai-moderation');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to load AI moderation data:', error);
      // Mock data for development
      setData({
        stats: {
          totalAnalyzed: 1247,
          toxicContent: 23,
          spamDetected: 45,
          sentimentPositive: 892,
          sentimentNegative: 156,
          sentimentNeutral: 199,
          actionsToday: 12,
          accuracyRate: 94.2,
        },
        recentAnalysis: [
          {
            id: '1',
            content: 'This place is amazing! Great coffee and friendly staff.',
            type: 'sentiment',
            result: { sentiment: 'positive', confidence: 0.95 },
            timestamp: new Date().toISOString(),
            action: 'approved',
          },
          {
            id: '2',
            content: 'Spam content with suspicious links...',
            type: 'spam',
            result: { isSpam: true, confidence: 0.89 },
            timestamp: new Date(Date.now() - 300000).toISOString(),
            action: 'removed',
          },
          {
            id: '3',
            content: 'Regular discussion about Michigan attractions',
            type: 'content',
            result: { toxicity: 0.02, profanity: false },
            timestamp: new Date(Date.now() - 600000).toISOString(),
            action: 'approved',
          },
        ],
        trends: {
          toxicityTrend: -12.5,
          spamTrend: -8.3,
          sentimentTrend: 15.2,
        },
      });
    } finally {
      setLoading(false);
    }
  }

  const filteredAnalysis = data?.recentAnalysis.filter(item => {
    if (activeFilter === 'all') return true;
    return item.action === activeFilter;
  }) || [];

  if (loading) {
    return (
      <div className="parchment-card">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-primary mx-auto mb-4"></div>
          <p className="text-ink-secondary">Loading AI moderation data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="parchment-card">
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-coral-primary mx-auto mb-4" />
          <h3 className="font-heading text-xl font-bold text-ink-primary mb-2">Failed to Load</h3>
          <button
            onClick={loadModerationData}
            className="px-4 py-2 bg-cyan-primary text-white font-heading font-bold treasure-border hover:bg-cyan-dark transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Moderation Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="parchment-card"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-primary to-cyan-dark rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-heading text-2xl font-bold text-ink-primary">AI Moderation Dashboard</h2>
            <p className="text-ink-secondary">Automated content analysis and community protection</p>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-cyan-light/20 to-cyan-primary/10 rounded-lg p-4 border border-cyan-primary/30">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-5 h-5 text-cyan-primary" />
              <span className="text-xs font-bold text-cyan-primary">TODAY</span>
            </div>
            <div className="text-2xl font-bold text-ink-primary">{data.stats.totalAnalyzed.toLocaleString()}</div>
            <div className="text-sm text-ink-secondary">Content Analyzed</div>
          </div>

          <div className="bg-gradient-to-br from-coral-light/20 to-coral-primary/10 rounded-lg p-4 border border-coral-primary/30">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-5 h-5 text-coral-primary" />
              <span className={`text-xs font-bold ${data.trends.toxicityTrend < 0 ? 'text-forest-green' : 'text-coral-primary'}`}>
                {data.trends.toxicityTrend > 0 ? '+' : ''}{data.trends.toxicityTrend.toFixed(1)}%
              </span>
            </div>
            <div className="text-2xl font-bold text-ink-primary">{data.stats.toxicContent}</div>
            <div className="text-sm text-ink-secondary">Toxic Content</div>
          </div>

          <div className="bg-gradient-to-br from-amber-light/20 to-amber-primary/10 rounded-lg p-4 border border-amber-primary/30">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-5 h-5 text-amber-primary" />
              <span className={`text-xs font-bold ${data.trends.spamTrend < 0 ? 'text-forest-green' : 'text-coral-primary'}`}>
                {data.trends.spamTrend > 0 ? '+' : ''}{data.trends.spamTrend.toFixed(1)}%
              </span>
            </div>
            <div className="text-2xl font-bold text-ink-primary">{data.stats.spamDetected}</div>
            <div className="text-sm text-ink-secondary">Spam Detected</div>
          </div>

          <div className="bg-gradient-to-br from-forest-green/20 to-forest-green/10 rounded-lg p-4 border border-forest-green/30">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-5 h-5 text-forest-green" />
              <span className="text-xs font-bold text-forest-green">{data.stats.accuracyRate}%</span>
            </div>
            <div className="text-2xl font-bold text-ink-primary">{data.stats.actionsToday}</div>
            <div className="text-sm text-ink-secondary">Actions Taken</div>
          </div>
        </div>
      </motion.div>

      {/* Sentiment Analysis Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="parchment-card"
      >
        <h3 className="font-heading text-xl font-bold text-ink-primary mb-4">Community Sentiment</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-forest-green mb-1">{data.stats.sentimentPositive}</div>
            <div className="text-sm text-ink-secondary">Positive</div>
            <div className="w-full bg-parchment-light rounded-full h-2 mt-2">
              <div 
                className="bg-forest-green h-2 rounded-full" 
                style={{ width: `${(data.stats.sentimentPositive / data.stats.totalAnalyzed) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-ink-secondary mb-1">{data.stats.sentimentNeutral}</div>
            <div className="text-sm text-ink-secondary">Neutral</div>
            <div className="w-full bg-parchment-light rounded-full h-2 mt-2">
              <div 
                className="bg-ink-secondary h-2 rounded-full" 
                style={{ width: `${(data.stats.sentimentNeutral / data.stats.totalAnalyzed) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-coral-primary mb-1">{data.stats.sentimentNegative}</div>
            <div className="text-sm text-ink-secondary">Negative</div>
            <div className="w-full bg-parchment-light rounded-full h-2 mt-2">
              <div 
                className="bg-coral-primary h-2 rounded-full" 
                style={{ width: `${(data.stats.sentimentNegative / data.stats.totalAnalyzed) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="parchment-card"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-heading text-xl font-bold text-ink-primary">Recent AI Analysis</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 text-sm font-bold rounded ${
                activeFilter === 'all'
                  ? 'bg-cyan-primary text-white'
                  : 'bg-parchment-light text-ink-secondary hover:text-ink-primary'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('flagged')}
              className={`px-3 py-1 text-sm font-bold rounded ${
                activeFilter === 'flagged'
                  ? 'bg-coral-primary text-white'
                  : 'bg-parchment-light text-ink-secondary hover:text-ink-primary'
              }`}
            >
              Flagged
            </button>
            <button
              onClick={() => setActiveFilter('approved')}
              className={`px-3 py-1 text-sm font-bold rounded ${
                activeFilter === 'approved'
                  ? 'bg-forest-green text-white'
                  : 'bg-parchment-light text-ink-secondary hover:text-ink-primary'
              }`}
            >
              Approved
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredAnalysis.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-parchment-light rounded-lg p-4 border border-ink-primary/10"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-bold rounded ${
                    item.type === 'content' ? 'bg-cyan-primary/20 text-cyan-primary' :
                    item.type === 'sentiment' ? 'bg-coral-primary/20 text-coral-primary' :
                    'bg-amber-primary/20 text-amber-primary'
                  }`}>
                    {item.type.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 text-xs font-bold rounded ${
                    item.action === 'approved' ? 'bg-forest-green/20 text-forest-green' :
                    item.action === 'flagged' || item.action === 'removed' ? 'bg-coral-primary/20 text-coral-primary' :
                    'bg-amber-primary/20 text-amber-primary'
                  }`}>
                    {item.action === 'approved' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                    {(item.action === 'flagged' || item.action === 'removed') && <XCircle className="w-3 h-3 inline mr-1" />}
                    {item.action === 'pending' && <Clock className="w-3 h-3 inline mr-1" />}
                    {item.action.toUpperCase()}
                  </span>
                </div>
                <span className="text-xs text-ink-secondary">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-ink-primary mb-2 line-clamp-2">{item.content}</p>
              <div className="text-xs text-ink-secondary bg-white rounded p-2">
                <strong>AI Result:</strong> {JSON.stringify(item.result, null, 2)}
              </div>
            </motion.div>
          ))}
          {filteredAnalysis.length === 0 && (
            <div className="text-center py-8 text-ink-secondary">
              No analysis results found for the selected filter.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
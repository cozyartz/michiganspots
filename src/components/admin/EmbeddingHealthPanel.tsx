import { useState, useEffect } from 'react';
import { Database, AlertTriangle, CheckCircle, RefreshCw, TrendingUp, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmbeddingHealthData {
  stats: {
    total_businesses: number;
    with_embeddings: number;
    missing_embeddings: number;
    coverage_percentage: number;
    last_sync: string | null;
  };
  missing_businesses: Array<{
    id: number;
    business_name: string;
    business_category: string;
    city: string;
    created_at: string;
  }>;
  health_status: 'healthy' | 'warning' | 'critical';
  recommendations: string[];
}

export function EmbeddingHealthPanel() {
  const [data, setData] = useState<EmbeddingHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    loadHealthData();
    // Refresh every 60 seconds
    const interval = setInterval(loadHealthData, 60000);
    return () => clearInterval(interval);
  }, []);

  async function loadHealthData() {
    try {
      const response = await fetch('/api/admin/embedding-health');
      const result = await response.json();

      if (result.success) {
        setData(result);
      }
    } catch (error) {
      console.error('Failed to load embedding health data:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function regenerateMissingEmbeddings() {
    if (!data || data.stats.missing_embeddings === 0) return;

    if (!confirm(`This will regenerate ${data.stats.missing_embeddings} missing embeddings. Continue?`)) {
      return;
    }

    setRegenerating(true);
    try {
      const response = await fetch('/api/admin/embedding-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'regenerate',
          batchSize: Math.min(data.stats.missing_embeddings, 50),
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`Successfully regenerated ${result.results.processed} embeddings!`);
        loadHealthData(); // Refresh data
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to regenerate embeddings:', error);
      alert('Failed to regenerate embeddings. Check console for details.');
    } finally {
      setRegenerating(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-forest-green';
      case 'warning':
        return 'text-amber-primary';
      case 'critical':
        return 'text-coral-primary';
      default:
        return 'text-ink-secondary';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-forest-green/20 border-forest-green/30';
      case 'warning':
        return 'bg-amber-primary/20 border-amber-primary/30';
      case 'critical':
        return 'bg-coral-primary/20 border-coral-primary/30';
      default:
        return 'bg-ink-secondary/20 border-ink-secondary/30';
    }
  };

  if (loading) {
    return (
      <div className="parchment-card">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-primary mx-auto mb-4"></div>
          <p className="text-ink-secondary">Loading embedding health data...</p>
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
            onClick={loadHealthData}
            className="px-4 py-2 bg-cyan-primary text-white font-heading font-bold treasure-border hover:bg-cyan-dark transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const coveragePercentage = data.stats.coverage_percentage;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="parchment-card"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-primary to-cyan-dark rounded-full flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-ink-primary">Embedding Health Monitor</h2>
              <p className="text-ink-secondary">Vectorize semantic search status</p>
            </div>
          </div>
          <button
            onClick={loadHealthData}
            disabled={loading}
            className="p-2 hover:bg-parchment-light rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 text-cyan-primary ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Health Status Banner */}
        <div className={`rounded-lg p-4 border ${getStatusBgColor(data.health_status)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {data.health_status === 'healthy' && <CheckCircle className="w-6 h-6 text-forest-green" />}
              {data.health_status !== 'healthy' && <AlertTriangle className="w-6 h-6 text-coral-primary" />}
              <div>
                <div className={`font-heading text-lg font-bold ${getStatusColor(data.health_status)}`}>
                  {data.health_status.toUpperCase()}
                </div>
                <div className="text-sm text-ink-secondary">
                  {coveragePercentage.toFixed(1)}% embedding coverage
                </div>
              </div>
            </div>
            {data.stats.last_sync && (
              <div className="text-right">
                <div className="flex items-center gap-1 text-ink-secondary text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Last sync:</span>
                </div>
                <div className="text-ink-primary font-medium">
                  {new Date(data.stats.last_sync).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="bg-gradient-to-br from-cyan-light/20 to-cyan-primary/10 rounded-lg p-4 border border-cyan-primary/30">
            <div className="flex items-center justify-between mb-2">
              <Database className="w-5 h-5 text-cyan-primary" />
              <span className="text-xs font-bold text-cyan-primary">TOTAL</span>
            </div>
            <div className="text-2xl font-bold text-ink-primary">{data.stats.total_businesses.toLocaleString()}</div>
            <div className="text-sm text-ink-secondary">Businesses</div>
          </div>

          <div className="bg-gradient-to-br from-forest-green/20 to-forest-green/10 rounded-lg p-4 border border-forest-green/30">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-forest-green" />
              <span className="text-xs font-bold text-forest-green">{coveragePercentage.toFixed(0)}%</span>
            </div>
            <div className="text-2xl font-bold text-ink-primary">{data.stats.with_embeddings.toLocaleString()}</div>
            <div className="text-sm text-ink-secondary">With Embeddings</div>
          </div>

          <div className="bg-gradient-to-br from-coral-light/20 to-coral-primary/10 rounded-lg p-4 border border-coral-primary/30">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-5 h-5 text-coral-primary" />
              <span className="text-xs font-bold text-coral-primary">MISSING</span>
            </div>
            <div className="text-2xl font-bold text-ink-primary">{data.stats.missing_embeddings.toLocaleString()}</div>
            <div className="text-sm text-ink-secondary">Need Regeneration</div>
          </div>
        </div>

        {/* Coverage Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-ink-secondary">Coverage Progress</span>
            <span className="font-bold text-ink-primary">{coveragePercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-parchment-light rounded-full h-4 border border-ink-primary/10">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${coveragePercentage >= 95 ? 'bg-forest-green' :
                  coveragePercentage >= 80 ? 'bg-amber-primary' : 'bg-coral-primary'
                }`}
              style={{ width: `${coveragePercentage}%` }}
            ></div>
          </div>
        </div>
      </motion.div>

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="parchment-card"
        >
          <h3 className="font-heading text-xl font-bold text-ink-primary mb-4">Recommendations</h3>
          <ul className="space-y-2">
            {data.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-ink-secondary">
                <span className="text-cyan-primary mt-1">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>

          {data.stats.missing_embeddings > 0 && (
            <button
              onClick={regenerateMissingEmbeddings}
              disabled={regenerating}
              className="mt-4 px-6 py-3 bg-cyan-primary text-white font-heading font-bold treasure-border hover:bg-cyan-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <RefreshCw className={`w-5 h-5 ${regenerating ? 'animate-spin' : ''}`} />
              {regenerating ? 'Regenerating...' : `Regenerate ${Math.min(data.stats.missing_embeddings, 50)} Embeddings`}
            </button>
          )}
        </motion.div>
      )}

      {/* Missing Businesses List */}
      {data.missing_businesses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="parchment-card"
        >
          <h3 className="font-heading text-xl font-bold text-ink-primary mb-4">
            Businesses Missing Embeddings
          </h3>
          <div className="space-y-2">
            {data.missing_businesses.map((business) => (
              <div
                key={business.id}
                className="bg-parchment-light rounded-lg p-3 border border-ink-primary/10 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-ink-primary">{business.business_name}</div>
                  <div className="text-sm text-ink-secondary">
                    {business.business_category} • {business.city}
                  </div>
                </div>
                <div className="text-xs text-ink-secondary">
                  ID: {business.id}
                </div>
              </div>
            ))}
            {data.stats.missing_embeddings > data.missing_businesses.length && (
              <div className="text-center text-ink-secondary text-sm py-2">
                ... and {data.stats.missing_embeddings - data.missing_businesses.length} more
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

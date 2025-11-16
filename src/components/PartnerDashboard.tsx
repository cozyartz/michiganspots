/**
 * Copyright (c) 2025 Cozyartz Media Group d/b/a State Spots
 * Licensed under AGPL-3.0-or-later OR Commercial
 * See LICENSE and LICENSE-COMMERCIAL.md for details
 */

import { useState, useEffect } from 'react';
import { TrendingUp, Users, MessageSquare, ThumbsUp, Share2, Award, MapPin, DollarSign, Calendar, Download, QrCode, ExternalLink, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

interface PartnerData {
  partner: {
    id: number;
    organization_name: string;
    partnership_type: string;
    partnership_tier: string;
    email: string;
    starts_at: string;
    ends_at: string;
    challenges_remaining: number;
    challenges_used: number;
    worker_partner_id?: string;
    worker_page_url?: string;
    worker_qr_code_url?: string;
    worker_qr_download_url?: string;
    worker_analytics_url?: string;
    worker_status?: string;
  };
  totalMetrics: {
    total_views: number;
    total_completions: number;
    total_comments: number;
    total_upvotes: number;
    total_shares: number;
    total_unique_participants: number;
  };
  dailyAnalytics: Array<{
    date: string;
    challenge_views: number;
    challenge_completions: number;
    challenge_comments: number;
    challenge_upvotes: number;
    challenge_shares: number;
    unique_participants: number;
  }>;
  challenges: Array<{
    id: number;
    title: string;
    status: string;
    created_at: string;
    start_date: string;
    end_date: string;
  }>;
  recentCompletions: Array<{
    user_reddit_username: string;
    completed_at: string;
    challenge_title: string;
    submission_url: string;
  }>;
}

export function PartnerDashboard() {
  const [data, setData] = useState<PartnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      // Get partner ID from URL or magic link token
      const params = new URLSearchParams(window.location.search);
      const partnerId = params.get('partner') || params.get('token');

      if (!partnerId) {
        setError('No partner ID found. Please use the link from your email.');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/analytics/partner?id=${partnerId}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to load dashboard');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-primary mx-auto mb-4"></div>
          <p className="text-ink-secondary">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment-light px-4">
        <div className="parchment-card max-w-md w-full text-center">
          <h1 className="font-heading text-2xl font-bold text-ink-primary mb-4">Access Error</h1>
          <p className="text-ink-secondary mb-6">{error}</p>
          <a href="/partnerships" className="inline-block px-6 py-3 bg-cyan-primary text-white font-heading font-bold treasure-border hover:bg-cyan-dark transition-colors">
            Back to Partnerships
          </a>
        </div>
      </div>
    );
  }

  const engagementRate = data.totalMetrics.total_views > 0
    ? ((data.totalMetrics.total_completions / data.totalMetrics.total_views) * 100).toFixed(1)
    : '0.0';

  const costPerVisit = data.partner.challenges_used > 0 && data.totalMetrics.total_completions > 0
    ? (1000 / data.totalMetrics.total_completions).toFixed(2) // Assuming avg $10/challenge
    : '0.00';

  return (
    <div className="min-h-screen bg-parchment-light py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-4xl md:text-5xl font-bold text-ink-primary mb-2">
            {data.partner.organization_name}
          </h1>
          <p className="text-ink-secondary text-lg">
            {data.partner.partnership_type.charAt(0).toUpperCase() + data.partner.partnership_type.slice(1)} Partner
            {' • '}
            {data.partner.partnership_tier.charAt(0).toUpperCase() + data.partner.partnership_tier.slice(1)} Tier
          </p>
        </motion.div>

        {/* Key Metrics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon={<MapPin className="w-8 h-8" />}
            value={data.totalMetrics.total_completions.toLocaleString()}
            label="Foot Traffic Visits"
            sublabel="GPS-verified completions"
            color="cyan"
            delay={0.1}
          />
          <MetricCard
            icon={<TrendingUp className="w-8 h-8" />}
            value={data.totalMetrics.total_views.toLocaleString()}
            label="Challenge Views"
            sublabel="Reddit impressions"
            color="amber"
            delay={0.2}
          />
          <MetricCard
            icon={<Users className="w-8 h-8" />}
            value={data.totalMetrics.total_unique_participants.toLocaleString()}
            label="Unique Explorers"
            sublabel="Individual participants"
            color="coral"
            delay={0.3}
          />
          <MetricCard
            icon={<MessageSquare className="w-8 h-8" />}
            value={data.totalMetrics.total_comments.toLocaleString()}
            label="Community Buzz"
            sublabel="Comments & discussions"
            color="cyan"
            delay={0.4}
          />
        </div>

        {/* AI-Generated Partner Page & QR Code */}
        {data.partner.worker_status === 'active' && data.partner.worker_page_url && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="parchment-card mb-8"
          >
            <h2 className="font-heading text-2xl font-bold text-ink-primary mb-6">Your Digital Presence</h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Partner Page Info */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-cyan-primary" />
                  <h3 className="font-heading text-lg font-bold text-ink-primary">AI-Powered Partner Page</h3>
                </div>
                <p className="text-ink-secondary mb-4 text-sm">
                  Your custom partner page has been automatically generated with AI, featuring your business information, location details, and Michigan Spots branding.
                </p>
                <a
                  href={data.partner.worker_page_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-primary text-white font-heading font-bold treasure-border hover:bg-cyan-dark transition-colors text-sm mb-3"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Partner Page
                </a>
                {data.partner.worker_analytics_url && (
                  <a
                    href={data.partner.worker_analytics_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-primary text-white font-heading font-bold treasure-border hover:bg-amber-dark transition-colors text-sm ml-2"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Page Analytics
                  </a>
                )}
              </div>

              {/* QR Code Display */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <QrCode className="w-5 h-5 text-cyan-primary" />
                  <h3 className="font-heading text-lg font-bold text-ink-primary">Branded QR Code</h3>
                </div>
                <div className="bg-white p-4 treasure-border mb-4 inline-block">
                  {data.partner.worker_qr_code_url && (
                    <img
                      src={data.partner.worker_qr_code_url}
                      alt="Partner QR Code"
                      className="w-48 h-48"
                    />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {data.partner.worker_qr_download_url && (
                    <a
                      href={data.partner.worker_qr_download_url}
                      download
                      className="inline-flex items-center gap-2 px-4 py-2 bg-coral-primary text-white font-heading font-bold treasure-border hover:bg-coral-dark transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download QR Code
                    </a>
                  )}
                  <p className="text-xs text-ink-secondary">
                    Print this QR code to display at your location. Customers can scan it to view your partner page and complete challenges!
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Engagement & ROI */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="parchment-card"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-bold text-ink-primary">Engagement Rate</h3>
              <ThumbsUp className="w-6 h-6 text-cyan-primary" />
            </div>
            <div className="text-4xl font-bold text-cyan-primary mb-2">{engagementRate}%</div>
            <p className="text-sm text-ink-secondary">Completions / Views</p>
            <div className="mt-4 pt-4 border-t border-ink-primary/10">
              <div className="flex justify-between text-sm">
                <span className="text-ink-secondary">Upvotes:</span>
                <span className="font-semibold text-ink-primary">{data.totalMetrics.total_upvotes}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-ink-secondary">Shares:</span>
                <span className="font-semibold text-ink-primary">{data.totalMetrics.total_shares}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="parchment-card"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-bold text-ink-primary">Cost Per Visit</h3>
              <DollarSign className="w-6 h-6 text-amber-primary" />
            </div>
            <div className="text-4xl font-bold text-amber-primary mb-2">${costPerVisit}</div>
            <p className="text-sm text-ink-secondary">Per foot traffic visit</p>
            <div className="mt-4 pt-4 border-t border-ink-primary/10">
              <div className="flex justify-between text-sm">
                <span className="text-ink-secondary">Challenges Used:</span>
                <span className="font-semibold text-ink-primary">{data.partner.challenges_used}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-ink-secondary">Remaining:</span>
                <span className="font-semibold text-ink-primary">{data.partner.challenges_remaining || 'Unlimited'}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="parchment-card"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-bold text-ink-primary">Partnership Status</h3>
              <Calendar className="w-6 h-6 text-coral-primary" />
            </div>
            <div className="text-sm mb-3">
              <div className="flex justify-between mb-2">
                <span className="text-ink-secondary">Active Since:</span>
                <span className="font-semibold text-ink-primary">
                  {new Date(data.partner.starts_at).toLocaleDateString()}
                </span>
              </div>
              {data.partner.ends_at && (
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Renews:</span>
                  <span className="font-semibold text-ink-primary">
                    {new Date(data.partner.ends_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-ink-primary/10">
              <button className="w-full px-4 py-2 bg-cyan-primary text-white font-heading font-bold treasure-border hover:bg-cyan-dark transition-colors text-sm">
                Request Report Email
              </button>
            </div>
          </motion.div>
        </div>

        {/* Active Challenges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="parchment-card mb-8"
        >
          <h2 className="font-heading text-2xl font-bold text-ink-primary mb-6">Your Challenges</h2>
          <div className="space-y-4">
            {data.challenges.length === 0 ? (
              <p className="text-ink-secondary text-center py-8">No challenges yet. Contact us to create your first challenge!</p>
            ) : (
              data.challenges.map((challenge, index) => (
                <div key={challenge.id} className="bg-parchment-light p-4 treasure-border">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-heading text-lg font-bold text-ink-primary">{challenge.title}</h3>
                    <span className={`px-3 py-1 text-xs font-bold rounded ${
                      challenge.status === 'active' ? 'bg-cyan-primary/20 text-cyan-primary' :
                      challenge.status === 'completed' ? 'bg-forest-green/20 text-forest-green' :
                      'bg-ink-faded/20 text-ink-faded'
                    }`}>
                      {challenge.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm text-ink-secondary">
                    <span>Start: {new Date(challenge.start_date).toLocaleDateString()}</span>
                    <span>End: {new Date(challenge.end_date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="parchment-card"
        >
          <h2 className="font-heading text-2xl font-bold text-ink-primary mb-6">Recent Completions</h2>
          <div className="space-y-3">
            {data.recentCompletions.length === 0 ? (
              <p className="text-ink-secondary text-center py-8">No completions yet. Your challenges will appear here when explorers complete them!</p>
            ) : (
              data.recentCompletions.map((completion, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-cyan-light/10 treasure-border">
                  <div>
                    <div className="font-semibold text-ink-primary">u/{completion.user_reddit_username}</div>
                    <div className="text-sm text-ink-secondary">{completion.challenge_title}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-ink-secondary">
                      {new Date(completion.completed_at).toLocaleDateString()}
                    </div>
                    {completion.submission_url && (
                      <a
                        href={completion.submission_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-cyan-primary hover:text-cyan-dark"
                      >
                        View →
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-ink-secondary">
          <p>Need help? Contact us at <a href="mailto:partners@michiganspots.com" className="text-cyan-primary hover:text-cyan-dark">partners@michiganspots.com</a></p>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  sublabel: string;
  color: 'cyan' | 'amber' | 'coral';
  delay: number;
}

function MetricCard({ icon, value, label, sublabel, color, delay }: MetricCardProps) {
  const colorClasses = {
    cyan: 'text-cyan-primary',
    amber: 'text-amber-primary',
    coral: 'text-coral-primary'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="parchment-card text-center"
    >
      <div className={`flex justify-center mb-3 ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className={`text-3xl font-bold mb-1 ${colorClasses[color]}`}>{value}</div>
      <div className="font-heading font-semibold text-ink-primary mb-1">{label}</div>
      <div className="text-xs text-ink-secondary">{sublabel}</div>
    </motion.div>
  );
}

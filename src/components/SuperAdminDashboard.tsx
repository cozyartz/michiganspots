import { useState, useEffect } from 'react';
import { Users, TrendingUp, DollarSign, CheckCircle, MapPin, MessageSquare, Award, AlertCircle, Download, Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardData {
  stats: {
    waitlist_count: number;
    partner_count: number;
    partners_signed: number;
    total_revenue: number;
    total_challenges: number;
    active_challenges: number;
    total_completions: number;
    total_views: number;
    total_unique_users: number;
  };
  signups: Array<{
    signup_type: string;
    email: string;
    organization_name: string | null;
    contact_name: string | null;
    partnership_type: string | null;
    partnership_tier: string | null;
    amount_paid: number | null;
    created_at: string;
    agreement_accepted: number | null;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
    details: any;
  }>;
  topPerformingPartners: Array<{
    organization_name: string;
    completions: number;
    views: number;
    engagement_rate: number;
  }>;
  platformMetrics: {
    avgEngagementRate: number;
    avgCostPerVisit: number;
    totalFootTraffic: number;
    growthRate: number;
  };
}

export function SuperAdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'waitlist' | 'partner'>('all');

  useEffect(() => {
    loadDashboard();
    // Refresh every minute
    const interval = setInterval(loadDashboard, 60000);
    return () => clearInterval(interval);
  }, []);

  async function loadDashboard() {
    try {
      const response = await fetch('/api/dashboard/superadmin');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredSignups = data?.signups.filter(signup => {
    const matchesSearch = searchTerm === '' ||
      signup.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      signup.organization_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      signup.contact_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterType === 'all' ||
      signup.signup_type === filterType;

    return matchesSearch && matchesFilter;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-primary mx-auto mb-4"></div>
          <p className="text-ink-secondary">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment-light">
        <div className="parchment-card max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-coral-primary mx-auto mb-4" />
          <h2 className="font-heading text-2xl font-bold text-ink-primary mb-4">Failed to Load</h2>
          <button
            onClick={loadDashboard}
            className="px-6 py-3 bg-cyan-primary text-white font-heading font-bold treasure-border hover:bg-cyan-dark transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment-light py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex justify-between items-center"
        >
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-ink-primary mb-2">
              Super Admin Dashboard
            </h1>
            <p className="text-ink-secondary text-lg">
              Michigan Spots Platform Analytics
            </p>
          </div>
          <button
            onClick={loadDashboard}
            className="px-4 py-2 bg-cyan-primary text-white font-heading font-bold treasure-border hover:bg-cyan-dark transition-colors text-sm"
          >
            Refresh Data
          </button>
        </motion.div>

        {/* Key Platform Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AdminMetricCard
            icon={<Users />}
            value={data.stats.waitlist_count.toLocaleString()}
            label="Waitlist Signups"
            sublabel="Early interest"
            color="cyan"
            delay={0.1}
          />
          <AdminMetricCard
            icon={<TrendingUp />}
            value={data.stats.partner_count.toLocaleString()}
            label="Total Partners"
            sublabel={`${data.stats.partners_signed} signed agreements`}
            color="amber"
            delay={0.2}
          />
          <AdminMetricCard
            icon={<DollarSign />}
            value={`$${(data.stats.total_revenue / 100).toLocaleString()}`}
            label="Total Revenue"
            sublabel="All-time"
            color="forest-green"
            delay={0.3}
          />
          <AdminMetricCard
            icon={<MapPin />}
            value={data.stats.total_completions.toLocaleString()}
            label="Foot Traffic"
            sublabel="Total business visits"
            color="coral"
            delay={0.4}
          />
        </div>

        {/* Platform Performance */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="parchment-card text-center"
          >
            <div className="text-2xl font-bold text-cyan-primary mb-1">
              {data.stats.active_challenges}
            </div>
            <div className="font-heading font-semibold text-ink-primary text-sm mb-1">
              Active Challenges
            </div>
            <div className="text-xs text-ink-secondary">
              {data.stats.total_challenges} total
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="parchment-card text-center"
          >
            <div className="text-2xl font-bold text-amber-primary mb-1">
              {data.stats.total_views.toLocaleString()}
            </div>
            <div className="font-heading font-semibold text-ink-primary text-sm mb-1">
              Total Views
            </div>
            <div className="text-xs text-ink-secondary">
              Reddit impressions
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="parchment-card text-center"
          >
            <div className="text-2xl font-bold text-coral-primary mb-1">
              {data.platformMetrics.avgEngagementRate.toFixed(1)}%
            </div>
            <div className="font-heading font-semibold text-ink-primary text-sm mb-1">
              Avg Engagement
            </div>
            <div className="text-xs text-ink-secondary">
              Completions / Views
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="parchment-card text-center"
          >
            <div className="text-2xl font-bold text-cyan-primary mb-1">
              {data.stats.total_unique_users.toLocaleString()}
            </div>
            <div className="font-heading font-semibold text-ink-primary text-sm mb-1">
              Unique Explorers
            </div>
            <div className="text-xs text-ink-secondary">
              Reddit users
            </div>
          </motion.div>
        </div>

        {/* Top Performing Partners */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="parchment-card mb-8"
        >
          <h2 className="font-heading text-2xl font-bold text-ink-primary mb-6">Top Performing Partners</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-cyan-primary/30">
                  <th className="text-left py-3 px-3 font-heading text-ink-primary">Partner</th>
                  <th className="text-right py-3 px-3 font-heading text-ink-primary">Visits</th>
                  <th className="text-right py-3 px-3 font-heading text-ink-primary">Views</th>
                  <th className="text-right py-3 px-3 font-heading text-ink-primary">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {data.topPerformingPartners.map((partner, index) => (
                  <tr key={index} className="border-b border-ink-primary/10 hover:bg-cyan-light/10">
                    <td className="py-3 px-3 font-semibold text-ink-primary">{partner.organization_name}</td>
                    <td className="py-3 px-3 text-right text-cyan-primary font-bold">{partner.completions.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right text-ink-secondary">{partner.views.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right text-amber-primary font-bold">{partner.engagement_rate.toFixed(1)}%</td>
                  </tr>
                ))}
                {data.topPerformingPartners.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-ink-secondary">
                      No partner data yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* All Signups Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="parchment-card"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-heading text-2xl font-bold text-ink-primary">All Signups</h2>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-ink-faded" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border-2 border-cyan-primary/30 rounded-lg bg-parchment-light text-ink-primary font-body focus:outline-none focus:border-cyan-primary"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-4 py-2 border-2 border-cyan-primary/30 rounded-lg bg-parchment-light text-ink-primary font-body focus:outline-none focus:border-cyan-primary"
              >
                <option value="all">All Types</option>
                <option value="waitlist">Waitlist Only</option>
                <option value="partner">Partners Only</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-cyan-primary/30">
                  <th className="text-left py-3 px-3 font-heading text-ink-primary">Type</th>
                  <th className="text-left py-3 px-3 font-heading text-ink-primary">Email</th>
                  <th className="text-left py-3 px-3 font-heading text-ink-primary">Organization</th>
                  <th className="text-left py-3 px-3 font-heading text-ink-primary">Tier</th>
                  <th className="text-right py-3 px-3 font-heading text-ink-primary">Amount</th>
                  <th className="text-left py-3 px-3 font-heading text-ink-primary">Date</th>
                  <th className="text-left py-3 px-3 font-heading text-ink-primary">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSignups.map((signup, index) => (
                  <tr key={index} className="border-b border-ink-primary/10 hover:bg-cyan-light/10">
                    <td className="py-3 px-3">
                      <span className={`px-2 py-1 text-xs font-bold rounded ${
                        signup.signup_type === 'waitlist'
                          ? 'bg-cyan-primary/20 text-cyan-primary'
                          : 'bg-amber-primary/20 text-amber-primary'
                      }`}>
                        {signup.signup_type === 'waitlist' ? 'WAITLIST' : 'PARTNER'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-ink-primary">{signup.email}</td>
                    <td className="py-3 px-3 text-ink-primary">{signup.organization_name || '-'}</td>
                    <td className="py-3 px-3 text-sm text-ink-secondary">
                      {signup.partnership_tier
                        ? `${signup.partnership_type} - ${signup.partnership_tier}`
                        : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-ink-primary">
                      {signup.amount_paid
                        ? `$${(signup.amount_paid / 100).toLocaleString()}`
                        : '-'}
                    </td>
                    <td className="py-3 px-3 text-sm text-ink-secondary">
                      {new Date(signup.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3">
                      {signup.agreement_accepted === 1 ? (
                        <span className="px-2 py-1 bg-forest-green/20 text-forest-green text-xs font-bold rounded">
                          SIGNED
                        </span>
                      ) : signup.signup_type === 'partner' ? (
                        <span className="px-2 py-1 bg-coral-primary/20 text-coral-primary text-xs font-bold rounded">
                          PENDING
                        </span>
                      ) : (
                        <span className="text-ink-faded text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredSignups.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-ink-secondary">
                      No signups found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-ink-secondary text-right">
            Showing {filteredSignups.length} of {data.signups.length} total signups
          </div>
        </motion.div>
      </div>
    </div>
  );
}

interface AdminMetricCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  sublabel: string;
  color: 'cyan' | 'amber' | 'forest-green' | 'coral';
  delay: number;
}

function AdminMetricCard({ icon, value, label, sublabel, color, delay }: AdminMetricCardProps) {
  const colorClasses = {
    'cyan': 'text-cyan-primary',
    'amber': 'text-amber-primary',
    'forest-green': 'text-forest-green',
    'coral': 'text-coral-primary'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="parchment-card text-center"
    >
      <div className={`flex justify-center mb-3 ${colorClasses[color]}`}>
        <div className="w-10 h-10">{icon}</div>
      </div>
      <div className={`text-3xl font-bold mb-1 ${colorClasses[color]}`}>{value}</div>
      <div className="font-heading font-semibold text-ink-primary mb-1">{label}</div>
      <div className="text-xs text-ink-secondary">{sublabel}</div>
    </motion.div>
  );
}

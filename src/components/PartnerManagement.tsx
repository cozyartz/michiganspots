/**
 * Copyright (c) 2025 Cozyartz Media Group d/b/a State Spots
 * Licensed under AGPL-3.0-or-later OR Commercial
 * See LICENSE and LICENSE-COMMERCIAL.md for details
 */

import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Globe, 
  QrCode, 
  BarChart3, 
  Settings, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ExternalLink,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Partner {
  partnerId: string;
  businessInfo: {
    businessName: string;
    description: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    email: string;
    website?: string;
    category: string;
    amenities: string[];
    specialOffers?: string;
  };
  subdomain: string;
  customHostname: string;
  hostnameStatus: {
    status: string;
    ssl_status: string;
  };
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastUpdated?: string;
}

interface PartnerStats {
  totalPartners: number;
  activePartners: number;
  activeHostnames: number;
  sslActiveHostnames: number;
}

interface PlatformStatus {
  platform: {
    name: string;
    environment: string;
    base_domain: string;
  };
  partners: {
    total: number;
    active: number;
  };
  hostnames: {
    total: number;
    active: number;
    pending: number;
    ssl_active: number;
  };
  health: {
    status: string;
    last_check: string;
  };
}

export function PartnerManagement() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [platformStatus, setPlatformStatus] = useState<PlatformStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [showOnboardingForm, setShowOnboardingForm] = useState(false);

  useEffect(() => {
    loadPartnerData();
    // Refresh every 2 minutes
    const interval = setInterval(loadPartnerData, 120000);
    return () => clearInterval(interval);
  }, []);

  async function loadPartnerData() {
    try {
      const [partnersResponse, statusResponse] = await Promise.all([
        fetch('/api/partners/list', {
          headers: { 'X-API-Key': 'admin-key' } // This would be properly secured
        }),
        fetch('/api/platform/status')
      ]);

      if (partnersResponse.ok) {
        const partnersData = await partnersResponse.json();
        setPartners(partnersData.partners || []);
      }

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setPlatformStatus(statusData.status);
      }
    } catch (error) {
      console.error('Failed to load partner data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = searchTerm === '' ||
      partner.businessInfo.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.businessInfo.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.customHostname.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'pending' && partner.hostnameStatus.status === 'pending') ||
      partner.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-primary mx-auto mb-4"></div>
          <p className="text-ink-secondary">Loading partner management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Platform Status Overview */}
      {platformStatus && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-4 gap-6"
        >
          <div className="parchment-card text-center">
            <div className="text-2xl font-bold text-cyan-primary mb-1">
              {platformStatus.partners.total}
            </div>
            <div className="font-heading font-semibold text-ink-primary text-sm mb-1">
              Total Partners
            </div>
            <div className="text-xs text-ink-secondary">
              {platformStatus.partners.active} active
            </div>
          </div>

          <div className="parchment-card text-center">
            <div className="text-2xl font-bold text-forest-green mb-1">
              {platformStatus.hostnames.active}
            </div>
            <div className="font-heading font-semibold text-ink-primary text-sm mb-1">
              Live Domains
            </div>
            <div className="text-xs text-ink-secondary">
              {platformStatus.hostnames.pending} pending
            </div>
          </div>

          <div className="parchment-card text-center">
            <div className="text-2xl font-bold text-amber-primary mb-1">
              {platformStatus.hostnames.ssl_active}
            </div>
            <div className="font-heading font-semibold text-ink-primary text-sm mb-1">
              SSL Active
            </div>
            <div className="text-xs text-ink-secondary">
              Secure connections
            </div>
          </div>

          <div className="parchment-card text-center">
            <div className={`text-2xl font-bold mb-1 ${
              platformStatus.health.status === 'operational' ? 'text-forest-green' : 'text-coral-primary'
            }`}>
              {platformStatus.health.status === 'operational' ? '✓' : '⚠'}
            </div>
            <div className="font-heading font-semibold text-ink-primary text-sm mb-1">
              Platform Health
            </div>
            <div className="text-xs text-ink-secondary">
              {platformStatus.health.status}
            </div>
          </div>
        </motion.div>
      )}

      {/* Partner Management Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex justify-between items-center"
      >
        <div>
          <h2 className="font-heading text-3xl font-bold text-ink-primary mb-2">
            Partner Management
          </h2>
          <p className="text-ink-secondary">
            Manage business partners and their custom domains
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadPartnerData}
            className="px-4 py-2 bg-cyan-primary text-white font-heading font-bold treasure-border hover:bg-cyan-dark transition-colors text-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowOnboardingForm(true)}
            className="px-4 py-2 bg-forest-green text-white font-heading font-bold treasure-border hover:bg-forest-green/80 transition-colors text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Partner
          </button>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="parchment-card"
      >
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-ink-faded" />
            <input
              type="text"
              placeholder="Search partners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-cyan-primary/30 rounded-lg bg-parchment-light text-ink-primary font-body focus:outline-none focus:border-cyan-primary"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border-2 border-cyan-primary/30 rounded-lg bg-parchment-light text-ink-primary font-body focus:outline-none focus:border-cyan-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending Setup</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Partners Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="parchment-card"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-cyan-primary/30">
                <th className="text-left py-3 px-3 font-heading text-ink-primary">Business</th>
                <th className="text-left py-3 px-3 font-heading text-ink-primary">Domain</th>
                <th className="text-left py-3 px-3 font-heading text-ink-primary">Status</th>
                <th className="text-left py-3 px-3 font-heading text-ink-primary">SSL</th>
                <th className="text-left py-3 px-3 font-heading text-ink-primary">Created</th>
                <th className="text-right py-3 px-3 font-heading text-ink-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPartners.map((partner, index) => (
                <PartnerRow key={partner.partnerId} partner={partner} />
              ))}
              {filteredPartners.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-ink-secondary">
                    {searchTerm || statusFilter !== 'all' ? 'No partners match your filters' : 'No partners yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-ink-secondary text-right">
          Showing {filteredPartners.length} of {partners.length} partners
        </div>
      </motion.div>

      {/* Onboarding Form Modal */}
      {showOnboardingForm && (
        <PartnerOnboardingModal
          onClose={() => setShowOnboardingForm(false)}
          onSuccess={() => {
            setShowOnboardingForm(false);
            loadPartnerData();
          }}
        />
      )}
    </div>
  );
}

interface PartnerRowProps {
  partner: Partner;
}

function PartnerRow({ partner }: PartnerRowProps) {
  const getStatusBadge = (status: string, sslStatus: string) => {
    if (status === 'active' && sslStatus === 'active') {
      return (
        <span className="px-2 py-1 bg-forest-green/20 text-forest-green text-xs font-bold rounded flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          LIVE
        </span>
      );
    } else if (status === 'pending') {
      return (
        <span className="px-2 py-1 bg-amber-primary/20 text-amber-primary text-xs font-bold rounded flex items-center gap-1">
          <Clock className="w-3 h-3" />
          PENDING
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 bg-coral-primary/20 text-coral-primary text-xs font-bold rounded flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          INACTIVE
        </span>
      );
    }
  };

  const getSSLBadge = (sslStatus: string) => {
    if (sslStatus === 'active') {
      return (
        <span className="px-2 py-1 bg-forest-green/20 text-forest-green text-xs font-bold rounded">
          SECURE
        </span>
      );
    } else if (sslStatus === 'pending') {
      return (
        <span className="px-2 py-1 bg-amber-primary/20 text-amber-primary text-xs font-bold rounded">
          PENDING
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 bg-coral-primary/20 text-coral-primary text-xs font-bold rounded">
          FAILED
        </span>
      );
    }
  };

  return (
    <tr className="border-b border-ink-primary/10 hover:bg-cyan-light/10">
      <td className="py-3 px-3">
        <div>
          <div className="font-semibold text-ink-primary">{partner.businessInfo.businessName}</div>
          <div className="text-sm text-ink-secondary">
            {partner.businessInfo.city}, {partner.businessInfo.state} • {partner.businessInfo.category}
          </div>
        </div>
      </td>
      <td className="py-3 px-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-primary" />
          <a
            href={`https://${partner.customHostname}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-primary hover:text-cyan-dark font-mono text-sm"
          >
            {partner.customHostname}
          </a>
          <ExternalLink className="w-3 h-3 text-ink-faded" />
        </div>
      </td>
      <td className="py-3 px-3">
        {getStatusBadge(partner.hostnameStatus.status, partner.hostnameStatus.ssl_status)}
      </td>
      <td className="py-3 px-3">
        {getSSLBadge(partner.hostnameStatus.ssl_status)}
      </td>
      <td className="py-3 px-3 text-sm text-ink-secondary">
        {new Date(partner.createdAt).toLocaleDateString()}
      </td>
      <td className="py-3 px-3">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => window.open(`https://${partner.customHostname}`, '_blank')}
            className="p-1 text-cyan-primary hover:text-cyan-dark transition-colors"
            title="View Site"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.open(`https://${partner.customHostname}/analytics`, '_blank')}
            className="p-1 text-amber-primary hover:text-amber-dark transition-colors"
            title="Analytics"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.open(`https://${partner.customHostname}/qr/download`, '_blank')}
            className="p-1 text-forest-green hover:text-forest-green/80 transition-colors"
            title="Download QR"
          >
            <QrCode className="w-4 h-4" />
          </button>
          <button
            className="p-1 text-ink-secondary hover:text-ink-primary transition-colors"
            title="Edit Partner"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

interface PartnerOnboardingModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function PartnerOnboardingModal({ onClose, onSuccess }: PartnerOnboardingModalProps) {
  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    address: '',
    city: '',
    state: 'MI',
    zipCode: '',
    phone: '',
    email: '',
    website: '',
    category: 'restaurant',
    amenities: [] as string[],
    specialOffers: '',
    hours: {
      monday: '9:00 AM - 5:00 PM',
      tuesday: '9:00 AM - 5:00 PM',
      wednesday: '9:00 AM - 5:00 PM',
      thursday: '9:00 AM - 5:00 PM',
      friday: '9:00 AM - 5:00 PM',
      saturday: '10:00 AM - 4:00 PM',
      sunday: 'Closed'
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/partners/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'admin-key'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Failed to onboard partner');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-parchment-light rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-heading text-2xl font-bold text-ink-primary">
              Onboard New Partner
            </h3>
            <button
              onClick={onClose}
              className="text-ink-secondary hover:text-ink-primary"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-coral-primary/20 text-coral-primary rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-ink-primary mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                  className="w-full px-3 py-2 border-2 border-cyan-primary/30 rounded-lg bg-parchment-light text-ink-primary font-body focus:outline-none focus:border-cyan-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-primary mb-1">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border-2 border-cyan-primary/30 rounded-lg bg-parchment-light text-ink-primary font-body focus:outline-none focus:border-cyan-primary"
                >
                  <option value="restaurant">Restaurant</option>
                  <option value="cafe">Cafe</option>
                  <option value="retail">Retail</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="services">Services</option>
                  <option value="tourism">Tourism</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="arts">Arts</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-primary mb-1">
                Description *
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border-2 border-cyan-primary/30 rounded-lg bg-parchment-light text-ink-primary font-body focus:outline-none focus:border-cyan-primary"
                placeholder="Brief description of the business..."
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-ink-primary mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border-2 border-cyan-primary/30 rounded-lg bg-parchment-light text-ink-primary font-body focus:outline-none focus:border-cyan-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-primary mb-1">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.zipCode}
                  onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                  className="w-full px-3 py-2 border-2 border-cyan-primary/30 rounded-lg bg-parchment-light text-ink-primary font-body focus:outline-none focus:border-cyan-primary"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-ink-primary mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full px-3 py-2 border-2 border-cyan-primary/30 rounded-lg bg-parchment-light text-ink-primary font-body focus:outline-none focus:border-cyan-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-primary mb-1">
                  State *
                </label>
                <select
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  className="w-full px-3 py-2 border-2 border-cyan-primary/30 rounded-lg bg-parchment-light text-ink-primary font-body focus:outline-none focus:border-cyan-primary"
                >
                  <option value="MI">Michigan</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-ink-primary mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border-2 border-cyan-primary/30 rounded-lg bg-parchment-light text-ink-primary font-body focus:outline-none focus:border-cyan-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-primary mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border-2 border-cyan-primary/30 rounded-lg bg-parchment-light text-ink-primary font-body focus:outline-none focus:border-cyan-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-primary mb-1">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
                className="w-full px-3 py-2 border-2 border-cyan-primary/30 rounded-lg bg-parchment-light text-ink-primary font-body focus:outline-none focus:border-cyan-primary"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-primary mb-1">
                Special Offers
              </label>
              <input
                type="text"
                value={formData.specialOffers}
                onChange={(e) => setFormData({...formData, specialOffers: e.target.value})}
                className="w-full px-3 py-2 border-2 border-cyan-primary/30 rounded-lg bg-parchment-light text-ink-primary font-body focus:outline-none focus:border-cyan-primary"
                placeholder="10% off for Michigan Spots members!"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-ink-secondary hover:text-ink-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-forest-green text-white font-heading font-bold treasure-border hover:bg-forest-green/80 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Partner'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

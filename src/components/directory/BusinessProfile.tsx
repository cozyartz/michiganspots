import { useState, useEffect } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Star,
  Sparkles,
  Share2,
  Edit,
  CheckCircle,
  ExternalLink,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface BusinessProfileProps {
  businessId: string;
  initialData?: any;
}

interface Business {
  id: string;
  name: string;
  category: string;
  city: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  ai_quality_score?: number;
  ai_generated_description?: string;
  ai_keywords?: string;
  ai_highlights?: string;
  ai_sentiment?: string;
  tier: 'FREE' | 'STARTER' | 'GROWTH' | 'PRO';
  featured_image_url?: string;
  gallery_images?: string;
  is_verified: boolean;
  is_claimed: boolean;
  hours?: string;
  social_facebook?: string;
  social_instagram?: string;
  social_twitter?: string;
  created_at: string;
  status: string;
}

export function BusinessProfile({ businessId, initialData }: BusinessProfileProps) {
  const [business, setBusiness] = useState<Business | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    if (!initialData) {
      fetchBusiness();
    }
  }, [businessId]);

  const fetchBusiness = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/directory/business/${businessId}`);
      if (!response.ok) throw new Error('Failed to load business');
      const data = await response.json();
      setBusiness(data.business);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: business?.name,
          text: business?.ai_generated_description || business?.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      setShowShareMenu(!showShareMenu);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
    setShowShareMenu(false);
  };

  const getQualityBadgeColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-600';
    if (score >= 90) return 'bg-forest-green/10 text-forest-green border-forest-green';
    if (score >= 75) return 'bg-lakes-blue/10 text-lakes-blue border-lakes-blue';
    if (score >= 60) return 'bg-copper-orange/10 text-copper-orange border-copper-orange';
    return 'bg-gray-100 text-gray-600 border-gray-400';
  };

  const getQualityLabel = (score?: number) => {
    if (!score) return 'Not Rated';
    if (score >= 90) return 'Excellent Quality';
    if (score >= 75) return 'Great Quality';
    if (score >= 60) return 'Good Quality';
    return 'Fair Quality';
  };

  const parseGalleryImages = (gallery?: string): string[] => {
    if (!gallery) return [];
    try {
      return JSON.parse(gallery);
    } catch {
      return [];
    }
  };

  const parseHighlights = (highlights?: string): string[] => {
    if (!highlights) return [];
    try {
      return JSON.parse(highlights);
    } catch {
      return highlights.split(',').map(h => h.trim()).filter(Boolean);
    }
  };

  if (loading) {
    return (
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="animate-pulse">
            <div className="h-96 bg-parchment-mid rounded-xl mb-6"></div>
            <div className="h-8 bg-parchment-mid rounded w-2/3 mb-4"></div>
            <div className="h-4 bg-parchment-mid rounded w-1/2 mb-8"></div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="h-64 bg-parchment-mid rounded"></div>
              <div className="h-64 bg-parchment-mid rounded"></div>
              <div className="h-64 bg-parchment-mid rounded"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !business) {
    return (
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <p className="text-red-600 font-semibold mb-4">{error || 'Business not found'}</p>
          <a
            href="/directory"
            className="inline-block px-6 py-3 bg-lakes-blue text-white rounded-xl font-bold hover:bg-lakes-blue/90 transition-colors"
          >
            Back to Directory
          </a>
        </div>
      </section>
    );
  }

  const galleryImages = parseGalleryImages(business.gallery_images);
  const highlights = parseHighlights(business.ai_highlights);

  return (
    <section className="py-12 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        {/* Hero Image */}
        {business.featured_image_url && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden mb-8 shadow-2xl"
          >
            <img
              src={business.featured_image_url}
              alt={business.name}
              className="w-full h-96 object-cover"
            />
          </motion.div>
        )}

        {/* Business Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display text-4xl md:text-5xl font-bold text-ink-primary">
                  {business.name}
                </h1>
                {business.is_verified && (
                  <div className="flex-shrink-0" title="Verified Business">
                    <CheckCircle className="w-8 h-8 text-lakes-blue fill-current" />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-4 py-1.5 bg-copper-orange/10 text-copper-orange font-semibold rounded-full">
                  {business.category}
                </span>
                <span className="px-4 py-1.5 bg-lakes-blue/10 text-lakes-blue font-semibold rounded-full flex items-center gap-2">
                  <MapPin size={16} />
                  {business.city}, MI
                </span>
                <span className={`px-4 py-1.5 font-bold rounded-full ${
                  business.tier === 'PRO' ? 'bg-gold/10 text-gold' :
                  business.tier === 'GROWTH' ? 'bg-copper-orange/10 text-copper-orange' :
                  business.tier === 'STARTER' ? 'bg-lakes-blue/10 text-lakes-blue' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {business.tier} Listing
                </span>
              </div>

              {/* AI Quality Score */}
              {business.ai_quality_score && (
                <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 ${getQualityBadgeColor(business.ai_quality_score)}`}>
                  <Sparkles size={20} />
                  <div>
                    <div className="text-sm font-semibold">AI Quality Score</div>
                    <div className="text-2xl font-bold">{business.ai_quality_score}/100 - {getQualityLabel(business.ai_quality_score)}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleShare}
                className="relative px-4 py-3 bg-parchment-light border-2 border-parchment-mid rounded-xl hover:bg-parchment-mid transition-colors"
                title="Share"
              >
                <Share2 size={20} />
                {showShareMenu && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white shadow-xl border-2 border-parchment-mid rounded-xl overflow-hidden z-10">
                    <button
                      onClick={copyToClipboard}
                      className="w-full text-left px-4 py-3 hover:bg-parchment-light transition-colors"
                    >
                      Copy Link
                    </button>
                  </div>
                )}
              </button>

              {!business.is_claimed && (
                <a
                  href={`/directory/claim?id=${business.id}`}
                  className="px-6 py-3 bg-copper-orange text-white rounded-xl font-bold hover:bg-copper-orange/90 transition-colors flex items-center gap-2"
                >
                  <Edit size={20} />
                  Claim This Business
                </a>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-lg text-ink-secondary leading-relaxed max-w-4xl">
            {business.ai_generated_description || business.description || 'No description available'}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Contact & Hours Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Information */}
            <div className="parchment-card p-6">
              <h2 className="font-heading text-xl font-bold text-ink-primary mb-4">
                Contact Information
              </h2>
              <div className="space-y-4">
                {business.address && (
                  <div className="flex items-start gap-3">
                    <MapPin size={20} className="text-lakes-blue flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm text-ink-secondary font-semibold mb-1">Address</div>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(business.address + ', ' + business.city + ', MI')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ink-primary hover:text-lakes-blue transition-colors"
                      >
                        {business.address}
                        <br />
                        {business.city}, Michigan
                      </a>
                    </div>
                  </div>
                )}

                {business.phone && (
                  <div className="flex items-start gap-3">
                    <Phone size={20} className="text-lakes-blue flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm text-ink-secondary font-semibold mb-1">Phone</div>
                      <a
                        href={`tel:${business.phone}`}
                        className="text-ink-primary hover:text-lakes-blue transition-colors"
                      >
                        {business.phone}
                      </a>
                    </div>
                  </div>
                )}

                {business.email && (
                  <div className="flex items-start gap-3">
                    <Mail size={20} className="text-lakes-blue flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm text-ink-secondary font-semibold mb-1">Email</div>
                      <a
                        href={`mailto:${business.email}`}
                        className="text-ink-primary hover:text-lakes-blue transition-colors break-all"
                      >
                        {business.email}
                      </a>
                    </div>
                  </div>
                )}

                {business.website && (
                  <div className="flex items-start gap-3">
                    <Globe size={20} className="text-lakes-blue flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm text-ink-secondary font-semibold mb-1">Website</div>
                      <a
                        href={business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lakes-blue hover:text-copper-orange transition-colors flex items-center gap-1 break-all"
                      >
                        Visit Website
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Hours */}
            {business.hours && (
              <div className="parchment-card p-6">
                <h2 className="font-heading text-xl font-bold text-ink-primary mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-lakes-blue" />
                  Hours
                </h2>
                <p className="text-ink-secondary whitespace-pre-line">{business.hours}</p>
              </div>
            )}

            {/* Social Media */}
            {(business.social_facebook || business.social_instagram || business.social_twitter) && (
              <div className="parchment-card p-6">
                <h2 className="font-heading text-xl font-bold text-ink-primary mb-4">
                  Social Media
                </h2>
                <div className="flex gap-3">
                  {business.social_facebook && (
                    <a
                      href={business.social_facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-lakes-blue/10 text-lakes-blue rounded-lg hover:bg-lakes-blue hover:text-white transition-colors"
                      title="Facebook"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </a>
                  )}
                  {business.social_instagram && (
                    <a
                      href={business.social_instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-copper-orange/10 text-copper-orange rounded-lg hover:bg-copper-orange hover:text-white transition-colors"
                      title="Instagram"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    </a>
                  )}
                  {business.social_twitter && (
                    <a
                      href={business.social_twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-forest-green/10 text-forest-green rounded-lg hover:bg-forest-green hover:text-white transition-colors"
                      title="Twitter/X"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Highlights */}
            {highlights.length > 0 && (
              <div className="parchment-card p-6">
                <h2 className="font-heading text-xl font-bold text-ink-primary mb-4 flex items-center gap-2">
                  <Sparkles size={20} className="text-copper-orange" />
                  AI-Generated Highlights
                </h2>
                <ul className="space-y-2">
                  {highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle size={18} className="text-forest-green flex-shrink-0 mt-0.5" />
                      <span className="text-ink-primary">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Gallery */}
            {galleryImages.length > 0 && (
              <div className="parchment-card p-6">
                <h2 className="font-heading text-xl font-bold text-ink-primary mb-4">
                  Photo Gallery
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {galleryImages.map((img, idx) => (
                    <div key={idx} className="rounded-lg overflow-hidden">
                      <img
                        src={img}
                        alt={`${business.name} - Image ${idx + 1}`}
                        className="w-full h-48 object-cover hover:scale-110 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords */}
            {business.ai_keywords && (
              <div className="parchment-card p-6">
                <h2 className="font-heading text-xl font-bold text-ink-primary mb-4">
                  Tags & Keywords
                </h2>
                <div className="flex flex-wrap gap-2">
                  {business.ai_keywords.split(',').map((keyword, idx) => (
                    <a
                      key={idx}
                      href={`/directory/search?q=${encodeURIComponent(keyword.trim())}`}
                      className="px-3 py-1.5 bg-copper-orange/10 text-copper-orange rounded-full text-sm font-semibold hover:bg-copper-orange hover:text-white transition-colors"
                    >
                      {keyword.trim()}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA Section */}
        {!business.is_claimed && (
          <div className="p-8 bg-gradient-to-r from-lakes-blue/10 to-copper-orange/10 rounded-2xl border-2 border-parchment-mid text-center">
            <h3 className="font-heading text-2xl font-bold text-ink-primary mb-4">
              Is this your business?
            </h3>
            <p className="text-lg text-ink-secondary mb-6">
              Claim this listing to update information, add photos, respond to reviews, and unlock premium features.
            </p>
            <a
              href={`/directory/claim?id=${business.id}`}
              className="inline-block px-8 py-4 bg-gradient-to-r from-lakes-blue to-copper-orange text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all"
            >
              Claim This Business FREE
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

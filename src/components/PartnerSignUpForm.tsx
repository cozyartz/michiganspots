import { useState, useEffect } from 'react';
import { Mail, User, Building2, MapPin, Phone, CheckCircle, AlertCircle, DollarSign, Gift, Code, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { getAllTiers, getAvailableDurations, getPrizeAddonPrice, getWebDevPrice } from '../lib/stripe-prices';

interface EmailValidation {
  isValid: boolean;
  severity: 'valid' | 'warning' | 'invalid';
  score: number;
  recommendations: string[];
}

interface PartnerSignUpFormProps {
  partnershipType?: 'chamber' | 'business' | 'community';
  preselectedTier?: string;
}

const PRIZE_TYPES = [
  { value: 'gift_cards', label: 'Gift Cards / Store Credit' },
  { value: 'tickets', label: 'Tickets & Experiences' },
  { value: 'swag', label: 'Physical Prizes / Swag' },
  { value: 'services', label: 'Service Vouchers' },
  { value: 'experiences', label: 'Experiences & Activities' },
  { value: 'cash', label: 'Cash Prizes' },
  { value: 'hybrid', label: 'Hybrid Package (Multiple Types)' }
];

const WEBDEV_SERVICES = [
  { id: 'landing_page', label: 'Landing Page', price: 499 },
  { id: 'ecommerce', label: 'E-Commerce Integration', price: 999 },
  { id: 'dashboard', label: 'Custom Dashboard', price: 799 },
  { id: 'api_integration', label: 'API Integration', price: 1299 },
];

export function PartnerSignUpForm({
  partnershipType = 'business',
  preselectedTier
}: PartnerSignUpFormProps) {
  // Basic Info
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');

  // Tier Selection
  const [selectedTier, setSelectedTier] = useState(preselectedTier || 'spot_partner');
  const [selectedDuration, setSelectedDuration] = useState('monthly');

  // Prize Package
  const [hasPrizePackage, setHasPrizePackage] = useState(false);
  const [prizeTypes, setPrizeTypes] = useState<string[]>([]);
  const [prizeValue, setPrizeValue] = useState('');
  const [prizeDescription, setPrizeDescription] = useState('');
  const [prizeAddonFee, setPrizeAddonFee] = useState(0);

  // Web/Dev Services
  const [selectedWebDevServices, setSelectedWebDevServices] = useState<string[]>([]);
  const [webdevNotes, setWebdevNotes] = useState('');

  // UI State
  const [showPrizeSection, setShowPrizeSection] = useState(false);
  const [showWebDevSection, setShowWebDevSection] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [emailValidation, setEmailValidation] = useState<EmailValidation | null>(null);
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);

  const tiers = getAllTiers();
  const availableDurations = getAvailableDurations(selectedTier);

  // Calculate total price
  const tierPrice = availableDurations.find(d => d.id === selectedDuration)?.amount || 0;
  const webdevTotal = selectedWebDevServices.reduce((sum, serviceId) => {
    const service = WEBDEV_SERVICES.find(s => s.id === serviceId);
    return sum + (service?.price || 0);
  }, 0);
  const totalPrice = tierPrice + prizeAddonFee + webdevTotal;

  // Update prize addon fee based on tier and value
  useEffect(() => {
    if (hasPrizePackage && prizeValue) {
      const value = parseInt(prizeValue);
      if (!isNaN(value) && value > 0) {
        const prizeInfo = getPrizeAddonPrice(selectedTier, selectedDuration);
        if (prizeInfo) {
          // Fee is typically 50-100% of prize value, capped at tier max
          const fee = Math.min(value, prizeInfo.max || value);
          setPrizeAddonFee(fee);
        }
      }
    } else {
      setPrizeAddonFee(0);
    }
  }, [hasPrizePackage, prizeValue, selectedTier, selectedDuration]);

  // Reset duration when tier changes if not available
  useEffect(() => {
    const durations = getAvailableDurations(selectedTier);
    if (!durations.find(d => d.id === selectedDuration)) {
      setSelectedDuration(durations[0]?.id || 'monthly');
    }
  }, [selectedTier]);

  // Validate email when field loses focus
  const validateEmailField = async () => {
    if (!email || email.trim() === '') {
      setEmailValidation(null);
      return;
    }

    setIsValidatingEmail(true);
    try {
      const response = await fetch('/api/validate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const result = await response.json();
        setEmailValidation({
          isValid: result.isValid,
          severity: result.severity,
          score: result.score,
          recommendations: result.recommendations,
        });
      } else {
        // If validation service is unavailable, allow submission (fallback)
        setEmailValidation(null);
      }
    } catch (error) {
      // Network error - allow submission (fallback to browser validation)
      console.error('Email validation error:', error);
      setEmailValidation(null);
    } finally {
      setIsValidatingEmail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('idle');

    // Check email validation before submitting
    if (emailValidation && !emailValidation.isValid) {
      setStatus('error');
      setStatusMessage(emailValidation.recommendations[0] || 'Please provide a valid email address.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/partner-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Basic info
          email,
          name,
          organizationName,
          city,
          phone,
          address,
          website,
          partnershipType,

          // Tier selection
          tier: selectedTier,
          duration: selectedDuration,
          tierAmount: tierPrice,

          // Prize package
          hasPrizePackage,
          prizeTypes: hasPrizePackage ? prizeTypes : [],
          prizeValue: hasPrizePackage ? parseInt(prizeValue) : 0,
          prizeDescription: hasPrizePackage ? prizeDescription : '',
          prizeAddonFee,

          // Web/dev services
          hasWebdevServices: selectedWebDevServices.length > 0,
          webdevServices: selectedWebDevServices,
          webdevTotalFee: webdevTotal,
          webdevNotes,

          // Total
          totalPaid: totalPrice
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to Stripe checkout
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          setStatus('success');
          setStatusMessage("Partnership request submitted! Redirecting to payment...");
        }
      } else {
        setStatus('error');
        setStatusMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setStatusMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePrizeType = (type: string) => {
    setPrizeTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleWebDevService = (serviceId: string) => {
    setSelectedWebDevServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(s => s !== serviceId)
        : [...prev, serviceId]
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="parchment-card">
        <h2 className="font-heading text-3xl font-bold text-ink-primary mb-2 text-center">
          Partner with Michigan Spots
        </h2>
        <p className="text-sm text-ink-secondary text-center mb-8">
          Join Michigan's most engaging treasure hunt platform
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION 1: Select Partnership Tier */}
          <div className="border-2 border-ink-primary p-6 rounded-sm bg-parchment-light/50">
            <h3 className="font-heading text-xl font-bold text-ink-primary mb-4 flex items-center">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-copper-orange text-parchment-base mr-3">1</span>
              Select Your Partnership Tier
            </h3>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {tiers.map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setSelectedTier(tier.id)}
                  className={`p-4 border-2 rounded-sm text-left transition-all ${
                    selectedTier === tier.id
                      ? 'border-copper-orange bg-copper-orange/10'
                      : 'border-ink-primary hover:border-copper-orange/50'
                  }`}
                >
                  <div className="text-2xl mb-2">{tier.icon}</div>
                  <div className="font-heading font-bold text-ink-primary">{tier.name}</div>
                </button>
              ))}
            </div>

            {/* Duration Selection */}
            <div className="mt-4">
              <label className="block text-sm font-heading font-semibold text-ink-primary mb-2">
                Billing Duration *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {availableDurations.map((duration) => (
                  <button
                    key={duration.id}
                    type="button"
                    onClick={() => setSelectedDuration(duration.id)}
                    className={`p-4 border-2 rounded-sm text-left transition-all ${
                      selectedDuration === duration.id
                        ? 'border-copper-orange bg-copper-orange/10'
                        : 'border-ink-primary hover:border-copper-orange/50'
                    }`}
                  >
                    <div className="font-heading font-bold text-ink-primary">{duration.name}</div>
                    <div className="text-2xl font-bold text-copper-orange my-1">{duration.label}</div>
                    {duration.perMonth && (
                      <div className="text-xs text-ink-secondary">{duration.perMonth}</div>
                    )}
                    {duration.savings && (
                      <div className="text-xs text-forest-green font-semibold mt-1">Save {duration.savings}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: Business Information */}
          <div className="border-2 border-ink-primary p-6 rounded-sm bg-parchment-light/50">
            <h3 className="font-heading text-xl font-bold text-ink-primary mb-4 flex items-center">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-copper-orange text-parchment-base mr-3">2</span>
              Business Information
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-heading font-semibold text-ink-primary mb-2">
                  Your Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-faded" />
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border-2 border-ink-primary rounded-sm bg-parchment-light text-ink-primary focus:outline-none focus:border-copper-orange transition-colors"
                    placeholder="John Smith"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-heading font-semibold text-ink-primary mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-faded" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailValidation(null); // Clear validation when user types
                    }}
                    onBlur={validateEmailField}
                    required
                    className={`w-full pl-10 pr-10 py-3 border-2 rounded-sm bg-parchment-light text-ink-primary focus:outline-none transition-colors ${
                      emailValidation
                        ? emailValidation.isValid
                          ? 'border-forest-green focus:border-forest-green'
                          : 'border-sunset-red focus:border-sunset-red'
                        : 'border-ink-primary focus:border-copper-orange'
                    }`}
                    placeholder="john@business.com"
                  />
                  {isValidatingEmail && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-5 h-5 border-2 border-copper-orange border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {emailValidation && !isValidatingEmail && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {emailValidation.isValid ? (
                        <CheckCircle className="w-5 h-5 text-forest-green" />
                      ) : (
                        <XCircle className="w-5 h-5 text-sunset-red" />
                      )}
                    </div>
                  )}
                </div>
                {emailValidation && !emailValidation.isValid && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-sunset-red mt-1 font-heading"
                  >
                    {emailValidation.recommendations[0]}
                  </motion.p>
                )}
                {emailValidation && emailValidation.isValid && emailValidation.severity === 'warning' && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-copper-orange mt-1 font-heading"
                  >
                    {emailValidation.recommendations[0]}
                  </motion.p>
                )}
              </div>

              <div>
                <label htmlFor="organization" className="block text-sm font-heading font-semibold text-ink-primary mb-2">
                  Business Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-faded" />
                  <input
                    type="text"
                    id="organization"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border-2 border-ink-primary rounded-sm bg-parchment-light text-ink-primary focus:outline-none focus:border-copper-orange transition-colors"
                    placeholder="Fieldstone Coffee"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-heading font-semibold text-ink-primary mb-2">
                  Phone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-faded" />
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border-2 border-ink-primary rounded-sm bg-parchment-light text-ink-primary focus:outline-none focus:border-copper-orange transition-colors"
                    placeholder="(269) 555-1234"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-heading font-semibold text-ink-primary mb-2">
                  City *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-faded" />
                  <input
                    type="text"
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border-2 border-ink-primary rounded-sm bg-parchment-light text-ink-primary focus:outline-none focus:border-copper-orange transition-colors"
                    placeholder="Battle Creek, MI"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-heading font-semibold text-ink-primary mb-2">
                  Website (optional)
                </label>
                <input
                  type="url"
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-ink-primary rounded-sm bg-parchment-light text-ink-primary focus:outline-none focus:border-copper-orange transition-colors"
                  placeholder="https://yourbusiness.com"
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="address" className="block text-sm font-heading font-semibold text-ink-primary mb-2">
                Business Address *
              </label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-ink-primary rounded-sm bg-parchment-light text-ink-primary focus:outline-none focus:border-copper-orange transition-colors"
                placeholder="123 Main St, Battle Creek, MI 49017"
              />
            </div>
          </div>

          {/* SECTION 3: Prize Package (Optional) */}
          <div className="border-2 border-ink-primary p-6 rounded-sm bg-parchment-light/50">
            <button
              type="button"
              onClick={() => setShowPrizeSection(!showPrizeSection)}
              className="w-full flex items-center justify-between mb-4"
            >
              <h3 className="font-heading text-xl font-bold text-ink-primary flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-copper-orange text-parchment-base mr-3">3</span>
                Prize Package Add-On (Optional)
                <Gift className="w-5 h-5 ml-2" />
              </h3>
              {showPrizeSection ? <ChevronUp /> : <ChevronDown />}
            </button>

            <AnimatePresence>
              {showPrizeSection && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-4"
                >
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasPrizePackage}
                      onChange={(e) => setHasPrizePackage(e.target.checked)}
                      className="mt-1 w-5 h-5"
                    />
                    <div>
                      <div className="font-heading font-semibold text-ink-primary">
                        Yes, I want to add a prize package
                      </div>
                      <div className="text-sm text-ink-secondary">
                        Get priority placement, featured badge, and social media highlights
                      </div>
                    </div>
                  </label>

                  {hasPrizePackage && (
                    <div className="space-y-4 pl-8 border-l-4 border-copper-orange">
                      <div>
                        <label className="block text-sm font-heading font-semibold text-ink-primary mb-2">
                          Prize Type(s) *
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {PRIZE_TYPES.map((type) => (
                            <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={prizeTypes.includes(type.value)}
                                onChange={() => togglePrizeType(type.value)}
                                className="w-4 h-4"
                              />
                              <span className="text-sm text-ink-primary">{type.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="prizeValue" className="block text-sm font-heading font-semibold text-ink-primary mb-2">
                          Total Prize Value * (in dollars)
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-faded" />
                          <input
                            type="number"
                            id="prizeValue"
                            value={prizeValue}
                            onChange={(e) => setPrizeValue(e.target.value)}
                            min="50"
                            required={hasPrizePackage}
                            className="w-full pl-10 pr-4 py-3 border-2 border-ink-primary rounded-sm bg-parchment-light text-ink-primary focus:outline-none focus:border-copper-orange transition-colors"
                            placeholder="100"
                          />
                        </div>
                        <p className="text-xs text-ink-secondary mt-1">
                          Minimum $50 value. Prize contribution fee will be calculated based on value.
                        </p>
                      </div>

                      <div>
                        <label htmlFor="prizeDescription" className="block text-sm font-heading font-semibold text-ink-primary mb-2">
                          Prize Description *
                        </label>
                        <textarea
                          id="prizeDescription"
                          value={prizeDescription}
                          onChange={(e) => setPrizeDescription(e.target.value)}
                          required={hasPrizePackage}
                          rows={3}
                          className="w-full px-4 py-3 border-2 border-ink-primary rounded-sm bg-parchment-light text-ink-primary focus:outline-none focus:border-copper-orange transition-colors resize-none"
                          placeholder="Describe the prize(s) you'll provide. Example: '$100 gift card to our restaurant + branded coffee mug'"
                        />
                      </div>

                      <div className="bg-blue-50 border-2 border-blue-300 rounded-sm p-4">
                        <p className="text-sm text-blue-900 font-semibold mb-2">⚠️ Important: Prize Submission Requirement</p>
                        <p className="text-xs text-blue-800">
                          All prizes must be submitted to Michigan Spots within 3 business days after challenge approval,
                          BEFORE your challenge goes live. Physical prizes ship to our Battle Creek office, digital prizes
                          (codes, vouchers) via secure email.
                        </p>
                      </div>

                      {prizeAddonFee > 0 && (
                        <div className="bg-copper-orange/10 border-2 border-copper-orange rounded-sm p-4">
                          <p className="font-heading font-bold text-ink-primary">
                            Prize Package Add-On Fee: ${prizeAddonFee}
                          </p>
                          <p className="text-xs text-ink-secondary mt-1">
                            This covers prize management, winner selection, shipping, and platform bonus matching (20% for cash prizes)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SECTION 4: Web/Dev Services (Optional) */}
          <div className="border-2 border-ink-primary p-6 rounded-sm bg-parchment-light/50">
            <button
              type="button"
              onClick={() => setShowWebDevSection(!showWebDevSection)}
              className="w-full flex items-center justify-between mb-4"
            >
              <h3 className="font-heading text-xl font-bold text-ink-primary flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-copper-orange text-parchment-base mr-3">4</span>
                Web/Dev Services Add-On (Optional)
                <Code className="w-5 h-5 ml-2" />
              </h3>
              {showWebDevSection ? <ChevronUp /> : <ChevronDown />}
            </button>

            <AnimatePresence>
              {showWebDevSection && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-4"
                >
                  <p className="text-sm text-ink-secondary">
                    Add professional web development services to your partnership (included in Premium/Title tiers)
                  </p>

                  <div className="space-y-3">
                    {WEBDEV_SERVICES.map((service) => (
                      <label
                        key={service.id}
                        className="flex items-center justify-between p-3 border-2 border-ink-primary rounded-sm cursor-pointer hover:border-copper-orange transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedWebDevServices.includes(service.id)}
                            onChange={() => toggleWebDevService(service.id)}
                            className="w-5 h-5"
                          />
                          <span className="font-heading font-semibold text-ink-primary">{service.label}</span>
                        </div>
                        <span className="text-copper-orange font-bold">${service.price}</span>
                      </label>
                    ))}
                  </div>

                  {selectedWebDevServices.length > 0 && (
                    <div>
                      <label htmlFor="webdevNotes" className="block text-sm font-heading font-semibold text-ink-primary mb-2">
                        Project Notes (optional)
                      </label>
                      <textarea
                        id="webdevNotes"
                        value={webdevNotes}
                        onChange={(e) => setWebdevNotes(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-ink-primary rounded-sm bg-parchment-light text-ink-primary focus:outline-none focus:border-copper-orange transition-colors resize-none"
                        placeholder="Any specific requirements or ideas for your web/dev project?"
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SECTION 5: Review & Payment */}
          <div className="border-2 border-copper-orange p-6 rounded-sm bg-copper-orange/5">
            <h3 className="font-heading text-xl font-bold text-ink-primary mb-4 flex items-center">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-copper-orange text-parchment-base mr-3">5</span>
              Review & Payment
            </h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center pb-2 border-b border-ink-primary">
                <span className="text-ink-secondary">Partnership ({selectedTier.replace('_', ' ')} - {selectedDuration})</span>
                <span className="font-bold text-ink-primary">${tierPrice}</span>
              </div>

              {hasPrizePackage && prizeAddonFee > 0 && (
                <div className="flex justify-between items-center pb-2 border-b border-ink-primary">
                  <span className="text-ink-secondary">Prize Package Add-On</span>
                  <span className="font-bold text-ink-primary">${prizeAddonFee}</span>
                </div>
              )}

              {webdevTotal > 0 && (
                <div className="flex justify-between items-center pb-2 border-b border-ink-primary">
                  <span className="text-ink-secondary">Web/Dev Services ({selectedWebDevServices.length})</span>
                  <span className="font-bold text-ink-primary">${webdevTotal}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t-2 border-copper-orange">
                <span className="font-heading text-xl font-bold text-ink-primary">Total Due Today</span>
                <span className="font-heading text-3xl font-bold text-copper-orange">${totalPrice}</span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Proceed to Secure Payment'}
            </Button>

            <p className="text-xs text-ink-faded text-center mt-4">
              You'll be redirected to Stripe for secure payment. By proceeding, you agree to our{' '}
              <a href="/terms" className="text-copper-orange hover:underline">Terms of Service</a> and{' '}
              <a href="/privacy" className="text-copper-orange hover:underline">Privacy Policy</a>.
            </p>
          </div>

          {status !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-sm border-2 ${
                status === 'success'
                  ? 'bg-forest-green/10 border-forest-green text-forest-green'
                  : 'bg-sunset-red/10 border-sunset-red text-sunset-red'
              }`}
            >
              <div className="flex items-start space-x-3">
                {status === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                )}
                <p className="font-heading text-sm">{statusMessage}</p>
              </div>
            </motion.div>
          )}
        </form>
      </div>
    </motion.div>
  );
}

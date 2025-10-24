import { useState, useRef } from 'react';
import { Mail, User, Building2, MapPin, Phone, CheckCircle, AlertCircle, FileText, Tag, Loader2, X, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { SignaturePad } from './SignaturePad';
import { getAllTiers, getAvailableDurations } from '../lib/stripe-prices';

interface InPersonPartnerSignupProps {
  partnershipType?: 'chamber' | 'business' | 'community';
}

interface WebDevService {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface CouponValidation {
  valid: boolean;
  error?: string;
  coupon?: {
    code: string;
    description: string;
    discountType: string;
    discountValue: number;
  };
  calculation?: {
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    savings: number;
    savingsPercent: number;
  };
}

const WEB_DEV_SERVICES: WebDevService[] = [
  {
    id: 'landing_page',
    name: 'Landing Page',
    description: 'Single page website • Mobile responsive • Contact form • Basic SEO',
    price: 499
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce Integration',
    description: 'Online store • Product catalog • Payment processing • Inventory management',
    price: 999
  },
  {
    id: 'custom_dashboard',
    name: 'Custom Dashboard',
    description: 'Analytics dashboard • Custom metrics • Real-time data • Export tools',
    price: 799
  },
  {
    id: 'api_integration',
    name: 'API Integration',
    description: 'Third-party services • Custom integrations • Webhook setup • Documentation',
    price: 1299
  }
];

export function InPersonPartnerSignup({ partnershipType = 'business' }: InPersonPartnerSignupProps) {
  // Basic Info
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [title, setTitle] = useState('');

  // Tier Selection
  const [selectedTier, setSelectedTier] = useState('spot_partner');
  const [selectedDuration, setSelectedDuration] = useState('monthly');

  // Web/Dev Services
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [couponValidation, setCouponValidation] = useState<CouponValidation | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Agreement
  const [hasReadAgreement, setHasReadAgreement] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [showContract, setShowContract] = useState(false);

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const contractRef = useRef<HTMLDivElement>(null);
  const tiers = getAllTiers();
  const availableDurations = getAvailableDurations(selectedTier);

  // Calculate prices
  const tierPrice = availableDurations.find(d => d.id === selectedDuration)?.amount || 0;
  const servicesTotal = selectedServices.reduce((sum, serviceId) => {
    const service = WEB_DEV_SERVICES.find(s => s.id === serviceId);
    return sum + (service?.price || 0);
  }, 0);
  const subtotal = tierPrice + servicesTotal;
  const discountAmount = couponValidation?.calculation?.discountAmount || 0;
  const finalTotal = couponValidation?.calculation?.finalAmount || subtotal;

  const handleSignature = (signatureData: string) => {
    setSignature(signatureData);
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
    // Reset coupon when services change
    if (couponValidation) {
      validateCoupon(couponCode);
    }
  };

  const validateCoupon = async (code: string) => {
    if (!code.trim()) {
      setCouponValidation(null);
      return;
    }

    setIsValidatingCoupon(true);

    try {
      // Determine purchase type
      let purchaseType = 'monthly';
      if (selectedDuration === 'yearly') {
        purchaseType = 'yearly';
      } else if (selectedServices.length > 0 && tierPrice === 0) {
        purchaseType = 'services';
      }

      const response = await fetch('/api/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          purchaseType,
          amount: subtotal
        })
      });

      const data: CouponValidation = await response.json();
      setCouponValidation(data);
    } catch (error) {
      setCouponValidation({
        valid: false,
        error: 'Failed to validate coupon. Please try again.'
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponValidation(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signature) {
      setStatus('error');
      setStatusMessage('Please sign the agreement before submitting.');
      return;
    }

    if (!hasReadAgreement) {
      setStatus('error');
      setStatusMessage('Please confirm you have read the agreement.');
      return;
    }

    setIsSubmitting(true);
    setStatus('idle');

    try {
      const response = await fetch('/api/in-person-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Basic info
          email,
          name,
          title,
          organizationName,
          city,
          phone,
          address,
          partnershipType,

          // Tier selection
          tier: selectedTier,
          duration: selectedDuration,
          tierAmount: tierPrice,

          // Services
          selectedServices: selectedServices.map(serviceId => {
            const service = WEB_DEV_SERVICES.find(s => s.id === serviceId);
            return {
              id: serviceId,
              name: service?.name,
              price: service?.price
            };
          }),
          servicesTotal,

          // Coupon
          couponCode: couponValidation?.valid ? couponCode.toUpperCase() : null,
          couponDiscount: discountAmount,
          originalAmount: subtotal,

          // Agreement
          signature,
          hasReadAgreement,

          // Total
          totalPaid: finalTotal,

          // Mark as pending payment (to be collected via PayPal reader)
          paymentMethod: 'in_person_paypal',
          paymentStatus: 'pending'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        const savingsText = discountAmount > 0 ? `\n\nDiscount Applied: -$${discountAmount}` : '';
        setStatusMessage(`Agreement signed successfully! Confirmation ID: ${data.confirmationId || 'N/A'}\n\nOriginal Amount: $${subtotal}${savingsText}\n\nAmount to Collect: $${finalTotal}\n\nPlease process payment via PayPal reader.`);

        // Clear form after 30 seconds
        setTimeout(() => {
          resetForm();
        }, 30000);
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

  const resetForm = () => {
    setEmail('');
    setName('');
    setOrganizationName('');
    setCity('');
    setPhone('');
    setAddress('');
    setTitle('');
    setSelectedTier('spot_partner');
    setSelectedDuration('monthly');
    setSelectedServices([]);
    setCouponCode('');
    setCouponValidation(null);
    setHasReadAgreement(false);
    setSignature(null);
    setShowContract(false);
    setStatus('idle');
    setStatusMessage('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl mx-auto p-4 md:p-8"
    >
      <div className="parchment-card">
        <div className="text-center mb-8">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-ink-primary mb-2">
            Partner with Michigan Spots
          </h2>
          <p className="text-lg text-ink-secondary">
            In-Person Registration
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION 1: Select Partnership Tier */}
          <div className="border-2 border-ink-primary p-6 rounded-sm bg-parchment-light/50">
            <h3 className="font-heading text-2xl font-bold text-ink-primary mb-6 flex items-center">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-copper-orange text-parchment-base mr-3 text-lg">1</span>
              Select Partnership Tier
            </h3>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {tiers.map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setSelectedTier(tier.id)}
                  className={`p-6 border-3 rounded-sm text-left transition-all touch-manipulation ${
                    selectedTier === tier.id
                      ? 'border-copper-orange bg-copper-orange/10'
                      : 'border-ink-primary hover:border-copper-orange/50'
                  }`}
                >
                  <div className="text-4xl mb-3">{tier.icon}</div>
                  <div className="font-heading font-bold text-lg text-ink-primary">{tier.name}</div>
                </button>
              ))}
            </div>

            {/* Duration Selection */}
            <div>
              <label className="block text-lg font-heading font-semibold text-ink-primary mb-3">
                Billing Duration *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {availableDurations.map((duration) => (
                  <button
                    key={duration.id}
                    type="button"
                    onClick={() => setSelectedDuration(duration.id)}
                    className={`p-5 border-3 rounded-sm text-left transition-all touch-manipulation ${
                      selectedDuration === duration.id
                        ? 'border-copper-orange bg-copper-orange/10'
                        : 'border-ink-primary hover:border-copper-orange/50'
                    }`}
                  >
                    <div className="font-heading font-bold text-lg text-ink-primary">{duration.name}</div>
                    <div className="text-3xl font-bold text-copper-orange my-2">{duration.label}</div>
                    {duration.perMonth && (
                      <div className="text-sm text-ink-secondary">{duration.perMonth}</div>
                    )}
                    {duration.savings && (
                      <div className="text-sm text-forest-green font-semibold mt-2">Save {duration.savings}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: Business Information */}
          <div className="border-2 border-ink-primary p-6 rounded-sm bg-parchment-light/50">
            <h3 className="font-heading text-2xl font-bold text-ink-primary mb-6 flex items-center">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-copper-orange text-parchment-base mr-3 text-lg">2</span>
              Business Information
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-base font-heading font-semibold text-ink-primary mb-2">
                  Contact Name *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-ink-faded" />
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-14 pr-4 py-4 text-lg border-2 border-ink-primary rounded-sm bg-parchment-light text-ink-primary focus:outline-none focus:border-copper-orange transition-colors touch-manipulation"
                    placeholder="John Smith"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="title" className="block text-base font-heading font-semibold text-ink-primary mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-4 text-lg border-2 border-ink-primary rounded-sm bg-parchment-light text-ink-primary focus:outline-none focus:border-copper-orange transition-colors touch-manipulation"
                  placeholder="Owner"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-base font-heading font-semibold text-ink-primary mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-ink-faded" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-14 pr-4 py-4 text-lg border-2 border-ink-primary rounded-sm bg-parchment-light text-ink-primary focus:outline-none focus:border-copper-orange transition-colors touch-manipulation"
                    placeholder="john@business.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-base font-heading font-semibold text-ink-primary mb-2">
                  Phone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-ink-faded" />
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full pl-14 pr-4 py-4 text-lg border-2 border-ink-primary rounded-sm bg-parchment-light text-ink-primary focus:outline-none focus:border-copper-orange transition-colors touch-manipulation"
                    placeholder="(269) 555-1234"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="organization" className="block text-base font-heading font-semibold text-ink-primary mb-2">
                  Business Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-ink-faded" />
                  <input
                    type="text"
                    id="organization"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    required
                    className="w-full pl-14 pr-4 py-4 text-lg border-2 border-ink-primary rounded-sm bg-parchment-light text-ink-primary focus:outline-none focus:border-copper-orange transition-colors touch-manipulation"
                    placeholder="Fieldstone Coffee"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="city" className="block text-base font-heading font-semibold text-ink-primary mb-2">
                  City *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-ink-faded" />
                  <input
                    type="text"
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="w-full pl-14 pr-4 py-4 text-lg border-2 border-ink-primary rounded-sm bg-parchment-light text-ink-primary focus:outline-none focus:border-copper-orange transition-colors touch-manipulation"
                    placeholder="Battle Creek, MI"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-base font-heading font-semibold text-ink-primary mb-2">
                  Business Address *
                </label>
                <input
                  type="text"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="w-full px-4 py-4 text-lg border-2 border-ink-primary rounded-sm bg-parchment-light text-ink-primary focus:outline-none focus:border-copper-orange transition-colors touch-manipulation"
                  placeholder="123 Main St"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2.5: Optional Web/Dev Services */}
          <div className="border-2 border-ink-primary p-6 rounded-sm bg-parchment-light/50">
            <h3 className="font-heading text-2xl font-bold text-ink-primary mb-4 flex items-center">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-copper-orange text-parchment-base mr-3 text-lg">+</span>
              Add Web & Development Services (Optional)
            </h3>
            <p className="text-ink-secondary mb-6">
              Enhance your partnership with professional web and development services. Select all that apply.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {WEB_DEV_SERVICES.map(service => (
                <label
                  key={service.id}
                  className={`flex items-start gap-4 p-5 border-2 rounded-sm cursor-pointer touch-manipulation transition-all ${
                    selectedServices.includes(service.id)
                      ? 'border-copper-orange bg-copper-orange/10'
                      : 'border-ink-primary hover:border-copper-orange/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(service.id)}
                    onChange={() => toggleService(service.id)}
                    className="mt-1 w-6 h-6 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-heading font-bold text-lg text-ink-primary">{service.name}</span>
                      <span className="font-heading font-bold text-xl text-copper-orange">${service.price}</span>
                    </div>
                    <p className="text-sm text-ink-secondary">{service.description}</p>
                  </div>
                </label>
              ))}
            </div>

            {selectedServices.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-forest-green/10 border-2 border-forest-green rounded-sm"
              >
                <div className="flex justify-between items-center">
                  <span className="font-heading text-lg font-semibold text-ink-primary">
                    Services Subtotal:
                  </span>
                  <span className="font-heading text-2xl font-bold text-forest-green">
                    ${servicesTotal}
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          {/* SECTION 3: Agreement Review & Signature */}
          <div className="border-2 border-copper-orange p-6 rounded-sm bg-copper-orange/5">
            <h3 className="font-heading text-2xl font-bold text-ink-primary mb-6 flex items-center">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-copper-orange text-parchment-base mr-3 text-lg">3</span>
              Partnership Agreement & Payment
            </h3>

            <div className="mb-6">
              <Button
                type="button"
                variant={showContract ? 'secondary' : 'primary'}
                size="lg"
                onClick={() => setShowContract(!showContract)}
                className="w-full flex items-center justify-center gap-3 touch-manipulation text-lg py-5"
              >
                <FileText className="w-6 h-6" />
                {showContract ? 'Hide Agreement' : 'View Partnership Agreement'}
              </Button>
            </div>

            {showContract && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <div
                  ref={contractRef}
                  className="max-h-96 overflow-y-auto border-2 border-ink-primary rounded-sm bg-parchment-base p-6 text-sm"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  <h4 className="font-heading text-xl font-bold mb-4">BUSINESS PARTNERSHIP AGREEMENT</h4>
                  <p className="mb-4"><strong>Michigan Spots Platform</strong></p>
                  <p className="mb-4">This Business Partnership Agreement is entered into between:</p>
                  <p className="mb-4">
                    <strong>Cozyartz Media Group</strong> ("Michigan Spots")<br />
                    Battle Creek, Michigan
                  </p>
                  <p className="mb-4">
                    <strong>AND</strong>
                  </p>
                  <p className="mb-4">
                    <strong>{organizationName || '[Your Business]'}</strong> ("Partner")<br />
                    {address || '[Your Address]'}<br />
                    {city || '[Your City]'}, Michigan<br />
                    Representative: {name || '[Your Name]'}<br />
                    Email: {email || '[Your Email]'}
                  </p>

                  <div className="space-y-4 text-xs">
                    <h5 className="font-bold text-base mt-6">1. PARTNERSHIP PACKAGE</h5>
                    <p>Selected Tier: <strong>{tiers.find(t => t.id === selectedTier)?.name}</strong></p>
                    <p>Duration: <strong>{availableDurations.find(d => d.id === selectedDuration)?.name}</strong></p>
                    <p>Partnership Amount: <strong>${tierPrice}</strong></p>

                    {selectedServices.length > 0 && (
                      <>
                        <p className="mt-4"><strong>Additional Services:</strong></p>
                        <ul className="list-disc list-inside ml-2 space-y-1">
                          {selectedServices.map(serviceId => {
                            const service = WEB_DEV_SERVICES.find(s => s.id === serviceId);
                            return service ? (
                              <li key={serviceId}>{service.name} - ${service.price}</li>
                            ) : null;
                          })}
                        </ul>
                        <p>Services Subtotal: <strong>${servicesTotal}</strong></p>
                      </>
                    )}

                    {couponValidation?.valid && (
                      <p className="text-forest-green">
                        <strong>Discount Applied:</strong> {couponValidation.coupon?.code} ({couponValidation.calculation?.savingsPercent}% off) - Save ${discountAmount}
                      </p>
                    )}

                    <p className="font-bold mt-2">
                      <strong>TOTAL AMOUNT: ${finalTotal}</strong>
                    </p>

                    <h5 className="font-bold text-base mt-6">2. SERVICES PROVIDED</h5>
                    <p>Michigan Spots will provide partnership services as outlined in the selected tier package, including challenge creation, business profile, analytics, and promotional features.</p>
                    {selectedServices.length > 0 && (
                      <p className="mt-2">Additionally, the following web and development services will be provided as selected above.</p>
                    )}

                    <h5 className="font-bold text-base mt-6">3. PAYMENT TERMS</h5>
                    <p>Full payment of ${finalTotal} is due at time of agreement signing. Payment will be collected via PayPal.</p>

                    <h5 className="font-bold text-base mt-6">4. REFUND POLICY</h5>
                    <p>14-day money-back guarantee from challenge go-live date. After 14 days, all sales are final.</p>

                    <h5 className="font-bold text-base mt-6">5. TERM</h5>
                    <p>This agreement is effective upon signature and payment, for the selected duration.</p>

                    <h5 className="font-bold text-base mt-6">6. GOVERNING LAW</h5>
                    <p>This Agreement is governed by the laws of the State of Michigan.</p>

                    <p className="mt-6 text-ink-secondary italic">
                      Full agreement details available at michiganspots.com/terms
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="mb-6">
              <label className="flex items-start gap-4 cursor-pointer touch-manipulation p-4 border-2 border-ink-primary rounded-sm hover:bg-parchment-light/50 transition-colors">
                <input
                  type="checkbox"
                  checked={hasReadAgreement}
                  onChange={(e) => setHasReadAgreement(e.target.checked)}
                  className="mt-1 w-6 h-6 flex-shrink-0"
                  required
                />
                <div className="text-base">
                  <div className="font-heading font-semibold text-ink-primary">
                    I have read and agree to the Partnership Agreement
                  </div>
                  <div className="text-sm text-ink-secondary mt-1">
                    By checking this box, I confirm that I have authority to bind {organizationName || 'my business'} to this agreement and accept all terms and conditions.
                  </div>
                </div>
              </label>
            </div>

            {/* Signature Pad */}
            <div className="mb-6">
              <SignaturePad
                onSave={handleSignature}
                label={`${name || 'Authorized Representative'}'s Signature`}
                required={true}
              />
            </div>

            {/* Discount Coupon */}
            <div className="mb-6">
              <label className="block text-lg font-heading font-semibold text-ink-primary mb-3">
                Discount Code (Optional)
              </label>

              {!couponValidation?.valid ? (
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Tag className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-ink-faded" />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          validateCoupon(couponCode);
                        }
                      }}
                      placeholder="FOUNDERS50"
                      className="w-full pl-14 pr-4 py-4 text-lg border-2 border-ink-primary rounded-sm bg-parchment-light text-ink-primary focus:outline-none focus:border-copper-orange transition-colors touch-manipulation uppercase"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={() => validateCoupon(couponCode)}
                    disabled={!couponCode.trim() || isValidatingCoupon}
                    className="px-8 touch-manipulation"
                  >
                    {isValidatingCoupon ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Validating...
                      </>
                    ) : (
                      'Apply'
                    )}
                  </Button>
                </div>
              ) : (
                <div className="bg-forest-green/10 border-2 border-forest-green rounded-sm p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Check className="w-6 h-6 text-forest-green" />
                      <div>
                        <div className="font-heading font-bold text-lg text-ink-primary">
                          {couponValidation.coupon?.code}
                        </div>
                        <div className="text-sm text-ink-secondary">
                          {couponValidation.coupon?.description}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="p-2 hover:bg-ink-primary/10 rounded-full transition-colors touch-manipulation"
                    >
                      <X className="w-6 h-6 text-ink-primary" />
                    </button>
                  </div>
                </div>
              )}

              {couponValidation && !couponValidation.valid && (
                <p className="mt-2 text-sm text-sunset-red flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {couponValidation.error}
                </p>
              )}
            </div>

            {/* Pricing Breakdown */}
            <div className="bg-copper-orange/10 border-2 border-copper-orange rounded-sm p-6 space-y-3">
              <div className="flex justify-between items-center text-lg">
                <span className="text-ink-primary">Partnership ({availableDurations.find(d => d.id === selectedDuration)?.name}):</span>
                <span className="font-heading font-bold text-ink-primary">${tierPrice}</span>
              </div>

              {selectedServices.length > 0 && (
                <div className="border-t-2 border-ink-primary/20 pt-3">
                  {selectedServices.map(serviceId => {
                    const service = WEB_DEV_SERVICES.find(s => s.id === serviceId);
                    return service ? (
                      <div key={serviceId} className="flex justify-between items-center text-base mb-2">
                        <span className="text-ink-secondary">{service.name}:</span>
                        <span className="font-heading font-semibold text-ink-primary">${service.price}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              )}

              {(tierPrice + servicesTotal > 0) && (
                <div className="flex justify-between items-center text-lg border-t-2 border-ink-primary/20 pt-3">
                  <span className="text-ink-primary">Subtotal:</span>
                  <span className="font-heading font-bold text-ink-primary">${subtotal}</span>
                </div>
              )}

              {couponValidation?.valid && discountAmount > 0 && (
                <div className="flex justify-between items-center text-lg">
                  <span className="text-forest-green font-semibold">
                    Discount ({couponValidation.calculation?.savingsPercent}% off):
                  </span>
                  <span className="font-heading font-bold text-forest-green">-${discountAmount}</span>
                </div>
              )}

              <div className="flex justify-between items-center border-t-2 border-copper-orange pt-3">
                <span className="font-heading text-2xl font-bold text-ink-primary">Amount to Collect:</span>
                <span className="font-heading text-4xl font-bold text-copper-orange">${finalTotal}</span>
              </div>

              {couponValidation?.valid && discountAmount > 0 && (
                <p className="text-sm text-forest-green font-semibold text-center">
                  You saved ${discountAmount}!
                </p>
              )}

              <p className="text-sm text-ink-secondary mt-2 text-center">
                To be processed via PayPal reader after signature
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full text-xl py-6 touch-manipulation"
            disabled={isSubmitting || !signature || !hasReadAgreement}
          >
            {isSubmitting ? 'Saving Agreement...' : 'Complete Agreement & Proceed to Payment'}
          </Button>

          {status !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-6 rounded-sm border-2 ${
                status === 'success'
                  ? 'bg-forest-green/10 border-forest-green text-forest-green'
                  : 'bg-sunset-red/10 border-sunset-red text-sunset-red'
              }`}
            >
              <div className="flex items-start space-x-3">
                {status === 'success' ? (
                  <CheckCircle className="w-8 h-8 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-8 h-8 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-heading text-lg font-bold mb-2">
                    {status === 'success' ? 'Agreement Signed!' : 'Error'}
                  </p>
                  <p className="text-base whitespace-pre-line">{statusMessage}</p>
                </div>
              </div>
            </motion.div>
          )}
        </form>
      </div>
    </motion.div>
  );
}

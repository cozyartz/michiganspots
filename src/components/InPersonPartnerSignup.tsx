import { useState, useRef } from 'react';
import { Mail, User, Building2, MapPin, Phone, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { SignaturePad } from './SignaturePad';
import { getAllTiers, getAvailableDurations } from '../lib/stripe-prices';

interface InPersonPartnerSignupProps {
  partnershipType?: 'chamber' | 'business' | 'community';
}

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

  // Calculate price
  const tierPrice = availableDurations.find(d => d.id === selectedDuration)?.amount || 0;

  const handleSignature = (signatureData: string) => {
    setSignature(signatureData);
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

          // Agreement
          signature,
          hasReadAgreement,

          // Total
          totalPaid: tierPrice,

          // Mark as pending payment (to be collected via PayPal reader)
          paymentMethod: 'in_person_paypal',
          paymentStatus: 'pending'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setStatusMessage(`Agreement signed successfully! Confirmation ID: ${data.confirmationId || 'N/A'}\n\nAmount to collect: $${tierPrice}\n\nPlease process payment via PayPal reader.`);

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

          {/* SECTION 3: Agreement Review & Signature */}
          <div className="border-2 border-copper-orange p-6 rounded-sm bg-copper-orange/5">
            <h3 className="font-heading text-2xl font-bold text-ink-primary mb-6 flex items-center">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-copper-orange text-parchment-base mr-3 text-lg">3</span>
              Partnership Agreement
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
                    <p>Amount: <strong>${tierPrice}</strong></p>

                    <h5 className="font-bold text-base mt-6">2. SERVICES PROVIDED</h5>
                    <p>Michigan Spots will provide partnership services as outlined in the selected tier package, including challenge creation, business profile, analytics, and promotional features.</p>

                    <h5 className="font-bold text-base mt-6">3. PAYMENT TERMS</h5>
                    <p>Full payment of ${tierPrice} is due at time of agreement signing. Payment will be collected via PayPal.</p>

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

            {/* Amount Due */}
            <div className="bg-copper-orange/10 border-2 border-copper-orange rounded-sm p-6">
              <div className="flex justify-between items-center">
                <span className="font-heading text-2xl font-bold text-ink-primary">Amount to Collect:</span>
                <span className="font-heading text-4xl font-bold text-copper-orange">${tierPrice}</span>
              </div>
              <p className="text-sm text-ink-secondary mt-2">
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

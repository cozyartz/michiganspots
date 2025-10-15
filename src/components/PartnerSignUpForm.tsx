import { useState, useEffect } from 'react';
import { Mail, User, Building2, MapPin, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './Button';

interface PartnerSignUpFormProps {
  partnershipType: 'chamber' | 'business' | 'community';
  title?: string;
  description?: string;
}

export function PartnerSignUpForm({
  partnershipType,
  title = 'Express Your Interest',
  description = "Not ready for the full application? Let us know you're interested and we'll reach out to discuss options."
}: PartnerSignUpFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // Auto-dismiss success message after 8 seconds
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        setStatus('idle');
        setStatusMessage('');
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('idle');

    try {
      const response = await fetch('/api/partner-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
          organizationName,
          city,
          phone,
          message,
          partnershipType
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setStatusMessage("Thanks for your interest! We'll reach out within 1-2 business days to discuss partnership opportunities.");
        setEmail('');
        setName('');
        setOrganizationName('');
        setCity('');
        setPhone('');
        setMessage('');
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

  const getPlaceholders = () => {
    switch (partnershipType) {
      case 'chamber':
        return {
          org: 'Battle Creek Area Chamber of Commerce',
          name: 'John Smith'
        };
      case 'business':
        return {
          org: 'Fieldstone Coffee Roasters',
          name: 'Sarah Johnson'
        };
      case 'community':
        return {
          org: 'Battle Creek Public Library',
          name: 'Jane Smith'
        };
    }
  };

  const placeholders = getPlaceholders();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
      id="quick-signup"
    >
      <div className="parchment-card">
        <h3 className="font-heading text-2xl font-bold text-ink-primary mb-2 text-center">
          {title}
        </h3>
        <p className="text-sm text-ink-secondary text-center mb-6">
          {description}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder={placeholders.name}
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
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border-2 border-ink-primary rounded-sm bg-parchment-light text-ink-primary focus:outline-none focus:border-copper-orange transition-colors"
                  placeholder="your@email.com"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="organization" className="block text-sm font-heading font-semibold text-ink-primary mb-2">
              Organization Name *
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
                placeholder={placeholders.org}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
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
                  placeholder="Battle Creek"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-heading font-semibold text-ink-primary mb-2">
                Phone (optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-faded" />
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-ink-primary rounded-sm bg-parchment-light text-ink-primary focus:outline-none focus:border-copper-orange transition-colors"
                  placeholder="(269) 555-1234"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-heading font-semibold text-ink-primary mb-2">
              Quick Note (optional)
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border-2 border-ink-primary rounded-sm bg-parchment-light text-ink-primary focus:outline-none focus:border-copper-orange transition-colors resize-none"
              placeholder="Anything you'd like us to know?"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Express Interest'}
          </Button>

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

        <p className="text-xs text-ink-faded text-center mt-4">
          By submitting, you agree to be contacted about partnership opportunities.
        </p>
      </div>
    </motion.div>
  );
}

import { useState, useEffect } from 'react';
import { Mail, User, MapPin, CheckCircle, AlertCircle, Users, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './Button';

interface EmailValidation {
  isValid: boolean;
  severity: 'valid' | 'warning' | 'invalid';
  score: number;
  recommendations: string[];
}

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [userType, setUserType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [emailValidation, setEmailValidation] = useState<EmailValidation | null>(null);
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);

  // Auto-dismiss success message after 8 seconds
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [status]);

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
      setMessage(emailValidation.recommendations[0] || 'Please provide a valid email address.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name, city, userType }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage("You're in! We'll notify you when Michigan Spots launches in October 2025. See you on the trails!");
        setEmail('');
        setName('');
        setCity('');
        setUserType('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
      id="signup"
    >
      <div className="parchment-card">
        <h3 className="font-heading text-2xl font-bold text-ink-primary mb-6 text-center">
          Join the Hunt
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-heading font-semibold text-ink-primary mb-2">
              Name
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
                placeholder="Your name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-heading font-semibold text-ink-primary mb-2">
              Email
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
                placeholder="your@email.com"
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
            <label htmlFor="city" className="block text-sm font-heading font-semibold text-ink-primary mb-2">
              Michigan City
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
                placeholder="Battle Creek, Detroit, Ann Arbor..."
              />
            </div>
          </div>

          <div>
            <label htmlFor="userType" className="block text-sm font-heading font-semibold text-ink-primary mb-2">
              I'm interested as a...
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-faded" />
              <select
                id="userType"
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border-2 border-ink-primary rounded-sm bg-parchment-light text-ink-primary focus:outline-none focus:border-copper-orange transition-colors appearance-none cursor-pointer"
              >
                <option value="">Select your interest...</option>
                <option value="player">Player - I want to discover spots and compete</option>
                <option value="business">Business Owner - I want to sponsor challenges</option>
                <option value="chamber">Chamber of Commerce - I represent a chamber</option>
                <option value="community">Community Organization - Library, park, non-profit</option>
                <option value="other">Just curious / Other</option>
              </select>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Joining...' : 'Get Early Access'}
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
                <p className="font-heading text-sm">{message}</p>
              </div>
            </motion.div>
          )}
        </form>

        <p className="text-xs text-ink-faded text-center mt-4">
          By signing up, you agree to our{' '}
          <a href="/terms" className="text-lakes-blue hover:underline">Terms of Service</a> and{' '}
          <a href="/privacy" className="text-lakes-blue hover:underline">Privacy Policy</a>. You'll receive updates about Michigan Spots challenges and community events.
        </p>
      </div>
    </motion.div>
  );
}

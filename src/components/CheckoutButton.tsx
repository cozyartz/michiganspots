/**
 * Copyright (c) 2025 Cozyartz Media Group d/b/a State Spots
 * Licensed under AGPL-3.0-or-later OR Commercial
 * See LICENSE and LICENSE-COMMERCIAL.md for details
 */

import { useState } from 'react';
import { CreditCard, Loader } from 'lucide-react';
import { Button } from './Button';

interface CheckoutButtonProps {
  email: string;
  name: string;
  organizationName: string;
  tier: 'spot_partner' | 'featured_partner' | 'premium_sponsor' | 'title_sponsor' | 'chamber_tourism';
  duration: 'monthly' | 'quarterly' | 'yearly';
  city?: string;
  phone?: string;
  disabled?: boolean;
  amount?: string;
}

export function CheckoutButton({
  email,
  name,
  organizationName,
  tier,
  duration,
  city,
  phone,
  disabled,
  amount
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!email || !name || !organizationName) {
      setError('Please fill in all required fields first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
          organizationName,
          tier,
          duration,
          city,
          phone
        }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to create checkout session');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleCheckout}
        disabled={disabled || isLoading}
        variant="primary"
        size="lg"
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5 mr-2" />
            {amount ? `Pay ${amount}` : 'Proceed to Payment'}
          </>
        )}
      </Button>

      {error && (
        <div className="p-3 bg-sunset-red/10 border border-sunset-red text-sunset-red rounded-sm text-sm">
          {error}
        </div>
      )}

      <p className="text-xs text-ink-faded text-center">
        Secure payment powered by Stripe • No credit card info stored
      </p>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Settings } from 'lucide-react';
import { cookieManager, type CookiePreferences } from '../utils/cookieManager';

export function CookieOptOut() {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [hasChoice, setHasChoice] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Load current preferences
    const prefs = cookieManager.getPreferences();
    setPreferences(prefs);
    setHasChoice(cookieManager.hasChoiceMade());

    // Listen for preference updates
    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<CookiePreferences>;
      setPreferences(customEvent.detail);
      setHasChoice(true);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    };

    window.addEventListener('cookiePreferencesUpdated', handleUpdate);
    return () => window.removeEventListener('cookiePreferencesUpdated', handleUpdate);
  }, []);

  const handleOptOutAll = () => {
    cookieManager.rejectOptional();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleOpenSettings = () => {
    cookieManager.openSettings();
  };

  if (!hasChoice) {
    return (
      <div className="parchment-card border-2 border-copper-orange">
        <div className="flex items-start space-x-4">
          <Settings className="w-8 h-8 text-copper-orange flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-heading text-xl font-bold text-ink-primary mb-3">
              Manage Your Cookie Preferences
            </h3>
            <p className="text-ink-secondary mb-4">
              You haven't made a cookie choice yet. Click below to open cookie settings or opt out of all optional cookies.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleOpenSettings}
                className="px-6 py-3 bg-copper-orange text-parchment-light font-heading font-bold border-2 border-ink-primary hover:bg-sunset-red transition-colors"
              >
                Open Cookie Settings
              </button>
              <button
                onClick={handleOptOutAll}
                className="px-6 py-3 bg-parchment-light text-ink-primary font-heading font-bold border-2 border-ink-primary hover:bg-parchment-mid transition-colors"
              >
                Opt Out of All Optional Cookies
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="parchment-card border-2 border-lakes-blue">
      <div className="flex items-start space-x-4">
        <Settings className="w-8 h-8 text-lakes-blue flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="font-heading text-xl font-bold text-ink-primary mb-3">
            Your Current Cookie Preferences
          </h3>

          {showSuccess && (
            <div className="mb-4 p-3 bg-forest-green/10 border-2 border-forest-green rounded flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-forest-green" />
              <span className="text-sm font-semibold text-forest-green">
                Cookie preferences updated successfully!
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center justify-between p-3 bg-parchment-light border-2 border-ink-primary rounded">
              <div>
                <div className="font-heading font-bold text-ink-primary">Essential Cookies</div>
                <div className="text-xs text-ink-faded">Required for site function</div>
              </div>
              <CheckCircle className="w-6 h-6 text-forest-green" />
            </div>

            <div className="flex items-center justify-between p-3 bg-parchment-light border-2 border-ink-primary rounded">
              <div>
                <div className="font-heading font-bold text-ink-primary">Functional Cookies</div>
                <div className="text-xs text-ink-faded">Preferences & settings</div>
              </div>
              {preferences?.functional ? (
                <CheckCircle className="w-6 h-6 text-forest-green" />
              ) : (
                <XCircle className="w-6 h-6 text-sunset-red" />
              )}
            </div>

            <div className="flex items-center justify-between p-3 bg-parchment-light border-2 border-ink-primary rounded">
              <div>
                <div className="font-heading font-bold text-ink-primary">Analytics Cookies</div>
                <div className="text-xs text-ink-faded">Usage & performance</div>
              </div>
              {preferences?.analytics ? (
                <CheckCircle className="w-6 h-6 text-forest-green" />
              ) : (
                <XCircle className="w-6 h-6 text-sunset-red" />
              )}
            </div>

            <div className="flex items-center justify-between p-3 bg-parchment-light border-2 border-ink-primary rounded">
              <div>
                <div className="font-heading font-bold text-ink-primary">Marketing Cookies</div>
                <div className="text-xs text-ink-faded">Campaigns & tracking</div>
              </div>
              {preferences?.marketing ? (
                <CheckCircle className="w-6 h-6 text-forest-green" />
              ) : (
                <XCircle className="w-6 h-6 text-sunset-red" />
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleOpenSettings}
              className="px-6 py-3 bg-lakes-blue text-parchment-light font-heading font-bold border-2 border-ink-primary hover:bg-lakes-light transition-colors"
            >
              Change Settings
            </button>
            <button
              onClick={handleOptOutAll}
              className="px-6 py-3 bg-parchment-light text-ink-primary font-heading font-bold border-2 border-ink-primary hover:bg-parchment-mid transition-colors"
            >
              Opt Out of Optional Cookies
            </button>
          </div>

          <p className="text-xs text-ink-faded mt-4">
            Changes take effect immediately. Essential cookies cannot be disabled as they are required for the site to function.
          </p>
        </div>
      </div>
    </div>
  );
}

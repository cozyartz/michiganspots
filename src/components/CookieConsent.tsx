/**
 * Copyright (c) 2025 Cozyartz Media Group d/b/a State Spots
 * Licensed under AGPL-3.0-or-later OR Commercial
 * See LICENSE and LICENSE-COMMERCIAL.md for details
 */

import { useState, useEffect } from 'react';
import { X, Cookie, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cookieManager, type CookiePreferences, defaultPreferences } from '../utils/cookieManager';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    // Check if user has already made a choice
    const savedPreferences = cookieManager.getPreferences();
    if (!savedPreferences) {
      // Show banner after a short delay
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      setPreferences(savedPreferences);
    }

    // Listen for reopening settings (from footer link or other pages)
    const handleReopenSettings = () => {
      const savedPrefs = cookieManager.getPreferences();
      if (savedPrefs) {
        setPreferences(savedPrefs);
      }
      setShowBanner(true);
      setShowSettings(true);
    };

    // Use custom event listener
    window.addEventListener('openCookieSettings', handleReopenSettings as EventListener);
    return () => window.removeEventListener('openCookieSettings', handleReopenSettings as EventListener);
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    cookieManager.savePreferences(prefs);
    setPreferences(prefs);
    setShowBanner(false);
    setShowSettings(false);
  };

  const acceptAll = () => {
    cookieManager.acceptAll();
    setShowBanner(false);
    setShowSettings(false);
  };

  const rejectOptional = () => {
    cookieManager.rejectOptional();
    setShowBanner(false);
    setShowSettings(false);
  };

  const saveCustom = () => {
    savePreferences(preferences);
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
      >
        <div className="max-w-6xl mx-auto">
          <div className="parchment-card shadow-2xl border-4 border-ink-primary">
            {!showSettings ? (
              // Simple banner
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <Cookie className="w-8 h-8 text-copper-orange flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-heading text-xl font-bold text-ink-primary mb-2">
                      We Value Your Privacy
                    </h3>
                    <p className="text-sm text-ink-secondary leading-relaxed">
                      Michigan Spots uses cookies to enhance your experience, analyze site usage, and support our partners. Essential cookies are required for the platform to function. You can customize your preferences or accept all cookies.
                    </p>
                    <a
                      href="/cookies"
                      className="text-sm text-lakes-blue hover:underline mt-2 inline-block"
                    >
                      Learn more about cookies
                    </a>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <button
                    onClick={() => setShowSettings(true)}
                    className="px-6 py-3 border-2 border-ink-primary bg-parchment-light text-ink-primary font-heading font-semibold hover:bg-parchment-mid transition-colors flex items-center justify-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Customize
                  </button>
                  <button
                    onClick={rejectOptional}
                    className="px-6 py-3 border-2 border-ink-primary bg-parchment-light text-ink-primary font-heading font-semibold hover:bg-parchment-mid transition-colors"
                  >
                    Reject Optional
                  </button>
                  <button
                    onClick={acceptAll}
                    className="px-6 py-3 border-2 border-ink-primary bg-copper-orange text-parchment-light font-heading font-bold hover:bg-sunset-red transition-colors"
                  >
                    Accept All
                  </button>
                </div>
              </div>
            ) : (
              // Detailed settings
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Cookie className="w-8 h-8 text-copper-orange" />
                    <h3 className="font-heading text-2xl font-bold text-ink-primary">
                      Cookie Preferences
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-2 hover:bg-parchment-light rounded transition-colors"
                    aria-label="Close settings"
                  >
                    <X className="w-6 h-6 text-ink-primary" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  {/* Essential Cookies */}
                  <div className="p-4 bg-parchment-light border-2 border-ink-primary rounded">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-heading text-lg font-bold text-ink-primary">
                            Essential Cookies
                          </h4>
                          <span className="text-xs px-2 py-1 bg-forest-green text-parchment-light font-semibold rounded">
                            Required
                          </span>
                        </div>
                        <p className="text-sm text-ink-secondary">
                          Necessary for the platform to function. These cookies enable core features like security, authentication, and form functionality. They cannot be disabled.
                        </p>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={true}
                          disabled
                          className="w-5 h-5 cursor-not-allowed opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Functional Cookies */}
                  <div className="p-4 bg-parchment-light border-2 border-ink-primary rounded">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-heading text-lg font-bold text-ink-primary mb-2">
                          Functional Cookies
                        </h4>
                        <p className="text-sm text-ink-secondary">
                          Enhance functionality and personalization. These remember your preferences like city selection, display settings, and UI state to improve your experience.
                        </p>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={preferences.functional}
                          onChange={(e) =>
                            setPreferences({ ...preferences, functional: e.target.checked })
                          }
                          className="w-5 h-5 cursor-pointer accent-copper-orange"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Analytics Cookies */}
                  <div className="p-4 bg-parchment-light border-2 border-ink-primary rounded">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-heading text-lg font-bold text-ink-primary mb-2">
                          Analytics Cookies
                        </h4>
                        <p className="text-sm text-ink-secondary">
                          Help us understand how users interact with the platform. We use Cloudflare Analytics to track page views, popular features, and performance. Data is anonymized and aggregated.
                        </p>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={preferences.analytics}
                          onChange={(e) =>
                            setPreferences({ ...preferences, analytics: e.target.checked })
                          }
                          className="w-5 h-5 cursor-pointer accent-copper-orange"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Marketing Cookies */}
                  <div className="p-4 bg-parchment-light border-2 border-ink-primary rounded">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-heading text-lg font-bold text-ink-primary mb-2">
                          Marketing Cookies
                        </h4>
                        <p className="text-sm text-ink-secondary">
                          Track campaign effectiveness and measure how you found Michigan Spots. Help us understand which marketing channels work best to support partners and grow the community.
                        </p>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={preferences.marketing}
                          onChange={(e) =>
                            setPreferences({ ...preferences, marketing: e.target.checked })
                          }
                          className="w-5 h-5 cursor-pointer accent-copper-orange"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  <button
                    onClick={rejectOptional}
                    className="px-6 py-3 border-2 border-ink-primary bg-parchment-light text-ink-primary font-heading font-semibold hover:bg-parchment-mid transition-colors"
                  >
                    Reject Optional
                  </button>
                  <button
                    onClick={saveCustom}
                    className="px-6 py-3 border-2 border-ink-primary bg-copper-orange text-parchment-light font-heading font-bold hover:bg-sunset-red transition-colors"
                  >
                    Save Preferences
                  </button>
                </div>

                <p className="text-xs text-ink-faded text-center mt-4">
                  You can change your preferences anytime by clicking "Cookie Settings" in the footer.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

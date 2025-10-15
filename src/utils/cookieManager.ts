// Cookie Management Utility
// Provides global cookie preference management

export interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export const defaultPreferences: CookiePreferences = {
  essential: true,
  functional: false,
  analytics: false,
  marketing: false,
};

const STORAGE_KEY = 'cookiePreferences';

export const cookieManager = {
  // Get current preferences
  getPreferences(): CookiePreferences | null {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  },

  // Save preferences
  savePreferences(prefs: CookiePreferences): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent('cookiePreferencesUpdated', { detail: prefs }));
  },

  // Check if user has made a choice
  hasChoiceMade(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) !== null;
  },

  // Accept all cookies
  acceptAll(): void {
    this.savePreferences({
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    });
  },

  // Reject optional cookies
  rejectOptional(): void {
    this.savePreferences({
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
    });
  },

  // Open settings modal
  openSettings(): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('openCookieSettings'));
  },

  // Clear preferences (for testing)
  clearPreferences(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  },
};

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).cookieManager = cookieManager;
}

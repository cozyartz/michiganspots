// Michigan Spots Design System
// Matches michiganspots.com branding

export const lightTheme = {
  colors: {
    copper: '#9B7B7B',      // Rose pewter (muted metallic)
    copperLight: '#B89898', // Light rose pewter
    copperDark: '#7D6262',  // Dark rose pewter
    cyan: {
      primary: '#4A9B94',   // Steel teal (refined lakes)
      dark: '#367873',      // Dark steel teal
      light: '#6BB5AD',     // Light steel teal
      glow: '#5DADA5',      // Steel teal glow
    },
    amber: {
      primary: '#B89898',   // Rose pewter light
      light: '#CDB1B1',     // Very light rose pewter
      dark: '#9B7B7B',      // Rose pewter
    },
    coral: {
      primary: '#9B8B8B',   // Neutral warm gray
      light: '#B5A8A8',     // Light warm gray
      dark: '#7D6F6F',      // Dark warm gray
    },
    forest: {
      primary: '#36766A',   // Slate green (refined)
      dark: '#2B5E54',      // Dark slate green
      light: '#4A8E80',     // Light slate green
    },
    ink: {
      primary: '#2C1810',
      secondary: '#5C4033',
    },
    background: '#FAFAF9',
    card: '#FFFFFF',
    border: '#E7E5E4',
    text: '#1F1F1F',
    textSecondary: '#6B7280',
    secondary: '#F3F4F6',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  },
};

export const darkTheme = {
  colors: {
    copper: '#B89898',      // Light rose pewter (brighter for dark mode)
    copperLight: '#CDB1B1', // Very light rose pewter
    copperDark: '#9B7B7B',  // Rose pewter
    cyan: {
      primary: '#6BB5AD',   // Light steel teal (brighter for dark mode)
      dark: '#4A9B94',      // Steel teal
      light: '#8CCBC4',     // Very light steel teal
      glow: '#7DC2BA',      // Steel teal bright glow
    },
    amber: {
      primary: '#CDB1B1',   // Very light rose pewter
      light: '#DCC5C5',     // Ultra light rose pewter
      dark: '#B89898',      // Light rose pewter
    },
    coral: {
      primary: '#B5A8A8',   // Light warm gray (brighter for dark mode)
      light: '#C9BFBF',     // Very light warm gray
      dark: '#9B8B8B',      // Neutral warm gray
    },
    forest: {
      primary: '#4A8E80',   // Light slate green (brighter for dark mode)
      dark: '#36766A',      // Slate green
      light: '#5FA59A',     // Very light slate green
    },
    ink: {
      primary: '#F5F5F4',
      secondary: '#D6D3D1',
    },
    background: '#1A1A1A',
    card: '#2D2D2D',
    border: '#4A4A4A',
    text: '#E5E5E5',
    textSecondary: '#A0A0A0',
    secondary: '#3A3A3A',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.4)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.4)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
  },
};

// Helper function to get theme
export const getTheme = (isDark: boolean) => isDark ? darkTheme : lightTheme;

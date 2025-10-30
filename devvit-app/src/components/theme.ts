// Michigan Spots Design System
// Matches michiganspots.com branding

export const lightTheme = {
  colors: {
    copper: '#D2691E',
    copperLight: '#E88A3F',
    copperDark: '#A0521A',
    cyan: {
      primary: '#06B6D4',
      dark: '#0891B2',
      light: '#67E8F9',
      glow: '#22D3EE',
    },
    amber: {
      primary: '#F59E0B',
      light: '#FCD34D',
      dark: '#D97706',
    },
    coral: {
      primary: '#FB7185',
      light: '#FDA4AF',
      dark: '#E11D48',
    },
    forest: {
      primary: '#10B981',
      dark: '#059669',
      light: '#34D399',
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
    copper: '#969696',
    copperLight: '#B0B0B0',
    copperDark: '#7A7A7A',
    cyan: {
      primary: '#22D3EE',
      dark: '#06B6D4',
      light: '#67E8F9',
      glow: '#67E8F9',
    },
    amber: {
      primary: '#FCD34D',
      light: '#FDE68A',
      dark: '#F59E0B',
    },
    coral: {
      primary: '#FDA4AF',
      light: '#FECDD3',
      dark: '#FB7185',
    },
    forest: {
      primary: '#34D399',
      dark: '#10B981',
      light: '#6EE7B7',
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

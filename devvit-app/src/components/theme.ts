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
    },
    ink: {
      primary: '#2C1810',
      secondary: '#5C4033',
    },
    background: '#FAFAF9',
    card: '#FFFFFF',
    border: '#E7E5E4',
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
    copper: '#E88A3F',
    copperLight: '#FFA860',
    copperDark: '#D2691E',
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
    },
    ink: {
      primary: '#F5F5F4',
      secondary: '#D6D3D1',
    },
    background: '#1C1917',
    card: '#292524',
    border: '#44403C',
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

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Modern light backgrounds - clean and fresh
        parchment: {
          light: '#FAFBFC',      // Ultra-light background
          mid: '#F5F7FA',        // Soft card background
          dark: '#E8ECF1',       // Subtle borders/dividers
        },
        // Primary text colors - deep purple/navy for sophistication
        ink: {
          primary: '#1A0B2E',    // Deep purple-navy (from logo interior)
          secondary: '#3D2963',  // Medium purple
          faded: '#6B5B8C',      // Light purple for subtle text
        },
        // Cyan/Turquoise - Your logo's signature color
        cyan: {
          primary: '#41C6BB',    // Main cyan (your preferred color)
          light: '#9CEDE1',      // Light cyan (your other preferred color)
          dark: '#2BA89E',       // Darker cyan for hover states
          glow: '#5FD9D1',       // Mid-tone for glows/shadows
        },
        // Legacy "lakes" mapped to cyan for compatibility
        lakes: {
          blue: '#41C6BB',       // Now cyan
          light: '#9CEDE1',      // Light cyan
        },
        // Golden amber - warm accent from logo
        amber: {
          primary: '#FFB800',    // Rich amber
          light: '#FFC933',      // Light amber
          dark: '#E6A600',       // Deep amber
        },
        // Keep gold mapped to amber for compatibility
        gold: {
          treasure: '#FFB800',
        },
        // Coral/Pink - vibrant accent from logo outline
        coral: {
          primary: '#FF6B9D',    // Bright coral-pink
          light: '#FFB3D1',      // Soft pink
          dark: '#E5527D',       // Deep coral
        },
        // Orange accent - warm pop from logo
        orange: {
          primary: '#FF8C42',    // Vibrant orange
          light: '#FFB380',      // Soft orange
          dark: '#E67A35',       // Deep orange
        },
        // Legacy copper mapped to new orange
        copper: {
          orange: '#FF8C42',
        },
        // Legacy sunset - now mapped to coral
        sunset: {
          red: '#FF6B9D',
        },
        // Forest green - keep for Michigan nature references
        forest: {
          green: '#2D7A5F',      // Slightly more vibrant green
        },
      },
      fontFamily: {
        display: ['Crimson Pro', 'Georgia', 'serif'],
        heading: ['Merriweather', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        decorative: ['Pirata One', 'cursive'],
        handwritten: ['Caveat', 'cursive'],
      },
      backgroundImage: {
        'parchment-texture': "url('/textures/parchment.png')",
      },
    },
  },
  plugins: [],
};

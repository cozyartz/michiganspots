/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class', // Enable dark mode with class strategy
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
        // Steel Teal - Refined lakes blue (Michigan Great Lakes, sophisticated)
        cyan: {
          primary: '#4A9B94',    // Steel teal (desaturated, professional)
          light: '#6BB5AD',      // Light steel teal
          dark: '#367873',       // Dark steel teal for hover states
          glow: '#5DADA5',       // Mid-tone for glows/shadows
        },
        // Legacy "lakes" mapped to steel teal for compatibility
        lakes: {
          blue: '#4A9B94',       // Steel teal
          light: '#6BB5AD',      // Light steel teal
        },
        // Rose Pewter - Muted metallic (replaces amber/gold for sophistication)
        amber: {
          primary: '#B89898',    // Rose pewter light (warm metallic)
          light: '#CDB1B1',      // Very light rose pewter
          dark: '#9B7B7B',       // Rose pewter (main accent)
        },
        // Keep gold mapped to rose pewter for compatibility
        gold: {
          treasure: '#B89898',   // Rose pewter light
        },
        // Neutral warm gray - Muted accent (replaces bright coral)
        coral: {
          primary: '#9B8B8B',    // Neutral warm gray
          light: '#B5A8A8',      // Light warm gray
          dark: '#7D6F6F',       // Dark warm gray
        },
        // Rose Pewter - Primary warm accent (replaces loud orange)
        orange: {
          primary: '#9B7B7B',    // Rose pewter (muted rose-gold)
          light: '#B89898',      // Light rose pewter
          dark: '#7D6262',       // Dark rose pewter
        },
        // Legacy copper mapped to rose pewter
        copper: {
          orange: '#9B7B7B',     // Rose pewter
        },
        // Legacy sunset - now mapped to neutral warm gray
        sunset: {
          red: '#9B8B8B',        // Neutral warm gray
        },
        // Slate green - Refined forest (Michigan forests, sophisticated)
        forest: {
          green: '#36766A',      // Slate green (cooler, more refined)
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

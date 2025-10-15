/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        parchment: {
          light: '#F4EFE5',
          mid: '#E8DCC8',
          dark: '#D4C5A9',
        },
        ink: {
          primary: '#2C1810',
          secondary: '#5C4A3A',
          faded: '#8B7865',
        },
        lakes: {
          blue: '#1E5A8E',
          light: '#4A8BC2',
        },
        forest: {
          green: '#2D5016',
        },
        copper: {
          orange: '#D97642',
        },
        gold: {
          treasure: '#D4AF37',
        },
        sunset: {
          red: '#A83C3C',
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

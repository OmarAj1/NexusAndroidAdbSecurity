/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        void: '#020617',
        surface: '#1e293b',
        accent: '#8b5cf6',
        safe: '#06b6d4',
        danger: '#ef4444',
      },
      // UPDATED SPACING WITH LARGER DEFAULTS
      spacing: {
        'safe-top': 'env(safe-area-inset-top, 5px)',      // Clears Status Bar
        'safe-bottom': 'env(safe-area-inset-bottom, 5px)', // Clears Nav Buttons
      },
      animation: {
        'press': 'press 0.1s ease-out',
      },
      keyframes: {
        press: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(0.96)' },
        }
      }
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 1. Custom Color Palette (Neon on Void)
      colors: {
        void: '#020617',    // Deep Navy/Black Background
        surface: '#1e293b', // Card Background (Slate 800)
        accent: '#8b5cf6',  // Purple Glow (Primary Action)
        safe: '#06b6d4',    // Cyan (Secure State)
        danger: '#ef4444',  // Red (Unsafe State/Action)
      },
      // 2. Custom Safe Area Spacing (for Phones with Notches)
      spacing: {
        'safe': 'env(safe-area-inset-bottom, 20px)',
      },
      // 3. Button Press Animation
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
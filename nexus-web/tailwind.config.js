/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // SEMANTIC COLORS (Use these everywhere)
        main: 'var(--bg-main)',
        card: 'var(--bg-card)',
        input: 'var(--bg-input)',

        body: 'var(--text-body)',
        muted: 'var(--text-muted)',

        border: 'var(--border-base)',

        // DYNAMIC STATUS COLORS
        accent: 'var(--color-accent)',
        safe: 'var(--color-safe)',
        danger: 'var(--color-danger)',
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
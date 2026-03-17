/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        bg: '#0A0A0F',
        surface: '#13131A',
        border: '#1E1E2A',
        amber: '#E8A030',
        muted: '#6A6070',
      },
    },
  },
  plugins: [],
}

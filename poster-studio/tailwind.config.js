/** @type {import('tailwindcss').Config} */
// UI chrome shares the Notice App's design tokens (see
// ../bengali-notice-app/style.css :root) so both sections read as one product.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        ui: ['"Noto Sans Bengali"', '"Hind Siliguri"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        bengali: ['"Hind Siliguri"', '"Noto Sans Bengali"', 'sans-serif'],
        display: ['"Tiro Bangla"', '"Noto Serif Bengali"', 'serif'],
      },
      colors: {
        ink: { DEFAULT: '#1c1c1c', soft: '#4a4a4a', mute: '#8a8f9c' },
        ui: { bg: '#f4f5f8', card: '#ffffff', line: '#dfe2ea' },
        navy: { DEFAULT: '#16225c', dark: '#0f1940', soft: '#e9ecf7' },
        brand: { green: '#1e7d37', greenDark: '#145c28', red: '#cf1414', gold: '#b8860b', cream: '#faf7ee' },
      },
      boxShadow: {
        poster: '0 24px 50px -18px rgba(15, 25, 64, 0.45)',
        card: '0 1px 2px rgba(15,25,64,0.06), 0 6px 18px -10px rgba(15,25,64,0.18)',
        pop: '0 10px 30px -8px rgba(15,25,64,0.35)',
      },
      borderRadius: { xl2: '14px' },
    },
  },
  plugins: [],
}

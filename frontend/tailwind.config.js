/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Topli, „papirni" beli sistem — dosije a ne dashboard-šablon.
        paper: '#FFFFFF',
        surface: { DEFAULT: '#F6F5F1', deep: '#EDEBE4' },
        line: { DEFAULT: '#E4E2DA', strong: '#CFCCC1' },
        ink: { DEFAULT: '#14161A', muted: '#5C6068', faint: '#8D9099' },
        // Akcenat je boja zaštitne opreme: signalno narandžasta.
        safety: {
          50: '#FEF3E9',
          100: '#FBE0C6',
          200: '#F6BC87',
          300: '#F09A4D',
          400: '#E87C1D',
          500: '#D2650B',
          600: '#A94F08',
          700: '#7E3B06',
        },
        signal: {
          ok: '#0F7A3D',
          okBg: '#E7F3EB',
          warn: '#A75C09',
          warnBg: '#FCF1E2',
          danger: '#AF2118',
          dangerBg: '#FBEAE8',
          info: '#1B558F',
          infoBg: '#E8F0F8',
        },
      },
      fontFamily: {
        sans: ['"Inter Tight"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        eyebrow: ['0.6563rem', { lineHeight: '0.9rem', letterSpacing: '0.14em' }],
        micro: ['0.6875rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        pop: '0 18px 50px -12px rgba(20, 22, 26, 0.28)',
        rail: '1px 0 0 0 #E4E2DA',
      },
      borderRadius: { card: '3px' },
      keyframes: {
        ticker: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        rise: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        pop: { from: { opacity: '0', transform: 'translateY(10px) scale(.985)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: {
        ticker: 'ticker 44s linear infinite',
        rise: 'rise .22s ease-out both',
        pop: 'pop .18s ease-out both',
      },
    },
  },
  plugins: [],
};

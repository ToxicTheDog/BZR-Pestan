/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: {
        // Tablet u pejzažu (iPad 11" je 1180–1194 px) — tu dosije kolona
        // još uvek ima smisla, a Tailwind-ov `xl` (1280) je promašuje.
        tablet: '1120px',
      },
      colors: {
        // Topli, „papirni" beli sistem — dosije a ne dashboard-šablon.
        paper: '#FFFFFF',
        surface: { DEFAULT: '#F6F5F1', deep: '#EDEBE4' },
        line: { DEFAULT: '#E4E2DA', strong: '#CFCCC1' },
        // `faint` je namerno tamniji nego što izgleda „elegantno“ — na tabletu
        // pod halogenim svetlom svetlo siva na beloj se jednostavno ne čita.
        ink: { DEFAULT: '#14161A', muted: '#50545C', faint: '#6E727C' },
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
        eyebrow: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.12em' }],
        micro: ['0.75rem', { lineHeight: '1.15rem' }],
      },
      boxShadow: {
        pop: '0 18px 50px -12px rgba(20, 22, 26, 0.28)',
        rail: '1px 0 0 0 #E4E2DA',
      },
      borderRadius: { card: '3px' },
      keyframes: {
        rise: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        // Bez `transform` — element sa transformacijom postaje containing block
        // za `position: fixed` potomke, pa bi omotač strane sekao modale i fioke.
        fade: { from: { opacity: '0' }, to: { opacity: '1' } },
        pop: { from: { opacity: '0', transform: 'translateY(10px) scale(.985)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: {
        rise: 'rise .22s ease-out both',
        fade: 'fade .2s ease-out both',
        pop: 'pop .18s ease-out both',
      },
    },
  },
  plugins: [],
};

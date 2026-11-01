import type { Config } from 'tailwindcss';

/**
 * Hassan's Toys World design system tokens.
 * Brand colours come straight from the brief:
 *   pink #FF6B9D · yellow #FFD93D · blue #49C1FF · purple #A78BFA · cream #FFF7E6 · navy #29254D
 * `600/700` shades are darker variants that keep white text readable (WCAG AA).
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pink: {
          50: '#FFF0F5',
          100: '#FFE0EB',
          200: '#FFC2D7',
          DEFAULT: '#FF6B9D',
          600: '#D93B72',
          700: '#B8285C',
        },
        yellow: {
          50: '#FFF9DB',
          100: '#FFF1B0',
          200: '#FFE97A',
          DEFAULT: '#FFD93D',
          600: '#E0B400',
        },
        blue: {
          50: '#EAF8FF',
          100: '#D2F0FF',
          200: '#A5E1FF',
          DEFAULT: '#49C1FF',
          600: '#0F86C4',
        },
        purple: {
          50: '#F4F0FF',
          100: '#E9E1FF',
          200: '#D3C4FD',
          DEFAULT: '#A78BFA',
          600: '#6D4BD8',
        },
        cream: {
          DEFAULT: '#FFF7E6',
          dark: '#FFEFCC',
        },
        navy: {
          DEFAULT: '#29254D',
          700: '#3B3668',
          500: '#5B5688',
          300: '#9A96BD',
          100: '#E6E4F2',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'var(--font-display-ar)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'var(--font-body-ar)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
        blob: '2rem',
      },
      boxShadow: {
        soft: '0 8px 24px -10px rgba(41, 37, 77, 0.22)',
        lift: '0 18px 40px -16px rgba(41, 37, 77, 0.32)',
        pink: '0 12px 28px -10px rgba(217, 59, 114, 0.55)',
        inset: 'inset 0 -3px 0 rgba(41, 37, 77, 0.08)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(-2deg)' },
          '50%': { transform: 'translateY(-10px) rotate(2deg)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-6deg)' },
          '50%': { transform: 'rotate(6deg)' },
        },
        pop: {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '70%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        'fade-up': {
          '0%': { transform: 'translateY(14px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
        },
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
        wiggle: 'wiggle 1.4s ease-in-out infinite',
        pop: 'pop 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.3) both',
        'fade-up': 'fade-up 0.5s ease-out both',
        marquee: 'marquee 28s linear infinite',
        twinkle: 'twinkle 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;

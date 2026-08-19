import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-jakarta)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Soft, warm, lightly romantic palette
        cream: '#FBF7F4',
        sand: '#F2E9E4',
        blush: '#E8C7C8',
        rose: '#C98B8E',
        wine: '#8C5B62',
        ink: '#4A3F41',
        mist: '#9C9490',
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgba(140, 91, 98, 0.20)',
        card: '0 2px 20px -8px rgba(74, 63, 65, 0.15)',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '60%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        pop: 'pop 0.35s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;

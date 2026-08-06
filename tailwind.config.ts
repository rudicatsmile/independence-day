import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        merdeka: {
          red: '#D9272D',
          crimson: '#991B1E',
          deep: '#600C0E',
          gold: '#F59E0B',
          'gold-light': '#FDE047',
          dark: '#0B0F19',
          surface: '#131A2A',
          card: 'rgba(255, 255, 255, 0.05)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        display: ['var(--font-display)', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 25px -5px rgba(217, 39, 45, 0.5)',
        'gold-glow': '0 0 25px -5px rgba(245, 158, 11, 0.6)',
      },
      animation: {
        'flag-wave': 'flagWave 3s ease-in-out infinite',
        'gold-pulse': 'goldPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 4s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'marquee': 'marquee 15s linear infinite',
      },
      keyframes: {
        flagWave: {
          '0%, 100%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(3deg) scale(1.02)' },
        },
        goldPulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(217, 39, 45, 0.4)' },
          '50%': { boxShadow: '0 0 35px rgba(245, 158, 11, 0.7)' },
        },
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;

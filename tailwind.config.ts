import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#0a0f1a',
        'deep-ocean': '#0d1b2e',
        slate: {
          DEFAULT: '#1a2a3e',
          800: '#16233544',
        },
        teal: '#1e6e6b',
        emerald: '#2dac72',
        gold: '#c9a84c',
        cream: '#f5f0e8',
        mist: '#b8c4d0',
        cyan: '#3ecfb2',
      },
      fontFamily: {
        heading: ['Cinzel', 'serif'],
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        label: ['"DM Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(10,15,26,0.06), 0 1px 6px rgba(10,15,26,0.06)',
        panel: '0 8px 30px rgba(10,15,26,0.35)',
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
};

export default config;

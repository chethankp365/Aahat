/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rail: {
          dark: '#0a0d14',
          panel: '#101726',
          glass: 'rgba(16, 23, 38, 0.75)',
          border: 'rgba(56, 189, 248, 0.2)',
          accent: '#06b6d4',
          cyan: '#22d3ee',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
          violet: '#8b5cf6'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'cyan-glow': '0 0 20px rgba(6, 182, 212, 0.35)',
        'rose-glow': '0 0 20px rgba(244, 63, 94, 0.45)',
        'glass-panel': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 4s linear infinite',
        'radar-sweep': 'radar 2s linear infinite'
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' }
        }
      }
    },
  },
  plugins: [],
}

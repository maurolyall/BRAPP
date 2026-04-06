import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Comfortaa', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.93)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out both',
        'scale-in': 'scale-in 0.4s ease-out both',
      },
      colors: {
        primary: 'var(--primary-red)',
        background: 'var(--bg-body)',
        card: 'var(--bg-cards)',
        text: 'var(--text-dark)',
        muted: 'var(--text-muted)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 8px 20px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 12px 30px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}

export default config

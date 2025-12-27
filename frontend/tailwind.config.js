/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Playfair Display', 'serif'],
        aeonik: ['Aeonik', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
      },
      colors: {
        // New light, Claude-like palette
        'cv-bg': '#FAF0E6',            // cream background
        'cv-text': '#374151',          // dark grey text
        'cv-muted': '#6B7280',         // muted text
        'cv-border': '#E5E7EB',        // light gray borders
        'cv-card': '#FFFFFF',          // card background
        'cv-accent': '#D97706',        // rust/orange accent
        'cv-accent-strong': '#C2410C', // stronger rust
        'cv-black': '#374151',         // dark grey (changed from pure black)
        'cricket-green': '#10b981',
        'cricket-green-bright': '#34d399',
        'cricket-blue': '#3b82f6',
        'cricket-blue-bright': '#60a5fa',
        'cricket-purple': '#8b5cf6',
        'cricket-orange': '#f59e0b',
        'cricket-dark': '#1e293b',
        'cricket-darker': '#0f172a',
        'cricket-card': '#1e293b',
        'cricket-card-hover': '#334155',
        'cricket-text': '#f1f5f9',
        'cricket-text-muted': '#cbd5e1',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'fade-in-delay': 'fade-in 0.5s ease-out 0.2s forwards',
        'fade-in-delay-2': 'fade-in 0.5s ease-out 0.4s forwards',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': {
            opacity: 1,
            boxShadow: '0 0 10px rgba(0,0,0,0.06)',
          },
          '50%': {
            opacity: 0.9,
            boxShadow: '0 0 16px rgba(0,0,0,0.08)',
          },
        },
        'slide-up': {
          '0%': {
            transform: 'translateY(10px)',
            opacity: 0,
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: 1,
          },
        },
        'shimmer': {
          '0%': {
            backgroundPosition: '-1000px 0',
          },
          '100%': {
            backgroundPosition: '1000px 0',
          },
        },
        'float': {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
        'fade-in': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
    },
  },
  plugins: [],
}


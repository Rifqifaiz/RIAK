/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1E3A8A',
          pink: '#BE185D',
          'blue-50': 'rgb(var(--c-brand-blue-50) / <alpha-value>)',
          'blue-100': 'rgb(var(--c-brand-blue-100) / <alpha-value>)',
          'pink-50': 'rgb(var(--c-brand-pink-50) / <alpha-value>)',
          'pink-100': 'rgb(var(--c-brand-pink-100) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--c-ink) / <alpha-value>)',
          muted: 'rgb(var(--c-ink-muted) / <alpha-value>)',
        },
        line: 'rgb(var(--c-line) / <alpha-value>)',
        page: 'rgb(var(--c-page) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--c-surface) / <alpha-value>)',
          2: 'rgb(var(--c-surface-2) / <alpha-value>)',
        },
        status: {
          aman: 'rgb(var(--c-aman) / <alpha-value>)',
          'aman-bg': 'rgb(var(--c-aman-bg) / <alpha-value>)',
          siaga: 'rgb(var(--c-siaga) / <alpha-value>)',
          'siaga-bg': 'rgb(var(--c-siaga-bg) / <alpha-value>)',
          terlewat: 'rgb(var(--c-terlewat) / <alpha-value>)',
          'terlewat-bg': 'rgb(var(--c-terlewat-bg) / <alpha-value>)',
        },
        transparency: {
          bersumber: 'rgb(var(--c-lbl-bersumber) / <alpha-value>)',
          kalibrasi: 'rgb(var(--c-lbl-kalibrasi) / <alpha-value>)',
          asumsi: 'rgb(var(--c-lbl-asumsi) / <alpha-value>)',
          ilustrasi: 'rgb(var(--c-lbl-ilustrasi) / <alpha-value>)',
          fiktif: 'rgb(var(--c-lbl-fiktif) / <alpha-value>)',
        }
      },
      fontFamily: {
        display: ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #1E3A8A 0%, #5B2C7A 50%, #BE185D 100%)',
      },
      borderRadius: {
        'card': '24px',
      },
      boxShadow: {
        'card': '0 8px 24px rgba(20, 33, 61, 0.06)',
        'elevated': '0 16px 48px rgba(20, 33, 61, 0.12)',
        'glass': '0 4px 16px rgba(30, 58, 138, 0.15)',
      }
    },
  },
  plugins: [],
}


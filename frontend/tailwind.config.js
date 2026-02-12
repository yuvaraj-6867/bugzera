/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          900: '#0A0E27',
          800: '#161B3D',
          700: '#1E2749',
          600: '#2A3458',
          500: '#3D4A73',
          400: '#556396',
        },
        accent: {
          electric: '#00F0FF',
          neon: '#7B61FF',
          coral: '#FF6B9D',
          lime: '#B4FF39',
        },
        status: {
          success: '#00E676',
          warning: '#FFB800',
          error: '#FF3B30',
          info: '#00B4D8',
        },
      },
      fontFamily: {
        sans: ['Instrument Sans', 'system-ui', 'sans-serif'],
        heading: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0ea5e9',
          secondary: '#6366f1',
          bg: '#030712',
          surface: '#111827',
          border: '#1f2937',
        },
      },
    },
  },
  plugins: [],
};

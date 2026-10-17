/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0a0e1a',
          800: '#111827',
          700: '#1f2937',
        },
        charcoal: {
          900: '#0f1419',
          800: '#1a1f2e',
        },
        electric: {
          blue: '#3b82f6',
        },
      },
    },
  },
  plugins: [],
}

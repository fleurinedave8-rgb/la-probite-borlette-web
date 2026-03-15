/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a73e8',
        secondary: '#f59e0b',
        danger: '#dc2626',
        success: '#16a34a',
        dark: '#2d2d2d',
        sidebar: '#1e1e1e',
      }
    },
  },
  plugins: [],
}

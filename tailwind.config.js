/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6C37',
        secondary: '#1F2937',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      }
    },
  },
  plugins: [],
}
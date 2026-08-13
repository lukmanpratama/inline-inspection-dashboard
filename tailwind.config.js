/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1A0F5A",
        accent: "#FF6A00",
      },
      fontFamily: {
        industrial: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

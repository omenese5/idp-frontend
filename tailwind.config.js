/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}", // <--- ESTA LÍNEA ES CRUCIAL
  ],
  theme: {
    extend: {
      // Aquí agregamos tu color personalizado
      colors: {
        'pastel-green': '#A8E6CF', 
        'zalgodyne-dark': '#1a1a2e',
      }
    },
  },
  plugins: [],
}
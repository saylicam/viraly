/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Palette Cyberpunk Deep Space
        bg: {
          primary: '#0B0B15',   // Noir profond teinté
          secondary: '#1B1B2F', // Violet très sombre
          tertiary: '#2D1B4E',  // Pour les dégradés
        },
        neon: {
          purple: '#8B5CF6',    // Violet Électrique
          magenta: '#EC4899',   // Magenta
          cyan: '#06B6D4',      // Cyan Laser
          blue: '#3B82F6',      // Bleu Roi
          emerald: '#10B981',   // Succès
          ruby: '#F43F5E',      // Danger
        },
        glass: {
          stroke: 'rgba(255, 255, 255, 0.1)',
          highlight: 'rgba(255, 255, 255, 0.2)',
        }
      },
      borderRadius: {
        '3xl': '32px',
      }
    },
  },
  plugins: [],
}








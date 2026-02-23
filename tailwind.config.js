/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        regiss: {
          deep: '#142239',   // Azul Profundo (Fundo)
          magenta: '#D5205D', // Magenta (Ação/Destaque)
          petrol: '#275A80',  // Petróleo (Secundário)
          wine: '#B32F50',    // Vinho (Detalhes)
          card: '#15335E',    // Cartões
          light: '#F1F5F9',   // Texto Claro
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      boxShadow: {
        'neon': '0 0 10px rgba(213, 32, 93, 0.5)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // IMPORTANTE: Permite alternar entre Sol/Lua manualmente
  theme: {
    extend: {
      colors: {
        // AQUI ESTÁ A MÁGICA:
        // Diz ao Tailwind para usar a variável CSS que injetamos no App.tsx
        // Assim, quando você escolhe "Roxo", tudo que é 'bg-primary' vira Roxo.
        primary: 'var(--primary-color)', 
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      // Animações suaves para os menus e modais
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-in': 'slideIn 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        }
      }
    },
  },
  plugins: [],
}
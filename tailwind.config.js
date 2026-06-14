/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#000000",
        accent: {
          DEFAULT: "#6D5DFC",
          hover: "#5b4ee0",
          light: "#EBE9FE",
        },
        secondary: {
          DEFAULT: "#8B5CF6",
          hover: "#7c3aed",
        },
        success: "#10B981",
        warning: "#F59E0B",
        bg: {
          light: "#FAFAFA",
          dark: "#0A0A0A",
        },
        card: {
          light: "#FFFFFF",
          dark: "#121212",
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      animation: {
        'grid-slide': 'grid-slide 20s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-subtle': 'pulse-subtle 4s ease-in-out infinite',
      },
      keyframes: {
        'grid-slide': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(40px)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.8 },
        }
      },
      boxShadow: {
        'premium': '0 8px 30px rgb(0 0 0 / 0.04)',
        'premium-dark': '0 8px 30px rgb(0 0 0 / 0.3)',
        'glass': '0 8px 32px 0 rgba(109, 93, 252, 0.08)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["Rubik", "Heebo", "system-ui", "sans-serif"],
        body: ["Heebo", "system-ui", "sans-serif"],
      },
      colors: {
        bg: {
          DEFAULT: "#F6F2E9",
          dark: "#0F1214",
        },
        surface: {
          1: "#FFFFFF",
          2: "#ECE7DC",
          "1-dark": "#151A1E",
          "2-dark": "#1D2328",
        },
        text: {
          DEFAULT: "#151A1E",
          muted: "#5A5F66",
          dark: "#EDE7DA",
          "dark-muted": "#B9B1A2",
        },
        primary: {
          DEFAULT: "#B79B4A",
          hover: "#A8893E",
          active: "#8A7332",
          contrast: "#0F1214",
        },
        secondary: {
          DEFAULT: "#4E5B3A",
          dark: "#66734A",
        },
        border: {
          DEFAULT: "#D8D1C3",
          dark: "#2C3237",
        },
        danger: "#A33A2B",
        warning: "#B07A2A",
        success: "#3E7C4A",
        info: "#2F5E7A",
      },
      boxShadow: {
        glow: "0 0 20px rgba(183, 155, 74, 0.35)",
        hud: "0 0 0 1px rgba(42, 47, 51, 0.15), 0 18px 30px rgba(10, 12, 14, 0.18)",
      },
      keyframes: {
        'slide-in-from-top': {
          '0%': { transform: 'translateX(-50%) translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(-50%) translateY(0)', opacity: '1' },
        },
        'zoom-in-95': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'progress': {
          '0%': { width: '100%' },
          '100%': { width: '0%' },
        },
      },
      animation: {
        'slide-in-from-top': 'slide-in-from-top 0.3s ease-out',
        'zoom-in-95': 'zoom-in-95 0.2s ease-out',
        'progress': 'progress 5s linear',
      },
    },
  },
  plugins: [],
};


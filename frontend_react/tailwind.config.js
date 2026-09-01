/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          void: "#050711",
          card: "rgba(11, 19, 43, 0.75)",
          panel: "rgba(8, 14, 30, 0.65)",
          border: "rgba(0, 240, 255, 0.25)",
        },
        neon: {
          cyan: "#00F0FF",
          green: "#00FF88",
          orange: "#FF9900",
          red: "#FF0055",
          purple: "#7928CA",
          blue: "#3A86FF",
        }
      },
      fontFamily: {
        hud: ['Orbitron', 'sans-serif'],
        data: ['Rajdhani', 'sans-serif'],
        code: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}

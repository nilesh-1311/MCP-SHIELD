/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        soc: {
          bg: "#060911",
          card: "#0d1322",
          cardHover: "#131b2e",
          border: "#1a243b",
          borderLight: "#263554",
          textMuted: "#7e8da4",
          textLight: "#cbd5e1",
          accentGreen: "#10b981",
          accentAmber: "#f59e0b",
          accentRed: "#ef4444",
          accentBlue: "#3b82f6",
          accentCyan: "#06b6d4",
          accentPurple: "#8b5cf6",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};

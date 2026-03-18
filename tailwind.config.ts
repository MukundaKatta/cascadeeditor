import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cascade: {
          bg: "#1e1e2e",
          surface: "#252536",
          surfaceHover: "#2d2d42",
          border: "#363650",
          text: "#cdd6f4",
          textMuted: "#6c7086",
          primary: "#89b4fa",
          primaryHover: "#74a8fc",
          secondary: "#a6e3a1",
          accent: "#f5c2e7",
          warning: "#f9e2af",
          error: "#f38ba8",
          success: "#a6e3a1",
          info: "#89dceb",
          agent: "#cba6f7",
          copilot: "#94e2d5",
          diff: {
            added: "rgba(166, 227, 161, 0.15)",
            addedLine: "rgba(166, 227, 161, 0.08)",
            removed: "rgba(243, 139, 168, 0.15)",
            removedLine: "rgba(243, 139, 168, 0.08)",
          },
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "cascade-pulse": "cascade-pulse 2s ease-in-out infinite",
        "slide-in": "slide-in 0.2s ease-out",
        "fade-in": "fade-in 0.15s ease-out",
        "shimmer": "shimmer 1.5s infinite",
      },
      keyframes: {
        "cascade-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "slide-in": {
          from: { transform: "translateY(-8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

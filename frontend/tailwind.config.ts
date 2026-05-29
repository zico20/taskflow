import type { Config } from "tailwindcss";

// Tokyo Night-inspired dark palette. #0D1117 background, #58A6FF accent.
const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0D1117",
          subtle: "#161B22",
          muted: "#1C2128",
          elevated: "#21262D",
        },
        border: {
          DEFAULT: "#30363D",
          subtle: "#21262D",
        },
        fg: {
          DEFAULT: "#E6EDF3",
          muted: "#8B949E",
          subtle: "#6E7681",
        },
        accent: {
          DEFAULT: "#58A6FF",
          hover: "#79B8FF",
          subtle: "#1F6FEB",
        },
        success: "#3FB950",
        warning: "#D29922",
        danger: "#F85149",
        priority: {
          low: "#3FB950",
          medium: "#D29922",
          high: "#F85149",
        },
      },
      borderRadius: {
        lg: "0.625rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.18s ease-out",
        "scale-in": "scale-in 0.14s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;

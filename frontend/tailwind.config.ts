import type { Config } from "tailwindcss";

/**
 * Liquid Glass palette.
 *
 * Color values resolve from CSS variables defined in `src/app/globals.css`, so
 * one set of tokens drives BOTH the dark (default) and light themes — the
 * `.light` class on <html> simply swaps the variable values.
 *
 * Channel variables are stored as space-separated RGB (e.g. "88 166 255") and
 * wrapped here as `rgb(var(--x) / <alpha-value>)` so Tailwind's opacity
 * modifiers keep working unchanged across the codebase (bg-accent/60,
 * ring-accent/40, hover:bg-danger/10, bg-bg-subtle/50, …).
 */
const alpha = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

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
          DEFAULT: alpha("--bg"),
          subtle: alpha("--bg-subtle"),
          muted: alpha("--bg-muted"),
          elevated: alpha("--bg-elevated"),
        },
        border: {
          DEFAULT: alpha("--border"),
          subtle: alpha("--border-subtle"),
        },
        fg: {
          DEFAULT: alpha("--fg"),
          muted: alpha("--fg-muted"),
          subtle: alpha("--fg-subtle"),
        },
        accent: {
          DEFAULT: alpha("--accent"),
          hover: alpha("--accent-hover"),
          subtle: alpha("--accent-subtle"),
        },
        success: alpha("--success"),
        warning: alpha("--warning"),
        danger: alpha("--danger"),
        priority: {
          low: alpha("--success"),
          medium: alpha("--warning"),
          high: alpha("--danger"),
        },
      },
      borderRadius: {
        // Generous, squircle-leaning scale.
        sm: "0.5rem",
        md: "0.75rem",
        lg: "1.125rem",
        xl: "1.5rem",
        "2xl": "1.75rem",
      },
      boxShadow: {
        glass: "var(--glass-shadow)",
        "glass-sm": "var(--glass-shadow-sm)",
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
        // Exit counterparts (used by the close transition).
        "fade-out": {
          from: { opacity: "1", transform: "translateY(0)" },
          to: { opacity: "0", transform: "translateY(4px)" },
        },
        "scale-out": {
          from: { opacity: "1", transform: "scale(1)" },
          to: { opacity: "0", transform: "scale(0.97)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.18s ease-out",
        "scale-in": "scale-in 0.14s ease-out",
        "fade-out": "fade-out 0.16s ease-in forwards",
        "scale-out": "scale-out 0.16s ease-in forwards",
      },
    },
  },
  plugins: [],
};

export default config;

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
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        emerald: {
          50: "#ECFDF5", 100: "#D1FAE5", 200: "#A7F3D0", 300: "#6EE7B7",
          400: "#34D399", 500: "#10B981", 600: "#059669", 700: "#047857",
          800: "#065F46", 900: "#064E3B",
        },
        gold: {
          50: "#FFFBEB", 100: "#FEF3C7", 200: "#FDE68A", 300: "#FCD34D",
          400: "#FBBF24", 500: "#F59E0B", 600: "#D97706", 700: "#B45309",
          800: "#92400E", 900: "#78350F",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          secondary: "#F8FAFC",
          tertiary: "#F1F5F9",
          dark: "#0F172A",
          "dark-secondary": "#1E293B",
          "dark-tertiary": "#334155",
        },
        ink: {
          DEFAULT: "#0F172A",
          secondary: "#475569",
          tertiary: "#94A3B8",
          light: "#CBD5E1",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
        card: "0 4px 16px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.02)",
        elevated: "0 8px 32px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.03)",
        modal: "0 20px 60px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.05)",
        glow: "0 0 20px rgba(16,185,129,0.15)",
      },
      animation: {
        "fade-in": "fadeIn 0.35s ease-out forwards",
        "slide-up": "slideUp 0.35s ease-out forwards",
        "slide-down": "slideDown 0.3s ease-out forwards",
        "scale-in": "scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "shimmer": "shimmer 1.5s ease-in-out infinite",
        "float": "float 4s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

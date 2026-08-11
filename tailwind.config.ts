import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design System - DivideAí
        primary: {
          DEFAULT: "#F97316",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        background: {
          DEFAULT: "#FFF7ED",
          dark: "#1C1917",
        },
        card: {
          DEFAULT: "#FFFFFF",
          dark: "#292524",
        },
        foreground: {
          DEFAULT: "#1C1917",
          dark: "#FAFAF9",
        },
        muted: {
          DEFAULT: "#78716C",
          foreground: "#78716C",
        },
        success: {
          DEFAULT: "#16A34A",
          foreground: "#FFFFFF",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

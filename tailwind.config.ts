import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        accent: {
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
        },
      },
      boxShadow: {
        soft: "0 4px 24px -4px rgba(79, 70, 229, 0.12), 0 2px 8px -2px rgba(15, 23, 42, 0.06)",
        glow: "0 0 40px -8px rgba(99, 102, 241, 0.45)",
        card: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -8px rgba(15,23,42,0.12)",
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(135deg, #4f46e5 0%, #7c3aed 45%, #a855f7 100%)",
        "mesh":
          "radial-gradient(at 20% 20%, rgba(99,102,241,0.25) 0, transparent 50%), radial-gradient(at 80% 10%, rgba(168,85,247,0.2) 0, transparent 45%), radial-gradient(at 50% 80%, rgba(59,130,246,0.15) 0, transparent 50%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out both",
        "slide-up": "slideUp 0.5s ease-out both",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

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
          50: "#ecfdf3",
          100: "#d1fae1",
          200: "#a7f0c6",
          300: "#6ee0a3",
          400: "#34c77b",
          500: "#16a75c",
          600: "#0f7a3d",
          700: "#0c6633",
          800: "#0b522b",
          900: "#0a4425",
          950: "#03260f",
        },
        navy: {
          700: "#1e2a4a",
          800: "#152040",
          900: "#0b1533",
        },
        accent: {
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
        },
      },
      boxShadow: {
        soft: "0 4px 24px -4px rgba(15, 122, 61, 0.10), 0 2px 8px -2px rgba(15, 23, 42, 0.06)",
        glow: "0 0 40px -8px rgba(15, 122, 61, 0.35)",
        card: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -8px rgba(15,23,42,0.12)",
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(135deg, #0b522b 0%, #0f7a3d 50%, #34c77b 100%)",
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

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
        sans: ["var(--font-noto)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        navy: {
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },
        ink: { DEFAULT: "#0F172A", muted: "#64748B" },
        line: "#E8EDF2",
        canvas: "#F8FAF9",
        accent: {
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
        },
      },
      boxShadow: {
        soft: "0 4px 24px -4px rgba(5, 150, 105, 0.10), 0 2px 8px -2px rgba(15, 23, 42, 0.06)",
        glow: "0 0 40px -8px rgba(5, 150, 105, 0.30)",
        card: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -8px rgba(15,23,42,0.12)",
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(135deg, #065f46 0%, #059669 50%, #34d399 100%)",
        "mesh":
          "radial-gradient(at 20% 20%, rgba(99,102,241,0.25) 0, transparent 50%), radial-gradient(at 80% 10%, rgba(168,85,247,0.2) 0, transparent 45%), radial-gradient(at 50% 80%, rgba(59,130,246,0.15) 0, transparent 50%)",
      },
      borderRadius: { card: "22px", btn: "16px" },
      transitionDuration: { DEFAULT: "200ms" },
      animation: {
        "modal-in": "modalIn 0.2s ease-out both",
        "backdrop-in": "fadeIn 0.2s ease-out both",
        "fade-in": "fadeIn 0.5s ease-out both",
        "slide-up": "slideUp 0.5s ease-out both",
      },
      keyframes: {
        modalIn: {
          "0%": { opacity: "0", transform: "scale(0.96) translateY(8px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
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

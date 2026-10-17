/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAFAF7",
        surface: "#FFFFFF",
        "surface-subtle": "#F3F1EA",
        border: "#E8E6DF",
        text: {
          primary: "#1F2933",
          secondary: "#52606D",
        },
        primary: {
          DEFAULT: "#0E7C86",
          hover: "#0A6169",
          tint: "#E3F4F5",
        },
        accent: {
          DEFAULT: "#F5A524",
          hover: "#DE8F18",
          tint: "#FEF7EB",
        },
        status: {
          resolved: "#2E8B57",
          "resolved-tint": "#EAF7EE",
          in_progress: "#2F6FDE",
          "in_progress-tint": "#EBF2FC",
          review: "#D98E04",
          "review-tint": "#FEF7EB",
          critical: "#D64545",
          "critical-tint": "#FCEBEB",
          closed: "#7B8794",
          "closed-tint": "#F0F2F5",
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        heading: ["'Plus Jakarta Sans'", "Outfit", "Inter", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(31, 41, 51, 0.05), 0 1px 2px -1px rgba(31, 41, 51, 0.05)",
        card: "0 4px 6px -1px rgba(31, 41, 51, 0.05), 0 2px 4px -2px rgba(31, 41, 51, 0.05)",
        lifted: "0 10px 15px -3px rgba(31, 41, 51, 0.08), 0 4px 6px -4px rgba(31, 41, 51, 0.04)",
      },
      keyframes: {
        "pulse-subtle": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.65 },
        },
        "ripple": {
          "0%": { transform: "scale(0.95)", opacity: 0.8 },
          "100%": { transform: "scale(1.4)", opacity: 0 },
        }
      },
      animation: {
        "pulse-subtle": "pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ripple": "ripple 2s cubic-bezier(0, 0.2, 0.8, 1) infinite",
      }
    },
  },
  plugins: [],
}

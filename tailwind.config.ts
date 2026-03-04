import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#2D5FA6",
          foreground: "#FFFFFF",
          50: "#EBF3FF",
          100: "#CDDDF7",
          200: "#9BBBEF",
          300: "#6999E0",
          400: "#4577D0",
          500: "#2D5FA6",
          600: "#1F4580",
          700: "#162E5C",
          800: "#0E1C38",
          900: "#070E1C",
        },
        secondary: {
          DEFAULT: "#5B94CC",
          foreground: "#1A1A2E",
          50: "#EFF5FC",
          100: "#D4E6F7",
          200: "#A8CCF0",
          300: "#7BB3E8",
          400: "#5B94CC",
          500: "#3F74A8",
          600: "#2D5FA6",
        },
        destructive: {
          DEFAULT: "#E63946",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        surface: "#FFFFFF",
        "text-main": "#1A1A2E",
        danger: "#E63946",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
export default config;

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
          DEFAULT: "#2E6F8F",
          foreground: "#FFFFFF",
          50: "#EAF4FA",
          100: "#C8E4F2",
          200: "#91C8E4",
          300: "#5AADD5",
          400: "#3A94BE",
          500: "#2E6F8F",
          600: "#245F79",
          700: "#1A4A5E",
          800: "#103243",
          900: "#081928",
        },
        secondary: {
          DEFAULT: "#3F8FB5",
          foreground: "#1A1A2E",
          50: "#ECF5FA",
          100: "#C9E4F2",
          200: "#92C9E5",
          300: "#5CAED8",
          400: "#3F8FB5",
          500: "#2D7499",
          600: "#1E5A7A",
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
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#050A14",
          mid: "#0F2940",
          light: "#F8F9FA",
          hover: "#1A1A2E",
        },
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

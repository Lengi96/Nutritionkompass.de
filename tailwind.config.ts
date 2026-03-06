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
          DEFAULT: "#50917B",
          foreground: "#FFFFFF",
          50: "#F1F7F4",
          100: "#E1EFE8",
          200: "#C2DED0",
          300: "#9DC9B5",
          400: "#76AF95",
          500: "#50917B",
          600: "#427865",
          700: "#355F51",
          800: "#27473D",
          900: "#182D27",
        },
        secondary: {
          DEFAULT: "#78A897",
          foreground: "#16241F",
          50: "#F3F8F6",
          100: "#E3EFEA",
          200: "#C7DDD5",
          300: "#A5C7BA",
          400: "#78A897",
          500: "#608A7A",
          600: "#4A6E60",
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
          dark: "#161C1A",
          mid: "#24322D",
          light: "#F6F7F7",
          hover: "#20302A",
        },
        "text-main": "#16241F",
        danger: "#E63946",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;

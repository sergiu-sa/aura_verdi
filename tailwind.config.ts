import type { Config } from "tailwindcss";

const config: Config = {
  // Enable dark mode via a class on the html element
  darkMode: ["class"],
  // Scan all source files for class names
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── Aura Brand Colors ────────────────────────────────────────────────
      colors: {
        // CSS variable bridge for shadcn/ui compatibility
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // ── Aura-specific semantic palette (CSS variable driven) ─────────
        // Values defined in globals.css for both light and dark modes.
        aura: {
          // Identity
          primary: "hsl(var(--aura-primary) / <alpha-value>)",
          "primary-light": "hsl(var(--aura-primary-light) / <alpha-value>)",
          // Backgrounds
          background: "hsl(var(--aura-bg) / <alpha-value>)",
          surface: "hsl(var(--aura-surface) / <alpha-value>)",
          "surface-high": "hsl(var(--aura-surface-high) / <alpha-value>)",
          // Semantic states
          safe: "hsl(var(--aura-safe) / <alpha-value>)",
          "safe-muted": "hsl(var(--aura-safe-muted) / <alpha-value>)",
          warning: "hsl(var(--aura-warning) / <alpha-value>)",
          "warning-muted": "hsl(var(--aura-warning-muted) / <alpha-value>)",
          danger: "hsl(var(--aura-danger) / <alpha-value>)",
          "danger-muted": "hsl(var(--aura-danger-muted) / <alpha-value>)",
          positive: "hsl(var(--aura-positive) / <alpha-value>)",
          // Text
          text: "hsl(var(--aura-text) / <alpha-value>)",
          "text-secondary": "hsl(var(--aura-text-secondary) / <alpha-value>)",
          "text-dim": "hsl(var(--aura-text-dim) / <alpha-value>)",
          // Borders
          border: "hsl(var(--aura-border) / <alpha-value>)",
          "border-subtle": "hsl(var(--aura-border-subtle) / <alpha-value>)",
          // Input
          input: "hsl(var(--aura-input) / <alpha-value>)",
        },
      },
      // ── Aura Typography ───────────────────────────────────────────────
      fontFamily: {
        // Display — used for large numbers and headings
        // Loaded via Google Fonts in layout.tsx
        display: ["var(--font-display)", "DM Serif Display", "Georgia", "serif"],
        // Body — clean sans for UI text
        sans: ["var(--font-sans)", "Geist", "system-ui", "sans-serif"],
        // Mono — for financial numbers, amounts, codes
        mono: ["var(--font-mono)", "Geist Mono", "Consolas", "monospace"],
      },
      // ── Border Radius ─────────────────────────────────────────────────
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // ── Custom Animations ─────────────────────────────────────────────
      keyframes: {
        // Accordion (shadcn/ui)
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Fade in for page/component reveals
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        // Subtle pulse for loading states
        "pulse-gentle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        // Teal glow for primary indicators
        "glow-teal": {
          "0%, 100%": { boxShadow: "0 0 8px 0 rgba(13, 115, 119, 0.4)" },
          "50%": { boxShadow: "0 0 20px 4px rgba(13, 115, 119, 0.6)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out both",
        "fade-in-slow": "fade-in 0.6s ease-out both",
        "pulse-gentle": "pulse-gentle 2s ease-in-out infinite",
        "glow-teal": "glow-teal 3s ease-in-out infinite",
      },
      // ── Animation delays for staggered reveals ────────────────────────
      transitionDelay: {
        "100": "100ms",
        "200": "200ms",
        "300": "300ms",
        "400": "400ms",
        "500": "500ms",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // iOS safe area support for mobile bottom nav
    function ({ addUtilities }: { addUtilities: (u: Record<string, Record<string, string>>) => void }) {
      addUtilities({
        '.pb-safe': { paddingBottom: 'env(safe-area-inset-bottom, 0px)' },
        '.pt-safe': { paddingTop: 'env(safe-area-inset-top, 0px)' },
      })
    },
  ],
};

export default config;

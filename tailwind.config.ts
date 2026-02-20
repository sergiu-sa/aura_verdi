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
        // ── Aura-specific semantic palette ──────────────────────────────
        aura: {
          // Identity
          primary: "#0D7377",        // Deep teal — Aura's signature
          "primary-light": "#11999E", // Lighter teal for hover states
          // Backgrounds
          background: "#121218",     // Near-black — default dark bg
          surface: "#1C1C28",        // Elevated card surface
          "surface-high": "#24243A", // Higher elevation (dialogs, dropdowns)
          // Semantic states
          safe: "#2D8B6F",           // Positive / green / money is safe
          "safe-muted": "#1E5C49",   // Muted safe background
          warning: "#D4A039",        // Caution / amber
          "warning-muted": "#5C3D0A",
          danger: "#C75050",         // Urgent / red
          "danger-muted": "#4A1414",
          // Text
          text: "#E8E8EC",           // Primary text (off-white)
          "text-secondary": "#8888A0", // Secondary / muted text
          "text-dim": "#55556A",     // Dimmed / disabled text
          // Borders
          border: "#2A2A3E",         // Default border
          "border-subtle": "#1E1E2E", // Very subtle border
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

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        border: "var(--border)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        accent: {
          DEFAULT: "var(--accent)",
          strong: "var(--accent-strong)",
        },
        // Back-compat aliases (older markup) → unified to the new palette.
        "text-primary": "var(--ink)",
        "text-muted": "var(--muted)",
        "accent-2": "var(--accent-strong)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      fontSize: {
        display: ["2.25rem", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "600" }],
        heading: ["1.375rem", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" }],
        body: ["0.9375rem", { lineHeight: "1.55", fontWeight: "400" }],
        caption: ["0.8125rem", { lineHeight: "1.45", fontWeight: "400" }],
        micro: ["0.6875rem", { lineHeight: "1.4", fontWeight: "400" }],
      },
      borderRadius: {
        card: "10px",
        ctl: "8px",
      },
      spacing: {
        page: "20px",
        nav: "64px",
      },
    },
  },
  plugins: [],
};
export default config;

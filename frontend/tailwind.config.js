/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "../admin/**/*.{js,ts,jsx,tsx,mdx}",
    "../api/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        // User-facing breakpoints
      xs: "320px",
        sm:"320px",
        md: "768px",
        lg: "1025px",
        // Wider than standard pc range
        xl: "1921px",
        "2xl": "2560px",

        // Optional helpers for max-width targeting
        "max-sm": { max: "767px" },
        "max-md": { max: "1024px" },
        "max-xl": { max: "2559px" },
      },
      // screens: {
      //   // User-facing breakpoints
      //   // sm (mobile): 320px - 767px
      //   sm: { min: "320px", max: "767px" },
      //   // md (tablet): 768px - 1024px
      //   md: { min: "768px", max: "1024px" },
      //   // lg (pc): 1025px and up (no max)
      //   lg: "1025px",
      //   // Wider than standard pc range
      //   xl: "1921px",
      //   "2xl": "2560px",

      //   // Optional helpers for max-width targeting
      //   "max-sm": { max: "767px" },
      //   "max-md": { max: "1024px" },
      //   "max-xl": { max: "2559px" },
      // },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter",
          "var(--font-noto-sans-jp)",
          '"Noto Sans JP"',
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],

        inter: ["var(--font-inter)", "Inter", "sans-serif"],
        "noto-jp": ["var(--font-noto-sans-jp)", '"Noto Sans JP"', "sans-serif"],
      },
      colors: {
        primary: "#2BB673",
        ink: "#252422",
        gradientStart: "#314166",
        gradientEnd: "#000000",
        lightGray: "#E4E3DF",
        danger: "#C80100",
        bgLightGray: "#F4F4F2",
        blightGray: "#A4A4A4",

        // Brand background palette.
        "brand-green-dark": "#1F8A5A",
        "brand-green": "#2BB673",
        "brand-mist": "#F0F7F7",
        "brand-charcoal": "#252422",
        "brand-stone": "#E4E3DF",
        "brand-offwhite": "#F4F4F2",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        card: "#18181b",
        border: "#27272a",
        muted: "#71717a",
        primary: "#fafafa",
        income: "#34d399",
        expense: "#f87171",
        warning: "#facc15",
        accent: "#6366f1",
      },
    },
  },
  plugins: [],
};

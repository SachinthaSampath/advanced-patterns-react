/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      maxWidth: {
        feed: "600px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: "#274C77",
          white: "#E7ECEF",
          gray: "#8B8C89",
          black: "#141414",
        },
        accent: {
          errorLight: "#F96C62",
          error: "#BF0603",
          warningLight: "#FFCE5C",
          warning: "#F4D58D",
          warningDark: "#FE9920",
          successMuted: "#708D81",
          success: "#14CC60",
        },
      },
    },
  },
  plugins: [],
};

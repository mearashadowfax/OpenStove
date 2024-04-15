/** @type {import('tailwindcss').Config} */

const colors = require('tailwindcss/colors')

export default {
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
    "./node_modules/preline/preline.js",
  ],
  darkMode: 'class',
  theme: {
    extend: {},
    colors: {
      dark: "#242424",
      stone: colors.stone,
      neutral: colors.neutral,
      primary: "#f4bf3c",
      "primary-accent-light": "#ff9000",
      "primary-accent-dark": "#FFA500",
      secondary: "#FF9A6C",
      "secondary-accent": "#ffa780",
      footer: "#404040",
      "footer-light": "#535353",
      accent: "#9e9e4d",
    },
  },
  plugins: [
      require("preline/plugin"),
      require("flowbite/plugin"),
      require('tailwindcss/plugin')(({ addVariant }) => {
        addVariant('search-cancel', '&::-webkit-search-cancel-button');
      }),
  ],
};

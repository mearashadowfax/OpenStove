/** @type {import('tailwindcss').Config} */

const colors = require('tailwindcss/colors')

export default {
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
    "./node_modules/flowbite/**/*.js",
  ],
  darkMode: 'class',
  theme: {
    extend: {},
    colors: {
      dark: "#242424",
      stone: colors.stone,
      primary: "#f4bf3c",
      secondary: "#f8955b",
      accent: "#9e9e4d",
    },
  },
  plugins: [
      require("flowbite/plugin")
  ],
};

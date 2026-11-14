import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cvsu: {
          green: "#166534",
          dark: "#14532d",
          light: "#dcfce7",
          gold: "#ca8a04",
        },
      },
    },
  },
  plugins: [],
};
export default config;

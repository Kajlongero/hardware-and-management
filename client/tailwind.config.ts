import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      backgroundColor: {
        "dark-0a": "#0a0a0a",
        "dark-1a": "#1a1a1a",
        "dark-2a": "#2a2a2a",
        "dark-3a": "#3a3a3a",
      },
      textColor: {
        "pure-yellow": "#ffff00",
      }
    },
    screens: {
      "only-small-mobile": {
        max: '425px',
      },
      "only-mobile": {
        max: '640px',
      },
      "only-tablet": {
        max: '768px',
      },
    }
  },
  plugins: [],
};
export default config;

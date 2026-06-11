import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211f",
        fog: "#f4f7f4",
        mint: "#1c8b64",
        date: "#b9822d",
        sea: "#27768f"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(23, 33, 31, 0.10)"
      }
    }
  },
  plugins: [forms]
};

export default config;

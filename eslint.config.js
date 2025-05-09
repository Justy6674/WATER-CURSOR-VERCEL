import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default [
  // Global ignores
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "eslint.config.js",
      "postcss.config.js",
      "tailwind.config.ts",
      "vite.config.ts",
      "public/**",
    ],
  },

  // Basic JS rules applied everywhere ESLint looks (respecting ignores)
  js.configs.recommended,

  // Basic TS/React Parser Setup for src files (NO RULES APPLIED YET)
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser, // Specify the TS parser
      parserOptions: {
        ecmaFeatures: { jsx: true }, // Enable JSX parsing
        project: "./tsconfig.app.json", // Explicitly point to the app tsconfig
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
    },
    // NO extends, NO plugins, NO rules in this block initially
  },
]; 
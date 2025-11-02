import js from "@eslint/js";
import nextPlugin from "eslint-config-next";
import globals from "globals";

const eslintConfig = [
  // Global ignores - must be first
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "**/dist/**",
      "**/.vercel/**",
      "**/next-env.d.ts",
    ],
  },
  // ESLint recommended rules
  js.configs.recommended,
  // Next.js recommended rules
  ...(Array.isArray(nextPlugin) ? nextPlugin : [nextPlugin]),
  // Global configuration
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        React: "readonly",
      },
    },
    rules: {
      // Disable rules for unused vars in specific cases
      "no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_"
      }],
      // Allow console in development
      "no-console": "off",
    },
  },
];

export default eslintConfig;

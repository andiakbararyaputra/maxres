// ESLint flat config — strict TypeScript + React hooks rules.
// "No warnings allowed in new code" (AGENTS.md), so CI treats warnings as failures.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "src-tauri/**",
      "vibe-coding-prompt-template/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": "warn",
      // AGENTS.md: strict TypeScript, no `any`.
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  prettier,
);

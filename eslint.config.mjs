import js from "@eslint/js";
import { fixupPluginRules } from "@eslint/compat";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import hooks from "eslint-plugin-react-hooks";
import a11y from "eslint-plugin-jsx-a11y";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";
import importX from "eslint-plugin-import-x";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "build/**",
      ".wrangler/**",
      ".react-router/**",
      "**/*.d.ts",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      ".agents/**",
      "drizzle/**",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      react: fixupPluginRules(react),
      "react-hooks": hooks,
      "jsx-a11y": fixupPluginRules(a11y),
      sonarjs,
      unicorn,
      "import-x": importX,
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat["jsx-runtime"].rules,
      ...hooks.configs.recommended.rules,
      ...a11y.flatConfigs.recommended.rules,
      "react/prop-types": "off",
      "sonarjs/cognitive-complexity": ["error", 15],
      "unicorn/throw-new-error": "error",
      "unicorn/prefer-node-protocol": "error",
      "max-lines": [
        "error",
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
      "max-lines-per-function": [
        "error",
        { max: 80, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
      "no-console": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "import-x/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "type",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },
  {
    files: ["app/components/ui/**/*.tsx"],
    rules: { "max-lines-per-function": "off" },
  },
  { files: ["server/platform/logging.ts"], rules: { "no-console": "off" } },
  prettier,
);

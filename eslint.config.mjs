import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Default ignores of eslint-config-next:
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    rules: {
      // Underscore-prefixed args / vars are intentional placeholders
      // (gateway stubs that conform to a shared interface, etc.).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      // react-hook-form 7.x exposes a non-memoizable `watch()` function;
      // the rule is a known false positive for this library. We use
      // `useWatch` where reactivity matters; bare `form.watch()` for
      // read-only access is fine.
      "react-hooks/incompatible-library": "off",
    },
  },
]);

export default eslintConfig;

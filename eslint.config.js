import js from "@eslint/js"
import ts from "typescript-eslint"
import svelte from "eslint-plugin-svelte"
import globals from "globals"

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs["flat/recommended"],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node }
    }
  },
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parserOptions: { parser: ts.parser }
    }
  },
  {
    rules: {
      "no-useless-assignment": "off",
      // shadcn-svelte primitives use rest props by design — components aren't
      // custom-element targets, so the custom_element_props_identifier
      // warning is noise.
      "svelte/valid-compile": ["error", { ignoreWarnings: true }]
    }
  },
  { ignores: [".svelte-kit/**", "build/**", "node_modules/**"] }
]

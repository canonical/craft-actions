// @ts-check
import js from "@eslint/js"
import {defineConfig} from "eslint/config"
import tseslint from "typescript-eslint"

export default defineConfig([
  {
    ignores: ["**/dist/**", "**/node_modules/**", "docs/**"]
  },
  {
    files: ["**/*.ts"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  }
])

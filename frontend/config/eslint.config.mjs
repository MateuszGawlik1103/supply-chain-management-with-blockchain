/**
 * ESLint configuration for the frontent.
 * Responsible for defining linting rules and settings.
 * This file uses ECMAScript modules (MJS).
 *
 */

import globals from "globals"; // Provides predefined global variables for different environments (browser, Node.js, etc.)
import eslint from '@eslint/js'; // Eslints recommended plugins
import tseslint from "typescript-eslint"; // Core TypeScript ESLint rules and configurations
import tsParser from "@typescript-eslint/parser"; // Parses TypeScript code for ESLint
import eslintPluginPrettier from "eslint-plugin-prettier"; // Integrates Prettier with ESLint for code formatting
import reactPlugin from "eslint-plugin-react"; // Provides linting rules for React-specific code
import reactHooksPlugin from "eslint-plugin-react-hooks"; // Enforces best practices for React hooks
import reactRefreshPlugin from "eslint-plugin-react-refresh"; // Ensures correct usage of React Fast Refresh (HMR)
import jsxA11yPlugin from "eslint-plugin-jsx-a11y"; // Helps improve accessibility in JSX with linting rules
import jsdoc from "eslint-plugin-jsdoc"; // Enforces and validates JSDoc comments for documentation
import importPlugin from "eslint-plugin-import"; // Helps with import/export organization and resolving module paths

export default tseslint.config(
  {
    files: [
      "src/**/*.ts",
      "src/**/*.tsx",
    ], // Apply rules to all .ts and .tsx files in src/ directory
  },
  {
    ignores: ["dist/**/*", "node_modules/**/*", "config/**/*"],
  },
  {
    languageOptions: {
      parser: tsParser, // Use TypeScript parser
      parserOptions: {
        project: "../tsconfig.test.json", // This path in container is: /app/tsconfig.test.json
        sourceType: "module", // Set ECMAScript module (ESM) as the source type
      },
      globals: {
        ...globals.browser, // Add global browser variables (window, document, etc.)
        test: "readonly", // Define vitest global variables as read-only (pertinent to all below)
        expect: "readonly",
        describe: "readonly",
        it: "readonly",
      },
    },
  },
  {
    settings: {
      react: {
        version: "detect", // Automatically detects the React version
      },
    },
  },
  {
    plugins: {
      react: reactPlugin,
      "jsx-a11y": jsxA11yPlugin,
      "react-refresh": reactRefreshPlugin,
      prettier: eslintPluginPrettier,
    },
  },
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  tseslint.configs.stylistic,
  importPlugin.flatConfigs.recommended,
  reactHooksPlugin.configs['recommended-latest'],
  jsdoc.configs["flat/recommended-typescript-error"],
  {
    rules: {
      ...eslintPluginPrettier.configs.recommended.rules, // Uses Prettier's recommended rules
      ...jsxA11yPlugin.configs.recommended.rules, // Uses recommended accessibility rules
      ...reactHooksPlugin.configs.recommended.rules, // Uses recommended React hooks rules

      "prettier/prettier": [
        "error",
        {
          endOfLine: "auto", // Fixes line ending issues automatically
        },
      ],
      "jsdoc/require-description": ["warn"], // Warns if JSDoc comments lack descriptions
      "jsdoc/require-jsdoc": [
        "error",
        {
          require: {
            FunctionDeclaration: true, // Requires JSDoc for functions
            MethodDefinition: true, // Requires JSDoc for class methods
            ClassDeclaration: true, // Requires JSDoc for classes
            ArrowFunctionExpression: true, // Requires JSDoc for arrow functions
          },
        },
      ],
      "@typescript-eslint/explicit-module-boundary-types": ["error"], // Enforces explicit return types in modules
      "@typescript-eslint/explicit-function-return-type": ["error"], // Requires return types for all functions
      "@typescript-eslint/no-explicit-any": ["error"], // Disallows 'any' type, ensuring proper type definitions
      '@typescript-eslint/typedef': [ // Enforces type annotations in locations regardless of whether they're required
        'warn',
        {
          parameter: true, // Whether to enforce type annotations for parameters of functions and methods.
          arrowParameter: true, // Whether to enforce type annotations for parameters of arrow functions.
        },
      ],
    },
  },
  {
    settings: {
      "import/resolver": { // Uses tsconfig.json for resolving import paths
        typescript: {
          project: "./tsconfig.json", // This path in container is: /app/tsconfig.json
        },
      },
    },
  },
);

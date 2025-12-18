// eslint-disable-next-line import/no-unresolved
import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import prettier from "eslint-plugin-prettier/recommended";

export default defineConfig([
  globalIgnores([
    "tst/assert.js",
    "gjspack/test/compile/dist/",
    "gjspack/lib/",
    "gjspack/test/fixtures",
    "gsx-demo/src/main.js",
    "gsx-demo/js/main.js",
    "gjspack/demo/flatpak",
  ]),
  js.configs.recommended,
  importPlugin.flatConfigs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        pkg: "readonly",
        ARGV: "readonly",
        Debugger: "readonly",
        GIRepositoryGType: "readonly",
        globalThis: "readonly",
        imports: "readonly",
        Intl: "readonly",
        log: "readonly",
        logError: "readonly",
        print: "readonly",
        printerr: "readonly",
        window: "readonly",
        TextEncoder: "readonly",
        TextDecoder: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    rules: {
      "array-callback-return": ["error"],
      "no-duplicate-imports": ["error"],
      "no-new-native-nonconstructor": ["error"],
      "no-restricted-globals": [
        "error",
        "window",
        "printerr",
        "print",
        "imports",
        "logError",
        "log",
      ],

      "no-unused-vars": [
        "error",
        {
          vars: "all",
          args: "all",
          argsIgnorePattern: "^_",
        },
      ],

      eqeqeq: ["error", "always"],
      "no-implicit-globals": ["error"],
      "no-var": ["error"],

      "prefer-arrow-callback": [
        "error",
        {
          allowNamedFunctions: true,
          allowUnboundThis: true,
        },
      ],

      "prefer-const": ["error"],
      "import/extensions": ["error", "ignorePackages"],

      "import/no-unresolved": [
        "error",
        {
          ignore: ["gi://*", "resource://*", "cairo", "gettext", "system"],
        },
      ],
    },
  },
  prettier,
]);

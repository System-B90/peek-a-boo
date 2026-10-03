import eslintReact from "@eslint-react/eslint-plugin";
import nextPlugin from "@next/eslint-plugin-next";
import stylistic from "@stylistic/eslint-plugin";
import { defineConfig } from "eslint/config";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import importPlugin from "eslint-plugin-import-x";
import perfectionist from "eslint-plugin-perfectionist";
import reactHooks from "eslint-plugin-react-hooks";
import unicorn from "eslint-plugin-unicorn";
import unusedImports from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

// ESLint 10 (#84): eslint-config-next pulled in eslint-plugin-react and
// eslint-plugin-import, neither of which supports ESLint 10. Its pieces are
// composed directly instead: @next/eslint-plugin-next, react-hooks,
// @eslint-react (React rules) and import-x (import rules, still under the
// `import/` prefix so rule names below are unchanged).
export default defineConfig([
    nextPlugin.configs["core-web-vitals"],
    reactHooks.configs.flat["recommended-latest"],
    {
        files: ["**/*.{ts,tsx}"],
        ...eslintReact.configs["recommended-typescript"],
        rules: {
            ...eslintReact.configs["recommended-typescript"].rules,
            // Was react/jsx-no-leaked-render under eslint-plugin-react.
            "@eslint-react/no-leaked-conditional-rendering": "error",
            // Style-only preferences this codebase does not follow.
            "@eslint-react/no-use-context": "off",
            "@eslint-react/naming-convention-context-name": "off",
        },
    },
    {
        plugins: {
            "@typescript-eslint": tseslint.plugin,
            "@stylistic": stylistic,
            import: importPlugin,
            "unused-imports": unusedImports,
            perfectionist: perfectionist,
            unicorn: unicorn,
        },
        settings: {
            "import-x/resolver-next": [createTypeScriptImportResolver()],
        },
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                projectService: {
                    allowDefaultProject: [ "*.mjs" ],
                },
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            "eol-last": ["error", "always"],
            "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],
            indent: ["error", 4],

            // --- Variables, Types & Assertions ---
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": "off",
            "unused-imports/no-unused-vars": [
                "warn",
                {
                    vars: "all",
                    varsIgnorePattern: "^_",
                    args: "after-used",
                    argsIgnorePattern: "^_",
                },
            ],
            "@typescript-eslint/method-signature-style": ["error", "property"],
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/array-type": ["error", { default: "generic" }],
            "@typescript-eslint/consistent-type-definitions": ["error", "type"],
            "@typescript-eslint/no-base-to-string": "error",
            "@typescript-eslint/ban-tslint-comment": "error",
            "@typescript-eslint/no-for-in-array": "error", // Use "of" instead
            "@typescript-eslint/prefer-for-of": "error",
            "@typescript-eslint/prefer-includes": "error",
            "@typescript-eslint/return-await": ["error", "always"],
            "@typescript-eslint/adjacent-overload-signatures": "error",
            "@typescript-eslint/ban-ts-comment": [
                "error",
                { "ts-ignore": "allow-with-description" },
            ],

            // --- Exports & Imports ---
            "import/no-default-export": "error",
            "import/no-cycle": "error",
            "unused-imports/no-unused-imports": "error",
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: ["./*", "../*"],
                            message: "Use absolute paths (@/*).",
                            allowTypeImports: true,
                        },
                        {
                            regex: "^@mui/[^/]+$",
                        },
                    ],
                },
            ],
            "import/order": [
                "error",
                {
                    groups: [
                        "builtin",
                        "external",
                        "internal",
                        "parent",
                        "sibling",
                        "index",
                    ],
                    "newlines-between": "always",
                    alphabetize: { order: "asc", caseInsensitive: true },
                },
            ],
            "@typescript-eslint/consistent-type-exports": [
                "error",
                { fixMixedExportsWithInlineTypeSpecifier: true },
            ],

            // --- React & Perfectionist ---
            "perfectionist/sort-variable-declarations": [
                "error",
                { type: "alphabetical" },
            ],
            "perfectionist/sort-union-types": [
                "error",
                { type: "alphabetical" },
            ],
            "perfectionist/sort-jsx-props": ["error", { type: "alphabetical" }],

            // --- Structural Spacing ---
            "@stylistic/padding-line-between-statements": [
                "error",
                { blankLine: "always", prev: "interface", next: "*" },
                { blankLine: "always", prev: "*", next: "interface" },
                { blankLine: "always", prev: "function", next: "function" },
                { blankLine: "never", prev: "type", next: "type" },
                { blankLine: "always", prev: "import", next: "*" },
                { blankLine: "any", prev: "import", next: "import" },
            ],

            "object-curly-newline": [
                "error",
                { ObjectPattern: { multiline: true, consistent: true } },
            ],
            "object-property-newline": [
                "error",
                { allowAllPropertiesOnSameLine: true },
            ],

            // --- Filename Convention (Unicorn) ---
            "unicorn/filename-case": [
                "error",
                {
                    cases: {
                        kebabCase: true,
                        pascalCase: true,
                    },
                    ignore: [
                        // Next.js reserved and specific logic files
                        "index.tsx",
                        "route.ts",
                        "route.tsx",
                        "layout.tsx",
                        "page.tsx",
                        "loading.tsx",
                        "error.tsx",
                        "not-found.tsx",
                        "template.tsx",
                        "instrumentation.ts",
                        "middleware.ts",
                        "types.ts",
                        "utils.ts",
                        "global.css",
                    ],
                },
            ],
        },
    },
    {
        files: [
            "**/app/**/{page,layout,error,global-error,not-found,loading,template,default}.tsx",
            "**/app/**/route.tsx",
            "**/app/**/route.ts",
            "**/*.config.{ts,js,mjs,mts}",
        ],
        rules: { "import/no-default-export": "off" },
    },
    {
        files: ["**/*.js", "**/*.mjs", "**/*.mts"],
        ...tseslint.configs.disableTypeChecked,
    },
    {
        ignores: [
            ".next/",
            "out/*",
            "dist/*",
            "node_modules/*",
            "next-env.d.ts",
            "venv/",
            "websock/venv/",
            "nginx/ssl/",
            "*.d.ts",
	    ".claude/",
        ],
    },
]);

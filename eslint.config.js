import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default [
    ...compat.extends("next/core-web-vitals", "next/typescript"),
    {
        files: ["**/*.{js,jsx,ts,tsx}"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        rules: {
            // Standard.ts rules
            quotes: ["error", "single", { avoidEscape: true }],
            semi: ["error", "never"],
            "no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
            "keyword-spacing": "error",
            "space-before-function-paren": ["error", "always"],
            eqeqeq: ["error", "always"],
            "space-infix-ops": "error",
            "comma-spacing": "error",
            "brace-style": ["error", "1tbs", { allowSingleLine: true }],
            curly: ["error", "multi-line"],
            camelcase: "error",

            // React specific rules
            "react/jsx-uses-react": "off", // Not needed in React 17+
            "react/react-in-jsx-scope": "off", // Not needed in React 17+

            // TypeScript specific rules
            "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-explicit-any": "warn",
        },
    },
    {
        ignores: [
            "node_modules/**",
            ".next/**",
            "out/**",
            "build/**",
            "dist/**",
            "*.config.js",
            "*.config.ts",
            "prisma/**",
            "test-*.js",
            "debug-*.js",
            "check-*.js",
        ],
    },
];

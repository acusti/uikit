import jsPlugin from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import jestPlugin from 'eslint-plugin-jest';
import jestDOMPlugin from 'eslint-plugin-jest-dom';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import markdownPlugin from 'eslint-plugin-markdown';
import perfectionistPlugin from 'eslint-plugin-perfectionist';
import reactPlugin from 'eslint-plugin-react';
import reactCompilerPlugin from 'eslint-plugin-react-compiler';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import testingLibraryPlugin from 'eslint-plugin-testing-library';
import globals from 'globals';

export default [
    jsPlugin.configs.recommended,
    jsxA11yPlugin.flatConfigs.strict,
    prettierConfig,
    perfectionistPlugin.configs['recommended-alphabetical'],

    // Global ignores
    {
        ignores: [
            '.pnp.cjs',
            'superflare.env.d.ts',
            'worker-configuration.d.ts',
            '.wrangler/',
            '.yarn/',
            'build/',
            'public/',
        ],
    },

    // React
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        languageOptions: {
            globals: { ...globals.browser },
        },
        plugins: {
            react: reactPlugin,
            'react-compiler': reactCompilerPlugin,
            'react-hooks': reactHooksPlugin,
        },
        settings: {
            formComponents: ['Form'],
            linkComponents: [
                { name: 'Link', linkAttribute: 'to' },
                { name: 'NavLink', linkAttribute: 'to' },
            ],
            react: { version: 'detect' },
        },
        rules: {
            ...reactPlugin.configs.recommended.rules,
            ...reactPlugin.configs['jsx-runtime'].rules,
            ...reactHooksPlugin.configs.recommended.rules,
            'react-compiler/react-compiler': 'warn',
            'react/jsx-no-leaked-render': ['warn', { validStrategies: ['ternary'] }],
            'react/jsx-sort-props': 'off',
            'react/no-unknown-property': [
                'error',
                {
                    ignore: ['popoverTarget', 'popoverTargetAction', 'precedence'],
                },
            ],
            'react-hooks/exhaustive-deps': [
                'warn',
                { enableDangerousAutofixThisMayCauseInfiniteLoops: true },
            ],
            'no-shadow': 'error',
            'sort-imports': 'off',
        },
    },

    // Typescript
    {
        files: ['**/*.{ts,tsx}'],
        plugins: {
            '@typescript-eslint': tsPlugin,
            import: importPlugin,
        },
        languageOptions: {
            parser: tsParser,
            parserOptions: { projectService: true },
        },
        settings: {
            'import/internal-regex': '^~/',
            'import/parsers': {
                '@typescript-eslint/parser': ['.ts', '.tsx'],
            },
            'import/resolver': {
                node: true,
                typescript: { alwaysTryTypes: true },
            },
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            ...tsPlugin.configs.stylistic.rules,
            ...importPlugin.configs.recommended.rules,
            ...importPlugin.configs.typescript.rules,
            '@typescript-eslint/array-type': ['error', { default: 'generic' }],
            '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
            '@typescript-eslint/no-deprecated': 'warn',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    caughtErrors: 'none',
                    varsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/prefer-nullish-coalescing': [
                'error',
                { ignorePrimitives: { boolean: true, string: true } },
            ],
            '@typescript-eslint/strict-boolean-expressions': [
                'error',
                { allowNullableBoolean: true, allowNullableString: true },
            ],
            // TODO figure out why ignorePackages doesn’t work ('react-dom/client' is erroring)
            // 'import/extensions': ['error', 'always', { ignorePackages: true }],
            'no-duplicate-imports': 'error',
            'no-undef': 'off', // typescript handles undefined variable detection
            'prefer-const': ['error', { destructuring: 'all' }],
            'sort-keys': 'off',
        },
    },

    // Markdown
    {
        files: ['**/*.md'],
        plugins: { markdown: markdownPlugin },
        processor: 'markdown/markdown',
        // The markdown plugin exposes three configuration blocks and is supposed
        // to be included as ...markdownPlugin.configs.recommended, but doing so in
        // this config makes it so that issues in markdown code blocks are missed.
        rules: markdownPlugin.configs.recommended[2].rules,
    },

    // Jest/Vitest
    {
        files: ['**/*.test.{js,jsx,ts,tsx}'],
        plugins: {
            jest: jestPlugin,
            'jest-dom': jestDOMPlugin,
            'testing-library': testingLibraryPlugin,
        },
        settings: {
            jest: {
                // we're using vitest which has a very similar API to jest
                // (so the linting plugins work nicely), but it means we have to explicitly
                // set the jest version.
                version: 28,
            },
        },
        rules: {
            ...jestPlugin.configs.recommended.rules,
            ...jestDOMPlugin.configs.recommended.rules,
            ...testingLibraryPlugin.configs.react.rules,
            'testing-library/no-manual-cleanup': 'off',
            // the following rules require setup-test-env: import '@testing-library/jest-dom/vitest';
            'jest-dom/prefer-empty': 'off',
            'jest-dom/prefer-in-document': 'off',
            'jest-dom/prefer-to-have-value': 'off',
        },
    },

    // Node
    {
        files: ['worker.ts', 'mocks/**/*.js'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },
];

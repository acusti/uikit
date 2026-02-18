import jsPlugin from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import canonicalPlugin from 'eslint-plugin-canonical';
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

import { compilerOptions } from './vite.config.base.js';

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

    // Typescript and React
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                projectService: {
                    allowDefaultProject: [
                        'eslint.config.js',
                        'vite.config.base.js',
                        'packages/*/vite.config.js',
                        'packages/*/.storybook/*.ts',
                    ],
                },
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            canonical: canonicalPlugin,
            import: importPlugin,
            react: reactPlugin,
            'react-compiler': reactCompilerPlugin,
            'react-hooks': reactHooksPlugin,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            ...tsPlugin.configs.stylistic.rules,
            ...importPlugin.configs.recommended.rules,
            ...importPlugin.configs.typescript.rules,
            ...reactPlugin.configs.recommended.rules,
            ...reactPlugin.configs['jsx-runtime'].rules,
            ...reactHooksPlugin.configs.recommended.rules,
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
            'canonical/filename-match-exported': 'error',
            'canonical/prefer-inline-type-import': 'error',
            'canonical/sort-react-dependencies': 'error',
            // 'import/extensions': ['error', 'always', { ignorePackages: true }],
            'import/order': 'off',
            'jsx-a11y/control-has-associated-label': 'error',
            'no-duplicate-imports': 'error',
            'no-shadow': 'error',
            'no-undef': 'off', // typescript handles undefined variable detection
            'perfectionist/sort-modules': [
                'error',
                {
                    partitionByComment: true,
                    type: 'alphabetical',
                },
            ],
            'prefer-const': ['error', { destructuring: 'all' }],
            'react-compiler/react-compiler': [
                'error',
                { ...compilerOptions, logger: undefined },
            ],
            'react-hooks/capitalized-calls': 'error', // avoid calling capitalized functions (should use JSX)
            'react-hooks/exhaustive-deps': [
                'warn',
                { enableDangerousAutofixThisMayCauseInfiniteLoops: true },
            ],
            'react-hooks/hooks': 'error', // largely reimplements the "rules-of-hooks" non-compiler rule
            'react-hooks/rule-suppression': 'error',
            'react-hooks/syntax': 'error',
            'react-hooks/todo': 'error',
            'react-hooks/unsupported-syntax': 'error',
            'react/jsx-no-leaked-render': ['warn', { validStrategies: ['ternary'] }],
            'react/jsx-sort-props': 'off',
            'react/no-unknown-property': 'error',
            'sort-imports': 'off',
            'sort-keys': 'off',
        },
        settings: {
            formComponents: ['Form'],
            'import/external-module-folders': ['.yarn'],
            'import/internal-regex': '^~/',
            'import/resolver': { typescript: { alwaysTryTypes: true } },
            linkComponents: [
                { linkAttribute: 'to', name: 'Link' },
                { linkAttribute: 'to', name: 'NavLink' },
            ],
            react: { version: 'detect' },
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
        rules: {
            ...jestPlugin.configs.recommended.rules,
            ...jestDOMPlugin.configs.recommended.rules,
            ...testingLibraryPlugin.configs.react.rules,
            // the following rules require setup-test-env: import '@testing-library/jest-dom/vitest';
            'jest-dom/prefer-empty': 'off',
            'jest-dom/prefer-in-document': 'off',
            'jest-dom/prefer-to-have-class': 'off',
            'jest-dom/prefer-to-have-value': 'off',
            'testing-library/no-manual-cleanup': 'off',
        },
        settings: {
            jest: {
                // we're using vitest which has a very similar API to jest
                // (so the linting plugins work nicely), but it means we have to explicitly
                // set the jest version.
                version: 28,
            },
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

/**
 * This is the basic starting point for linting from the remix Indie Stack.
 * It relies on recommended configs out of the box for simplicity, but you can
 * and should modify this configuration to best suit your team's needs.
 */

/** @type {import('eslint').Linter.Config} */
module.exports = {
    root: true,
    parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    env: {
        browser: true,
        commonjs: true,
        es6: true,
    },

    // Base config
    extends: ['eslint:recommended'],

    overrides: [
        // React
        {
            files: ['**/*.{js,jsx,ts,tsx}'],
            plugins: ['react', 'jsx-a11y'],
            extends: [
                'plugin:react/recommended',
                'plugin:react/jsx-runtime',
                'plugin:react-hooks/recommended',
                'plugin:jsx-a11y/recommended',
                'prettier',
            ],
            settings: {
                formComponents: ['Form'],
                linkComponents: [
                    { name: 'Link', linkAttribute: 'to' },
                    { name: 'NavLink', linkAttribute: 'to' },
                ],
                react: { version: 'detect' },
            },
            rules: {
                'react/jsx-no-leaked-render': ['warn', { validStrategies: ['ternary'] }],
                'react/jsx-sort-props': 'warn',
                'react/no-unknown-property': [
                    'error',
                    { ignore: ['popover', 'popoverTarget', 'popoverTargetAction'] },
                ],
            },
        },

        // Typescript
        {
            files: ['**/*.{ts,tsx}'],
            plugins: ['@typescript-eslint', 'import', 'typescript-sort-keys'],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                project: ['./tsconfig.json', 'packages/*/tsconfig.json'],
                tsconfigRootDir: __dirname,
            },
            settings: {
                'import/internal-regex': '^~/',
                'import/resolver': {
                    node: { extensions: ['.ts', '.tsx'] },
                    typescript: { alwaysTryTypes: true },
                },
            },
            extends: [
                'plugin:@typescript-eslint/recommended-type-checked',
                'plugin:@typescript-eslint/stylistic',
                'plugin:import/recommended',
                'plugin:import/typescript',
                'plugin:typescript-sort-keys/recommended',
                'prettier',
            ],
            rules: {
                '@typescript-eslint/array-type': ['error', { default: 'generic' }],
                '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
                '@typescript-eslint/prefer-nullish-coalescing': 'warn',
                'import/order': [
                    'error',
                    {
                        alphabetize: { caseInsensitive: true, order: 'asc' },
                        groups: ['builtin', 'external', 'internal', 'parent', 'sibling'],
                        'newlines-between': 'always',
                    },
                ],
                'prefer-const': ['error', { destructuring: 'all' }],
                'sort-keys': 'warn',
            },
        },

        // Markdown
        {
            files: ['**/*.md'],
            plugins: ['markdown'],
            extends: ['plugin:markdown/recommended', 'prettier'],
        },

        // Jest/Vitest
        {
            files: ['**/*.test.{js,jsx,ts,tsx}'],
            plugins: ['jest', 'jest-dom', 'testing-library'],
            extends: [
                'plugin:jest/recommended',
                'plugin:jest-dom/recommended',
                'plugin:testing-library/react',
                'prettier',
            ],
            settings: {
                jest: {
                    // we’re using vitest which has a very similar API to jest
                    // (so the linting plugins work nicely), but it means we have to explicitly
                    // set the jest version.
                    version: 28,
                },
            },
        },

        // Node
        {
            files: ['.eslintrc.js', 'mocks/**/*.js'],
            env: { node: true },
        },
    ],
};

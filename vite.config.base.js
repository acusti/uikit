import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig as defineConfigVite } from 'vite';
import { configDefaults } from 'vitest/config';

import { assertInstallMatchesLockfile } from './scripts/assert-install-matches-lockfile.mjs';

export const defineConfig = (options = {}) => {
    const {
        build: buildOptions,
        css,
        entry = ['src/index.ts'],
        formats = ['es'],
        plugins = [],
        react: isReact = false,
        target,
    } = options;

    // a test run against an install that lags bun.lock stops here, before
    // Vitest caches any module resolved against it
    if (process.env.VITEST) {
        assertInstallMatchesLockfile(fileURLToPath(new URL('.', import.meta.url)));
    }

    return defineConfigVite({
        build: {
            lib: {
                entry,
                fileName: (_format, entryName) => `${entryName}.js`,
                formats,
            },
            minify: false,
            rolldownOptions: {
                external: [
                    /^node:/,
                    /^@acusti\//,
                    'clsx',
                    'react',
                    'react/compiler-runtime',
                    'react/jsx-runtime',
                    'react-dom',
                ],
            },
            sourcemap: true,
            ...(target ? { target } : {}),
            ...(buildOptions ?? {}),
        },
        ...(css ? { css } : {}),
        plugins: [
            ...(isReact
                ? [react(isReact === true ? { compiler: compilerOptions } : {})]
                : []),
            ...plugins,
        ],
        test: {
            exclude: [...configDefaults.exclude, '**/dist/**'],
            setupFiles: [fileURLToPath(new URL('./vitest.setup.js', import.meta.url))],
        },
    });
};

// React Compiler https://github.com/reactwg/react-compiler/discussions/36#discussioncomment-11285011
export const compilerOptions = {
    environment: {
        enableTreatRefLikeIdentifiersAsRefs: true,
    },
};

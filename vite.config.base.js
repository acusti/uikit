import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig as defineConfigVite } from 'vite';
import { configDefaults } from 'vitest/config';

export const defineConfig = async (options = {}) => {
    const {
        build: buildOptions,
        css,
        entry = ['src/index.ts'],
        formats = ['es'],
        plugins = [],
        react: isReact = false,
        target,
    } = options;

    // dynamic import: only packages that opt into the compiler pay for
    // resolving @acusti/vite-plugin-react-compiler, so packages that don’t,
    // including @acusti/vite-plugin-react-compiler itself, never need it
    // pre-built
    const reactCompilerPlugins =
        isReact === true
            ? [
                  (await import('@acusti/vite-plugin-react-compiler')).default({
                      reactCompiler: compilerOptions,
                  }),
              ]
            : [];

    return defineConfigVite({
        build: {
            lib: {
                entry,
                fileName: (_format, entryName) => `${entryName}.js`,
                formats,
            },
            minify: false,
            rollupOptions: {
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
            // react: 'no-compiler' opts out of the React Compiler transform
            // (for code that by design accesses refs during render)
            ...(isReact ? [react()] : []),
            ...reactCompilerPlugins,
            ...plugins,
        ],
        test: {
            exclude: [...configDefaults.exclude, '**/dist/**'],
            setupFiles: [fileURLToPath(new URL('./vitest.setup.js', import.meta.url))],
        },
    });
};

// React Compiler https://github.com/reactwg/react-compiler/discussions/36#discussioncomment-11285011
// (compiler bailouts are caught by oxlint's react-compiler rules instead of
// a runtime logger: @acusti/vite-plugin-react-compiler doesn't support
// callback-valued options like `logger` since they can't cross the native
// oxc-transform-react boundary)
export const compilerOptions = {
    environment: {
        enableTreatRefLikeIdentifiersAsRefs: true,
    },
};

import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';

// can’t go through the shared ../../vite.config.base.js here: that file
// imports @acusti/vite-plugin-react-compiler itself (to wire it up for
// every other package’s react: true build), which would mean this package
// needing its own dist/ pre-built just to load its own build config.
// scripts/run-workspaces.mjs forces this package to build first for the
// same reason — see the comment there
export default defineConfig({
    build: {
        lib: {
            entry: ['src/index.ts'],
            fileName: (_format, entryName) => `${entryName}.js`,
            formats: ['es'],
        },
        minify: false,
        rollupOptions: {
            external: [/^node:/, 'oxc-transform-react', 'vite'],
        },
        sourcemap: true,
        target: 'node20',
    },
    test: {
        exclude: [...configDefaults.exclude, '**/dist/**'],
        setupFiles: [fileURLToPath(new URL('../../vitest.setup.js', import.meta.url))],
    },
});

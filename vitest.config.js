import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // Run each package's tests through its own build config, so code is
        // tested as it ships: compiled by the React Compiler for the packages
        // that build with it, uncompiled for the one that opts out. The root
        // config used to carry no react plugin, so nothing was compiled.
        projects: ['packages/*/vite.config.js'],
    },
});

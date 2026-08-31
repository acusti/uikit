import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // run each package’s tests through its own build config, so code is
        // tested as it ships
        projects: ['packages/*/vite.config.js'],
    },
});

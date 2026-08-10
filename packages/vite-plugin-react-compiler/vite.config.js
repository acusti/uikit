import { defineConfig } from '../../vite.config.base.js';

export default defineConfig({
    build: {
        rollupOptions: {
            external: [/^node:/, 'oxc-transform-react', 'vite'],
        },
    },
    target: 'node20',
});

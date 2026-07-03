import { defineConfig } from '../../vite.config.base.js';

export default defineConfig({
    build: {
        rollupOptions: {
            external: [/^node:/, '@svgr/core', '@svgr/plugin-jsx', 'vite'],
        },
    },
    target: 'node20',
});

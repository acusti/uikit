import { defineConfig } from '../../vite.config.base.js';

export default defineConfig({
    build: {
        rolldownOptions: { external: [/^node:/, 'vite'] },
    },
    target: 'node20',
});

import { defineConfig } from '../../vite.config.base.js';

export default defineConfig({
    build: {
        rolldownOptions: { external: [/^node:/, 'oxc-transform-react', 'vite'] },
    },
    target: 'node20',
});

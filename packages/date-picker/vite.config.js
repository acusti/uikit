import { defineConfig } from '../../vite.config.base.js';

export default defineConfig({
    build: { cssMinify: 'lightningcss' },
    css: { transformer: 'lightningcss' },
    react: true,
});

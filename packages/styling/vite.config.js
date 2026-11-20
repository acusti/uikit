import { defineConfig } from '../../vite.config.base.js';

export default defineConfig({
    build: {
        rolldownOptions: {
            // the base list, plus the plugin’s runtime import from vite
            external: [
                /^node:/,
                'react',
                'react/compiler-runtime',
                'react/jsx-runtime',
                'react-dom',
                'vite',
            ],
        },
    },
    entry: ['src/index.ts', 'src/vite.ts'],
    react: true,
});

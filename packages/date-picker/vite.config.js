import react from '@vitejs/plugin-react';

import { compilerOptions, defineConfig } from '../../vite.config.base.js';

export default defineConfig({
    build: { cssMinify: 'lightningcss' },
    css: { transformer: 'lightningcss' },
    plugins: [
        react({
            babel: {
                plugins: [['babel-plugin-react-compiler', compilerOptions]],
            },
        }),
    ],
});

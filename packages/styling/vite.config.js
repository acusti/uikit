import react from '@vitejs/plugin-react';

import { compilerOptions, defineConfig } from '../../vite.config.base.js';

export default defineConfig({
    plugins: [
        react({
            babel: {
                plugins: [['babel-plugin-react-compiler', compilerOptions]],
            },
        }),
    ],
});

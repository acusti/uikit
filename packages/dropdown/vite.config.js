import react from '@vitejs/plugin-react';

import { compilerOptions, defineConfig } from '../../vite.config.base.js';

export default defineConfig({
    entry: ['src/Dropdown.tsx'],
    plugins: [
        react({
            babel: {
                plugins: [['babel-plugin-react-compiler', compilerOptions]],
            },
        }),
    ],
});

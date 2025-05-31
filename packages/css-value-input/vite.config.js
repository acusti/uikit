import react from '@vitejs/plugin-react';

import { defineConfig } from '../../vite.config.base.js';

export default defineConfig({
    entry: ['src/CSSValueInput.tsx'],
    plugins: [react()],
});

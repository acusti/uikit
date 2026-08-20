import reactCompiler from '@acusti/vite-plugin-react-compiler';

import { compilerOptions, defineConfig } from '../../vite.config.base.js';

export default defineConfig({
    entry: ['src/useBoundingClientRect.ts'],
    plugins: [reactCompiler({ reactCompiler: compilerOptions })],
    react: true,
});

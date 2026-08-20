import reactCompiler from '@acusti/vite-plugin-react-compiler';

import { compilerOptions, defineConfig } from '../../vite.config.base.js';

export default defineConfig({
    build: { cssMinify: 'lightningcss' },
    css: { transformer: 'lightningcss' },
    plugins: [reactCompiler({ reactCompiler: compilerOptions })],
    react: true,
});

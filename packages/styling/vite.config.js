import reactCompiler from '@acusti/vite-plugin-react-compiler';

import { compilerOptions, defineConfig } from '../../vite.config.base.js';

export default defineConfig({
    plugins: [reactCompiler({ reactCompiler: compilerOptions })],
    react: true,
});

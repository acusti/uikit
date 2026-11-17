import styleSheets from '@acusti/sheets/vite';
import { defineConfig } from 'vite';

// `vite build` makes the default build, `vite build --mode raw` the raw one
export default defineConfig(({ mode }) => ({
    build: {
        lib: { entry: 'src/index.ts', fileName: 'index', formats: ['es'] },
        outDir: mode === 'raw' ? 'dist/raw' : 'dist/default',
        rolldownOptions: { external: [/^react(-dom)?(\/|$)/] },
    },
    oxc: { jsx: { runtime: 'automatic' } },
    plugins: [
        styleSheets({
            library: mode === 'raw' ? 'raw' : 'default',
            prefix: '@fixture/ui/',
        }),
    ],
}));

import dts from 'unplugin-dts/vite';
import { defineConfig as defineConfigVite } from 'vite';

export const defineConfig = (options = {}) => {
    const { entry = ['src/index.ts'], formats = ['es'], plugins = [], target } = options;

    return defineConfigVite({
        build: {
            lib: {
                entry,
                fileName: (_format, entryName) => `${entryName}.js`,
                formats,
            },
            minify: false,
            rollupOptions: {
                external: [
                    /^node:/,
                    /^@acusti\//,
                    'clsx',
                    'react',
                    'react-dom',
                    'react/jsx-runtime',
                ],
            },
            sourcemap: true,
            ...(target ? { target } : {}),
        },
        plugins: [...plugins, dts({ exclude: ['**/*.test.ts', '**/*.test.tsx'] })],
    });
};

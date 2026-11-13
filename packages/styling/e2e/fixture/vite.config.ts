import styleSheets from '@acusti/styling/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    builder: {},
    environments: {
        client: {
            build: {
                manifest: true,
                outDir: 'dist/client',
                rolldownOptions: { input: 'src/entry-client.tsx' },
            },
        },
        ssr: {
            build: {
                outDir: 'dist/server',
                rolldownOptions: { input: 'src/entry-server.tsx' },
            },
        },
    },
    oxc: { jsx: { runtime: 'automatic' } },
    plugins: [styleSheets({ stripClientText: true })],
});

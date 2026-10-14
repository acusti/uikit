// The config that size.ts builds a version with: the package’s own, with that
// version’s entry and somewhere of its own to write to.
import { defineConfig } from '../../../../vite.config.base.js';

export default defineConfig({
    build: { emptyOutDir: true, outDir: process.env.SIZE_OUT },
    entry: [process.env.SIZE_ENTRY ?? ''],
});

import { defineConfig } from '../../vite.config.base.js';

// react: 'no-compiler' opts out of the React Compiler transform for code
// that by design accesses refs during render
export default defineConfig({
    entry: ['src/useIsOutOfBounds.ts'],
    react: 'no-compiler',
});

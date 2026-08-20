import { defineConfig } from '../../vite.config.base.js';

// opts out of the React Compiler transform for code that by design accesses
// refs during render, by omitting @acusti/vite-plugin-react-compiler
export default defineConfig({ entry: ['src/useIsOutOfBounds.ts'], react: true });

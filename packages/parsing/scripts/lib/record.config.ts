// The config that versions.ts runs a version’s tests with, to record the inputs
// that they pass to parseAsJSON: the test file is a copy in the run directory,
// named so that no other config takes it for a test.
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: [`${process.env.RECORD_DIR}/*.record.ts`],
    },
});

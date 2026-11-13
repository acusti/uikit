import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

import { assertInstallMatchesLockfile } from './scripts/assert-install-matches-lockfile.mjs';

// Vitest loads this config before the projects’, and a throw here stops the run
// once rather than once per project. A run of one package checks from
// vite.config.base.js instead.
assertInstallMatchesLockfile(fileURLToPath(new URL('.', import.meta.url)));

export default defineConfig({
    test: {
        projects: [
            // run each package’s tests through its own build config, so code is
            // tested as it ships
            'packages/*/vite.config.js',
            { test: { include: ['scripts/*.test.mjs'], name: 'scripts' } },
        ],
    },
});

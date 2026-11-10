import { defineConfig, devices } from '@playwright/test';

// The fixture app imports `@acusti/styling` as published, from `dist`, so
// build the package (`bun run build`) before running these.

const BUILD_PORT = 4391;
const DEV_PORT = 4392;

export default defineConfig({
    forbidOnly: Boolean(process.env.CI),
    projects: [
        {
            name: 'build',
            testMatch: 'build.e2e.ts',
            use: {
                ...devices['Desktop Chrome'],
                baseURL: `http://localhost:${BUILD_PORT}`,
            },
        },
        {
            name: 'dev',
            testMatch: 'dev.e2e.ts',
            use: {
                ...devices['Desktop Chrome'],
                baseURL: `http://localhost:${DEV_PORT}`,
            },
        },
    ],
    reporter: process.env.CI ? 'github' : 'list',
    testDir: '.',
    use: { trace: 'retain-on-failure' },
    webServer: [
        {
            command: 'node server.mjs --build',
            cwd: 'fixture',
            env: { PORT: String(BUILD_PORT) },
            port: BUILD_PORT,
            timeout: 120_000,
        },
        {
            command: 'node server.mjs --dev',
            cwd: 'fixture',
            env: { PORT: String(DEV_PORT) },
            port: DEV_PORT,
            timeout: 120_000,
        },
    ],
    // the dev test edits a stylesheet on disk
    workers: 1,
});

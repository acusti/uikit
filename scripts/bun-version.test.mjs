import { readFileSync } from 'node:fs';

import { expect, it } from 'vitest';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

// netlify.toml pins a Bun of its own, the one copy of the version that a Bun
// bump has to edit by hand besides packageManager
it('builds on Netlify with the Bun packageManager pins', () => {
    const { packageManager } = JSON.parse(read('package.json'));
    const netlifyVersion = /\bBUN_VERSION\s*=\s*"([^"]+)"/.exec(
        read('netlify.toml'),
    )?.[1];

    expect(netlifyVersion).toBe(packageManager.replace(/^bun@/, ''));
});

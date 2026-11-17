// Builds the fixture library both ways and installs it into the fixture
// app’s node_modules, as a package manager would. It has no package.json of
// its own, so that it imports `@acusti/sheets` as this package.
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const library = fileURLToPath(new URL('./', import.meta.url));
const modules = fileURLToPath(new URL('../fixture/node_modules/', import.meta.url));
const installed = `${modules}@fixture/ui/`;

// what a dual-published library’s manifest says
const manifest = {
    exports: {
        '.': {
            'acusti-sheets': './dist/raw/index.js',
            default: './dist/default/index.js',
        },
    },
    name: '@fixture/ui',
    peerDependencies: { '@acusti/sheets': '*', react: '^19.2' },
    peerDependenciesMeta: { '@acusti/sheets': { optional: true } },
    private: true,
    type: 'module',
};

await rm(`${library}dist`, { force: true, recursive: true });
for (const mode of ['production', 'raw']) {
    await build({ logLevel: 'warn', mode, root: library });
}
await rm(installed, { force: true, recursive: true });
await mkdir(installed, { recursive: true });
await cp(`${library}dist`, `${installed}dist`, { recursive: true });
await writeFile(`${installed}package.json`, `${JSON.stringify(manifest, null, 4)}\n`);

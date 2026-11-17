// Builds the fixture library both ways and installs it into the fixture
// app’s node_modules, as a package manager would. It has no package.json of
// its own, so that it imports `@acusti/styling` as this package.
import { cp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const library = fileURLToPath(new URL('./', import.meta.url));
const modules = fileURLToPath(new URL('../fixture/node_modules/', import.meta.url));
const installed = `${modules}@fixture/ui/`;

// what a dual-published library’s manifest says
const manifest = {
    exports: {
        '.': {
            'acusti-styling': './dist/raw/index.js',
            default: './dist/default/index.js',
        },
    },
    name: '@fixture/ui',
    peerDependencies: { '@acusti/styling': '*', react: '^19.2' },
    peerDependenciesMeta: { '@acusti/styling': { optional: true } },
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

// The app installs @acusti/styling too, where the library finds it: Vite
// replaces an optional peer the library can’t resolve with an empty module.
await rm(`${modules}@acusti/styling`, { force: true, recursive: true });
await mkdir(`${modules}@acusti`, { recursive: true });
await symlink('../../../..', `${modules}@acusti/styling`);

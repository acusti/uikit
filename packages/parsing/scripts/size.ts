// What each version adds to a bundle: dist/index.js as the package’s own build
// makes it, minified by bun and gzipped.
//
//   bun scripts/size.ts [--base <ref>] [--branch <ref>]
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { gzipSync } from 'node:zlib';

import { PACKAGE_DIR, prepareRun } from './lib/versions.ts';

const { values: options } = parseArgs({
    options: {
        base: { default: 'origin/main', type: 'string' },
        branch: { type: 'string' },
    },
});
const { dir, versions } = prepareRun({
    base: { label: 'base', ref: options.base },
    branch: { label: 'branch', ref: options.branch ?? null },
});

const run = (command: string, args: Array<string>, env: Record<string, string> = {}) => {
    const result = spawnSync(command, args, {
        cwd: PACKAGE_DIR,
        encoding: 'utf8',
        env: { ...process.env, ...env },
    });
    if (result.status !== 0) {
        console.error(result.stdout + result.stderr);
        process.exit(1);
    }
};

const sizes: Record<string, Record<string, number | string>> = {};
for (const label of ['base', 'branch']) {
    // an entry like src/index.ts, for that version’s parser
    const buildDir = path.join(dir, `size-${label}`);
    mkdirSync(buildDir, { recursive: true });
    const entry = path.join(buildDir, 'index.ts');
    writeFileSync(entry, `export { parseAsJSON } from '../${label}.ts';\n`);
    const outDir = path.join(buildDir, 'dist');
    run('bunx', ['vite', 'build', '--config', 'scripts/lib/size.config.ts'], {
        SIZE_ENTRY: entry,
        SIZE_OUT: outDir,
    });
    const minifiedPath = path.join(buildDir, 'index.min.js');
    run('bun', [
        'build',
        path.join(outDir, 'index.js'),
        '--minify',
        '--outfile',
        minifiedPath,
    ]);
    const built = readFileSync(path.join(outDir, 'index.js'));
    const minified = readFileSync(minifiedPath);
    sizes[label] = {
        'dist/index.js': built.length,
        minified: minified.length,
        'minified and gzipped': gzipSync(minified, { level: 9 }).length,
        version: versions[label],
    };
}
console.table(sizes);
const difference =
    (sizes.branch['minified and gzipped'] as number) -
    (sizes.base['minified and gzipped'] as number);
console.log(`minified and gzipped: ${difference >= 0 ? '+' : ''}${difference} bytes`);

import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';

import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';

import {
    assertInstallMatchesLockfile,
    findInstallProblems,
} from './assert-install-matches-lockfile.mjs';

const roots = [];

afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, { force: true, recursive: true });
});

// A checkout installed the way Bun’s isolated linker lays one out: each package
// version in its own store directory, linked into the node_modules of whatever
// depends on it. `store` maps a store directory to the package it holds and the
// links beside it, and `links` maps a workspace’s node_modules entry to a store
// directory. bun.lock is written with the trailing commas Bun writes, in the
// format version Bun writes unless `lock` names another.
function createCheckout({ links, lock, store }) {
    const root = mkdtempSync(join(tmpdir(), 'install-check-'));
    roots.push(root);
    writeFileSync(
        join(root, 'bun.lock'),
        JSON.stringify({ lockfileVersion: 1, ...lock }, null, 2).replace(
            /\n(\s*)([}\]])/g,
            ',\n$1$2',
        ),
    );
    const storeDir = (entry) => join(root, 'node_modules/.bun', entry, 'node_modules');
    for (const [entry, { deps = {}, name, version }] of Object.entries(store)) {
        const dir = join(storeDir(entry), name);
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, 'package.json'), JSON.stringify({ name, version }));
        for (const [dependency, target] of Object.entries(deps)) {
            link(join(storeDir(entry), dependency), join(storeDir(target), dependency));
        }
    }
    for (const [path, target] of Object.entries(links)) {
        const name = path.slice(
            path.lastIndexOf('node_modules/') + 'node_modules/'.length,
        );
        link(join(root, path), join(storeDir(target), name));
    }
    return root;
}

function link(path, target) {
    mkdirSync(dirname(path), { recursive: true });
    symlinkSync(relative(dirname(path), target), path);
}

const workspaces = (dependencies) => ({
    '': { name: 'repo' },
    'packages/plugin': { dependencies, name: '@repo/plugin' },
});

describe('findInstallProblems', () => {
    // The shape of a pull that bumped a dependency, before `bun install`. What
    // the old version depends on is held to nothing: the new version’s entries
    // would report each of its dependencies as a mismatch of its own.
    it('reports a workspace’s dependency installed at another version than bun.lock pins', () => {
        const root = createCheckout({
            links: { 'packages/plugin/node_modules/transformer': 'transformer@0.156.0' },
            lock: {
                packages: {
                    helper: ['helper@2.0.0', '', {}, 'sha512-'],
                    transformer: [
                        'transformer@0.158.0',
                        '',
                        { dependencies: { helper: '^2' } },
                        'sha512-',
                    ],
                },
                workspaces: workspaces({ transformer: '0.158.0' }),
            },
            store: {
                'helper@1.0.0': { name: 'helper', version: '1.0.0' },
                'transformer@0.156.0': {
                    deps: { helper: 'helper@1.0.0' },
                    name: 'transformer',
                    version: '0.156.0',
                },
            },
        });

        expect(findInstallProblems(root)).toEqual([
            'transformer (the @repo/plugin workspace): installed 0.156.0, bun.lock has 0.158.0',
        ]);
    });

    it('reports nothing for an install that matches bun.lock', () => {
        const root = createCheckout({
            links: { 'packages/plugin/node_modules/transformer': 'transformer@0.158.0' },
            lock: {
                packages: {
                    helper: ['helper@2.0.0', '', {}, 'sha512-'],
                    transformer: [
                        'transformer@0.158.0',
                        '',
                        { dependencies: { helper: '^2' } },
                        'sha512-',
                    ],
                },
                workspaces: workspaces({ transformer: '0.158.0' }),
            },
            store: {
                'helper@2.0.0': { name: 'helper', version: '2.0.0' },
                'transformer@0.158.0': {
                    deps: { helper: 'helper@2.0.0' },
                    name: 'transformer',
                    version: '0.158.0',
                },
            },
        });

        expect(findInstallProblems(root)).toEqual([]);
    });

    // A regenerated lockfile can bump a dependency of a dependency alone, and
    // its parent’s store directory keeps the old link until the install. The
    // nested key is how bun.lock pins a version that differs from the
    // top-level one, which the parent has to resolve before the top level.
    it('reports a transitive dependency at the wrong version, through a nested key', () => {
        const root = createCheckout({
            links: { 'packages/plugin/node_modules/transformer': 'transformer@0.158.0' },
            lock: {
                packages: {
                    semver: ['semver@7.7.0', '', {}, 'sha512-'],
                    transformer: [
                        'transformer@0.158.0',
                        '',
                        { dependencies: { semver: '^6' } },
                        'sha512-',
                    ],
                    'transformer/semver': ['semver@6.3.1', '', {}, 'sha512-'],
                },
                workspaces: workspaces({ transformer: '0.158.0' }),
            },
            store: {
                'semver@6.3.0': { name: 'semver', version: '6.3.0' },
                'transformer@0.158.0': {
                    deps: { semver: 'semver@6.3.0' },
                    name: 'transformer',
                    version: '0.158.0',
                },
            },
        });

        expect(findInstallProblems(root)).toEqual([
            'semver (via transformer@0.158.0): installed 6.3.0, bun.lock has 6.3.1',
        ]);
    });

    // Only a workspace’s own required dependencies count as missing. Bun leaves
    // out builds it can’t run here, and bun.lock doesn’t always mark them
    // optional; a missing transitive dependency already fails its first import
    // with an error that names it.
    it('reports a workspace’s dependency that isn’t installed, unless it is optional', () => {
        const root = createCheckout({
            links: { 'node_modules/runner': 'runner@5.1.0' },
            lock: {
                packages: {
                    fsevents: ['fsevents@2.3.3', '', {}, 'sha512-'],
                    runner: [
                        'runner@5.1.0',
                        '',
                        { dependencies: { tinypool: '^2' } },
                        'sha512-',
                    ],
                    tinypool: ['tinypool@2.0.0', '', {}, 'sha512-'],
                    transformer: ['transformer@0.158.0', '', {}, 'sha512-'],
                },
                workspaces: {
                    '': {
                        devDependencies: { runner: '^5' },
                        name: 'repo',
                        optionalDependencies: { fsevents: '^2' },
                    },
                    'packages/plugin': {
                        dependencies: { transformer: '0.158.0' },
                        name: '@repo/plugin',
                    },
                },
            },
            store: { 'runner@5.1.0': { name: 'runner', version: '5.1.0' } },
        });

        expect(findInstallProblems(root)).toEqual([
            'transformer (the @repo/plugin workspace): not installed, bun.lock has 0.158.0',
        ]);
    });

    // A checkout whose transformer has an optional build limited by `platform`,
    // and a stale 0.156.0 link to that build left where resolution can reach
    // it, in node_modules/.bun/node_modules
    function checkoutWithStaleBuild(platform) {
        return createCheckout({
            links: {
                'node_modules/.bun/node_modules/@transformer/binding':
                    '@transformer+binding@0.156.0',
                'packages/plugin/node_modules/transformer': 'transformer@0.158.0',
            },
            lock: {
                packages: {
                    '@transformer/binding': [
                        '@transformer/binding@0.158.0',
                        '',
                        platform,
                        'sha512-',
                    ],
                    transformer: [
                        'transformer@0.158.0',
                        '',
                        { optionalDependencies: { '@transformer/binding': '0.158.0' } },
                        'sha512-',
                    ],
                },
                workspaces: workspaces({ transformer: '0.158.0' }),
            },
            store: {
                '@transformer+binding@0.156.0': {
                    name: '@transformer/binding',
                    version: '0.156.0',
                },
                'transformer@0.158.0': { name: 'transformer', version: '0.158.0' },
            },
        });
    }

    // Bun skips another platform’s build, and resolution can still reach a link
    // to one an earlier install left behind. A list that names platforms and
    // also excludes some limits the build to the ones it names, as npm reads it.
    const otherOS = process.platform === 'win32' ? 'linux' : 'win32';
    it.each([
        ['names another platform', { os: otherOS }],
        ['names platforms alongside an exclusion', { os: [otherOS, '!aix'] }],
        ['excludes this platform', { os: [`!${process.platform}`] }],
    ])('passes over a stale link to a build that %s', (_, platform) => {
        expect(findInstallProblems(checkoutWithStaleBuild(platform))).toEqual([]);
    });

    // the layout this check was written for: a glibc machine holding a stale
    // link to the musl build, or the reverse; libc counts on Linux alone
    it.runIf(process.platform === 'linux')(
        'passes over a stale link to the build for the other libc',
        () => {
            const otherLibc =
                process.report.getReport().header.glibcVersionRuntime == null
                    ? 'glibc'
                    : 'musl';
            const root = checkoutWithStaleBuild({
                cpu: process.arch,
                libc: otherLibc,
                os: process.platform,
            });

            expect(findInstallProblems(root)).toEqual([]);
        },
    );

    // this platform’s build is what the bindings load, so a stale one counts
    it('reports this platform’s build at the wrong version', () => {
        const root = createCheckout({
            links: { 'packages/plugin/node_modules/transformer': 'transformer@0.158.0' },
            lock: {
                packages: {
                    '@transformer/binding-here': [
                        '@transformer/binding-here@0.158.0',
                        '',
                        { cpu: process.arch, os: process.platform },
                        'sha512-',
                    ],
                    transformer: [
                        'transformer@0.158.0',
                        '',
                        {
                            optionalDependencies: {
                                '@transformer/binding-here': '0.158.0',
                            },
                        },
                        'sha512-',
                    ],
                },
                workspaces: workspaces({ transformer: '0.158.0' }),
            },
            store: {
                '@transformer+binding-here@0.156.0': {
                    name: '@transformer/binding-here',
                    version: '0.156.0',
                },
                'transformer@0.158.0': {
                    deps: {
                        '@transformer/binding-here': '@transformer+binding-here@0.156.0',
                    },
                    name: 'transformer',
                    version: '0.158.0',
                },
            },
        });

        expect(findInstallProblems(root)).toEqual([
            '@transformer/binding-here (via transformer@0.158.0): installed 0.156.0, bun.lock has 0.158.0',
        ]);
    });

    // packages that depend on each other, as some npm packages do, are walked
    // once each rather than until the stack runs out
    it('walks a dependency cycle once', () => {
        const root = createCheckout({
            links: { 'packages/plugin/node_modules/a': 'a@1.0.0' },
            lock: {
                packages: {
                    a: ['a@1.0.0', '', { dependencies: { b: '^1' } }, 'sha512-'],
                    b: ['b@1.0.0', '', { dependencies: { a: '^1' } }, 'sha512-'],
                },
                workspaces: workspaces({ a: '^1' }),
            },
            store: {
                'a@1.0.0': { deps: { b: 'b@1.0.0' }, name: 'a', version: '1.0.0' },
                'b@1.0.0': { deps: { a: 'a@1.0.0' }, name: 'b', version: '1.0.0' },
            },
        });

        expect(findInstallProblems(root)).toEqual([]);
    });

    // A Bun release that changes the lockfile’s shape would otherwise block
    // every test run on mismatches that aren’t there, which no install clears.
    it('lets a lockfile in another format through, with a warning', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        onTestFinished(() => warn.mockRestore());
        const root = createCheckout({
            links: { 'packages/plugin/node_modules/transformer': 'transformer@0.156.0' },
            lock: {
                lockfileVersion: 2,
                packages: { transformer: ['transformer@0.158.0', '', {}, 'sha512-'] },
                workspaces: workspaces({ transformer: '0.158.0' }),
            },
            store: { 'transformer@0.156.0': { name: 'transformer', version: '0.156.0' } },
        });

        expect(findInstallProblems(root)).toEqual([]);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('version 2'));
    });

    // a workspace, git or file dependency has no registry version to hold it to
    it('passes over a dependency on another workspace', () => {
        const root = createCheckout({
            links: {},
            lock: {
                packages: { '@repo/plugin': ['@repo/plugin@workspace:packages/plugin'] },
                workspaces: {
                    '': {
                        devDependencies: { '@repo/plugin': 'workspace:*' },
                        name: 'repo',
                    },
                    'packages/plugin': { name: '@repo/plugin' },
                },
            },
            store: {},
        });

        expect(findInstallProblems(root)).toEqual([]);
    });
});

describe('assertInstallMatchesLockfile', () => {
    it('names the mismatches and how to fix them, listing the first ten', () => {
        const names = Array.from({ length: 12 }, (_, index) => `dep${index}`);
        const root = createCheckout({
            links: Object.fromEntries(
                names.map((name) => [`node_modules/${name}`, `${name}@1.0.0`]),
            ),
            lock: {
                packages: Object.fromEntries(
                    names.map((name) => [name, [`${name}@2.0.0`, '', {}, 'sha512-']]),
                ),
                workspaces: {
                    '': {
                        devDependencies: Object.fromEntries(
                            names.map((name) => [name, '^2']),
                        ),
                        name: 'repo',
                    },
                },
            },
            store: Object.fromEntries(
                names.map((name) => [`${name}@1.0.0`, { name, version: '1.0.0' }]),
            ),
        });

        expect(() => assertInstallMatchesLockfile(root)).toThrow(
            [
                'node_modules does not match bun.lock, so the tests would run against other versions than this checkout pins:',
                '',
                ...names
                    .slice(0, 10)
                    .map(
                        (name) =>
                            `  ${name} (the root): installed 1.0.0, bun.lock has 2.0.0`,
                    ),
                '  …and 2 more',
                '',
                'Run `bun install`, then run the tests again.',
            ].join('\n'),
        );
    });

    // A watch-mode restart reloads every config in the same process, after a
    // pull or branch switch that usually changes bun.lock as well; a check
    // remembered from before it would let the restarted run test, and cache,
    // the old install.
    it('checks a root again once its bun.lock changes', () => {
        const lock = (version) => ({
            packages: { transformer: [`transformer@${version}`, '', {}, 'sha512-'] },
            workspaces: workspaces({ transformer: version }),
        });
        const root = createCheckout({
            links: { 'packages/plugin/node_modules/transformer': 'transformer@0.158.0' },
            lock: lock('0.158.0'),
            store: { 'transformer@0.158.0': { name: 'transformer', version: '0.158.0' } },
        });
        assertInstallMatchesLockfile(root);

        writeFileSync(
            join(root, 'bun.lock'),
            JSON.stringify({ lockfileVersion: 1, ...lock('0.159.0') }),
        );

        expect(() => assertInstallMatchesLockfile(root)).toThrow(
            'transformer (the @repo/plugin workspace): installed 0.158.0, bun.lock has 0.159.0',
        );
    });
});

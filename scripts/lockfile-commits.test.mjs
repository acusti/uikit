import { execFileSync } from 'node:child_process';
import {
    copyFileSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

const roots = [];

afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, { force: true, recursive: true });
});

const GIT_ENV = {
    ...process.env,
    GIT_AUTHOR_EMAIL: 'test@example.com',
    GIT_AUTHOR_NAME: 'Test',
    GIT_COMMITTER_EMAIL: 'test@example.com',
    GIT_COMMITTER_NAME: 'Test',
};

const git = (root, ...args) =>
    execFileSync('git', args, { cwd: root, encoding: 'utf8', env: GIT_ENV });

// bun.lock in the layout the script reads: one line per package, a blank
// line between entries, a trailing comma after the last member of every
// object
function lockfile(packages) {
    const entries = Object.entries(packages).map(
        ([key, tuple]) => `    ${JSON.stringify(key)}: ${JSON.stringify(tuple)},`,
    );
    return [
        '{',
        '  "lockfileVersion": 2,',
        '  "configVersion": 1,',
        '  "workspaces": {',
        '    "": {',
        '      "name": "repo",',
        '      "dependencies": {',
        '        "esbuild": "^0.25.0",',
        '        "transformer": "^1.0.0",',
        '      },',
        '    },',
        '  },',
        '  "packages": {',
        entries.join('\n\n'),
        '  }',
        '}',
        '',
    ].join('\n');
}

// A repo whose HEAD holds `before` as bun.lock, with `after` written over it
// the way a regenerated lockfile is, and a copy of the script at the path it
// runs from
function createRepo({ after, before }) {
    const root = mkdtempSync(join(tmpdir(), 'lockfile-commits-'));
    roots.push(root);
    mkdirSync(join(root, 'scripts'));
    copyFileSync(
        new URL('./lockfile-commits.mjs', import.meta.url),
        join(root, 'scripts/lockfile-commits.mjs'),
    );
    git(root, 'init', '-q');
    git(root, 'config', 'core.hooksPath', '/dev/null');
    git(root, 'config', 'commit.gpgsign', 'false');
    writeFileSync(join(root, 'bun.lock'), lockfile(before));
    git(root, 'add', 'bun.lock');
    git(root, 'commit', '-q', '-m', 'Initial');
    writeFileSync(join(root, 'bun.lock'), lockfile(after));
    return root;
}

const run = (root, ...args) =>
    execFileSync('bun', ['scripts/lockfile-commits.mjs', ...args], {
        cwd: root,
        encoding: 'utf8',
        env: GIT_ENV,
    });

const commitTitles = (root) =>
    git(root, 'log', '--format=%s', 'HEAD~2..HEAD').trim().split('\n');

const stripped = {
    '@oxc/binding-linux-x64-gnu': [
        '@oxc/binding-linux-x64-gnu@0.127.0',
        '',
        { cpu: 'x64', os: 'linux' },
        'sha512-a',
    ],
    esbuild: [
        'esbuild@0.25.0',
        '',
        { optionalDependencies: { '@oxc/binding-linux-x64-gnu': '0.127.0' } },
        'sha512-b',
    ],
    transformer: ['transformer@1.0.0', '', {}, 'sha512-c'],
};
const recorded = {
    ...stripped,
    '@oxc/binding-linux-x64-gnu': [
        '@oxc/binding-linux-x64-gnu@0.127.0',
        '',
        { cpu: 'x64', libc: 'glibc', os: 'linux' },
        'sha512-a',
    ],
    esbuild: [
        'esbuild@0.25.0',
        '',
        {
            hasInstallScript: true,
            optionalDependencies: { '@oxc/binding-linux-x64-gnu': '0.127.0' },
        },
        'sha512-b',
    ],
};

describe('lockfile-commits', () => {
    // A regeneration after Bun 1.4.0–1.4.3 wrote the lockfile brings back the
    // metadata it dropped, at versions that didn’t change. A bump that also
    // gains metadata (transformer here) is still a bump.
    it('records metadata at unchanged versions in one commit of its own, apart from the bumps', () => {
        const root = createRepo({
            after: {
                ...recorded,
                transformer: [
                    'transformer@1.1.0',
                    '',
                    { hasInstallScript: true },
                    'sha512-d',
                ],
            },
            before: stripped,
        });

        const plan = run(root);
        expect(plan).toContain('3 changed lockfile entries -> 2 commits');
        expect(plan).toContain('Record libc and install-script metadata in bun.lock');
        expect(plan).toContain('Bump transformer to 1.1.0');
        expect(plan).not.toContain('Bump esbuild');

        run(root, '--commit');
        expect(commitTitles(root).toSorted()).toEqual([
            'Bump transformer to 1.1.0',
            'Record libc and install-script metadata in bun.lock',
        ]);
        expect(readFileSync(join(root, 'bun.lock'), 'utf8')).toBe(
            git(root, 'show', 'HEAD:bun.lock'),
        );
        const metadataCommit = git(
            root,
            'log',
            '--format=%H',
            '--grep=^Record',
            '-1',
        ).trim();
        const changedLines = git(root, 'show', '--format=', metadataCommit)
            .split('\n')
            .filter((line) => /^\+ {4}"/.test(line));
        expect(changedLines).toEqual([
            expect.stringContaining('"@oxc/binding-linux-x64-gnu"'),
            expect.stringContaining('"esbuild"'),
        ]);
    });

    // the shape of a lockfile Bun 1.4.0–1.4.3 wrote, against one Bun 1.4.4 wrote
    it('names a commit that only drops metadata for what it does', () => {
        const root = createRepo({ after: stripped, before: recorded });

        expect(run(root)).toContain(
            'Drop libc and install-script metadata from bun.lock',
        );
    });

    // Neither Record nor Drop fits two shapes: entries that went opposite
    // ways, and a field whose value changed (a build relabeled glibc to musl).
    // Each reaches the fallback title by its own path.
    it.each([
        {
            after: { ...stripped, esbuild: recorded.esbuild },
            before: {
                ...stripped,
                '@oxc/binding-linux-x64-gnu': recorded['@oxc/binding-linux-x64-gnu'],
            },
            shape: 'one entry gaining a field and another losing one',
        },
        {
            after: {
                ...recorded,
                '@oxc/binding-linux-x64-gnu': [
                    '@oxc/binding-linux-x64-gnu@0.127.0',
                    '',
                    { cpu: 'x64', libc: 'musl', os: 'linux' },
                    'sha512-a',
                ],
            },
            before: recorded,
            shape: 'a field whose value changed',
        },
    ])('names a commit for $shape as an update', ({ after, before }) => {
        const root = createRepo({ after, before });

        expect(run(root)).toContain(
            'Update libc and install-script metadata in bun.lock',
        );
    });

    // the metadata commit takes an entry only when nothing else on its line
    // changed: an entry at the same version with another integrity hash is a
    // change of its own, and stays one
    it('keeps any other change at an unchanged version out of the metadata commit', () => {
        const root = createRepo({
            after: {
                ...recorded,
                transformer: ['transformer@1.0.0', '', {}, 'sha512-e'],
            },
            before: stripped,
        });

        const plan = run(root);
        expect(plan).toContain('3 changed lockfile entries -> 2 commits');
        expect(plan).toContain('Bump transformer to 1.0.0');
    });

    // AGENTS.md documents both flags for adjusting a plan, and either can put a
    // bump in one commit with the metadata entries, which changed no version
    it.each([
        ['--merge', '@oxc/binding-linux-x64-gnu,transformer'],
        ['--merge', 'transformer,@oxc/binding-linux-x64-gnu'],
        ['--assign', 'transformer=esbuild'],
    ])('names a commit that %s %s puts metadata in by its bump', (flag, value) => {
        const root = createRepo({
            after: {
                ...recorded,
                transformer: ['transformer@1.1.0', '', {}, 'sha512-d'],
            },
            before: stripped,
        });

        const plan = run(root, flag, value);
        expect(plan).toContain('3 changed lockfile entries -> 1 commit');
        expect(plan).toContain('Bump transformer to 1.1.0 (and transitive deps)');
    });
});

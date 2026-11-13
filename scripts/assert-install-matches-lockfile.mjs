import { readFileSync, realpathSync, statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

// Called while a vitest config loads, so a run against the wrong packages stops
// before it starts. A node_modules that lags its bun.lock (a pull that bumped a
// dependency, a branch switch) runs the tests against the old versions, and
// what that shows is a failure in code that is already fixed.
//
// 1. What it checks. Starting from each workspace’s own dependencies, it
//    follows the links Node would follow and compares each package it reaches
//    with the version bun.lock gives that edge. It only reads.
// 2. Why it follows links rather than listing node_modules/.bun. Bun keeps
//    every version it ever installed in the store, and installs a platform
//    build in one release but not the next, so what the store holds says
//    little about what a test imports.
// 3. What a missed check costs. Vitest caches each transformed module with its
//    imports resolved to paths in the store, version included, and clears that
//    cache only when bun.lock changes. A run between a pull and the install
//    caches the old versions’ paths under the new bun.lock’s hash, and the
//    install that follows doesn’t clear them. A run this stops caches nothing.
// 4. What it doesn’t understand, it lets through. A bun.lock in a format other
//    than the one it reads would make it report mismatches that aren’t there,
//    and `bun install` couldn’t clear those.

// list the first ten; past that, a count says as much
const MAX_LISTED = 10;

// The bun.lock text each root last passed with, by root. Vite bundles each
// project’s config with what it imports, so a run of every package loads this
// module once per project, and globalThis is where every copy sees the others’
// results. A watch-mode restart reloads the configs in the same process, and
// the pull or branch switch behind it usually changes bun.lock too, so a root
// is checked again whenever its bun.lock no longer matches.
const passedLockfiles = (globalThis[Symbol.for('@acusti/uikit:passed-lockfiles')] ??=
    new Map());

export function assertInstallMatchesLockfile(root) {
    const text = readFileSync(join(root, 'bun.lock'), 'utf8');
    if (passedLockfiles.get(root) === text) return;
    const problems = findProblems(root, text);
    if (problems.length === 0) {
        passedLockfiles.set(root, text);
        return;
    }

    const listed = problems.slice(0, MAX_LISTED).map((problem) => `  ${problem}`);
    if (problems.length > MAX_LISTED) {
        listed.push(`  …and ${problems.length - MAX_LISTED} more`);
    }
    throw new Error(
        [
            'node_modules does not match bun.lock, so the tests would run against other versions than this checkout pins:',
            '',
            ...listed,
            '',
            'Run `bun install`, then run the tests again.',
        ].join('\n'),
    );
}

export function findInstallProblems(root) {
    return findProblems(root, readFileSync(join(root, 'bun.lock'), 'utf8'));
}

function findProblems(root, text) {
    const lock = parseLockfile(text);
    if (lock.lockfileVersion !== 1) {
        console.warn(
            `Skipped checking node_modules against bun.lock: scripts/assert-install-matches-lockfile.mjs reads lockfileVersion 1, and this bun.lock is version ${lock.lockfileVersion}.`,
        );
        return [];
    }
    const problems = [];
    // The package directories already walked, by real path. Besides saving
    // the walk from repeating itself, this is what ends a dependency cycle,
    // which would otherwise recurse until the stack overflows, and throw while
    // the config loads.
    const visited = new Set();

    // `from` is the directory resolution starts in, `parentKey` the bun.lock
    // key of the package that depends on `name` (a workspace’s name, or '' for
    // the root), and `via` what the message names as the dependent
    function check({ from, isDirect, isOptional, name, parentKey, via }) {
        const key = resolveKey(lock.packages, parentKey, name);
        const entry = lock.packages[key];
        // a dependency bun.lock doesn’t list has no version to hold it to
        if (entry == null) return;
        const [resolved, , meta = {}] = entry;
        const wanted = resolved.slice(resolved.lastIndexOf('@') + 1);
        // a workspace, git or file package has no registry version to match
        if (!/^\d/.test(wanted)) return;
        // Skip other platforms’ builds. Bun doesn’t install them here, but
        // node_modules/.bun/node_modules can keep a link to one from an earlier
        // install, and nothing on this machine loads it.
        if (!isForThisPlatform(meta)) return;

        const dir = resolvePackageDir(from, name);
        if (dir == null) {
            // Absence is a finding for a workspace’s own dependencies alone.
            // Bun leaves out an optional one it can’t run here (another
            // platform’s build), and a missing transitive one fails its first
            // import loudly enough.
            if (isDirect && !isOptional) {
                problems.push(`${name} (${via}): not installed, bun.lock has ${wanted}`);
            }
            return;
        }
        const installed = readVersion(dir);
        if (installed !== wanted) {
            problems.push(
                `${name} (${via}): installed ${installed ?? 'nothing readable'}, bun.lock has ${wanted}`,
            );
            // what the wrong version depends on would be held to the wrong
            // entries, so its own mismatch is the whole finding
            return;
        }
        if (visited.has(dir)) return;
        visited.add(dir);

        for (const [dependency, isDependencyOptional] of dependenciesOf(meta)) {
            check({
                from: dir,
                isDirect: false,
                isOptional: isDependencyOptional,
                name: dependency,
                parentKey: key,
                via: `via ${resolved}`,
            });
        }
    }

    for (const [path, workspace] of Object.entries(lock.workspaces)) {
        const parentKey = path === '' ? '' : workspace.name;
        const via = path === '' ? 'the root' : `the ${workspace.name} workspace`;
        for (const [name, isOptional] of dependenciesOf(workspace)) {
            check({
                from: join(root, path),
                isDirect: true,
                isOptional,
                name,
                parentKey,
                via,
            });
        }
    }

    return problems;
}

// [name, isOptional] for each dependency a manifest or bun.lock entry lists,
// peers left out: Bun links a peer by the version it settled on for the whole
// tree, which no single bun.lock key states
function dependenciesOf({ dependencies, devDependencies, optionalDependencies }) {
    return [
        ...Object.keys(dependencies ?? {}).map((name) => [name, false]),
        ...Object.keys(devDependencies ?? {}).map((name) => [name, false]),
        ...Object.keys(optionalDependencies ?? {}).map((name) => [name, true]),
    ];
}

// whether the os, cpu and libc a bun.lock entry is limited to (each a name, a
// list of names, or names negated with `!`) include this machine’s
function isForThisPlatform({ cpu, libc, os }) {
    return (
        matches(os, process.platform) &&
        matches(cpu, process.arch) &&
        (process.platform !== 'linux' || matches(libc, getLibc()))
    );
}

// as npm reads these lists: an exclusion of the value rules it out, and a list
// that names any values has to name this one
function matches(allowed, value) {
    if (allowed == null) return true;
    const names = [allowed].flat();
    if (names.includes(`!${value}`)) return false;
    const included = names.filter((name) => !name.startsWith('!'));
    return included.length === 0 || included.includes(value);
}

// a glibc runtime reports its version, and musl doesn’t; the report takes tens
// of milliseconds to build, so it is built once
let libc;
function getLibc() {
    libc ??=
        process.report.getReport().header.glibcVersionRuntime == null ? 'musl' : 'glibc';
    return libc;
}

// The bun.lock key a dependency of `parentKey` resolves to. Keys spell the
// hoisted layout’s nesting ("@babel/core/semver" is the semver inside
// @babel/core’s own node_modules), so this looks for the dependency beside the
// parent, then one level up at a time, as Node’s resolution would.
function resolveKey(packages, parentKey, name) {
    const segments = parentKey.match(/@[^/]+\/[^/]+|[^/]+/g) ?? [];
    for (let depth = segments.length; depth > 0; depth -= 1) {
        const key = [...segments.slice(0, depth), name].join('/');
        if (key in packages) return key;
    }
    return name;
}

// the real directory `name` resolves to from `from`, by Node’s lookup: each
// ancestor’s node_modules, skipping ancestors that are node_modules themselves
function resolvePackageDir(from, name) {
    for (let dir = from; ; dir = dirname(dir)) {
        if (basename(dir) !== 'node_modules') {
            const candidate = join(dir, 'node_modules', name);
            if (statSync(candidate, { throwIfNoEntry: false })?.isDirectory()) {
                return realpathSync(candidate);
            }
        }
        if (dirname(dir) === dir) return null;
    }
}

// bun.lock is JSONC, a comma after the last member of every object and array.
// A string is matched first so that a comma inside one stays where it is.
function parseLockfile(text) {
    return JSON.parse(
        text.replace(
            /"(?:[^"\\]|\\.)*"|,(\s*[}\]])/g,
            (match, closer) => closer ?? match,
        ),
    );
}

function readVersion(dir) {
    try {
        const { version } = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
        return typeof version === 'string' ? version : null;
    } catch {
        return null;
    }
}

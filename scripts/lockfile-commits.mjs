#!/usr/bin/env bun
// Splits a regenerated bun.lock into one commit per direct dependency (plus the
// transitive entries that only it pulls in), so `git blame`/`git revert` stay useful.
//
// Workflow:
//   rm bun.lock && bun install           # regenerate with the latest in-range versions
//   bun scripts/lockfile-commits.mjs     # print the plan (dry run, changes nothing)
//   bun scripts/lockfile-commits.mjs --commit
//
// How it works: bun.lock (lockfileVersion 1) is one line per package, so the diff
// against HEAD is a set of changed package keys. Each key is attributed to a changed
// direct dependency (an "anchor") that reaches it through the dependency graph
// (dependencies and optionalDependencies, plus peerDependencies that changed, in the
// old or new lockfile; see `reach`).
// Anchors that are connected and moved between the same two versions (e.g. the
// storybook packages) are merged. Changed keys with no changed ancestor become their
// own groups. The groups are replayed on top of HEAD's lockfile one at a time, with
// the dependency graph checked after every step; the final state must be
// byte-identical to the regenerated lockfile or nothing is committed.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const LOCKFILE = 'bun.lock';
const ENTRY_LINE = /^ {4}"((?:[^"\\]|\\.)+)": \[/;
const EDGE_FIELDS = ['dependencies', 'optionalDependencies', 'peerDependencies'];
// ranges we trust Bun.semver to evaluate (skips tags, urls, `workspace:`, prereleases)
const PLAIN_RANGE = /^[\sv\d.^~<>=*xX|,-]+$/;

const HELP = `Usage: bun scripts/lockfile-commits.mjs [options]

Splits the uncommitted changes in bun.lock into one commit per direct dependency.
Prints the plan by default; nothing is written or committed without --commit.

Options:
  --commit               Create the commits (requires bun.lock to be the only modified file)
  --verbose              List every lockfile entry in each group
  --merge a,b[,c]        Put the groups containing these lockfile keys in one commit
                         (repeatable)
  --assign key=owner     Move a lockfile entry into the group containing \`owner\`
                         (repeatable; use it to resolve the "ambiguous" warnings)
  -h, --help             Show this help`;

const { values: options } = parseArgs({
    allowPositionals: false,
    options: {
        assign: { multiple: true, type: 'string' },
        commit: { default: false, type: 'boolean' },
        help: { default: false, short: 'h', type: 'boolean' },
        merge: { multiple: true, type: 'string' },
        verbose: { default: false, type: 'boolean' },
    },
});

if (options.help) {
    console.log(HELP);
    process.exit(0);
}

if (typeof Bun === 'undefined') {
    console.error(
        'Run this script with bun (it uses Bun.semver): bun scripts/lockfile-commits.mjs',
    );
    process.exit(1);
}

process.chdir(fileURLToPath(new URL('..', import.meta.url)));

const fail = (message) => {
    console.error(`Error: ${message}`);
    process.exit(1);
};

const git = (...args) =>
    execFileSync('git', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

// ---------------------------------------------------------------------------
// Lockfile text <-> entries
// ---------------------------------------------------------------------------

const serialize = ({ entries, head, tail }) => {
    const body = [];
    entries.forEach((entry, index) => {
        if (index > 0) body.push('');
        body.push(entry.line);
    });
    return [...head, ...body, ...tail].join('\n');
};

const parseLockfile = (text, label) => {
    const lines = text.split('\n');
    let first = -1;
    let last = -1;
    const entries = [];
    lines.forEach((line, index) => {
        const match = ENTRY_LINE.exec(line);
        if (!match) return;
        if (first < 0) first = index;
        last = index;
        entries.push({ key: match[1], line });
    });
    if (first < 0) fail(`no package entries found in ${label}`);
    const lockfile = {
        entries,
        head: lines.slice(0, first),
        tail: lines.slice(last + 1),
    };
    // guards against a lockfile layout change we don't understand
    if (serialize(lockfile) !== text) {
        fail(`${label} has an unrecognized layout (expected one line per package)`);
    }
    return lockfile;
};

const parseWorkspaces = (text) =>
    JSON.parse(text.replace(/,(\s*[}\]])/g, '$1')).workspaces ?? {};

const directDependencyNames = (workspaces) => {
    const names = new Set();
    for (const workspace of Object.values(workspaces)) {
        for (const field of ['dependencies', 'devDependencies', 'optionalDependencies']) {
            for (const [name, range] of Object.entries(workspace[field] ?? {})) {
                if (!String(range).startsWith('workspace:')) names.add(name);
            }
        }
    }
    return names;
};

// ---------------------------------------------------------------------------
// Dependency graph
// ---------------------------------------------------------------------------

// "@scope/a/b" -> ["@scope/a", "b"]: nested keys are paths of package names
const keyNames = (key) => {
    const parts = key.split('/');
    const names = [];
    for (let i = 0; i < parts.length; i += 1) {
        if (parts[i].startsWith('@') && i + 1 < parts.length) {
            names.push(`${parts[i]}/${parts[i + 1]}`);
            i += 1;
        } else {
            names.push(parts[i]);
        }
    }
    return names;
};

// node_modules-style lookup: nested copy first, then each ancestor, then top level
const resolveDependency = (nodes, key, dependency) => {
    const names = keyNames(key);
    for (let depth = names.length; depth >= 0; depth -= 1) {
        const candidate = [...names.slice(0, depth), dependency].join('/');
        if (nodes.has(candidate)) return candidate;
    }
    return null;
};

const nodeCache = new Map();
const readNode = (line) => {
    let node = nodeCache.get(line);
    if (!node) {
        const match = ENTRY_LINE.exec(line);
        const tuple = JSON.parse(line.slice(match[0].length - 1).replace(/,\s*$/, ''));
        const meta = tuple[2] && typeof tuple[2] === 'object' ? tuple[2] : {};
        node = { meta, version: tuple[0].slice(tuple[0].lastIndexOf('@') + 1) };
        nodeCache.set(line, node);
    }
    return node;
};

const buildGraph = (entries) => {
    const nodes = new Map();
    for (const { key, line } of entries) {
        const { meta, version } = readNode(line);
        nodes.set(key, { edges: [], key, meta, peerEdges: [], version });
    }
    const problems = new Map();
    for (const node of nodes.values()) {
        if (node.version.startsWith('workspace:')) continue;
        const optionalPeers = new Set(node.meta.optionalPeers ?? []);
        for (const field of EDGE_FIELDS) {
            for (const [dependency, range] of Object.entries(node.meta[field] ?? {})) {
                const target = resolveDependency(nodes, node.key, dependency);
                if (!target) {
                    if (field === 'dependencies') {
                        problems.set(
                            `missing:${node.key}:${dependency}`,
                            `${node.key} needs ${dependency}@${range}, which is not in the lockfile`,
                        );
                    }
                    continue;
                }
                if (field !== 'peerDependencies') node.edges.push(target);
                // an optional peer is not installed *by* this package, so it doesn't own it
                else if (!optionalPeers.has(dependency)) node.peerEdges.push(target);
                const { version } = nodes.get(target);
                if (
                    PLAIN_RANGE.test(range) &&
                    !version.includes('-') &&
                    !Bun.semver.satisfies(version, range)
                ) {
                    if (field === 'peerDependencies' && optionalPeers.has(dependency))
                        continue;
                    problems.set(
                        `mismatch:${node.key}:${field}:${dependency}`,
                        `${node.key} (${field}) wants ${dependency}@${range} but ${target} is ${version}`,
                    );
                }
            }
        }
    }
    return { nodes, problems };
};

// Everything reachable from `start` through dependencies and optionalDependencies.
// Peer dependencies are followed only when the peer itself changed: that attributes an
// auto-installed peer (eslint for eslint-plugin-perfectionist) without making every
// package that peer-depends on an unchanged `vite` appear to own all of vite's tree.
const reachCache = new WeakMap();
const reach = (graph, start) => {
    let perGraph = reachCache.get(graph);
    if (!perGraph) reachCache.set(graph, (perGraph = new Map()));
    let seen = perGraph.get(start);
    if (!seen) {
        seen = new Set();
        const stack = [start];
        while (stack.length) {
            const key = stack.pop();
            if (seen.has(key)) continue;
            seen.add(key);
            const node = graph.nodes.get(key);
            for (const next of node?.edges ?? []) stack.push(next);
            for (const next of node?.peerEdges ?? []) {
                if (changedSet.has(next)) stack.push(next);
            }
        }
        seen.delete(start);
        perGraph.set(start, seen);
    }
    return seen;
};

// ---------------------------------------------------------------------------
// Load old (HEAD) and new (working tree) lockfiles
// ---------------------------------------------------------------------------

const dirty = git('status', '--porcelain', '--untracked-files=no')
    .split('\n')
    .filter(Boolean)
    .filter((line) => line.slice(3) !== LOCKFILE || line[0] !== ' ');
if (dirty.length > 0 && options.commit) {
    fail(
        `only ${LOCKFILE} may have uncommitted changes (unstaged) when using --commit:\n${dirty.join('\n')}`,
    );
}

const oldText = git('show', `HEAD:${LOCKFILE}`);
const newText = readFileSync(LOCKFILE, 'utf8');
if (oldText === newText) {
    console.log(`${LOCKFILE} has no changes relative to HEAD. Nothing to do.`);
    process.exit(0);
}

const oldLock = parseLockfile(oldText, `HEAD:${LOCKFILE}`);
const newLock = parseLockfile(newText, LOCKFILE);
if (
    JSON.stringify([oldLock.head, oldLock.tail]) !==
    JSON.stringify([newLock.head, newLock.tail])
) {
    fail(
        `the workspaces section of ${LOCKFILE} changed (package.json edits or workspace\n` +
            'version bumps). Commit those on their own first, then re-run on the remaining changes.',
    );
}

const oldGraph = buildGraph(oldLock.entries);
const newGraph = buildGraph(newLock.entries);
const oldLines = new Map(oldLock.entries.map((entry) => [entry.key, entry.line]));
const newLines = new Map(newLock.entries.map((entry) => [entry.key, entry.line]));
const newOrder = newLock.entries.map((entry) => entry.key);
const newIndex = new Map(newOrder.map((key, index) => [key, index]));

const changed = [...new Set([...oldLines.keys(), ...newLines.keys()])].filter(
    (key) => oldLines.get(key) !== newLines.get(key),
);

const changedSet = new Set(changed);
const reachAnyCache = new Map();
const reachAny = (key) => {
    let merged = reachAnyCache.get(key);
    if (!merged) {
        merged = new Set();
        for (const graph of [oldGraph, newGraph]) {
            if (graph.nodes.has(key)) for (const k of reach(graph, key)) merged.add(k);
        }
        reachAnyCache.set(key, merged);
    }
    return merged;
};
const reaches = (a, b) => reachAny(a).has(b);
const versionOf = (graph, key) => graph.nodes.get(key)?.version;
const changeOf = (key) => `${versionOf(oldGraph, key)}->${versionOf(newGraph, key)}`;

// ---------------------------------------------------------------------------
// Grouping
// ---------------------------------------------------------------------------

const directNames = new Set([
    ...directDependencyNames(parseWorkspaces(oldText)),
    ...directDependencyNames(parseWorkspaces(newText)),
]);
const anchors = changed.filter((key) => directNames.has(key));
const anchorSet = new Set(anchors);

const makeUnionFind = (items) => {
    const parent = new Map(items.map((item) => [item, item]));
    const find = (item) => {
        while (parent.get(item) !== item) {
            parent.set(item, parent.get(parent.get(item)));
            item = parent.get(item);
        }
        return item;
    };
    return { find, union: (a, b) => parent.set(find(a), find(b)) };
};

// 1. anchors: merge connected ones that moved between the same two versions
const anchorSets = makeUnionFind(anchors);
for (const a of anchors) {
    for (const b of anchors) {
        if (a < b && changeOf(a) === changeOf(b) && (reaches(a, b) || reaches(b, a))) {
            anchorSets.union(a, b);
        }
    }
}
const groups = []; // { leaders: string[], members: Set<string> }
const groupOfKey = new Map();
const groupByAnchorRoot = new Map();
for (const anchor of anchors) {
    const root = anchorSets.find(anchor);
    let group = groupByAnchorRoot.get(root);
    if (!group) {
        group = { leaders: [], members: new Set() };
        groupByAnchorRoot.set(root, group);
        groups.push(group);
    }
    group.leaders.push(anchor);
    group.members.add(anchor);
    groupOfKey.set(anchor, group);
}

// 2. attribute every other changed key to the anchor(s) that reach it
const ambiguous = [];
const unowned = [];
const ownedByGroups = new Map();
for (const key of changed) {
    if (anchorSet.has(key)) continue;
    let owners = anchors.filter((anchor) => reaches(anchor, key));
    // an owner that merely reaches the key through another owner is not the cause
    owners = owners.filter(
        (a) => !owners.some((b) => b !== a && reaches(a, b) && !reaches(b, a)),
    );
    const ownerGroups = [...new Set(owners.map((anchor) => groupOfKey.get(anchor)))];
    if (ownerGroups.length === 0) unowned.push(key);
    else ownedByGroups.set(key, ownerGroups);
}
// bigger groups first; ties broken by name so the order is deterministic
const byWeight = (a, b) =>
    b.members.size - a.members.size || a.leaders[0].localeCompare(b.leaders[0]);
for (const [key, ownerGroups] of ownedByGroups) {
    if (ownerGroups.length === 1) {
        ownerGroups[0].members.add(key);
        groupOfKey.set(key, ownerGroups[0]);
    }
}
const rankedGroups = [...groups].sort(byWeight);
for (const [key, ownerGroups] of ownedByGroups) {
    if (ownerGroups.length === 1) continue;
    const winner = rankedGroups.find((group) => ownerGroups.includes(group));
    winner.members.add(key);
    groupOfKey.set(key, winner);
    ambiguous.push({
        chosen: winner.leaders[0],
        key,
        owners: ownerGroups.map((group) => group.leaders[0]),
    });
}

// 3. changed keys with no changed ancestor. Copies of a package that moved between
// nesting levels (hoisting) must travel together, so first join any copy whose name
// matches an already-grouped entry; the rest become groups of their own.
const packageNameOf = (key) => keyNames(key).at(-1);
const groupsByName = new Map();
for (const key of changed) {
    const group = groupOfKey.get(key);
    if (!group) continue;
    const name = packageNameOf(key);
    groupsByName.set(name, [...(groupsByName.get(name) ?? []), group]);
}
const orphans = [];
for (const key of unowned) {
    const candidates = groupsByName.get(packageNameOf(key)) ?? [];
    const winner = rankedGroups.find((group) => candidates.includes(group));
    if (winner) {
        winner.members.add(key);
        groupOfKey.set(key, winner);
    } else {
        orphans.push(key);
    }
}
const orphanSets = makeUnionFind(orphans);
for (const a of orphans) {
    for (const b of orphans) {
        if (a !== b && (reaches(a, b) || packageNameOf(a) === packageNameOf(b))) {
            orphanSets.union(a, b);
        }
    }
}
const orphanGroups = new Map();
for (const key of orphans) {
    const root = orphanSets.find(key);
    let group = orphanGroups.get(root);
    if (!group) {
        group = { leaders: [], members: new Set() };
        orphanGroups.set(root, group);
        groups.push(group);
    }
    group.members.add(key);
    groupOfKey.set(key, group);
}
for (const group of orphanGroups.values()) {
    const members = [...group.members];
    group.leaders = members.filter(
        (key) => !members.some((other) => other !== key && reaches(other, key)),
    );
    if (group.leaders.length === 0) group.leaders = members;
}

// 4. user overrides
const findGroup = (key, flag) => {
    const group = groupOfKey.get(key);
    if (!group) fail(`${flag}: "${key}" is not a changed lockfile entry`);
    return group;
};
const mergeGroups = (target, source) => {
    if (target === source) return;
    for (const key of source.members) {
        target.members.add(key);
        groupOfKey.set(key, target);
    }
    target.leaders.push(...source.leaders);
    groups.splice(groups.indexOf(source), 1);
};
for (const spec of options.merge ?? []) {
    const [first, ...rest] = spec.split(',').map((key) => key.trim());
    for (const key of rest)
        mergeGroups(findGroup(first, '--merge'), findGroup(key, '--merge'));
}
const overridden = new Set();
for (const spec of options.assign ?? []) {
    const [key, owner] = spec.split('=');
    if (!key || !owner) fail(`--assign expects key=owner, got "${spec}"`);
    overridden.add(key);
    const from = findGroup(key, '--assign');
    const to = findGroup(owner, '--assign');
    if (from === to) continue;
    from.members.delete(key);
    from.leaders = from.leaders.filter((leader) => leader !== key);
    to.members.add(key);
    groupOfKey.set(key, to);
    if (from.members.size === 0) groups.splice(groups.indexOf(from), 1);
    else if (from.leaders.length === 0) from.leaders = [[...from.members][0]];
}

// every changed key must be in exactly one group
const grouped = groups.reduce((sum, group) => sum + group.members.size, 0);
if (grouped !== changed.length || changed.some((key) => !groupOfKey.has(key))) {
    fail(
        `internal error: ${grouped} grouped entries for ${changed.length} changed entries`,
    );
}

// ---------------------------------------------------------------------------
// Commit titles
// ---------------------------------------------------------------------------

const verbOf = (key) =>
    !oldGraph.nodes.has(key) ? 'Add' : !newGraph.nodes.has(key) ? 'Remove' : 'Bump';
const titleOf = (group) => {
    const leaders = [...group.leaders].sort((a, b) => a.localeCompare(b));
    const verbs = new Set(leaders.map(verbOf));
    const verb = verbs.size === 1 ? [...verbs][0] : 'Update';
    let subject;
    if (leaders.length > 3) {
        subject = `${leaders.slice(0, 3).join(', ')} and ${leaders.length - 3} more`;
    } else if (verb === 'Bump') {
        const byVersion = new Map();
        for (const key of leaders) {
            const version = versionOf(newGraph, key);
            byVersion.set(version, [...(byVersion.get(version) ?? []), key]);
        }
        subject = [...byVersion]
            .map(([version, keys]) => `${keys.join(', ')} to ${version}`)
            .join(' and ');
    } else if (verb === 'Add') {
        subject = leaders.map((key) => `${key}@${versionOf(newGraph, key)}`).join(', ');
    } else {
        subject = leaders.join(', ');
    }
    const suffix = group.members.size > leaders.length ? ' (and transitive deps)' : '';
    return `${verb} ${subject}${suffix}`;
};

// ---------------------------------------------------------------------------
// Replay the groups on top of HEAD's lockfile
// ---------------------------------------------------------------------------

const applyGroup = (entries, group) => {
    const keys = [...group.members].sort(
        (a, b) => (newIndex.get(a) ?? Infinity) - (newIndex.get(b) ?? Infinity),
    );
    const next = [...entries];
    for (const key of keys) {
        const at = next.findIndex((entry) => entry.key === key);
        const line = newLines.get(key);
        if (line === undefined) {
            if (at >= 0) next.splice(at, 1);
        } else if (at >= 0) {
            next[at] = { key, line };
        } else {
            let insertAt = 0;
            for (let i = newIndex.get(key) - 1; i >= 0; i -= 1) {
                const predecessor = next.findIndex((entry) => entry.key === newOrder[i]);
                if (predecessor >= 0) {
                    insertAt = predecessor + 1;
                    break;
                }
            }
            next.splice(insertAt, 0, { key, line });
        }
    }
    return next;
};

// Prefer an order in which no step introduces a new dependency mismatch.
const steps = [];
let current = oldLock.entries;
let currentProblems = oldGraph.problems;
const remaining = [...groups].sort(byWeight);
while (remaining.length > 0) {
    let pick = null;
    let fallback = null;
    for (const group of remaining) {
        const entries = applyGroup(current, group);
        const { problems } = buildGraph(entries);
        const introduced = [...problems]
            .filter(([id]) => !currentProblems.has(id))
            .map(([, message]) => message);
        const candidate = { entries, group, introduced, problems };
        if (introduced.length === 0) {
            pick = candidate;
            break;
        }
        fallback ??= candidate;
    }
    pick ??= fallback;
    remaining.splice(remaining.indexOf(pick.group), 1);
    steps.push({ ...pick, title: titleOf(pick.group) });
    current = pick.entries;
    currentProblems = pick.problems;
}

if (serialize({ ...newLock, entries: current }) !== newText) {
    fail(
        'replaying the groups did not reproduce the new lockfile exactly; nothing was committed',
    );
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const describeKey = (key) => {
    const from = versionOf(oldGraph, key);
    const to = versionOf(newGraph, key);
    return `${key}: ${from ?? '(none)'} -> ${to ?? '(none)'}`;
};

const countOf = (count, singular, plural) =>
    `${count} ${count === 1 ? singular : plural}`;
console.log(
    `${countOf(changed.length, 'changed lockfile entry', 'changed lockfile entries')} -> ${countOf(steps.length, 'commit', 'commits')}\n`,
);
steps.forEach((step, index) => {
    console.log(
        `${index + 1}. ${step.title}  [${countOf(step.group.members.size, 'entry', 'entries')}]`,
    );
    const listed = options.verbose ? [...step.group.members] : step.group.leaders;
    for (const key of listed) console.log(`     ${describeKey(key)}`);
});

const warnings = [];
for (const { chosen, key, owners } of ambiguous) {
    if (overridden.has(key)) continue;
    warnings.push(
        `ambiguous: ${key} is pulled in by ${owners.join(', ')}; put it with ${chosen} ` +
            `(override: --assign ${key}=<one of those>)`,
    );
}
steps.forEach((step, index) => {
    for (const message of step.introduced) {
        warnings.push(
            `commit ${index + 1} leaves a new mismatch (no better order found): ${message}`,
        );
    }
});
if (warnings.length > 0) {
    console.log('\nWarnings:');
    for (const warning of warnings) console.log(`  - ${warning}`);
}

const lingering = [...currentProblems.values()];
if (lingering.length > 0) {
    console.log(
        `\nNote: the regenerated lockfile itself has ${lingering.length} dependency mismatch(es) ` +
            '(usually optional or peer ranges); these are not caused by this split:',
    );
    for (const message of lingering) console.log(`  - ${message}`);
}

if (!options.commit) {
    console.log('\nDry run only. Re-run with --commit to create these commits.');
    process.exit(0);
}

// ---------------------------------------------------------------------------
// Commit
// ---------------------------------------------------------------------------

console.log('');
try {
    for (const step of steps) {
        writeFileSync(LOCKFILE, serialize({ ...newLock, entries: step.entries }));
        git('commit', '-m', step.title, '--', LOCKFILE);
        console.log(`committed: ${step.title}`);
    }
} finally {
    // on failure, leave the regenerated lockfile in place so the run can be resumed
    writeFileSync(LOCKFILE, newText);
}
console.log(
    '\nDone. Before pushing, run: bun install --frozen-lockfile && bun run build && bun run test && bun run lint && bun run tsc',
);

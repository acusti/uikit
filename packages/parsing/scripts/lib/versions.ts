// Saves the two versions that a run compares, and records the inputs that each
// version’s tests pass to parseAsJSON.
import { execFileSync, spawnSync } from 'node:child_process';
import {
    cpSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import path from 'node:path';

export const PACKAGE_DIR = path.resolve(import.meta.dirname, '../..');
export const RUNS_DIR = path.join(PACKAGE_DIR, 'scripts/runs');
const SOURCE = 'src/parse-as-json.ts';
const TEST = 'src/parse-as-json.test.ts';
const README = 'README.md';

const git = (args: Array<string>) =>
    execFileSync('git', args, { cwd: PACKAGE_DIR, encoding: 'utf8' }).trim();

// the package’s path in the repository, for `git show <ref>:<path>`
const PREFIX = git(['rev-parse', '--show-prefix']);

// A version is a git ref, or the working tree (with whatever is not committed).
export type Version = { label: string; ref: null | string };

function readVersionFile(ref: null | string, file: string) {
    if (ref == null) return readFileSync(path.join(PACKAGE_DIR, file), 'utf8');
    return execFileSync('git', ['show', `${ref}:${PREFIX}${file}`], {
        cwd: PACKAGE_DIR,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
    });
}

// how a run names a version: its ref and commit, or the working tree
export function describeVersion(ref: null | string) {
    if (ref != null)
        return `${ref} (${git(['rev-parse', '--short', `${ref}^{commit}`])})`;
    const head = git(['rev-parse', '--short', 'HEAD']);
    const isDirty = git(['status', '--porcelain', '--', 'src', README]) !== '';
    return `the working tree (${head}${isDirty ? ', with changes not committed' : ''})`;
}

// the modules directly in a version’s src directory, as paths in the package
function listSourceFiles(ref: null | string) {
    const names =
        ref == null
            ? readdirSync(path.join(PACKAGE_DIR, 'src'), { withFileTypes: true })
                  .filter((entry) => entry.isFile())
                  .map((entry) => entry.name)
            : git(['ls-tree', '--name-only', `${ref}:${PREFIX}src`]).split('\n');
    return names
        .filter((name) => /\.(?:[cm]?[jt]sx?|json)$/.test(name))
        .map((name) => `src/${name}`);
}

// Makes a run directory with a saved copy of each version’s parser (base.ts and
// branch.ts), its tests and its README, and says which is which in
// versions.json.
export function prepareRun({ base, branch }: { base: Version; branch: Version }) {
    // (the process id keeps two runs started in the same second apart)
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const dir = path.join(RUNS_DIR, `${stamp}-${process.pid}`);
    mkdirSync(dir, { recursive: true });
    const versions: Record<string, string> = {};
    for (const { label, ref } of [base, branch]) {
        writeFileSync(path.join(dir, `${label}.ts`), readVersionFile(ref, SOURCE));
        writeFileSync(path.join(dir, `${label}.test.ts.txt`), readVersionFile(ref, TEST));
        writeFileSync(path.join(dir, `${label}.README.md`), readVersionFile(ref, README));
        // the other files in src, which the tests may import (fixtures, say)
        const others = path.join(dir, `${label}.src`);
        mkdirSync(others);
        for (const file of listSourceFiles(ref)) {
            if (file === SOURCE || file === TEST) continue;
            writeFileSync(
                path.join(others, path.basename(file)),
                readVersionFile(ref, file),
            );
        }
        versions[label] = describeVersion(ref);
    }
    writeFileSync(
        path.join(dir, 'versions.json'),
        JSON.stringify(versions, null, 2) + '\n',
    );
    return { dir, versions };
}

// Runs a version’s tests against its own parser, wrapped so that every input
// that the tests pass to parseAsJSON is written to inputs-<label>.jsonl. Texts
// longer than maxLength (a timing test’s, say) are left out, since harnesses
// cut each input at every length. Throws where the tests fail, or do not load,
// or pass no string at all: a comparison without that version’s inputs would
// leave out the tests that a change is about.
export function recordInputs(dir: string, label: string, maxLength = 20_000) {
    const recordDir = path.join(dir, `record-${label}`);
    mkdirSync(recordDir, { recursive: true });
    cpSync(path.join(dir, `${label}.src`), recordDir, { recursive: true });
    const output = path.join(dir, `inputs-${label}.raw.jsonl`);
    writeFileSync(output, '');
    writeFileSync(
        path.join(recordDir, 'parse-as-json.ts'),
        `import { appendFileSync } from 'node:fs';
import { parseAsJSON as parse } from '../${label}.ts';
export * from '../${label}.ts';
export function parseAsJSON(text: string) {
    appendFileSync(${JSON.stringify(output)}, JSON.stringify(text ?? null) + '\\n');
    return parse(text);
}
`,
    );
    writeFileSync(
        path.join(recordDir, 'parse-as-json.record.ts'),
        readFileSync(path.join(dir, `${label}.test.ts.txt`), 'utf8'),
    );
    const result = spawnSync(
        'bunx',
        ['vitest', 'run', '--config', path.join(import.meta.dirname, 'record.config.ts')],
        {
            cwd: PACKAGE_DIR,
            encoding: 'utf8',
            env: { ...process.env, RECORD_DIR: path.relative(PACKAGE_DIR, recordDir) },
        },
    );
    const log = result.stdout + result.stderr;
    const tests = /Tests\s+(.*)/.exec(log)?.[1]?.trim() ?? 'no test summary';
    const lines = new Set(readFileSync(output, 'utf8').split('\n').filter(Boolean));
    // (the raw recording is only read here, and is the largest file of a run)
    rmSync(output);
    let dropped = 0;
    let others = 0;
    const kept = [...lines].filter((line) => {
        const input = JSON.parse(line) as unknown;
        if (typeof input !== 'string') others++;
        const isLong = typeof input === 'string' && input.length > maxLength;
        if (isLong) dropped++;
        return !isLong;
    });
    const inputs = kept.length - others;
    if (result.error || result.status !== 0 || inputs === 0) {
        const reason = result.error
            ? String(result.error)
            : result.status !== 0
              ? `its tests did not pass (${tests})`
              : 'its tests passed no string to parseAsJSON';
        throw new Error(
            `could not record the ${label}’s inputs: ${reason}\n${log.slice(-2000)}`,
        );
    }
    writeFileSync(path.join(dir, `inputs-${label}.jsonl`), kept.join('\n') + '\n');
    return { dropped, inputs, others, tests };
}

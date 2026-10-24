// Compares two versions of parseAsJSON on every harness: saves a copy of each,
// records the inputs that each version’s tests pass to it, runs the harnesses in
// parallel, and prints what each found. Exits with 1 where a harness failed: a
// reading that throws, a text with a known answer that the branch reads wrong
// where the base read it right, a recorded response that is valid JSON and is not
// read as JSON.parse reads it, or a README example that the branch reads
// otherwise. Every other difference is for you to account for.
//
//   bun scripts/compare.ts [--base <ref>] [--branch <ref>] [--only <names>]
//
// --base is origin/main by default, and --branch the working tree. --only takes
// harness names, separated by commas. Set PARSING_CORPUS to a file made by
// collect-corpus.ts to read recorded responses too. --run <dir> runs the
// harnesses again on a run directory that has been made already.
import { spawn } from 'node:child_process';
import { createWriteStream, existsSync, readFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { type Summary, printSummary } from './lib/common.ts';
import { prepareRun, recordInputs } from './lib/versions.ts';

// the longest first, so that the others run alongside them
const HARNESSES = [
    'code-block-before',
    'code-block-after',
    'root-before-answer',
    'fuzz-structural',
    'corpus',
    'code-block-in-string',
    'fuzz-preamble',
    'differential',
    'readme',
];

const { values: options } = parseArgs({
    options: {
        base: { default: 'origin/main', type: 'string' },
        branch: { type: 'string' },
        only: { type: 'string' },
        run: { type: 'string' },
    },
});
const names = options.only
    ? options.only.split(',').map((name) => name.trim())
    : HARNESSES;
const unknown = names.filter((name) => !HARNESSES.includes(name));
if (unknown.length) {
    console.error(
        `no harness named ${unknown.join(', ')} (there are ${HARNESSES.join(', ')})`,
    );
    process.exit(2);
}

let dir: string;
if (options.run) {
    dir = path.resolve(options.run);
    if (!existsSync(path.join(dir, 'versions.json'))) {
        console.error(`${dir} is not a run directory`);
        process.exit(2);
    }
} else {
    const run = prepareRun({
        base: { label: 'base', ref: options.base },
        branch: { label: 'branch', ref: options.branch ?? null },
    });
    dir = run.dir;
}
const versions = JSON.parse(
    readFileSync(path.join(dir, 'versions.json'), 'utf8'),
) as Record<string, string>;
console.log(`base:   ${versions.base}\nbranch: ${versions.branch}\nrun:    ${dir}`);

if (!options.run) {
    for (const label of ['base', 'branch']) {
        try {
            const { dropped, inputs, others, tests } = recordInputs(dir, label);
            console.log(
                `${label}’s tests: ${tests}; ${inputs} strings and ${others} other input${others === 1 ? '' : 's'} recorded (${dropped} longer strings left out)`,
            );
        } catch (error) {
            console.error(error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    }
}

// runs a harness in a process of its own, with what it prints in <name>.log
function runHarness(name: string) {
    return new Promise<number>((resolve) => {
        const log = createWriteStream(path.join(dir, `${name}.log`));
        const child = spawn(
            'bun',
            [path.join(import.meta.dirname, 'harnesses', `${name}.ts`), dir],
            {
                stdio: ['ignore', 'pipe', 'pipe'],
            },
        );
        child.stdout.pipe(log);
        child.stderr.pipe(log);
        // a harness that cannot be started fails like one that crashes
        child.on('error', (error) => {
            log.write(String(error) + '\n');
            resolve(1);
        });
        child.on('close', (code) => resolve(code ?? 1));
    });
}

const started = Date.now();
const queue = [...names];
const exitCodes = new Map<string, number>();
const workers = Array.from(
    { length: Math.max(1, availableParallelism() - 1) },
    async () => {
        for (let name = queue.shift(); name; name = queue.shift()) {
            const code = await runHarness(name);
            exitCodes.set(name, code);
            console.log(`${name} done (${Math.round((Date.now() - started) / 1000)} s)`);
        }
    },
);
await Promise.all(workers);

let failures = 0;
for (const name of names) {
    const file = path.join(dir, `${name}.summary.json`);
    if (exitCodes.get(name) !== 0 || !existsSync(file)) {
        failures++;
        console.log(`\n${name} did not finish: see ${path.join(dir, `${name}.log`)}`);
        continue;
    }
    const summary = JSON.parse(readFileSync(file, 'utf8')) as Summary;
    failures += summary.failures;
    printSummary(summary);
}
console.log(
    `\n${failures ? `${failures} FAILED` : 'nothing failed'}; differences and samples are in ${dir}`,
);
process.exit(failures ? 1 : 0);

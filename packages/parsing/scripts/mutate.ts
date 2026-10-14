// Mutates the parser one change at a time and runs the package’s tests on each
// mutant, to find changed code that no test pins.
//
//   bun scripts/mutate.ts <mutants.ts> [names…]
//
// The mutants file’s default export is a list of { name, old, new }: old is text
// that occurs exactly once in src/parse-as-json.ts, and new what it becomes. With
// names, only the mutants whose names include one of them run. Give each changed
// condition its plain deletion as well as its inversions, and move each new
// branch past the nearest `continue` or `break` in its block.
//
// A mutant is killed where a test of how a text reads fails. One that only a
// timing test kills, or that times out, is listed as such: under load, a timing
// test fails for no fault of the mutant’s. Run this with nothing else using the
// machine.
//
// The parser file is rewritten for each mutant and put back at the end, so the
// script will not start while it has changes that are not committed.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { PACKAGE_DIR } from './lib/versions.ts';

type Mutant = { name: string; new: string; old: string };

const [mutantsPath, ...only] = process.argv.slice(2);
if (!mutantsPath) {
    console.error('usage: bun scripts/mutate.ts <mutants.ts> [names…]');
    process.exit(2);
}
const SOURCE = path.join(PACKAGE_DIR, 'src/parse-as-json.ts');
const TIMEOUT = 60_000;

const { default: mutants } = (await import(path.resolve(mutantsPath))) as {
    default: Array<Mutant>;
};

const isDirty = spawnSync('git', ['status', '--porcelain', '--', SOURCE], {
    cwd: PACKAGE_DIR,
    encoding: 'utf8',
}).stdout.trim();
if (isDirty) {
    console.error(`${SOURCE} has changes that are not committed: commit them first`);
    process.exit(2);
}

// vitest’s workers, from this run or any other
const findWorkers = () =>
    spawnSync('pgrep', ['-fl', 'vitest/dist/workers'], {
        encoding: 'utf8',
    }).stdout.trim();

// Runs the tests in a process group of their own, and kills the whole group when
// they end: a worker that is stuck in a mutant’s loop never sees that its parent
// is gone, and would go on spinning with init as its parent.
function runTests() {
    const output = path.join(tmpdir(), `parsing-mutate-${process.pid}.json`);
    return new Promise<{ code: number; failed: Array<string> }>((resolve) => {
        const child = spawn(
            'bunx',
            ['vitest', 'run', '--reporter=json', `--outputFile=${output}`],
            {
                cwd: PACKAGE_DIR,
                detached: true,
                stdio: 'ignore',
            },
        );
        const timer = setTimeout(() => finish(124), TIMEOUT);
        let isDone = false;
        const finish = (code: number) => {
            if (isDone) return;
            isDone = true;
            clearTimeout(timer);
            try {
                process.kill(-child.pid!, 'SIGKILL');
            } catch {
                // the group has ended already
            }
            const failed: Array<string> = [];
            if (existsSync(output)) {
                try {
                    const report = JSON.parse(readFileSync(output, 'utf8')) as {
                        testResults: Array<{
                            assertionResults: Array<{ status: string; title: string }>;
                        }>;
                    };
                    for (const file of report.testResults) {
                        for (const test of file.assertionResults) {
                            if (test.status !== 'passed') failed.push(test.title);
                        }
                    }
                } catch {
                    // the run ended before it wrote its report
                }
                rmSync(output);
            }
            resolve({ code, failed });
        };
        child.on('close', (code) => finish(code ?? 1));
    });
}

const isTimingTest = (title: string) => title.includes('good time');

const workers = findWorkers();
if (workers) {
    console.error(
        `vitest workers are running already, which would slow the tests:\n${workers}`,
    );
    process.exit(2);
}

const original = readFileSync(SOURCE, 'utf8');
const unmutated = await runTests();
if (unmutated.code !== 0) {
    console.error(`the tests fail before any mutation: ${unmutated.failed.join('; ')}`);
    process.exit(1);
}

const results: Array<{ name: string; status: string }> = [];
try {
    for (const mutant of mutants) {
        if (only.length && !only.some((name) => mutant.name.includes(name))) continue;
        const occurrences = original.split(mutant.old).length - 1;
        if (occurrences !== 1 || mutant.old === mutant.new) {
            results.push({ name: mutant.name, status: 'NOT APPLIED' });
            console.log(`NOT APPLIED  ${mutant.name} (old occurs ${occurrences} times)`);
            continue;
        }
        writeFileSync(SOURCE, original.replace(mutant.old, mutant.new));
        const { code, failed } = await runTests();
        const behaviour = failed.filter((title) => !isTimingTest(title));
        const status =
            code === 0
                ? 'SURVIVED'
                : code === 124
                  ? 'TIMED OUT'
                  : behaviour.length
                    ? 'KILLED'
                    : failed.length
                      ? 'TIMING ONLY'
                      : 'NO TEST NAMED';
        results.push({ name: mutant.name, status });
        const tests =
            behaviour.slice(0, 3).join('; ') + (behaviour.length > 3 ? ' …' : '');
        const timing = failed.length > behaviour.length ? ' + a timing test' : '';
        console.log(
            `${status.padEnd(12)} ${mutant.name}  [${behaviour.length} tests: ${tests}${timing}]`,
        );
    }
} finally {
    writeFileSync(SOURCE, original);
}

const killed = results.filter(({ status }) => status === 'KILLED').length;
console.log(`\n${killed} killed of ${results.length}`);
const left = findWorkers();
console.log(
    left ? `VITEST WORKERS LEFT RUNNING:\n${left}` : 'no vitest workers left running',
);
process.exit(killed === results.length && !left ? 0 : 1);

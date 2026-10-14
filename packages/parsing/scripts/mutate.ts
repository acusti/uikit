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
// Each mutant is listed as KILLED where a test of how a text reads fails, and
// otherwise as SURVIVED, TIMING ONLY (only a timing test fails, which under load
// it does for no fault of the mutant’s), TIMED OUT, DOES NOT LOAD (a mistake in
// the mutant, not a gap in the tests) or NOT APPLIED (old is not in the file
// once). Run this with nothing else using the machine.
//
// The parser file is rewritten for each mutant and put back at the end, so the
// script will not start while it has changes that are not committed.
import { type ChildProcess, spawn, spawnSync } from 'node:child_process';
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

// vitest’s workers, from this run or any other: node or bun running a script
// from vitest/dist/workers (not a shell or an editor whose command line only
// has those words in it)
const findWorkers = () =>
    spawnSync('ps', ['-Ao', 'pid=,command='], { encoding: 'utf8' })
        .stdout.split('\n')
        .filter((line) => {
            const [, executable = '', ...args] = line.trim().split(/\s+/);
            return (
                /(?:^|\/)(?:node|bun)$/.test(executable) &&
                args.some((arg) => arg.includes('vitest/dist/workers/'))
            );
        })
        .join('\n');

// The tests that are running, which an interrupt has to stop.
let running: ChildProcess | undefined;

const killGroup = (child: ChildProcess) => {
    try {
        process.kill(-child.pid!, 'SIGKILL');
    } catch {
        // the group has ended already
    }
};

// Runs the tests in a process group of their own, and kills the whole group when
// they end: a worker that is stuck in a mutant’s loop never sees that its parent
// is gone, and would go on spinning with init as its parent.
function runTests() {
    const output = path.join(tmpdir(), `parsing-mutate-${process.pid}.json`);
    return new Promise<{ code: number; failed: Array<string>; message: string }>(
        (resolve) => {
            const child = spawn(
                'bunx',
                ['vitest', 'run', '--reporter=json', `--outputFile=${output}`],
                {
                    cwd: PACKAGE_DIR,
                    detached: true,
                    stdio: 'ignore',
                },
            );
            running = child;
            const timer = setTimeout(() => finish(124), TIMEOUT);
            let isDone = false;
            const finish = (code: number) => {
                if (isDone) return;
                isDone = true;
                clearTimeout(timer);
                killGroup(child);
                running = undefined;
                const failed: Array<string> = [];
                // why a test file failed where no test did (it did not load, say)
                let message = '';
                if (existsSync(output)) {
                    try {
                        const report = JSON.parse(readFileSync(output, 'utf8')) as {
                            testResults: Array<{
                                assertionResults: Array<{
                                    status: string;
                                    title: string;
                                }>;
                                message?: string;
                            }>;
                        };
                        for (const file of report.testResults) {
                            message ||= file.message ?? '';
                            for (const test of file.assertionResults) {
                                if (test.status !== 'passed') failed.push(test.title);
                            }
                        }
                    } catch {
                        // the run ended before it wrote its report
                    }
                    rmSync(output);
                }
                resolve({ code, failed, message });
            };
            child.on('close', (code) => finish(code ?? 1));
        },
    );
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
// On an interrupt, stop the tests and put the parser back: the tests run in a
// process group of their own, which a terminal’s Ctrl-C does not reach.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => {
        if (running) killGroup(running);
        writeFileSync(SOURCE, original);
        console.log(`\n${signal}: the tests were stopped and ${SOURCE} put back`);
        process.exit(signal === 'SIGINT' ? 130 : 143);
    });
}
const unmutated = await runTests();
if (unmutated.code !== 0) {
    const reason = unmutated.failed.join('; ') || unmutated.message.split('\n')[0];
    console.error(`the tests fail before any mutation: ${reason}`);
    process.exit(1);
}

const results: Array<{ name: string; status: string }> = [];
try {
    for (const mutant of mutants) {
        if (only.length && !only.some((name) => mutant.name.includes(name))) continue;
        const occurrences = original.split(mutant.old).length - 1;
        if (occurrences !== 1 || mutant.old === mutant.new) {
            results.push({ name: mutant.name, status: 'NOT APPLIED' });
            const why =
                occurrences === 1
                    ? 'new is the same as old'
                    : `old occurs ${occurrences} times`;
            console.log(`NOT APPLIED   ${mutant.name} (${why})`);
            continue;
        }
        // (split and join, as replace would read $& and the like in new)
        writeFileSync(SOURCE, original.split(mutant.old).join(mutant.new));
        const { code, failed, message } = await runTests();
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
                      : 'DOES NOT LOAD';
        results.push({ name: mutant.name, status });
        const tests =
            behaviour.slice(0, 3).join('; ') + (behaviour.length > 3 ? ' …' : '');
        const timing = failed.length > behaviour.length ? ' + a timing test' : '';
        const detail =
            status === 'DOES NOT LOAD'
                ? (message.split('\n')[0] ?? '')
                : `${behaviour.length} tests: ${tests}${timing}`;
        console.log(`${status.padEnd(13)} ${mutant.name}  [${detail}]`);
    }
} finally {
    writeFileSync(SOURCE, original);
}

if (!results.length) {
    console.log(`no mutant’s name includes ${only.join(' or ')}`);
    process.exit(1);
}
const killed = results.filter(({ status }) => status === 'KILLED').length;
console.log(`\n${killed} killed of ${results.length}`);
const left = findWorkers();
console.log(
    left ? `VITEST WORKERS LEFT RUNNING:\n${left}` : 'no vitest workers left running',
);
process.exit(killed === results.length && !left ? 0 : 1);

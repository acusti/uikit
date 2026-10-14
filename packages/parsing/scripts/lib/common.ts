// What every harness shares: how a version is read, how two readings are told
// apart, the inputs that the tests pass, and how a harness reports.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export type ParsedResult = {
    postscript: string;
    preamble: string;
    value: unknown;
};

export type Parse = (text: string) => ParsedResult;

// a harness’s table: a row for each kind of text, a count for each column
export type Rows = Record<string, Record<string, number>>;

export type Summary = {
    // the number of texts that fail the harness (a known answer that the branch
    // reads wrong where the base read it right, or a reading that throws)
    failures: number;
    name: string;
    notes: Array<string>;
    rows: Rows;
    title: string;
};

export type Run = {
    base: Parse;
    branch: Parse;
    dir: string;
};

export async function loadRun(dir: string): Promise<Run> {
    const base = (await import(path.join(dir, 'base.ts'))) as { parseAsJSON: Parse };
    const branch = (await import(path.join(dir, 'branch.ts'))) as {
        parseAsJSON: Parse;
    };
    return { base: base.parseAsJSON, branch: branch.parseAsJSON, dir };
}

// the run directory that a harness is given as its one argument
export function getRunDir() {
    const dir = process.argv[2];
    if (!dir) {
        console.error('usage: bun <harness>.ts <run directory from compare.ts>');
        process.exit(2);
    }
    return path.resolve(dir);
}

// a reading as a string, so that two can be compared, with a reading that
// throws as one that no other reading equals
export function read(parse: Parse, text: string) {
    try {
        return JSON.stringify(parse(text));
    } catch (error) {
        return 'THROWS: ' + String(error);
    }
}

export function readValue(parse: Parse, text: string) {
    try {
        return JSON.stringify(parse(text).value);
    } catch (error) {
        return 'THROWS: ' + String(error);
    }
}

export const isThrown = (reading: string) => reading.startsWith('THROWS: ');

export type Change =
    | 'nullToValue'
    | 'sameValue'
    | 'throws'
    | 'valueToNull'
    | 'valueToValue';

// how a reading changed from base to branch (sameValue: only the preamble or the
// postscript did)
export function getChange(before: string, after: string): Change {
    if (isThrown(before) || isThrown(after)) return 'throws';
    const beforeValue = JSON.stringify((JSON.parse(before) as ParsedResult).value);
    const afterValue = JSON.stringify((JSON.parse(after) as ParsedResult).value);
    if (beforeValue === afterValue) return 'sameValue';
    if (beforeValue === 'null') return 'nullToValue';
    if (afterValue === 'null') return 'valueToNull';
    return 'valueToValue';
}

// a linear congruential generator, so that a run with the same seed makes the
// same texts
export function createRandom(seed: number) {
    let state = seed;
    return () => {
        state = (state * 1103515245 + 12345) & 0x7fffffff;
        return state / 0x7fffffff;
    };
}

// the inputs that the tests passed to parseAsJSON, as recorded by compare.ts
// (the strings only, each once)
export function readInputs(dir: string, version: 'base' | 'branch') {
    const inputs = new Set<string>();
    const lines = readFileSync(path.join(dir, `inputs-${version}.jsonl`), 'utf8');
    for (const line of lines.split('\n')) {
        if (!line) continue;
        const input = JSON.parse(line) as unknown;
        if (typeof input === 'string') inputs.add(input);
    }
    return [...inputs];
}

// the inputs that are not the start of another one (the rest are its prefixes,
// which a harness that cuts texts reads anyway)
export function getLastInputs(inputs: Array<string>) {
    const sorted = [...inputs].sort();
    return sorted.filter((input, index) => !sorted[index + 1]?.startsWith(input));
}

// the objects and arrays that the inputs read as, each once
export function getValues(parse: Parse, inputs: Array<string>) {
    const values = new Map<string, unknown>();
    for (const input of getLastInputs(inputs)) {
        const { value } = parse(input);
        if (value !== null && typeof value === 'object') {
            values.set(JSON.stringify(value), value);
        }
    }
    return [...values.values()];
}

export function count(rows: Rows, row: string, column: string, by = 1) {
    rows[row] ??= {};
    rows[row][column] = (rows[row][column] ?? 0) + by;
}

// the columns of a harness that compares readings, so that a count of 0 shows
export const CHANGES: Array<Change> = [
    'nullToValue',
    'valueToNull',
    'valueToValue',
    'sameValue',
    'throws',
];

// starts a row with these columns at 0, in this order
export function addRow(rows: Rows, row: string, columns: Array<string>) {
    rows[row] ??= Object.fromEntries(columns.map((column) => [column, 0]));
}

export function writeLines(file: string, lines: Array<string>) {
    writeFileSync(file, lines.join('\n') + (lines.length ? '\n' : ''));
}

// writes a harness’s summary next to its output and prints its table
export function report(dir: string, summary: Summary) {
    writeFileSync(
        path.join(dir, `${summary.name}.summary.json`),
        JSON.stringify(summary, null, 2) + '\n',
    );
    printSummary(summary);
}

export function printSummary({ failures, name, notes, rows, title }: Summary) {
    console.log(`\n${title} (${name})${failures ? ` — ${failures} FAILED` : ''}`);
    const columns = [...new Set(Object.values(rows).flatMap((row) => Object.keys(row)))];
    const table: Record<string, Record<string, number>> = {};
    for (const [row, counts] of Object.entries(rows)) {
        table[row] = Object.fromEntries(
            columns.map((column) => [column, counts[column] ?? 0]),
        );
    }
    const totals = Object.fromEntries(
        columns.map((column) => [
            column,
            Object.values(rows).reduce((sum, counts) => sum + (counts[column] ?? 0), 0),
        ]),
    );
    if (Object.keys(rows).length > 1) table['(all)'] = totals;
    console.table(table);
    for (const note of notes) console.log(note);
}

// A text that a harness knows the answer for. check reads it with a version and
// says whether that reading is right.
export type Check = (
    parse: Parse,
    version: 'base' | 'branch',
) => { isRight: boolean; reading: string };

// Reads a text that a harness knows the answer for with both versions, and
// counts it: wrong in either, fixed (wrong in base, right in branch), regressed
// (right in base, wrong in branch: a failure), or changed (wrong in both, and
// read differently). A few of each are kept as samples.
export function createKnownAnswers(run: Run) {
    const rows: Rows = {};
    const samples: Array<string> = [];
    let failures = 0;
    const check = (row: string, text: string, checkText: Check) => {
        const before = checkText(run.base, 'base');
        const after = checkText(run.branch, 'branch');
        addRow(rows, row, [
            'texts',
            'baseWrong',
            'branchWrong',
            'fixed',
            'regressed',
            'changed',
            'throws',
        ]);
        count(rows, row, 'texts');
        if (!before.isRight) count(rows, row, 'baseWrong');
        if (!after.isRight) count(rows, row, 'branchWrong');
        let kind = '';
        if (isThrown(after.reading)) kind = 'throws';
        else if (before.isRight && !after.isRight) kind = 'regressed';
        else if (!before.isRight && after.isRight) kind = 'fixed';
        else if (!before.isRight && before.reading !== after.reading) kind = 'changed';
        if (!kind) return;
        if (kind === 'throws' || kind === 'regressed') failures++;
        count(rows, row, kind);
        if ((rows[row][kind] ?? 0) <= 5) {
            samples.push(
                JSON.stringify({
                    after: after.reading,
                    before: before.reading,
                    kind,
                    row,
                    text,
                }),
            );
        }
    };
    return { check, getFailures: () => failures, rows, samples };
}

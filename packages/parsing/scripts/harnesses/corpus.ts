// Recorded model responses (a JSONL file with a `text` on each line, made by
// collect-corpus.ts and named by PARSING_CORPUS), read by base and by branch:
//
// - whole: a response that is valid JSON has to read as JSON.parse reads it;
// - at up to 340 lengths of each (the first 40, and CUTS more drawn at random,
//   300 by default, less those that fall on the same length), in order: each
//   difference, and how often a reading goes from a value to null or gets
//   smaller, in each version;
// - at every length, for a response that the two versions read differently whole.
//
// The responses are not ours to publish: what this writes holds no response
// text (only where each difference is), and an example in an issue or a PR has
// to be made up.
import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
    addRow,
    count,
    createDifferences,
    createRandom,
    getRunDir,
    isThrown,
    loadRun,
    report,
    writeLines,
} from '../lib/common.ts';

const dir = getRunDir();
const run = await loadRun(dir);
const corpusPath = process.env.PARSING_CORPUS;

if (!corpusPath) {
    report(dir, {
        failures: 0,
        name: 'corpus',
        notes: ['skipped: set PARSING_CORPUS to a JSONL file made by collect-corpus.ts'],
        rows: {},
        title: 'Recorded responses',
    });
    process.exit(0);
}

const random = createRandom(Number(process.env.SEED ?? 1234));
const CUTS = Number(process.env.CUTS ?? 300);
const texts = [
    ...new Set(
        readFileSync(corpusPath, 'utf8')
            .split('\n')
            .filter(Boolean)
            .map((line) => (JSON.parse(line) as { text: string }).text),
    ),
];

const { compare, differences, getFailures, rows } = createDifferences(run, {
    columns: ['baseWentToNull', 'branchWentToNull', 'baseShrank', 'branchShrank'],
    isPrivate: true,
});
// responses that are valid JSON and are not read as JSON.parse reads them
let failures = 0;

// how long a reading’s value is as JSON: -1 for null, and null where it throws
const sizeOf = (reading: string) => {
    if (isThrown(reading)) return null;
    const { value } = JSON.parse(reading) as { value: unknown };
    return value === null ? -1 : JSON.stringify(value).length;
};

// Reads a response at each of these lengths, in order: counts each difference,
// and each time a reading goes from a value to null, or gets smaller, in each
// version.
function readLengths(row: string, text: string, ends: Array<number>, index: number) {
    const previous: Record<'base' | 'branch', null | number> = { base: -1, branch: -1 };
    for (const end of ends) {
        const readings = compare(row, text.slice(0, end), { end, response: index });
        for (const version of ['base', 'branch'] as const) {
            const size = sizeOf(readings[version === 'base' ? 'before' : 'after']);
            const last = previous[version];
            if (last != null && last > -1 && size === -1) {
                count(rows, row, `${version}WentToNull`);
            }
            if (last != null && size != null && size > -1 && size < last) {
                count(rows, row, `${version}Shrank`);
            }
            previous[version] = size;
        }
    }
}

for (const [index, text] of texts.entries()) {
    const whole = compare('whole', text, { length: text.length, response: index });
    addRow(rows, 'whole', ['validJSON', 'baseNotAsJSONParse', 'branchNotAsJSONParse']);
    let parsed: string | undefined;
    try {
        parsed = JSON.stringify(JSON.parse(text));
    } catch {
        parsed = undefined;
    }
    if (parsed !== undefined) {
        count(rows, 'whole', 'validJSON');
        for (const [version, reading] of [
            ['base', whole.before],
            ['branch', whole.after],
        ] as const) {
            const value = isThrown(reading)
                ? undefined
                : JSON.stringify((JSON.parse(reading) as { value: unknown }).value);
            if (value !== parsed) {
                count(rows, 'whole', `${version}NotAsJSONParse`);
                if (version === 'branch') failures++;
            }
        }
    }
    if (whole.before !== whole.after) {
        // every length of a response that the two read differently
        readLengths(
            'every length of a response read differently whole',
            text,
            Array.from({ length: text.length }, (_, end) => end + 1),
            index,
        );
    }
    const ends = new Set<number>();
    for (let n = 0; n < CUTS; n++) ends.add(1 + Math.floor(random() * text.length));
    for (let end = 1; end <= Math.min(text.length, 40); end++) ends.add(end);
    readLengths(
        'sampled lengths',
        text,
        [...ends].sort((a, b) => a - b),
        index,
    );
}

writeLines(path.join(dir, 'corpus.jsonl'), differences);
report(dir, {
    failures: failures + getFailures(),
    name: 'corpus',
    notes: [
        `${texts.length} responses from ${corpusPath}; where the versions differ is in corpus.jsonl, with no response text`,
    ],
    rows,
    title: 'Recorded responses: whole, at sampled lengths, and at every length where the versions differ',
});

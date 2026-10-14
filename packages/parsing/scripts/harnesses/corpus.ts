// Recorded model responses (a JSONL file with a `text` on each line, made by
// collect-corpus.ts and named by PARSING_CORPUS), read by base and by branch:
//
// - whole: a response that is valid JSON has to read as JSON.parse reads it;
// - at sampled lengths (the first 40 and 300 more, in order): each difference,
//   and how often a reading goes from a value to null or gets smaller, in each
//   version;
// - at every length, for a response that the two versions read differently whole.
//
// The responses are not ours to publish: what this writes stays in the run
// directory, and an example in an issue or a PR has to be made up.
import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
    type Rows,
    CHANGES,
    addRow,
    count,
    createRandom,
    getChange,
    getRunDir,
    isThrown,
    loadRun,
    read,
    report,
    writeLines,
} from '../lib/common.ts';

const dir = getRunDir();
const { base, branch } = await loadRun(dir);
const corpusPath = process.env.PARSING_CORPUS;
const rows: Rows = {};
const differences: Array<string> = [];
let failures = 0;

if (!corpusPath) {
    report(dir, {
        failures,
        name: 'corpus',
        notes: ['skipped: set PARSING_CORPUS to a JSONL file made by collect-corpus.ts'],
        rows,
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

// a reading’s value, and how long it is as JSON (-1 for null)
const sizeOf = (reading: string) => {
    if (isThrown(reading)) return -1;
    const { value } = JSON.parse(reading) as { value: unknown };
    return value === null ? -1 : JSON.stringify(value).length;
};

// Reads a response at each of these lengths, in order: counts each difference,
// and each time a reading goes from a value to null, or gets smaller, in each
// version.
function readLengths(row: string, text: string, ends: Array<number>, index: number) {
    const previous = { base: -1, branch: -1 };
    for (const end of ends) {
        const cut = text.slice(0, end);
        const readings = { base: read(base, cut), branch: read(branch, cut) };
        addRow(rows, row, [
            'texts',
            ...CHANGES,
            'baseWentToNull',
            'branchWentToNull',
            'baseShrank',
            'branchShrank',
        ]);
        count(rows, row, 'texts');
        for (const version of ['base', 'branch'] as const) {
            const size = sizeOf(readings[version]);
            if (previous[version] > -1 && size === -1)
                count(rows, row, `${version}WentToNull`);
            if (size > -1 && size < previous[version])
                count(rows, row, `${version}Shrank`);
            previous[version] = size;
        }
        if (readings.base === readings.branch) continue;
        const change = getChange(readings.base, readings.branch);
        if (change === 'throws') failures++;
        count(rows, row, change);
        if (differences.length < 2000) {
            differences.push(
                JSON.stringify({
                    change,
                    end,
                    ends: cut.slice(-80),
                    response: index,
                    row,
                }),
            );
        }
    }
}

for (const [index, text] of texts.entries()) {
    const whole = { base: read(base, text), branch: read(branch, text) };
    addRow(rows, 'whole', [
        'texts',
        'validJSON',
        'baseNotAsJSONParse',
        'branchNotAsJSONParse',
        ...CHANGES,
    ]);
    count(rows, 'whole', 'texts');
    let parsed: string | undefined;
    try {
        parsed = JSON.stringify(JSON.parse(text));
    } catch {
        parsed = undefined;
    }
    if (parsed !== undefined) {
        count(rows, 'whole', 'validJSON');
        for (const version of ['base', 'branch'] as const) {
            const value = isThrown(whole[version])
                ? undefined
                : JSON.stringify(
                      (JSON.parse(whole[version]) as { value: unknown }).value,
                  );
            if (value !== parsed) {
                count(rows, 'whole', `${version}NotAsJSONParse`);
                if (version === 'branch') failures++;
            }
        }
    }
    if (whole.base !== whole.branch) {
        const change = getChange(whole.base, whole.branch);
        if (change === 'throws') failures++;
        count(rows, 'whole', change);
        differences.push(
            JSON.stringify({
                change,
                length: text.length,
                response: index,
                row: 'whole',
            }),
        );
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
    failures,
    name: 'corpus',
    notes: [
        `${texts.length} responses from ${corpusPath}; the differences (with no response text) are in corpus.jsonl`,
    ],
    rows,
    title: 'Recorded responses: whole, at sampled lengths, and at every length where the versions differ',
});

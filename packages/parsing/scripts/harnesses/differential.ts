// Every input that each version’s tests pass to parseAsJSON, cut at every
// length, read by base and by branch. There is no known answer: each difference
// is written out to be accounted for.
import path from 'node:path';

import {
    type Rows,
    CHANGES,
    addRow,
    count,
    getChange,
    getRunDir,
    loadRun,
    read,
    readInputs,
    report,
    writeLines,
} from '../lib/common.ts';

const dir = getRunDir();
const { base, branch } = await loadRun(dir);
const rows: Rows = {};
const differences: Array<string> = [];
let failures = 0;

for (const version of ['base', 'branch'] as const) {
    const row = `every length of the ${version}’s test inputs`;
    const inputs = readInputs(dir, version);
    addRow(rows, row, ['inputs', 'texts', ...CHANGES]);
    count(rows, row, 'inputs', inputs.length);
    const seen = new Set<string>();
    for (const input of inputs) {
        for (let end = 1; end <= input.length; end++) {
            const text = input.slice(0, end);
            if (seen.has(text)) continue;
            seen.add(text);
            count(rows, row, 'texts');
            const before = read(base, text);
            const after = read(branch, text);
            if (before === after) continue;
            const change = getChange(before, after);
            if (change === 'throws') failures++;
            count(rows, row, change);
            differences.push(JSON.stringify({ after, before, change, row, text }));
        }
    }
}

writeLines(path.join(dir, 'differential.jsonl'), differences);
report(dir, {
    failures,
    name: 'differential',
    notes: [`${differences.length} differences in differential.jsonl`],
    rows,
    title: 'Differential: the test inputs at every length',
});

// Every input that either version’s tests pass to parseAsJSON, cut at every
// length (the empty text included), read by base and by branch, and the inputs
// that are not strings (parseAsJSON() and parseAsJSON(null) are recorded as
// null). There is no known answer: each difference is written out to be
// accounted for. Each input is read once, in a row named by whose tests pass it.
import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
    createDifferences,
    createSourceOf,
    getRunDir,
    loadRun,
    readAllInputs,
    report,
    writeLines,
} from '../lib/common.ts';

const dir = getRunDir();
const run = await loadRun(dir);
const { compare, differences, getFailures, rows } = createDifferences(run);
const sourceOf = createSourceOf(dir);

const seen = new Set<string>();
for (const input of readAllInputs(dir)) {
    for (let end = 0; end <= input.length; end++) {
        const text = input.slice(0, end);
        if (seen.has(text)) continue;
        seen.add(text);
        compare(`every length of the test inputs${sourceOf(input)}`, text);
    }
}

// the recorded inputs that are not strings, each once
const others = new Set<string>();
for (const version of ['base', 'branch']) {
    const lines = readFileSync(path.join(dir, `inputs-${version}.jsonl`), 'utf8');
    for (const line of lines.split('\n')) {
        if (line && typeof JSON.parse(line) !== 'string') others.add(line);
    }
}
for (const line of others) {
    compare('the inputs that are not strings', JSON.parse(line) as string);
}

writeLines(path.join(dir, 'differential.jsonl'), differences);
report(dir, {
    failures: getFailures(),
    name: 'differential',
    notes: [`${differences.length} differences in differential.jsonl`],
    rows,
    title: 'Differential: the test inputs at every length',
});

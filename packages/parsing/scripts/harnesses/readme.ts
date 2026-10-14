// Every example in the branch’s README, run as it is written there: each call to
// parseAsJSON with what the README says it results in, on the line after it
// (`// …`) or in a block comment after it (`/* results in: … */`), and the first
// usage example’s value and preamble. Members are compared in any order. The base
// reads them too, so that the examples of what the branch adds show as such.
import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
    type Parse,
    type Rows,
    addRow,
    count,
    getRunDir,
    loadRun,
    report,
} from '../lib/common.ts';

const dir = getRunDir();
const { base, branch } = await loadRun(dir);
const readme = readFileSync(path.join(dir, 'branch.README.md'), 'utf8');
const blocks = [...readme.matchAll(/^(`{3,4})js\n([\s\S]*?)\n\1$/gm)].map(
    (match) => match[2],
);

// the same members in any order
const sort = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(sort);
    if (value === null || typeof value !== 'object') return value;
    const object = value as Record<string, unknown>;
    return Object.fromEntries(
        Object.keys(object)
            .sort()
            .map((key) => [key, sort(object[key])]),
    );
};
const isSame = (a: unknown, b: unknown) =>
    JSON.stringify(sort(a)) === JSON.stringify(sort(b));
const evaluate = (code: string, parse: Parse): unknown =>
    new Function('parseAsJSON', `return (${code})`)(parse);

type Example = { call: string; expected: string; part?: 'preamble' | 'value' };
const examples: Array<Example> = [];
for (const block of blocks) {
    const named =
        /const \{ preamble, value \} =\s*(parseAsJSON\([\s\S]*?\));\n\/\* value is:\n([\s\S]*?)\nand preamble is:\n([\s\S]*?)\n\*\//.exec(
            block,
        );
    if (named) {
        examples.push({ call: named[1], expected: named[2], part: 'value' });
        examples.push({ call: named[1], expected: named[3], part: 'preamble' });
    }
    const results =
        /^(parseAsJSON\((?:[^;]|;(?!\n))*?\)(?:\.value)?);\n(?:\/\/ (.*)|\/\* results in:\n([\s\S]*?)\n\*\/)/gm;
    for (const match of block.matchAll(results)) {
        examples.push({ call: match[1], expected: match[2] ?? match[3] });
    }
}

const rows: Rows = {};
const notes: Array<string> = [];
let failures = 0;
for (const { call, expected, part } of examples) {
    const want = evaluate(expected, branch);
    addRow(rows, 'examples', ['checks', 'baseWrong', 'branchWrong']);
    count(rows, 'examples', 'checks');
    for (const [version, parse] of [
        ['base', base],
        ['branch', branch],
    ] as const) {
        let got = evaluate(call, parse);
        if (part) got = (got as Record<string, unknown>)[part];
        if (isSame(got, want)) continue;
        count(rows, 'examples', `${version}Wrong`);
        if (version === 'branch') {
            failures++;
            notes.push(
                `branch: ${call.replace(/\s+/g, ' ')}\n  got      ${JSON.stringify(got)}\n  expected ${JSON.stringify(want)}`,
            );
        } else {
            notes.push(
                `base reads it otherwise: ${call.replace(/\s+/g, ' ').slice(0, 120)}`,
            );
        }
    }
}
const calls = (readme.match(/parseAsJSON\(\s*['`]/g) ?? []).length;
notes.unshift(
    `${examples.length} checks of the ${calls} calls in the README’s ${blocks.length} code blocks`,
);

report(dir, {
    failures,
    name: 'readme',
    notes,
    rows,
    title: 'The README’s examples, as they are written there',
});

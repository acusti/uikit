// Each test input (the last of its prefixes) with a preamble before it: prose
// with braces, brackets or quoted words in it, code, a set, a citation, a task
// list, a markdown table, a lone bracket; or with a comment line after its
// opening brace, or its first key without its opening quote mark. Read whole, and
// cut at each length from just before the input to 50 into it and at 14 more, by
// base and by branch. There is no known answer: each difference is written out
// to be accounted for.
import path from 'node:path';

import {
    type Rows,
    CHANGES,
    addRow,
    count,
    createRandom,
    getChange,
    getLastInputs,
    getRunDir,
    loadRun,
    read,
    readInputs,
    report,
    writeLines,
} from '../lib/common.ts';

const dir = getRunDir();
const { base, branch } = await loadRun(dir);
const random = createRandom(Number(process.env.SEED ?? 1234));

const COMMENT = Symbol('a comment line after the opening brace');
const DROP_QUOTE = Symbol('the first key without its opening quote mark');
const PREFIXES: Array<[string, string | symbol]> = [
    ['plain', 'Here is the result:\n'],
    ['braces in prose', 'Use {placeholders} like this: '],
    ['template braces', 'Hello {{name}}, here you go:\n'],
    ['code with braces', 'function f() {\n  return 1;\n}\n'],
    ['a set in prose', 'Options {a, b} are set:\n'],
    ['citation and link', 'As in [1] and [the docs](https://example.com):\n'],
    ['bracketed note', 'Note [the draft] is below.\n'],
    ['task list', '- [ ] check this\n- [x] done\n'],
    ['quoted word', 'Here is the "About" section:\n'],
    ['quoted key in prose', 'I set "status": "done" as asked.\n'],
    ['a lone brace', '{'],
    ['a lone bracket', '['],
    ['brace and line break', '{\n'],
    ['bracket and line break', '[\n'],
    ['a markdown table', '| Field | Value |\n| --- | --- |\n| heading | Hello |\n\n'],
    ['a comment line after the brace', COMMENT],
    ['first key without its opening quote', DROP_QUOTE],
    ['nothing', ''],
];

const inputs = getLastInputs([
    ...new Set([...readInputs(dir, 'base'), ...readInputs(dir, 'branch')]),
]);
const rows: Rows = {};
const differences: Array<string> = [];
const seen = new Set<string>();
let failures = 0;
for (const input of inputs) {
    const trimmed = input.trimStart();
    for (const [kind, prefix] of PREFIXES) {
        let variant: string;
        let from: number;
        if (prefix === COMMENT) {
            const brace = /^\{\s*\n?/.exec(trimmed);
            if (!brace) continue;
            variant = '{\n  // a note\n' + trimmed.slice(brace[0].length);
            from = 1;
        } else if (prefix === DROP_QUOTE) {
            const key = /^\{\s*"/.exec(trimmed);
            if (!key) continue;
            variant = 'Here it is:\n{\n' + trimmed.slice(key[0].length);
            from = 12;
        } else {
            variant = (prefix as string) + input;
            from = (prefix as string).length;
        }
        const ends = new Set<number>([variant.length]);
        for (
            let end = Math.max(1, from - 3);
            end <= Math.min(variant.length, from + 50);
            end++
        ) {
            ends.add(end);
        }
        for (let n = 0; n < 14; n++) ends.add(1 + Math.floor(random() * variant.length));
        for (const end of ends) {
            const text = variant.slice(0, end);
            if (seen.has(kind + '\u0001' + text)) continue;
            seen.add(kind + '\u0001' + text);
            addRow(rows, kind, ['texts', ...CHANGES]);
            count(rows, kind, 'texts');
            const before = read(base, text);
            const after = read(branch, text);
            if (before === after) continue;
            const change = getChange(before, after);
            if (change === 'throws') failures++;
            count(rows, kind, change);
            differences.push(JSON.stringify({ after, before, change, from, kind, text }));
        }
    }
}

writeLines(path.join(dir, 'fuzz-preamble.jsonl'), differences);
report(dir, {
    failures,
    name: 'fuzz-preamble',
    notes: [
        `${inputs.length} inputs; ${differences.length} differences in fuzz-preamble.jsonl`,
    ],
    rows,
    title: 'Preamble fuzz: each test input after a preamble',
});

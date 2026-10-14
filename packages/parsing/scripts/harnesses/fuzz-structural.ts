// Each test input (the last of its prefixes), with one mutation of its structure:
// a comma before a closing bracket or after an opening one, a raw line break
// (escaped or not) in a word, an escaped backslash before a closing quote mark,
// a punctuation mark deleted, doubled or replaced, and a preamble with a first
// key that has lost its opening quote mark. Read whole, and cut at each of the 40
// lengths after the mutation and at 6 more, by base and by branch. There is no
// known answer: each difference is written out to be accounted for.
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

const pick = <T>(items: Array<T>, max: number) =>
    items.length <= max
        ? items
        : [
              ...new Set(
                  Array.from(
                      { length: max },
                      () => items[Math.floor(random() * items.length)],
                  ),
              ),
          ];

type Mutation = { at: number; kind: string; text: string };

function mutate(input: string) {
    const mutations: Array<Mutation> = [];
    const indicesOf = (chars: string) =>
        [...input].flatMap((char, index) => (chars.includes(char) ? [index] : []));
    const insert = (kind: string, index: number, what: string) =>
        mutations.push({
            at: index,
            kind,
            text: input.slice(0, index) + what + input.slice(index),
        });
    for (const index of pick(indicesOf(']'), 25)) {
        insert('comma before ]', index, ',');
        insert('comma before ]', index, ', ');
    }
    for (const index of pick(indicesOf('}'), 40)) {
        insert('comma before }', index, ',');
        insert('comma before }', index, ',\n');
    }
    for (const index of pick(indicesOf('['), 15)) insert('comma after [', index + 1, ',');
    for (const index of pick(indicesOf('{'), 15)) insert('comma after {', index + 1, ',');
    const inWords = [...input].flatMap((_, index) =>
        index > 0 && /[a-z]/i.test(input[index - 1]) && /[a-z ]/i.test(input[index])
            ? [index]
            : [],
    );
    for (const index of pick(inWords, 30)) {
        insert('escaped backslash + raw line break', index, '\\\\\n');
    }
    for (const index of pick(inWords, 30)) insert('raw line break', index, '\n');
    for (const index of pick(inWords, 15)) insert('two raw line breaks', index, '\n\n');
    const closers = [...input].flatMap((char, index) =>
        index > 0 && char === '"' && !/[\s:,{[\\]/.test(input[index - 1]) ? [index] : [],
    );
    for (const index of pick(closers, 30))
        insert('escaped backslash before "', index, '\\\\');
    for (const index of pick(indicesOf(',[]{}":'), 30)) {
        const choice = random();
        if (choice < 0.34) {
            mutations.push({
                at: index,
                kind: 'noise',
                text: input.slice(0, index) + input.slice(index + 1),
            });
        } else if (choice < 0.67) {
            insert('noise', index, input[index]);
        } else {
            insert('noise', index, ',[]{}'[Math.floor(random() * 5)]);
        }
    }
    // a preamble that quotes a word and ends in a colon, and a first key that has
    // lost its opening quote mark
    const firstKey = /^\s*\{\s*"/.exec(input);
    if (firstKey) {
        const quoteIndex = firstKey[0].length - 1;
        const prefix = 'Here is the JSON for the "About" section:\n';
        mutations.push({
            at: prefix.length + quoteIndex,
            kind: 'quoted preamble, first key without its quote',
            text: prefix + input.slice(0, quoteIndex) + input.slice(quoteIndex + 1),
        });
    }
    return mutations;
}

// which tests pass each input: a difference from an input that only the
// branch’s tests pass is likely what the branch’s new tests are about
const baseInputs = new Set(readInputs(dir, 'base'));
const branchInputs = new Set(readInputs(dir, 'branch'));
const inputs = getLastInputs([...new Set([...baseInputs, ...branchInputs])]);
const sourceOf = (input: string) =>
    !branchInputs.has(input)
        ? ' (base’s tests only)'
        : !baseInputs.has(input)
          ? ' (branch’s tests only)'
          : '';

const rows: Rows = {};
const differences: Array<string> = [];
const seen = new Set<string>();
let failures = 0;
for (const input of inputs) {
    for (const { at, kind, text: variant } of mutate(input)) {
        const row = kind + sourceOf(input);
        const ends = new Set<number>([variant.length]);
        for (let end = at + 1; end <= Math.min(variant.length, at + 40); end++)
            ends.add(end);
        for (let n = 0; n < 6; n++)
            ends.add(at + 1 + Math.floor(random() * (variant.length - at)));
        for (const end of ends) {
            if (end > variant.length || end < 1) continue;
            const text = variant.slice(0, end);
            if (seen.has(text)) continue;
            seen.add(text);
            addRow(rows, row, ['texts', ...CHANGES]);
            count(rows, row, 'texts');
            const before = read(base, text);
            const after = read(branch, text);
            if (before === after) continue;
            const change = getChange(before, after);
            if (change === 'throws') failures++;
            count(rows, row, change);
            differences.push(
                JSON.stringify({ after, at, before, change, kind: row, text }),
            );
        }
    }
}

writeLines(path.join(dir, 'fuzz-structural.jsonl'), differences);
report(dir, {
    failures,
    name: 'fuzz-structural',
    notes: [
        `${inputs.length} inputs; ${differences.length} differences in fuzz-structural.jsonl`,
    ],
    rows,
    title: 'Structural fuzz: each test input with one mutation',
});

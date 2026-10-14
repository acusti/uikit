// Each test input (the last of its prefixes), with one mutation of its structure:
// a comma before a closing bracket or after an opening one, a raw line break
// (escaped or not) in a word, an escaped backslash before a closing quote mark,
// a punctuation mark deleted or doubled or with one of `,[]{}` put before it,
// and a preamble with a first key that has lost its opening quote mark. Read
// whole, and cut at each of the 40 lengths after the mutation and at 6 more, by
// base and by branch. There is no known answer: each difference is written out
// to be accounted for.
import path from 'node:path';

import {
    createDifferences,
    createRandom,
    createSourceOf,
    getLastInputs,
    getRunDir,
    loadRun,
    readAllInputs,
    report,
    writeLines,
} from '../lib/common.ts';

const dir = getRunDir();
const run = await loadRun(dir);
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
    // the indexes (of UTF-16 code units, as slice has them) where test holds
    const indexesWhere = (test: (index: number) => boolean) => {
        const indexes: Array<number> = [];
        for (let index = 0; index < input.length; index++) {
            if (test(index)) indexes.push(index);
        }
        return indexes;
    };
    const indexesOf = (chars: string) =>
        indexesWhere((index) => chars.includes(input[index]));
    const insert = (kind: string, index: number, what: string) =>
        mutations.push({
            at: index,
            kind,
            text: input.slice(0, index) + what + input.slice(index),
        });
    for (const index of pick(indexesOf(']'), 25)) {
        insert('comma before ]', index, ',');
        insert('comma before ]', index, ', ');
    }
    for (const index of pick(indexesOf('}'), 40)) {
        insert('comma before }', index, ',');
        insert('comma before }', index, ',\n');
    }
    for (const index of pick(indexesOf('['), 15)) insert('comma after [', index + 1, ',');
    for (const index of pick(indexesOf('{'), 15)) insert('comma after {', index + 1, ',');
    const inWords = indexesWhere(
        (index) =>
            index > 0 && /[a-z]/i.test(input[index - 1]) && /[a-z ]/i.test(input[index]),
    );
    for (const index of pick(inWords, 30)) {
        insert('escaped backslash + raw line break', index, '\\\\\n');
    }
    for (const index of pick(inWords, 30)) insert('raw line break', index, '\n');
    for (const index of pick(inWords, 15)) insert('two raw line breaks', index, '\n\n');
    const closers = indexesWhere(
        (index) =>
            index > 0 && input[index] === '"' && !/[\s:,{[\\]/.test(input[index - 1]),
    );
    for (const index of pick(closers, 30))
        insert('escaped backslash before "', index, '\\\\');
    for (const index of pick(indexesOf(',[]{}":'), 30)) {
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

const inputs = getLastInputs(readAllInputs(dir));
const sourceOf = createSourceOf(dir);
const { compare, differences, getFailures, rows } = createDifferences(run);
const seen = new Set<string>();
for (const input of inputs) {
    for (const { at, kind, text: variant } of mutate(input)) {
        const ends = new Set<number>([variant.length]);
        for (let end = at + 1; end <= Math.min(variant.length, at + 40); end++) {
            ends.add(end);
        }
        for (let n = 0; n < 6; n++) {
            ends.add(at + 1 + Math.floor(random() * (variant.length - at)));
        }
        for (const end of ends) {
            if (end > variant.length || end < 1) continue;
            const text = variant.slice(0, end);
            if (seen.has(text)) continue;
            seen.add(text);
            compare(kind + sourceOf(input), text, { at });
        }
    }
}

writeLines(path.join(dir, 'fuzz-structural.jsonl'), differences);
report(dir, {
    failures: getFailures(),
    name: 'fuzz-structural',
    notes: [
        `${inputs.length} inputs; ${differences.length} differences in fuzz-structural.jsonl`,
    ],
    rows,
    title: 'Structural fuzz: each test input with one mutation',
});

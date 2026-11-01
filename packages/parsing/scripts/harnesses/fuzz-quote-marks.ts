// Each test input (the last of its prefixes) with quote marks put in at one to
// four places, as a model leaves them unescaped in a string: alone, in quoted
// words, as an inches mark, and with what the rules for a quote mark look at
// around it (a closing bracket, a line break, a comma, a colon). Few test inputs
// have one that is not the end of its string, and the walk is the only thing that
// reads those. Half of them have a trailing comma put in too, and each is read
// bare, in a code block, after a preamble and before a note, four times over at
// other places: whole, cut around each thing that was put in and at 6 more
// lengths, by base and by branch. There is no known answer: each difference is
// written out to be accounted for.
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

const KINDS: Array<[string, Array<string>]> = [
    ['a quote mark', ['"', '""']],
    ['quoted words', ['"hi"', ' "hi" ', 'he said "hi" to me', '"a"b"c"']],
    ['an inches mark', ['5" ', ' 5", ']],
    [
        'and a closing bracket',
        ['"}', '"]', '}"', ']"', '" }', '" ]', '"a}b"', '"a]b"', '"[1]"', '"{1}"'],
    ],
    ['and a line break', ['"\n', '"\r\n', '\n"', '"a\nb"', '"\n}', '"\n]']],
    ['and what ends a string', ['",', '",\n', '":', '" : ', '"  ']],
    ['and what starts a string', [': "', ', "']],
    ['an escaped one', ['\\"', '\\\\"']],
];
const WRAPPERS: Array<[string, string, string]> = [
    ['bare', '', ''],
    ['in a code block', '```json\n', '\n```'],
    ['after a preamble', 'Here it is:\n\n\n', ''],
    ['before a note', '', '\n\n\n\nNote: that is all.'],
];
// the lengths after the end of what was put in that each text is cut at
const CUTS = [0, 1, 3];
const ROUNDS = 4;

const pick = <Item>(items: Array<Item>) => items[Math.floor(random() * items.length)];

// the input with pieces put in, and the index of the end of each piece
function putIn(input: string, pieces: Array<string>) {
    let text = input;
    const ends: Array<number> = [];
    const insert = (index: number, piece: string) => {
        text = text.slice(0, index) + piece + text.slice(index);
        ends.forEach((end, endIndex) => {
            if (end > index) ends[endIndex] = end + piece.length;
        });
        ends.push(index + piece.length);
    };
    if (random() < 0.5) {
        const brackets = [...text.matchAll(/[}\]]/g)].map(({ index }) => index);
        if (brackets.length) insert(pick(brackets), ',');
    }
    const places = 1 + Math.floor(random() * 4);
    for (let place = 0; place < places; place++) {
        insert(Math.floor(random() * (text.length + 1)), pick(pieces));
    }
    return { ends, text };
}

const inputs = getLastInputs(readAllInputs(dir));
const sourceOf = createSourceOf(dir);
const { compare, differences, getFailures, rows } = createDifferences(run);
const seen = new Set<string>();
for (const input of inputs) {
    for (const [kind, pieces] of KINDS) {
        for (let round = 0; round < ROUNDS; round++) {
            for (const [wrapper, before, after] of WRAPPERS) {
                const { ends, text: changed } = putIn(input, pieces);
                const text = before + changed + after;
                const lengths = new Set<number>([text.length]);
                for (const end of ends) {
                    for (const cut of CUTS) lengths.add(before.length + end + cut);
                }
                for (let n = 0; n < 6; n++) {
                    lengths.add(1 + Math.floor(random() * text.length));
                }
                for (const length of lengths) {
                    const cutText = text.slice(0, length);
                    if (seen.has(kind + '\u0001' + cutText)) continue;
                    seen.add(kind + '\u0001' + cutText);
                    compare(kind + sourceOf(input), cutText, { wrapper });
                }
            }
        }
    }
}

writeLines(path.join(dir, 'fuzz-quote-marks.jsonl'), differences);
report(dir, {
    failures: getFailures(),
    name: 'fuzz-quote-marks',
    notes: [
        `${inputs.length} inputs; ${differences.length} differences in fuzz-quote-marks.jsonl`,
    ],
    rows,
    title: 'Quote mark fuzz: each test input with quote marks put in',
});

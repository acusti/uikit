// What follows an object or array that cannot be read is read as if it were not
// there. Each value that the test inputs read as (compact and pretty-printed,
// alone and with a code block of code after it) comes after such a root, not in
// a code block, and is right where the text reads as it does without the root:
// whole, and cut at every length from the first character of the value on. The
// roots have code blocks in their strings and comments, stray quote marks, and
// members that could be taken for the JSON. Rows named COST are readings that a
// release chose to give up, and OPEN ones are known to be wrong; they are wrong
// in base too, and only a change in them counts.
import path from 'node:path';

import {
    createKnownAnswers,
    getRunDir,
    getValues,
    loadRun,
    readAllInputs,
    readValue,
    report,
    writeLines,
} from '../lib/common.ts';

const dir = getRunDir();
const run = await loadRun(dir);
const values = getValues(run, readAllInputs(dir));
const F = '```';
const ROOTS: Array<[string, string]> = [
    ['a root that cannot be read', '{ a: \'b\', "c": {"d": 1} }\n'],
    [
        '…with a block of shell in a string, and members after it',
        'Note:\n{ a: "q\n' + F + 'sh\nnpm i\n' + F + '\nthen",\n  b: {"c": 1}\n}\n',
    ],
    [
        '…with a block of no language in a string',
        'Note:\n{ content: "see:\n' + F + '\nls\n' + F + '\n", data: {"x": 1} }\n',
    ],
    [
        '…with a line of code in a string',
        'Note:\n{ a: "Run\n' + F + 'npm i' + F + ' first", b: {"c": 1} }\n',
    ],
    [
        '…with a block of shell in a comment',
        'Config:\n{\n  debug: true,\n  /* e.g.\n' +
            F +
            '\nls\n' +
            F +
            '\n  */\n  b: {"c": 1}\n}\n',
    ],
    ['…with a stray quote mark on its first line', 'Size:\n{ w: 5" } so:\n'],
    [
        '…with a json block of JSON that cannot be read in a string, and members after it',
        'Note:\n{ doc: "Example:\n' + F + 'json\n{ a: 1 }\n' + F + '\n", b: {"c": 1} }\n',
    ],
    [
        'COST …with JSON after the fence that closes a block of shell in a string',
        'Note:\n{ a: "q\n' +
            F +
            'sh\nnpm i\n' +
            F +
            '\n[1, 2]\nthen",\n  b: {"c": 1}\n}\n',
    ],
    [
        'COST …with a block of JSON in a string',
        '{ content: "see:\n' + F + 'json\n{"inner": 1}\n' + F + '\n", b: 2 }\n',
    ],
    [
        'COST …with a block of JSON in a comment',
        'Config:\n{\n  debug: true,\n  /* e.g.\n' +
            F +
            '\n[1, 2]\n' +
            F +
            '\n  */\n}\nFixed:\n',
    ],
    [
        'OPEN …a JS object with an inches mark in single quotes',
        "You gave me:\n{\n  name: 'the 13\" laptop',\n  ports: 2\n}\nAs JSON:\n",
    ],
    ['OPEN …with a bracket in single quotes', "Note:\n{ end: ']' }\nThe JSON:\n"],
];

const { check, getFailures, rows, samples } = createKnownAnswers(run);
for (const value of values) {
    for (const json of [JSON.stringify(value), JSON.stringify(value, null, 2)]) {
        const tails = [
            ['', ''],
            [', then a block of code', '\n' + F + '\nls\n' + F],
        ] as const;
        for (const [tail, suffix] of tails) {
            const body = json + suffix;
            for (const [kind, root] of ROOTS) {
                for (let end = 1; end <= body.length; end++) {
                    const alone = body.slice(0, end);
                    check(kind + tail, root + alone, (parse) => {
                        const reading = readValue(parse, root + alone);
                        return { isRight: reading === readValue(parse, alone), reading };
                    });
                }
            }
        }
    }
}

writeLines(path.join(dir, 'root-before-answer.jsonl'), samples);
report(dir, {
    failures: getFailures(),
    name: 'root-before-answer',
    notes: [`${values.length} values`],
    rows,
    title: 'An answer after a root that cannot be read reads as it does alone',
});

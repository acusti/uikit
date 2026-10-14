// The JSON in a code block is the value, whatever comes before the block. Each
// value that the test inputs read as is put in a code block (with the language
// json and with none, compact and pretty-printed), after text with something
// JSON-like in it, and is right where the text reads as the block alone does:
// whole, and cut at every length from the first character of the JSON on (the
// block not yet closed).
import path from 'node:path';

import {
    createKnownAnswers,
    getRunDir,
    getValues,
    loadRun,
    readInputs,
    readValue,
    report,
    writeLines,
} from '../lib/common.ts';

const dir = getRunDir();
const run = await loadRun(dir);
const values = getValues(run.branch, [
    ...new Set([...readInputs(dir, 'base'), ...readInputs(dir, 'branch')]),
]);
const F = '```';
const PREFIXES: Array<[string, string]> = [
    ['an object in code', 'if (x)\n{\n  go({"y": 1});\n}\n'],
    ['a whole value', '{"x": 1}\n'],
    ['a value in a sentence', 'Use {"y": [1, 2]} like so, or ["a", "b"]:\n'],
    ['an array of numbers on a line', 'Sizes:\n[1, 2]\n'],
    ['a value that is not closed', 'foo({"y": 1, "z": [\n'],
    ['a value and a stray quote mark', 'A {"y": 1} is 5" wide\n'],
    ['a root that cannot be read', '{ a: \'b\', "c": {"d": 1} }\n'],
    ['an unclosed bracket', '[draft\n'],
    ['a code block of code', F + 'js\nconst y = {"z": 2};\n' + F + '\n'],
    [
        'a string that ends on a closing fence',
        '{"note": "run:\n' + F + 'js\nfoo()\n' + F + '"}\nHere it is:\n',
    ],
    ['a string with one fence in it', '{"note": "see\n' + F + '\nx"}\n'],
    [
        'a string with a fence and more on its line',
        'Call go({"s": "a\n' + F + 'js"}) first:\n',
    ],
    [
        'a string with a whole block in it',
        '{"note": "see\n' + F + 'js\nfoo()\n' + F + '\nok"}\n',
    ],
    ['an unreadable root with a fence in a string', '{ note: "see\n' + F + '\nx" }\n'],
    [
        'an unreadable root whose string ends on a fence',
        '{ note: "run:\n' + F + 'js\nfoo()\n' + F + '" }\nSo:\n',
    ],
    ['a block that is not closed', 'Log:\n' + F + '\nstarted\n\n'],
    ['a value inside a block of text', F + '\nplan: {"draft": 1}\n' + F + '\n'],
    ['a quoted fence in prose', 'He wrote "use\n' + F + '\nhere" and left.\n'],
    [
        'a value, then a block that is not closed',
        'Use {"y": 1}.\nLog:\n' + F + '\nstarted\n\n',
    ],
    [
        'a value, then an unreadable root with a fence in a string',
        'Use {"y": 1}:\n{ note: "see\n' + F + '\nx" }\n',
    ],
    [
        'a value, then a quoted fence in prose',
        'Use {"y": 1}. He wrote "use\n' + F + '\nhere" and left.\n',
    ],
    [
        'a value, then one with a fence in a string',
        '{"y": 1}\n{"note": "see\n' + F + '\nx"}\n',
    ],
    [
        'a value, then a block of text and a fence in a string',
        '{"y": 1}\n' + F + '\n{ note: "see\n' + F + 'js" }\n' + F + '\n',
    ],
    ['an unreadable root with an inches mark, not closed', 'Note:\n{ size: 5" wide\n'],
    [
        'an unreadable root with an inches mark',
        'Spec:\n{\n  width: 5",\n  height: 3\n}\n',
    ],
    [
        'an unreadable root with an odd quote mark in a string',
        'Spec:\n{\n  screen: "a 13" laptop",\n  ports: 2\n}\nAs JSON:\n',
    ],
    [
        'a JS object with an inches mark in single quotes',
        "You gave me:\n{\n  name: 'the 13\" laptop',\n  ports: 2\n}\nAs JSON:\n",
    ],
    [
        'an unreadable root with a block of shell in a string, and more of it',
        'Note:\n{ a: "q\n' + F + 'sh\nnpm i\n' + F + '\nthen",\n  b: {"c": 1}\n}\n',
    ],
    [
        'an unreadable root with code in a line of a string',
        'Note:\n{ a: "Run\n' + F + 'npm i' + F + ' first", b: {"c": 1} }\n',
    ],
    [
        'an unreadable root with a block of shell in a comment',
        'Config:\n{\n  debug: true,\n  /* e.g.\n' +
            F +
            '\nls\n' +
            F +
            '\n  */\n  b: {"c": 1}\n}\n',
    ],
];

const { check, getFailures, rows, samples } = createKnownAnswers(run);
for (const value of values) {
    for (const json of [JSON.stringify(value), JSON.stringify(value, null, 2)]) {
        for (const opener of [F + 'json\n', F + '\n']) {
            const fenced = opener + json + '\n' + F + '\nDone.';
            // what the block alone reads as, at each length, in each version
            const expected = new Map<string, Array<string>>();
            for (const [name, parse] of [
                ['base', run.base],
                ['branch', run.branch],
            ] as const) {
                const readings: Array<string> = [];
                for (let end = opener.length + 1; end <= fenced.length; end++) {
                    readings.push(readValue(parse, fenced.slice(0, end)));
                }
                expected.set(name, readings);
            }
            for (const [kind, prefix] of PREFIXES) {
                for (let end = opener.length + 1; end <= fenced.length; end++) {
                    const text = prefix + fenced.slice(0, end);
                    check(kind, text, (parse, version) => {
                        const reading = readValue(parse, text);
                        const alone = expected.get(version)![end - opener.length - 1];
                        return { isRight: reading === alone, reading };
                    });
                }
            }
        }
    }
}

writeLines(path.join(dir, 'code-block-before.jsonl'), samples);
report(dir, {
    failures: getFailures(),
    name: 'code-block-before',
    notes: [`${values.length} values`],
    rows,
    title: 'A code block after text with something JSON-like in it reads as the block alone',
});

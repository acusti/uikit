// A code block after the answer does not take its place unless it is JSON. Each
// value that the test inputs read as (compact and pretty-printed; bare, after a
// preamble and in a json block) has a code block put after it, and is right
// where the text reads as the answer alone does, cut at every length into what
// was put after it:
//
// - a block in another language, whatever it starts with: at every length;
// - a block with no language, or the line after a closing fence, that starts
//   with something that is not JSON that can be read: once its line is whole
//   (while it streams in, a line of brackets alone may be taken for JSON).
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
const CODE: Array<[string, string]> = [
    ['python', "{'name': 'Ann'}"],
    ['python', "['a', 'b']"],
    ['python', "[{'name': 'Ann'}]"],
    ['python', '{"name": "Bo", "ok": True}'],
    ['python', '["a", "b"]'],
    ['js', "{ name: 'Ann' }"],
    ['js', "{\n  name: 'Ann',\n}"],
    ['js', "['a', 'b'].map(f)"],
    ['js', '["a", "b"].map(f)'],
    ['js', "[{ name: 'Ann' }]"],
    ['js', '{"name": "Bo"}'],
    ['javascript', '[1, 2, 3]'],
    ['ts', '{ name: string }'],
    ['php', "['name' => 'Ann']"],
    ['ruby', '{ "name" => "Ann" }'],
    ['yaml', '{name: Ann}'],
    ['yaml', '[a, b]'],
    ['bash', '[[ -f out.json ]] && cat out.json'],
    ['toml', '[[servers]]'],
    ['lua', '{ name = "Ann" }'],
    ['graphql', '{ user { id } }'],
    ['jsx', '{items.map((item) => <li>{item}</li>)}'],
    ['ini', '[section]'],
    ['text', '{}'],
    ['sh', '[]'],
];
const NOT_JSON = [
    "{ name: 'Ann' }",
    "{'name': 'Ann'}",
    '{ a: "b" }',
    "['a', 'b']",
    '[[ -f out.json ]] && cat out.json',
    '[[servers]]',
    "[{'name': 'Ann'}]",
    '[{ name: 1 }]',
    '{ user { id } }',
    '[section]',
    '{items.map(f)}',
    '[ -f out.json ] && cat out.json',
    '{name: Ann}',
];
// a line of brackets alone, which may yet be JSON
const BRACKETS_ONLY = /(?:^|\n)[ \t]*[[{][[{ \t]*-?$/;

const { check, getFailures, rows, samples } = createKnownAnswers(run);
for (const value of values) {
    for (const json of [JSON.stringify(value), JSON.stringify(value, null, 2)]) {
        const places = [
            ['bare', json],
            ['after a preamble', 'Here it is:\n' + json],
            ['in a block', 'Here:\n' + F + 'json\n' + json + '\n' + F],
        ] as const;
        for (const [place, answer] of places) {
            const expected = {
                base: readValue(run.base, answer),
                branch: readValue(run.branch, answer),
            };
            const checkAfter = (kind: string, suffix: string, isStrict: boolean) => {
                for (let end = 1; end <= suffix.length; end++) {
                    const text = answer + suffix.slice(0, end);
                    const isLineOfBrackets =
                        !isStrict && end < suffix.length && BRACKETS_ONLY.test(text);
                    check(`${kind} (${place})`, text, (parse, version) => {
                        const reading = readValue(parse, text);
                        const isRight = reading === expected[version] || isLineOfBrackets;
                        return { isRight, reading };
                    });
                }
            };
            for (const [language, line] of CODE) {
                checkAfter(
                    'other language',
                    `\n\nIn ${language}:\n${F}${language}\n${line}\n${F}\nDone.`,
                    true,
                );
            }
            for (const line of NOT_JSON) {
                checkAfter('no language', `\n\nOr:\n${F}\n${line}\n${F}\nDone.`, false);
                checkAfter(
                    'after a closing fence',
                    `\n\nTo save it:\n${F}sh\nsave ann.json\n${F}\n${line}`,
                    false,
                );
                checkAfter(
                    'after a closing fence, more on the line',
                    `\n\nTo save it:\n${F}sh\nsave ann.json\n${F}\n${line} is what it stores.`,
                    false,
                );
            }
        }
    }
}

writeLines(path.join(dir, 'code-block-after.jsonl'), samples);
report(dir, {
    failures: getFailures(),
    name: 'code-block-after',
    notes: [`${values.length} values`],
    rows,
    title: 'A code block after the answer leaves the answer as it is, unless it is JSON',
});

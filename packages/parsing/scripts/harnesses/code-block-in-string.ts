// A code block inside one of the JSON’s own strings is part of the string. Each
// value that the test inputs read as is put in a json code block inside a string
// of another value (with raw line breaks, as a model that escapes nothing writes
// them), after prose with quoted words in it, bare and in a code block of its own.
// It is right where what is read is the outer value, and never the one in the
// string: whole (all of the outer value), and cut at every length from the
// fence in the string on (the outer value as far as the text goes).
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
const PROSE: Array<[string, string]> = [
    ['no quoted words', 'Here is the code:'],
    ['a quoted word', 'Say "hi" and then:'],
    ['a quoted number', 'Set "port" to "8080" and then:'],
    ['two quoted words', 'Use "a" or "b" here:'],
    ['an inches mark and a quoted word', 'For the 13" screen, set "size":'],
];
// the outer value as far as a cut text goes, which has its own first key
const isOuter = (reading: string) => reading.startsWith('{"zztitle":');

const { check, getFailures, rows, samples } = createKnownAnswers(run);
for (const value of values) {
    const json = JSON.stringify(value);
    for (const [kind, prose] of PROSE) {
        const places = [
            ['bare', '', ''],
            ['in a block', 'Here:\n' + F + 'json\n', '\n' + F],
        ] as const;
        for (const [place, head, tail] of places) {
            const start = `${head}{"zztitle": "Docs", "content": "${prose}\n${F}json\n`;
            const content = `${prose}\n${F}json\n${json}\n${F}\nThen restart.`;
            const text = `${start}${json}\n${F}\nThen restart.", "b": 2}${tail}`;
            // the whole text reads as all of the outer value
            const outer = JSON.stringify({ zztitle: 'Docs', content, b: 2 });
            for (let end = start.length + 1; end <= text.length; end++) {
                const cut = text.slice(0, end);
                check(`${kind} (${place})`, cut, (parse) => {
                    const reading = readValue(parse, cut);
                    const isRight =
                        end === text.length ? reading === outer : isOuter(reading);
                    return { isRight, reading };
                });
            }
        }
    }
}

writeLines(path.join(dir, 'code-block-in-string.jsonl'), samples);
report(dir, {
    failures: getFailures(),
    name: 'code-block-in-string',
    notes: [`${values.length} values`],
    rows,
    title: 'A code block in one of the JSON’s strings is part of the string',
});

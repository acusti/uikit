// A code block inside one of the JSON’s own strings is part of the string. Each
// value that the test inputs read as is put in a json code block inside a string
// of another value (with raw line breaks, as a model that escapes its quote marks
// but not its line breaks writes them; see below), after prose with quoted words
// in it, bare and in a code block of its own. It is right where what is read is
// the outer value, and never the one in the string: whole (all of the outer
// value), and cut at every length from the fence in the string on (the outer
// value as far as the text goes, all of it read).
//
// The block’s JSON, and the prose before it, are written as JSON has them in a
// string (their quote marks escaped, their line breaks raw). Rows named COST write
// both with their quote marks as they are: the first one that a colon follows (or
// an inches mark, which ends the string early) ends the string, so the outer
// value is not read. Both versions get them wrong, and only a change counts.
import path from 'node:path';

import {
    createKnownAnswers,
    getRunDir,
    getValues,
    isThrown,
    loadRun,
    read,
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
// (A copy of isPrefixOf in parse-as-json.test.ts, with isAwaitingValue always on.)
// Whether `partial` is `whole` as far as it had been written: equal to it everywhere
// but at its open end (the last value, and its last value, and so on down), where a
// string is a prefix of the whole one and an array or object holds the first of the
// whole one’s items or keys, in order, or a key with no value yet holds ''.
function isPrefixOf(partial: unknown, whole: unknown, isOpenEnd = true): boolean {
    if (typeof partial === 'string') {
        if (typeof whole !== 'string') return false;
        return isOpenEnd ? whole.startsWith(partial) : whole === partial;
    }
    if (partial == null || typeof partial !== 'object') return partial === whole;
    if (whole == null || typeof whole !== 'object') return false;
    if (Array.isArray(partial) !== Array.isArray(whole)) return false;
    const keys = Object.keys(partial);
    const wholeKeys = Object.keys(whole);
    if (keys.length > wholeKeys.length) return false;
    if (!isOpenEnd && keys.length < wholeKeys.length) return false;
    return keys.every((key, index) => {
        if (key !== wholeKeys[index]) return false;
        const isLast = isOpenEnd && index === keys.length - 1;
        const value = (partial as Record<string, unknown>)[key];
        if (isLast && value === '' && !Array.isArray(partial)) return true;
        return isPrefixOf(value, (whole as Record<string, unknown>)[key], isLast);
    });
}
// Whether a reading is the outer value as far as a cut text goes: all of the cut is
// read (none of it is left to the postscript), and every cut holds the outer
// value’s first key whole, so a reading with no key (`{}` is a prefix of any
// object) is a reading that lost it.
const isOuter = (reading: string, outer: unknown) => {
    if (isThrown(reading)) return false;
    const { postscript, value } = JSON.parse(reading) as {
        postscript: string;
        value: unknown;
    };
    return (
        postscript === '' &&
        value !== null &&
        typeof value === 'object' &&
        Object.keys(value).length > 0 &&
        isPrefixOf(value, outer)
    );
};
// a string as it is written inside the quote marks of another
const asStringContent = (text: string) => JSON.stringify(text).slice(1, -1);

const { check, getFailures, rows, samples } = createKnownAnswers(run);
for (const value of values) {
    const json = JSON.stringify(value);
    for (const [kind, prose] of PROSE) {
        const places = [
            ['bare', '', ''],
            ['in a block', 'Here:\n' + F + 'json\n', '\n' + F],
        ] as const;
        for (const [place, head, tail] of places) {
            // the string, and its JSON as it is written: with its quote marks escaped,
            // or (COST) as they are
            const content = `${prose}\n${F}json\n${json}\n${F}\nThen restart.`;
            const outer = { zztitle: 'Docs', content, b: 2 };
            for (const isEscaped of [true, false]) {
                const row = `${isEscaped ? '' : 'COST '}${kind} (${place})`;
                const written = isEscaped ? asStringContent : (text: string) => text;
                const start = `${head}{"zztitle": "Docs", "content": "${written(prose)}\n${F}json\n`;
                const text = `${start}${written(json)}\n${F}\nThen restart.", "b": 2}${tail}`;
                for (let end = start.length + 1; end <= text.length; end++) {
                    const cut = text.slice(0, end);
                    check(row, cut, (parse) => {
                        const reading = readValue(parse, cut);
                        const isRight =
                            end === text.length
                                ? reading === JSON.stringify(outer)
                                : isOuter(read(parse, cut), outer);
                        return { isRight, reading };
                    });
                }
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

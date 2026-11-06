// The ChatML tokens of a raw completion are left out of it. Each test input is
// written as a model in the Qwen family writes a raw completion: before
// `<|im_end|>` (with a line break after it or before it, or neither), with
// `<|im_start|>` and the role on its line before it, or with nothing; and
// between the start token alone and the end token alone. It is right where it
// reads as the text without the tokens does: whole, and cut at every length.
// Cut in the start token or the role, it reads as the empty text; cut after the
// text or in the whitespace around the end token, as the text with a line break
// after it, since the end token shows that it is whole. A few texts with a
// token in a string, the preamble or the postscript are read the same way, so a
// token anywhere else has to be kept. Rows named OPEN are cuts partway through
// a token, which is kept as text, so that they are wrong in base too, and only a
// change in them counts: they are right where the value is the whole text’s and
// the part of the token is in the reading, if it has a letter or digit in it (a
// preamble or postscript with none is left out, as the parser leaves it out of
// any text). An input that starts or ends with a token is left out (the tests
// have a few), since it would be read with two. So is a text after the start
// token alone whose first line, whole or as far as it goes, is one word in
// lowercase, which is read as the role (a cost). So is a cut partway through
// the end token after a text whose whole value is a string, number or literal
// in either version: such a value is read only where nothing follows it, so the
// cut has no value to compare with.
import path from 'node:path';

import {
    createKnownAnswers,
    getLastInputs,
    getRunDir,
    loadRun,
    read,
    readAllInputs,
    readValue,
    report,
    writeLines,
} from '../lib/common.ts';

const dir = getRunDir();
const run = await loadRun(dir);
const START = '<|im_start|>';
const END = '<|im_end|>';
const ROLE = 'assistant\n';
const WRAPPED_REGEXP = /^\s*<\|im_start\|>|<\|im_end\|>\s*$/;
// tokens that the text itself has, which are kept
const WITH_TOKENS = [
    '{"stop": ["<|im_end|>", "<|im_start|>"], "role": "assistant"}',
    '{"template": "<|im_start|>user\\n{{ content }}<|im_end|>\\n"}',
    '{"a": "b"}\nIt ends on <|im_end|>, as a Qwen model’s reply does.',
    'Here <|im_end|> is the JSON:\n{"a": "b"}',
];
const texts = [
    ...getLastInputs(readAllInputs(dir)).filter(
        (text) => text.trim() !== '' && !WRAPPED_REGEXP.test(text),
    ),
    ...WITH_TOKENS,
];
const ENDS = [END, END + '\n', '\n' + END];
const STARTS = [
    { endings: ENDS, label: '', start: '' },
    { endings: ENDS, label: 'start token and role, ', start: START + ROLE },
    // (the start token alone only with the end token alone, as in #480)
    { endings: [END], label: 'start token, ', start: START },
];
// a text whose first line, whole or as far as it goes, is one word in
// lowercase, which after the start token alone is read as the role (a cost)
const isTakenForRole = (text: string) => /^[a-z]+(?:\n|$)/.test(text);
const versions = [
    ['base', run.base],
    ['branch', run.branch],
] as const;

const { check, getFailures, rows, samples } = createKnownAnswers(run);
let scalarCuts = 0;
let roleLike = 0;
// the text is read as expected, so its preamble and postscript hold the tokens
// that the expected reading’s do, and no others
const checkReading = (row: string, text: string, expected: Map<string, string>) =>
    check(row, text, (parse, version) => {
        const reading = read(parse, text);
        return { isRight: reading === expected.get(version), reading };
    });
// a cut partway through a token: the whole text’s value, and the part of the
// token kept as text, if it has a letter or digit in it
const checkPart = (row: string, text: string, part: string, value: Map<string, string>) =>
    check(row, text, (parse, version) => {
        const reading = read(parse, text);
        const isRight =
            readValue(parse, text) === value.get(version) &&
            (!/\w/.test(part) || reading.includes(JSON.stringify(part).slice(1, -1)));
        return { isRight, reading };
    });
const readEach = (text: string) =>
    new Map(versions.map(([name, parse]) => [name, read(parse, text)]));
const empty = readEach('');
const emptyValue = new Map(versions.map(([name]) => [name, JSON.stringify(null)]));

// cut in the start token, at its end and in the role (the same for every text)
for (let end = 1; end <= START.length + ROLE.length; end++) {
    const text = (START + ROLE).slice(0, end);
    if (end < START.length) {
        checkPart('OPEN: cut in the start token', text, text, emptyValue);
    } else if (end === START.length) {
        checkReading('the start token alone', text, empty);
    } else {
        checkReading('cut in the role', text, empty);
    }
}

for (const text of texts) {
    const kind = WITH_TOKENS.includes(text) ? 'a text with a token, ' : '';
    // the text read whole as a whole text, and cut at each length
    const whole = readEach(text + '\n');
    const wholeValue = new Map(
        versions.map(([name, parse]) => [name, readValue(parse, text + '\n')]),
    );
    for (let end = 1; end <= text.length; end++) {
        const cut = text.slice(0, end);
        const expected = readEach(cut);
        checkReading(
            `${kind}cut in the text, after the start token and role`,
            START + ROLE + cut,
            expected,
        );
        if (isTakenForRole(cut)) roleLike++;
        else
            checkReading(
                `${kind}cut in the text, after the start token alone`,
                START + cut,
                expected,
            );
    }
    // a string, number or literal, which nothing can follow
    const isScalar = [...wholeValue.values()].some((value) =>
        /^(?:["\d-]|true|false)/.test(value),
    );
    for (const { endings, label, start } of STARTS) {
        // (one text left out for each length that the ending is cut at)
        if (start === START && isTakenForRole(text)) {
            roleLike += endings.reduce((sum, ending) => sum + ending.length, 0);
            continue;
        }
        for (const ending of endings) {
            const name = label + JSON.stringify(ending);
            for (let end = 1; end <= ending.length; end++) {
                const cut = start + text + ending.slice(0, end);
                const rest = ending.slice(0, end).trim();
                if (rest === '' || rest === END) {
                    checkReading(`${kind}cut at or after the end of ${name}`, cut, whole);
                } else if (isScalar) {
                    scalarCuts++;
                } else {
                    checkPart(
                        `OPEN: ${kind}cut in the end token of ${name}`,
                        cut,
                        rest,
                        wholeValue,
                    );
                }
            }
        }
    }
}

writeLines(path.join(dir, 'chatml-tokens.jsonl'), samples);
report(dir, {
    failures: getFailures(),
    name: 'chatml-tokens',
    notes: [
        `${texts.length} texts (${WITH_TOKENS.length} with a token in them)`,
        `${roleLike} texts left out (each a whole text or a cut of one): after the start token alone, a first line that is one word in lowercase, whole or as far as it goes (read as the role)`,
        `${scalarCuts} cuts in the end token left out: after a text whose whole value is a string, number or literal`,
    ],
    rows,
    title: 'A raw completion with ChatML tokens reads as the text without them',
});

// A thinking model’s reasoning is no part of the JSON, even where it has a draft
// of it. Each test input is written as the answer after reasoning: in a <think>
// block that the text starts with (on lines of their own, or on one line), with
// a blank line, a line break or nothing between the block and the answer, and
// after reasoning that ends with a </think> on a line of its own and has no
// <think> (the chat template wrote it into the prompt). The reasoning has a
// draft on a line of its own, one partway through a line, prose with brackets,
// another test input, a draft in a code block, or nothing. It is right where it
// reads as the input does, with the reasoning as written added to the front of
// its preamble: whole, and cut at every length of the input. Cut in a <think>
// block, it reads as null, with all of the text as its preamble (if it has a
// letter or digit in it). Rows that end in “as base reads it” have no known
// answer, and are right where they read as base reads them: reasoning with no
// <think> before its </think> has arrived, and a <think> block after the
// answer. An input with <|im_start|> in it is left out: a raw completion has
// its ChatML tokens around the reasoning, not in it.
import path from 'node:path';

import {
    createKnownAnswers,
    getLastInputs,
    getRunDir,
    loadRun,
    type Parse,
    read,
    readAllInputs,
    report,
    writeLines,
} from '../lib/common.ts';

const dir = getRunDir();
const run = await loadRun(dir);
const texts = getLastInputs(readAllInputs(dir))
    .map((text) => text.trimStart())
    .filter((text) => text.trim() !== '' && !/<\/?think>|<\|im_start\|>/.test(text));
const REASONINGS: Array<[string, (index: number) => string]> = [
    [
        'a draft on a line of its own',
        () => 'A first try:\n{"heading": "Hello"}\nToo plain.',
    ],
    [
        'a draft partway through a line',
        () => 'Maybe {"heading": "Hello"} would do, or ["a", "b"]. Too plain.',
    ],
    [
        'prose with brackets',
        () => 'The user wants {heading} and a list [1]. Keep it short.',
    ],
    [
        'another input',
        (index) => `A draft:\n${texts[(index + 1) % texts.length]}\nBetter.`,
    ],
    [
        'a draft in a code block',
        () => 'A first try:\n```json\n{"heading": "Hello"}\n```\nToo plain.',
    ],
    ['no reasoning', () => ''],
];
const SEPARATORS = ['\n\n', '\n', ''];

const { check, getFailures, rows, samples } = createKnownAnswers(run);

const checkReading = (row: string, text: string, expected: (parse: Parse) => string) =>
    check(row, text, (parse) => {
        const reading = read(parse, text);
        return { isRight: reading === expected(parse), reading };
    });
const asBase = (text: string) => {
    const reading = read(run.base, text);
    return () => reading;
};

// the answer read on its own, with the reasoning added to the front of its
// preamble
const afterReasoning = (parse: Parse, reasoning: string, answer: string) => {
    let reading;
    try {
        reading = parse(answer);
    } catch (error) {
        return 'THROWS: ' + String(error);
    }
    const { postscript, preamble, value } = reading;
    return JSON.stringify({
        postscript,
        preamble: (preamble ? reasoning + preamble : reasoning).trim(),
        value,
    });
};
const checkAfter = (row: string, front: string, answer: string) =>
    checkReading(row, front + answer, (parse) => afterReasoning(parse, front, answer));

for (let index = 0; index < texts.length; index++) {
    const text = texts[index];
    // whole, after each reasoning, block and separator
    for (const [label, getReasoning] of REASONINGS) {
        const reasoning = getReasoning(index);
        const fronts = SEPARATORS.map((separator) => [
            `a <think> block, ${label}, ${JSON.stringify(separator)}`,
            `<think>\n${reasoning}\n</think>${separator}`,
        ]);
        fronts.push([`no <think>, ${label}`, `${reasoning}\n</think>\n\n`]);
        if (!reasoning.includes('\n')) {
            fronts.push([
                `a <think> block on one line, ${label}`,
                `<think>${reasoning}</think>`,
            ]);
        }
        for (const [row, front] of fronts)
            checkAfter(`${row}, whole`, front, text + '\n');
    }

    // cut at every length of the input, after one reasoning and separator each
    const [label, getReasoning] = REASONINGS[index % REASONINGS.length];
    const reasoning = getReasoning(index);
    const separator = SEPARATORS[index % SEPARATORS.length];
    const fronts = [
        ['a <think> block', `<think>\n${reasoning}\n</think>${separator}`],
        ['no <think>', `${reasoning}\n</think>\n\n`],
    ];
    for (const [kind, front] of fronts) {
        for (let end = 1; end <= text.length; end++) {
            const answer = text.slice(0, end);
            checkAfter(`${kind}, ${label}, cut in the input`, front, answer);
        }
    }

    // a <think> block after the input, whole and cut in the block
    const after = '\n\n<think>\nHm, {"x": 1} and [2].\n</think>';
    for (let end = 1; end <= after.length; end++) {
        const cut = text + after.slice(0, end);
        checkReading(
            'a <think> block after the input, as base reads it',
            cut,
            asBase(cut),
        );
    }
}

// cut in the reasoning, which does not depend on the input
for (const [label, getReasoning] of REASONINGS) {
    const reasoning = getReasoning(0);
    const block = `<think>\n${reasoning}\n</think>`;
    for (let end = 1; end < block.length; end++) {
        const cut = block.slice(0, end);
        checkReading(`a <think> block, ${label}, cut in the block`, cut, () =>
            JSON.stringify({
                postscript: '',
                // (a preamble with no letter or digit is left out, as it is from any text)
                preamble: /\w/.test(cut) ? cut.trim() : '',
                value: null,
            }),
        );
    }
    const unopened = `${reasoning}\n</think>`;
    for (let end = 1; end < unopened.length; end++) {
        const cut = unopened.slice(0, end);
        checkReading(
            `no <think>, ${label}, cut before the </think>, as base reads it`,
            cut,
            asBase(cut),
        );
    }
}

writeLines(path.join(dir, 'thinking-reasoning.jsonl'), samples);
report(dir, {
    failures: getFailures(),
    name: 'thinking-reasoning',
    notes: [`${texts.length} inputs`],
    rows,
    title: 'The answer after a thinking model’s reasoning reads as it does alone',
});

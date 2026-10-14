// Times base against branch on long texts: ones with thousands of brackets and
// code fences before the JSON (the search for its start), ones that need a repair
// (the walk), and valid JSON for scale. The two versions take turns, each going
// first on every other run, so that neither a busy moment on the machine nor
// the order falls on one of them, and the best of --runs is shown. Run it with
// nothing else using the machine.
//
//   bun scripts/perf.ts [--base <ref>] [--branch <ref>] [--runs <n>] [--cases <file>]
//
// --cases names a module whose default export is more cases, as a list of
// [label, text] (for the shapes that a change is about).
import path from 'node:path';
import { parseArgs } from 'node:util';

import type { Parse } from './lib/common.ts';
import { prepareRun } from './lib/versions.ts';

const { values: options } = parseArgs({
    options: {
        base: { default: 'origin/main', type: 'string' },
        branch: { type: 'string' },
        cases: { type: 'string' },
        runs: { default: '7', type: 'string' },
    },
});

const F = '```';
const SECTION = (index: number) =>
    `{"category": "features", "variant": "variant-${index % 3}", "props": {"eyebrow": "Our Process", "heading": "From flour to loaf ${index}", "items": [{"heading": "Slow Fermentation", "isLive": true, "rating": 4.5}, {"heading": "Stone-Baked", "isLive": false, "rating": 3}]}, "note": "Every loaf is shaped by hand and baked the same morning."}`;
// a page of sections that is missing a comma after its first member, so that it
// goes through the walk
const page = (count: number) =>
    '{"title": "Our Story"\n"sections": [' +
    Array.from({ length: count }, (_, index) => SECTION(index)).join(', ') +
    ']}';
const indent = (text: string) => {
    // pretty-printed without being parsed: a line break and an indent after each
    // opening bracket and comma outside a string
    let out = '';
    let depth = 0;
    let isInString = false;
    for (let index = 0; index < text.length; index++) {
        const char = text[index];
        if (isInString) {
            out += char;
            if (char === '\\') out += text[++index];
            else if (char === '"') isInString = false;
        } else if (char === '"') {
            isInString = true;
            out += char;
        } else if (char === '{' || char === '[') {
            out += char + '\n' + '  '.repeat(++depth);
        } else if (char === '}' || char === ']') {
            out += '\n' + '  '.repeat(--depth) + char;
        } else if (char === ',') {
            out += ',\n' + '  '.repeat(depth);
            if (text[index + 1] === ' ') index++;
        } else {
            out += char;
        }
    }
    return out;
};
const members = (count: number, value: (index: number) => string) =>
    '{"start": "x"\n' +
    Array.from({ length: count }, (_, index) => `"key${index}": ${value(index)}`).join(
        ', ',
    ) +
    '}';

const CASES: Array<[string, string]> = [
    // the search for the start
    [
        '32,000 roots that cannot be read, then a code block',
        'Note:\n{ a: 1 }\n'.repeat(32_000) + F + 'json\n{"a": 1}\n' + F,
    ],
    [
        '16,000 roots not closed, each before a fence line',
        ('Note:\n{ a: 1\n' + F + '\n').repeat(16_000),
    ],
    ["16,000 times ['a' before a fence line", ("['a'\n" + F + '\n').repeat(16_000)],
    [
        '16,000 values, each before a json block with a root that cannot be read',
        ('{"y": 1}\n' + F + 'json\n{ a: 1 }\n' + F + '\nthen\n').repeat(16_000),
    ],
    [
        '16,000 roots not closed, each before a json block',
        ('{ a: 1\n' + F + 'json\n{"b": 2}\n' + F + '\n').repeat(16_000),
    ],
    [
        '16,000 roots, each with a block of shell in a string, then the answer',
        ('{ a: "q\n' + F + 'sh\nnpm i\n' + F + '\nthen" }\n').repeat(16_000) + '{"a": 1}',
    ],
    [
        '16,000 blocks of shell in one string of a root, then the answer',
        '{ a: "' +
            ('q\n' + F + 'sh\nnpm i\n' + F + '\n').repeat(16_000) +
            '" }\n{"a": 1}',
    ],
    [
        'a citation and a link, 32,000 times, then the answer',
        'As in [1], and [the docs](https://example.com).\n'.repeat(32_000) + '{"a": 1}',
    ],
    [
        '1.6 MB of JSON in a block after a preamble',
        'Here:\n' +
            F +
            'json\n' +
            JSON.stringify(
                {
                    items: Array.from({ length: 20_000 }, (_, index) => ({
                        id: index,
                        name: 'item ' + index,
                        tags: ['a', 'b'],
                    })),
                },
                null,
                1,
            ) +
            '\n' +
            F,
    ],
    // the walk
    ['a page of 400 sections, a comma missing', page(400)],
    ['the same, pretty-printed', indent(page(400))],
    ['a page of 2,000 sections, a comma missing', page(2_000)],
    [
        'one object of 5,000 string members, a comma missing',
        members(5_000, (index) => `"value ${index}"`),
    ],
    ['one object of 20,000 number members, a comma missing', members(20_000, String)],
    [
        'a string of 200 KB in an object with a comma missing',
        '{"a": "b"\n"c": "' + 'lorem ipsum '.repeat(17_000) + '", "d": 1}',
    ],
    // for scale
    [
        'valid JSON: a page of 400 sections',
        page(400).replace('"Our Story"\n', '"Our Story", '),
    ],
];

const extra = options.cases
    ? (
          (await import(path.resolve(options.cases))) as {
              default: Array<[string, string]>;
          }
      ).default
    : [];
const runs = Number(options.runs);
if (!Number.isInteger(runs) || runs < 1) {
    console.error(`--runs takes a whole number of 1 or more, not ${options.runs}`);
    process.exit(2);
}
const { dir, versions } = prepareRun({
    base: { label: 'base', ref: options.base },
    branch: { label: 'branch', ref: options.branch ?? null },
});
console.log(`base:   ${versions.base}\nbranch: ${versions.branch}\n`);
const parsers: Array<[string, Parse]> = [];
for (const label of ['base', 'branch']) {
    const module = (await import(path.join(dir, `${label}.ts`))) as {
        parseAsJSON: Parse;
    };
    parsers.push([label, module.parseAsJSON]);
}
// warm up
for (const [, parse] of parsers) {
    for (let index = 0; index < 50; index++) {
        parse(page(3));
        parse('As in [1]:\n' + F + 'json\n{"a": 1}\n' + F);
    }
}

const rows: Array<Record<string, string>> = [];
for (const [label, text] of [...CASES, ...extra]) {
    const best = parsers.map(() => Infinity);
    const isNull = parsers.map(() => false);
    for (let run = 0; run < runs; run++) {
        // each goes first on every other run
        const order = run % 2 ? [1, 0] : [0, 1];
        for (const index of order) {
            const [, parse] = parsers[index];
            const start = performance.now();
            isNull[index] = parse(text).value === null;
            best[index] = Math.min(best[index], performance.now() - start);
        }
    }
    const size =
        text.length >= 10_240
            ? `${Math.round(text.length / 1024)} KB`
            : `${text.length} chars`;
    const row: Record<string, string> = { text: `${label} (${size})` };
    parsers.forEach(([name], index) => {
        const ms = best[index];
        row[name] = `${ms.toFixed(ms < 10 ? 2 : 0)} ms${isNull[index] ? ' (null)' : ''}`;
    });
    rows.push(row);
}
console.table(rows);

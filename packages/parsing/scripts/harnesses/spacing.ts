// Spacing that JSON allows reads as JSON’s usual spacing does. Each value that the
// test inputs read as is written token by token, with a spacing in the slots
// between its tokens (before or after a colon or a comma, inside a bracket), and
// with or without one of the repairs that send a text to the walk. Its reference
// is the same tokens with JSON.stringify’s spacing: none, or its two-space indent
// for a spacing with line breaks.
//
// It is right where the text reads as its reference does in the same version
// (the postscript with its whitespace taken out), cut at the same token: bare at
// every length, after a preamble and in a code block that is not closed at some
// lengths, and before a postscript whole. A cut that ends in spacing is compared
// with the reference cut after its spacing, or with a space put in where it has
// none, since a space after a number says that it is whole.
//
// Rows named OPEN are the two repairs that look for a key’s colon right after its
// closing quote mark (a string left open before a line that starts with a key,
// and an object closed too early), where spacing comes before a colon. Both
// versions get them wrong, and only a change counts.
import path from 'node:path';

import {
    createKnownAnswers,
    createRandom,
    getRunDir,
    getValues,
    loadRun,
    type Parse,
    readAllInputs,
    report,
    writeLines,
} from '../lib/common.ts';

const dir = getRunDir();
const run = await loadRun(dir);
const values = getValues(run, readAllInputs(dir));
const random = createRandom(Number(process.env.SEED ?? 1234));
// a bare text up to this long is cut at every length, and any other at its first
// 20 lengths and at this many more, drawn at random
const MAX_ALL_CUTS = 1500;
const SAMPLE_CUTS = 20;

type Slot =
    | 'afterColon'
    | 'afterComma'
    | 'beforeColon'
    | 'beforeComma'
    | 'close'
    | 'open';
type Spacing = {
    // whether it has line breaks (its reference has JSON.stringify’s indent)
    isPretty: boolean;
    name: string;
    space: (slot: Slot, depth: number) => string;
};
// a token, or the spacing before the token numbered `token`
type Segment = { isSpace: boolean; text: string; token: number };

const indent = (depth: number, unit = '  ', lineBreak = '\n') =>
    lineBreak + unit.repeat(depth);

// spacing with line breaks: what JSON.stringify(value, null, 2) writes, but for
// what is given
const pretty =
    ({
        afterColon = ' ',
        afterComma,
        beforeColon = '',
        beforeComma,
        lineBreak = '\n',
        lineEnd = '',
        unit = '  ',
    }: {
        afterColon?: string;
        afterComma?: (depth: number) => string;
        beforeColon?: string;
        beforeComma?: (depth: number) => string;
        lineBreak?: string;
        lineEnd?: string;
        unit?: string;
    }) =>
    (slot: Slot, depth: number) => {
        switch (slot) {
            case 'open':
                return lineEnd + indent(depth + 1, unit, lineBreak);
            case 'close':
                return indent(depth, unit, lineBreak);
            case 'beforeColon':
                return beforeColon;
            case 'afterColon':
                return afterColon;
            case 'beforeComma':
                return beforeComma?.(depth) ?? '';
            case 'afterComma':
                return (
                    afterComma?.(depth) ?? lineEnd + indent(depth + 1, unit, lineBreak)
                );
        }
    };

const inline = (spaces: Partial<Record<Slot, string>>) => (slot: Slot) =>
    spaces[slot] ?? '';

const PRETTY: Spacing = { isPretty: true, name: 'pretty', space: pretty({}) };
const RANDOM_SPACES = ['', ' ', '  ', '\t', '\n', '\n  ', ' \n', '\r\n', ' \t', '\n\n'];
const SPACINGS: Array<Spacing> = [
    // around a comma
    {
        isPretty: false,
        name: 'a space before a comma',
        space: inline({ afterColon: ' ', afterComma: ' ', beforeComma: ' ' }),
    },
    {
        isPretty: false,
        name: 'two spaces after a comma',
        space: inline({ afterColon: ' ', afterComma: '  ' }),
    },
    {
        isPretty: false,
        name: 'a tab after a comma',
        space: inline({ afterColon: ' ', afterComma: '\t' }),
    },
    // around a colon
    {
        isPretty: false,
        name: 'a space before a colon',
        space: inline({ afterColon: ' ', afterComma: ' ', beforeColon: ' ' }),
    },
    {
        isPretty: false,
        name: 'two spaces before a colon',
        space: inline({ afterColon: ' ', afterComma: ' ', beforeColon: '  ' }),
    },
    {
        isPretty: false,
        name: 'a tab before a colon',
        space: inline({ afterColon: ' ', afterComma: ' ', beforeColon: '\t' }),
    },
    {
        isPretty: false,
        name: 'a tab after a colon',
        space: inline({ afterColon: '\t', afterComma: ' ' }),
    },
    // throughout
    {
        isPretty: false,
        name: 'spaces throughout',
        space: inline({
            afterColon: ' ',
            afterComma: ' ',
            beforeColon: ' ',
            beforeComma: ' ',
            close: ' ',
            open: ' ',
        }),
    },
    {
        isPretty: false,
        name: 'tabs throughout',
        space: inline({
            afterColon: '\t',
            afterComma: '\t',
            beforeColon: '\t',
            beforeComma: '\t',
            close: '\t',
            open: '\t',
        }),
    },
    // with line breaks
    {
        isPretty: true,
        name: 'indented, a space before a colon',
        space: pretty({ beforeColon: ' ' }),
    },
    {
        isPretty: true,
        name: 'indented, a tab after a colon',
        space: pretty({ afterColon: '\t' }),
    },
    {
        isPretty: true,
        name: 'indented, a space at the end of a line',
        space: pretty({ lineEnd: ' ' }),
    },
    {
        isPretty: true,
        name: 'indented, a space before a comma',
        space: pretty({ beforeComma: () => ' ' }),
    },
    {
        isPretty: true,
        name: 'indented, commas first',
        space: pretty({
            afterComma: () => ' ',
            beforeComma: (depth) => indent(depth + 1),
        }),
    },
    { isPretty: true, name: 'indented, CRLF', space: pretty({ lineBreak: '\r\n' }) },
    { isPretty: true, name: 'indented with tabs', space: pretty({ unit: '\t' }) },
    {
        isPretty: true,
        name: 'indented, blank lines',
        space: pretty({ afterComma: (depth) => '\n' + indent(depth + 1) }),
    },
    {
        isPretty: false,
        name: 'a mix, at random',
        space: () => RANDOM_SPACES[Math.floor(random() * RANDOM_SPACES.length)] ?? '',
    },
];

const REPAIRS = [
    'no repair',
    'trailing commas',
    'an unescaped quote mark in a string',
    'a raw line break in a string',
    'a string left open before a key',
    'an object closed too early',
] as const;
type Repair = (typeof REPAIRS)[number];
// the repairs that look for a key’s colon right after its closing quote mark
const KEY_REPAIRS: Array<Repair> = [
    'a string left open before a key',
    'an object closed too early',
];

const WRAPPERS = [
    { head: '', name: 'bare', tail: '' },
    { head: 'Here is the JSON:\n', name: 'after a preamble', tail: '' },
    { head: '```json\n', name: 'in a code block that is not closed', tail: '' },
    { head: '', name: 'before a postscript', tail: '\n\nLet me know if you need more.' },
];

// a string as it is written inside its quote marks
const escape = (text: string) => JSON.stringify(text).slice(1, -1);

// a string that is a value, with the repair made in one of three words or more:
// its middle word in quote marks that are not escaped, or a raw line break before it
function writeString(string: string, repair: Repair) {
    const words = string.split(' ');
    const middle = Math.floor(words.length / 2);
    if (words.length >= 3 && repair === 'an unescaped quote mark in a string') {
        const written = words.map((word, index) =>
            index === middle ? `"${escape(word)}"` : escape(word),
        );
        return `"${written.join(' ')}"`;
    }
    if (words.length >= 3 && repair === 'a raw line break in a string') {
        const before = escape(words.slice(0, middle).join(' '));
        return `"${before}\n${escape(words.slice(middle).join(' '))}"`;
    }
    return JSON.stringify(string);
}

// the value as tokens and the spacing between them, with the repair made
function write(value: unknown, spacing: Spacing, repair: Repair) {
    const segments: Array<Segment> = [];
    let token = 0;
    let hasSpaceBeforeColon = false;
    let isStringLeftOpen = false;
    const push = (text: string) =>
        segments.push({ isSpace: false, text, token: token++ });
    const space = (slot: Slot, depth: number, text = spacing.space(slot, depth)) => {
        if (!text) return;
        if (slot === 'beforeColon') hasSpaceBeforeColon = true;
        segments.push({ isSpace: true, text, token });
    };
    const writeNode = (node: unknown, depth: number) => {
        if (node === null || typeof node !== 'object') {
            push(
                typeof node === 'string'
                    ? writeString(node, repair)
                    : JSON.stringify(node),
            );
            return;
        }
        const isArray = Array.isArray(node);
        const entries: Array<[string | null, unknown]> = isArray
            ? node.map((item) => [null, item])
            : Object.entries(node);
        push(isArray ? '[' : '{');
        if (entries.length > 0) space('open', depth);
        let isCommaLeftOut = false;
        for (const [index, [key, item]] of entries.entries()) {
            if (index > 0 && !isCommaLeftOut) {
                space('beforeComma', depth);
                push(',');
                space('afterComma', depth);
            }
            isCommaLeftOut = false;
            if (key !== null) {
                push(JSON.stringify(key));
                space('beforeColon', depth);
                push(':');
                space('afterColon', depth);
            }
            if (
                repair === 'a string left open before a key' &&
                spacing.isPretty &&
                !isStringLeftOpen &&
                key !== null &&
                typeof item === 'string' &&
                index < entries.length - 1
            ) {
                // the first such string with its closing quote mark and the comma
                // after it left out, so that the next line starts with a key (with
                // no space before the line break, which would be in the string)
                isStringLeftOpen = true;
                isCommaLeftOut = true;
                push(JSON.stringify(item).slice(0, -1));
                space('open', depth, spacing.space('open', depth).replace(/^[ \t]+/, ''));
                continue;
            }
            writeNode(item, depth + 1);
            if (
                repair === 'an object closed too early' &&
                depth === 0 &&
                key !== null &&
                index === 0 &&
                entries.length > 1
            ) {
                push('}');
            }
        }
        if (repair === 'trailing commas' && entries.length > 0) {
            space('beforeComma', depth);
            push(',');
        }
        if (entries.length > 0) space('close', depth);
        push(isArray ? ']' : '}');
    };
    writeNode(value, 0);
    return { hasSpaceBeforeColon, segments };
}

const join = (segments: Array<Segment>) => segments.map(({ text }) => text).join('');

// The reference cut that matches a cut of the text at `length`: the reference up
// to the same token (and as far into it), or after the spacing before the next
// token if the cut ends in spacing (with a space put in where it has none).
function createCutter(segments: Array<Segment>, reference: Array<Segment>) {
    const tokenStarts = new Map<number, number>();
    const spaceEnds = new Map<number, number>();
    let offset = 0;
    for (const { isSpace, text, token } of reference) {
        if (!isSpace) tokenStarts.set(token, offset);
        offset += text.length;
        if (isSpace) spaceEnds.set(token, offset);
    }
    const referenceText = join(reference);
    return (length: number) => {
        let position = 0;
        for (const { isSpace, text, token } of segments) {
            const end = position + text.length;
            if (length <= end) {
                const into = length - position;
                if (!isSpace) {
                    return referenceText.slice(0, (tokenStarts.get(token) ?? 0) + into);
                }
                const spaceEnd = spaceEnds.get(token);
                if (spaceEnd !== undefined) return referenceText.slice(0, spaceEnd);
                return referenceText.slice(0, tokenStarts.get(token)) + ' ';
            }
            position = end;
        }
        return referenceText;
    };
}

// a reading as a string: value, preamble, and the postscript with its whitespace
// taken out (where the reference has none, the text may have some)
function readWith(parse: Parse, text: string, cache: Map<string, string>) {
    let reading = cache.get(text);
    if (reading === undefined) {
        try {
            const { postscript, preamble, value } = parse(text);
            reading = JSON.stringify([value, preamble, postscript.replace(/\s+/g, '')]);
        } catch (error) {
            reading = 'THROWS: ' + String(error);
        }
        cache.set(text, reading);
    }
    return reading;
}

const { check, getFailures, rows, samples } = createKnownAnswers(run);
for (const value of values) {
    for (const repair of REPAIRS) {
        // (a repair that the value has no place for, such as an unescaped quote
        // mark where no string has three words, writes the text with no repair,
        // whatever the spacing)
        if (
            repair !== 'no repair' &&
            join(write(value, PRETTY, repair).segments) ===
                join(write(value, PRETTY, 'no repair').segments)
        ) {
            continue;
        }
        // (each version’s readings by text, so that the spacings share their
        // references: none for those with no line break, the indent for the others)
        const caches = {
            base: new Map<string, string>(),
            branch: new Map<string, string>(),
        };
        for (const spacing of SPACINGS) {
            // (a string left open takes in the line break after it, and the indent
            // after that where a cut ends there, so it is skipped where those are
            // not its reference’s: with CRLF, or tabs)
            if (
                repair === 'a string left open before a key' &&
                (!spacing.isPretty ||
                    spacing.space('open', 0).replace(/^[ \t]+/, '') !==
                        PRETTY.space('open', 0))
            ) {
                continue;
            }
            const { hasSpaceBeforeColon, segments } = write(value, spacing, repair);
            const reference = spacing.isPretty
                ? write(value, PRETTY, repair).segments
                : segments.filter(({ isSpace }) => !isSpace);
            const body = join(segments);
            const referenceBody = join(reference);
            if (body === referenceBody) continue;
            const row =
                hasSpaceBeforeColon && KEY_REPAIRS.includes(repair)
                    ? `OPEN ${repair}, spacing before a colon`
                    : spacing.name;
            const cutReference = createCutter(segments, reference);
            for (const { head, name, tail } of WRAPPERS) {
                const lengths = new Set<number>([body.length]);
                if (tail) {
                    // whole only
                } else if (name === 'bare' && body.length <= MAX_ALL_CUTS) {
                    for (let length = 1; length < body.length; length++) {
                        lengths.add(length);
                    }
                } else {
                    for (let length = 1; length <= Math.min(body.length, 20); length++) {
                        lengths.add(length);
                    }
                    for (let index = 0; index < SAMPLE_CUTS; index++) {
                        lengths.add(1 + Math.floor(random() * body.length));
                    }
                }
                for (const length of [...lengths].sort((a, b) => a - b)) {
                    const isWhole = length === body.length;
                    const text = head + body.slice(0, length) + (isWhole ? tail : '');
                    const referenceText =
                        head + (isWhole ? referenceBody + tail : cutReference(length));
                    check(row, text, (parse, version) => {
                        const reading = readWith(parse, text, caches[version]);
                        const answer = readWith(parse, referenceText, caches[version]);
                        return { isRight: reading === answer, reading };
                    });
                }
            }
        }
    }
}

writeLines(path.join(dir, 'spacing.jsonl'), samples);
report(dir, {
    failures: getFailures(),
    name: 'spacing',
    notes: [`${values.length} values`],
    rows,
    title: 'Spacing that JSON allows reads as JSON’s usual spacing does',
});

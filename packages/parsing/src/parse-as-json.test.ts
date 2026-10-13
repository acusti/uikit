import { beforeAll, describe, expect, it } from 'vitest';

import {
    getPreviousStringType,
    parseAsJSON,
    parseUnfinishedJSON,
} from './parse-as-json.js';

// an unfinished page, up to where the props of its first section are open
const PAGE_STARTS = [
    {
        reading: 'closing',
        start: '{"sections":[{"props":{"heading":"Hi",',
        startProps: { heading: 'Hi' },
    },
    {
        reading: 'repairing',
        start: '{"sections":[{"props":{"heading":"Hi"\n"lede":"Yo",',
        startProps: { heading: 'Hi', lede: 'Yo' },
    },
];

// where a text stops on a key, if its innermost open structure is an object:
// inside the key, or between the key and its value (after it or after its colon)
const STOPS_IN_KEY_REGEXP = /[{,]\s*"(?:[^"\\]|\\.)*\\?$/;
const STOPS_AFTER_KEY_REGEXP = /[{,]\s*"(?:[^"\\]|\\.)*"\s*:?\s*$/;

describe('@acusti/parsing', () => {
    describe('getPreviousStringType', () => {
        it('returns KEY if the previous string token is an object key', () => {
            expect(getPreviousStringType('{"foo": "')).toBe('KEY');
        });

        it('returns VALUE if the previous string token is not an object key', () => {
            expect(getPreviousStringType('{"foo": "bar", "')).toBe('VALUE');
        });

        it('returns null if the previous token isn’t a string', () => {
            expect(getPreviousStringType('{"foo": 42, "')).toBe(null);
            expect(getPreviousStringType('{"foo": ["one", "two"]')).toBe(null);
        });

        it('goes by whichever ended later, a key or a value, each a string that another follows', () => {
            // a value ended later
            expect(getPreviousStringType('{"a":"b","c"')).toBe('VALUE');
            expect(getPreviousStringType('{"a":"b","c":"d","e"')).toBe('VALUE');
            // a key ended later, though a value ended before it
            expect(getPreviousStringType('{"a":"b","c":"d"')).toBe('KEY');
            expect(getPreviousStringType('{"a":"b","c","d":"e"')).toBe('KEY');
            // an array closed after both
            expect(getPreviousStringType('{"a":"b","c":["d"]')).toBe(null);
            expect(getPreviousStringType('{"a":["b","c"],"d"')).toBe(null);
            // an array closed before either
            expect(getPreviousStringType('{"a":["b"],"c":"d"')).toBe('KEY');
            expect(getPreviousStringType('{"a":["b"],"c":"d","e"')).toBe('VALUE');
            // more than one space between the two strings does not count
            expect(getPreviousStringType('{"a":  "b",  "c"')).toBe(null);
            expect(getPreviousStringType('{"a":"b",\n"c"')).toBe('KEY');
            // nor does an end at the very start of the text
            expect(getPreviousStringType('":"a')).toBe(null);
            expect(getPreviousStringType('x":"a')).toBe('KEY');
            expect(getPreviousStringType('","a')).toBe(null);
            expect(getPreviousStringType('x","a')).toBe('VALUE');
        });
    });

    // parseAsJSON’s readings can’t show whether closing a text or repairing it
    // read it, since both are held to the same readings, so these ask the closer
    describe('parseUnfinishedJSON', () => {
        it('reads every unfinished prefix of a page without the repairs', () => {
            const text = getPageStreamPieces().join('');
            const unclosed: Array<string> = [];
            for (let endIndex = 1; endIndex < text.length; endIndex++) {
                const prefix = text.slice(0, endIndex);
                const trimmedPrefix = prefix.trim();
                const value = parseUnfinishedJSON({
                    isEndDelimited: !prefix.endsWith(trimmedPrefix),
                    text: trimmedPrefix,
                });
                if (value === undefined) unclosed.push(prefix.slice(-60));
            }
            expect(unclosed).toEqual([]);
        });

        it('tells an escaped quote mark from one that closes a string', () => {
            expect(
                parseUnfinishedJSON({
                    isEndDelimited: false,
                    text: '{"quote": "the \\"best\\"", "a": "b',
                }),
            ).toEqual({ a: 'b', quote: 'the "best"' });
            // an even number of backslashes is escaped backslashes, which escape nothing
            expect(
                parseUnfinishedJSON({
                    isEndDelimited: false,
                    text: '["C:\\\\", "a \\\\\\"b\\\\\\\\", "c',
                }),
            ).toEqual(['C:\\', 'a \\"b\\\\', 'c']);
        });

        it('leaves a text that is whole, or that needs a repair, to parseAsJSON', () => {
            for (const text of [
                '{"a": "b"}',
                '{"a": "b"\n"c": "d',
                '{"a": "b"} and then {"c": "d',
                'Here it is: {"a": "b',
            ]) {
                expect(parseUnfinishedJSON({ isEndDelimited: false, text }), text).toBe(
                    undefined,
                );
            }
        });
    });

    describe('parseAsJSON', () => {
        it('returns value as null when input is empty', () => {
            // @ts-expect-error testing invalid input
            expect(parseAsJSON()).toEqual({ postscript: '', preamble: '', value: null });
            // @ts-expect-error testing invalid input
            expect(parseAsJSON(null)).toEqual({
                postscript: '',
                preamble: '',
                value: null,
            });
            expect(parseAsJSON('')).toEqual({
                postscript: '',
                preamble: '',
                value: null,
            });
        });
        it('converts a LLM response string to a JSON object', convertToJSONTestCase);
        it('handles nested JSON structures', nestedJSONTestCase);
        it('handles JSON with missing comma-separators', missingCommasTestCase);
        it('handles JSON with trailing comma-separators', trailingCommasTestCase);
        it(
            'strips invalid JSON when the LLM response goes off the rails',
            stripInvalidJSONTestCase,
        );
        it('handles too many closing curly braces', extraClosingCurliesTestCase);
        it(
            'handles unterminated string values and invalid object nesting',
            unterminatedStringsAndInvalidNestingTestCase,
        );
        it(
            'handles partial (streaming) LLM responses as they come in',
            partialResponsesTestCase,
        );
        it('detects and strips detailed pre- and post-amble text', preambleTestCase);
        it('starts the JSON at a bracket, never at a quote mark', quoteMarkStartTestCase);
        it('reads JSON that has comments in it', commentsTestCase);
        it(
            'returns the first value in the text, with what follows it as the postscript',
            restartsMidResponseTestCase,
        );
        it('leaves a markdown table as the text that it is', markdownTableTestCase);
        it('preserves escaped new lines within strings', preservesNewLinesTestCase);
        it('handles extraneous escape characters', extraneousEscapeCharactersTestCase);
        it('handles unescaped double quotes', unescapedDoubleQuotesTestCase);
        it(
            'handles fenced JSON with percent signs and nested arrays of objects',
            fencedJSONWithPercentSignsTestCase,
        );
        it(
            'handles fenced JSON variants including indentation and blank lines',
            fencedJSONVariantsTestCase,
        );
        it(
            'detects premature closing curly brace and ignores it',
            prematureClosingCurliesTestCase,
        );
        it(
            'detects an object key with a missing value and fills it in',
            missingValuesTestCase,
        );
        it('handles nested arrays without issue', nestedArraysTestCase);
        it('handles number values', numberValuesTestCase);
        it(
            'handles missing opening quotemarks for object keys',
            missingOpeningQuoteTestCase,
        );
        it(
            'cleanly dilineates between preamble and JSON results',
            extractPreambleTestCase,
        );
        it('reads an unfinished object from its opening brace, before its first key is whole', () => {
            // as it reads one with no whitespace after the brace
            expect(parseAsJSON('{"sections"').value).toEqual({ sections: '' });
            expect(parseAsJSON('{\n  "sections"')).toEqual({
                postscript: '',
                preamble: '',
                value: { sections: '' },
            });
            expect(parseAsJSON('{\n  "sec')).toEqual({
                postscript: '',
                preamble: '',
                value: {},
            });
            expect(parseAsJSON('{\n  "')).toEqual({
                postscript: '',
                preamble: '',
                value: {},
            });
            // and when what follows the key is not JSON, which is left to the repairs
            expect(parseAsJSON('{ "a b" x')).toEqual({
                postscript: 'x',
                preamble: '',
                value: { 'a b': '' },
            });
        });

        it('takes a brace for the start of the JSON only where it opens an object', () => {
            // a brace in the preamble is part of it, in prose or in code
            expect(parseAsJSON('Use {placeholders} like this: {"a": "b"}')).toEqual({
                postscript: '',
                preamble: 'Use {placeholders} like this:',
                value: { a: 'b' },
            });
            expect(
                parseAsJSON(
                    'Call it like so:\nfunction f() {\n  return 1;\n}\nand the config is {"a": "b"}',
                ),
            ).toEqual({
                postscript: '',
                preamble:
                    'Call it like so:\nfunction f() {\n  return 1;\n}\nand the config is',
                value: { a: 'b' },
            });
            // …as it is where no JSON follows it
            expect(parseAsJSON('Set {name} to your name.')).toEqual({
                postscript: '',
                preamble: 'Set {name} to your name.',
                value: null,
            });
            // a brace that another follows is not the start, but the other may be
            expect(parseAsJSON('{{"a": "b"}}')).toEqual({
                postscript: '',
                preamble: '',
                value: { a: 'b' },
            });
            // an object that is empty, or that the text has only just opened, starts
            // at its brace
            expect(parseAsJSON('{}\nand more')).toEqual({
                postscript: 'and more',
                preamble: '',
                value: {},
            });
            expect(parseAsJSON('Here it is:\n{\n  ')).toEqual({
                postscript: '',
                preamble: 'Here it is:',
                value: {},
            });
            // …and so does one whose first key is as far as the text has got, in the
            // middle of a line too, and partway through an escape sequence
            expect(parseAsJSON('The result is {"sec').value).toEqual({});
            expect(parseAsJSON('The result is {"C:\\').value).toEqual({});
            expect(parseAsJSON('The result is {"sections"').value).toEqual({
                sections: '',
            });
            // a quote mark after the brace has to open a key, which a string that a
            // line break and a bracket cut short is not
            expect(
                parseAsJSON('Here is the "Benefits{" page:\n{\n"name": "John"\n}'),
            ).toEqual({
                postscript: '',
                preamble: 'Here is the "Benefits{" page:',
                value: { name: 'John' },
            });
            expect(parseAsJSON('Here is the "Benefits{" page:\n{')).toEqual({
                postscript: '',
                preamble: 'Here is the "Benefits{" page:',
                value: {},
            });
            // (a key with a line break in it is one, and the line break is repaired)
            expect(
                parseAsJSON('Here it is:\n{"first\nname": "Ann",\n"age": "40"}').value,
            ).toEqual({ age: '40', 'first\nname': 'Ann' });
            // as does one whose first key has lost its opening quote mark, which is
            // restored where it follows a line break
            expect(parseAsJSON('{\nheading": "Hi",\n"sub": "Yo"\n}')).toEqual({
                postscript: '',
                preamble: '',
                value: { heading: 'Hi', sub: 'Yo' },
            });
        });

        it('takes a bracket for the start of the JSON by what follows it and where it stands', () => {
            // an array that opens on a number or a literal, at the start of the text
            // or after a colon
            expect(parseAsJSON('[1, 2]\nand more')).toEqual({
                postscript: 'and more',
                preamble: '',
                value: [1, 2],
            });
            expect(parseAsJSON('Here they are: [true, "a"]\nDone.')).toEqual({
                postscript: 'Done.',
                preamble: 'Here they are:',
                value: [true, 'a'],
            });
            expect(parseAsJSON('Here it is: [-1,').value).toEqual([-1]);
            // (a number that the text ends on is held back, as it is anywhere, and
            // so is a literal that it ends partway through)
            expect(parseAsJSON('Here are the sizes: [12').value).toEqual([]);
            expect(parseAsJSON('Here they are: [tr').value).toEqual([]);
            expect(parseAsJSON('Here they are: [fal').value).toEqual([]);
            expect(parseAsJSON('Here they are: [nu').value).toEqual([]);
            expect(parseAsJSON('Here they are: [true').value).toEqual([true]);
            // …and where a full stop ends the line after it
            expect(parseAsJSON('The sizes are: [1, 2].')).toEqual({
                postscript: '',
                preamble: 'The sizes are:',
                value: [1, 2],
            });
            // …or a line break of either kind
            expect(parseAsJSON('Here:\r\n[1, 2]\r\nDone.')).toEqual({
                postscript: 'Done.',
                preamble: 'Here:',
                value: [1, 2],
            });
            // …and one that a line break follows, whatever needs repairing in it
            expect(parseAsJSON('[\n  {"a": 1}\n  {"a": 2}\n]').value).toEqual([
                { a: 1 },
                { a: 2 },
            ]);
            expect(parseAsJSON('[\n  {"a": 1,},\n  {"a": 2,},\n]')).toEqual({
                postscript: '',
                preamble: '',
                value: [{ a: 1 }, { a: 2 }],
            });
            // an empty array or object, or one that the text ends on, at the start of
            // a line
            expect(parseAsJSON('Here are the tags:\n[')).toEqual({
                postscript: '',
                preamble: 'Here are the tags:',
                value: [],
            });
            expect(parseAsJSON('Here it is:\n  {}\nand that is all')).toEqual({
                postscript: 'and that is all',
                preamble: 'Here it is:',
                value: {},
            });
            expect(parseAsJSON('Here are the sizes:\n\t[1, 2]').value).toEqual([1, 2]);

            // none of those in the middle of a line of prose (a citation, a task
            // list, a link, an empty object written out), nor at the start of a
            // line or after a colon where the line goes on after it (a list of
            // references, a score), nor a bracket that no item follows
            const preambles = [
                'As in [1], the result is:',
                '- [ ] check this\n- [x] done',
                'See the [2024 report](https://example.com):',
                'Notes:\n[2024 report](https://example.com) has more. Here it is:',
                'It returns {} when there is nothing, or [] for a list. Here it is',
                'References\n[1] Smith 2020\n[2] Doe 2021',
                'Sources:\n[1]: https://example.com\nHere is the JSON:',
                'Score: [0.5] and the JSON',
                'Use this: {} or that:',
                '[ ] check this',
                // …and a brace that a string follows, unless it is a key
                'In Python, {"a", "b"} is a set. Here:',
                'I like {"quoted"} things.',
            ];
            for (const preamble of preambles) {
                expect(parseAsJSON(preamble + '\n{"a": "b"}'), preamble).toEqual({
                    postscript: '',
                    preamble,
                    value: { a: 'b' },
                });
            }
            // (a number is an item where a comma or a closing bracket follows it)
            expect(parseAsJSON('Notes:\n[2024 report]').value).toBe(null);
            // which leaves an array of numbers unread where a sentence runs on into
            // it, or on from it
            expect(parseAsJSON('The answer is [1, 2, 3].')).toEqual({
                postscript: '',
                preamble: 'The answer is [1, 2, 3].',
                value: null,
            });
            expect(parseAsJSON('[1, 2] and more')).toEqual({
                postscript: '',
                preamble: '[1, 2] and more',
                value: null,
            });
            // (a key after it is no exception, as it is after an object)
            expect(parseAsJSON('Here: [1, 2], "c": "d"').value).toBe(null);
            // an array that opens on a string, an object or an array is taken anywhere
            expect(parseAsJSON('The tags are ["a", "b"].').value).toEqual(['a', 'b']);
            // a text with no bracket in it and no word has no preamble either
            expect(parseAsJSON('``')).toEqual({
                postscript: '',
                preamble: '',
                value: null,
            });
        });

        it('reads nothing from inside an object or array that it cannot read', () => {
            const none = (preamble: string) => ({
                postscript: '',
                preamble,
                value: null,
            });
            const read = (preamble: string) => ({
                postscript: '',
                preamble,
                value: { a: 1 },
            });
            // a root that cannot be read is not read from one of its members: keys
            // with no quote marks or with single ones, or a stray character after
            // the bracket
            for (const text of [
                '{ a: "b", "c": {"d": 1} }',
                "{'a': 'b', 'c': {\"d\": 1}}",
                '{a": "b", "c": {"d": 1}}',
                '{,"a": "b", "c": {"d": 1}}',
                '{]"a": "b", "tags": ["x", "y"]}',
                '{]"a": "b,\n"tags": ["x", "y"]}',
                '{]"a": {"d": 1}, "tags": ["x", "y"]}',
                "['a', 'b', {\"d\": 1}]",
                '[, {"d": 1}]',
                // (a bracket in one of its strings does not close it, and a
                // comment after its bracket is not what it is known by)
                '{ a: "}", "c": {"d": 1} }',
                '{ // settings\n  a: "b",\n  "c": {"d": 1}\n}',
            ]) {
                expect(parseAsJSON(text), text).toEqual(none(text));
            }
            // …nor while it streams in
            for (const text of [
                '{ a: "b", "c": {"d": "e"',
                'Here you go:\n{ a: "b", "tags": ["x", "y"',
                'Result: { a: "b", "c": {"d": "e"',
                '{ a: "}", "c": {"d": "e',
                '{ a: "}",\n  "c": {"d": "e',
            ]) {
                expect(parseAsJSON(text), text).toEqual(none(text));
            }
            // …nor in a code block
            for (const text of [
                'Here you go:\n```json\n{ a: "b", "c": {"d": 1',
                'Here you go:\n```json\n{ a: "b", "c": {"d": 1} }\n```',
            ]) {
                expect(parseAsJSON(text).value, text).toBe(null);
            }
            // what follows it is still read: after its closing bracket…
            expect(parseAsJSON('Config: {debug: true} and the JSON:\n{"a": 1}')).toEqual(
                read('Config: {debug: true} and the JSON:'),
            );
            expect(parseAsJSON('{debug: true}.\n{"a": 1}')).toEqual(
                read('{debug: true}.'),
            );
            expect(
                parseAsJSON('{debug: true} then {"a": 1}\n```js\nx()\n```').value,
            ).toEqual({
                a: 1,
            });
            // (which a stray quote mark on its line does not hide, whatever
            // comes later in the text)
            expect(parseAsJSON('{Note: 5" wide}\n{"a": 1}')).toEqual(
                read('{Note: 5" wide}'),
            );
            for (const text of [
                'Size:\n{ w: 5" } so: {"a": 1}\n```\nls\n```',
                'Size:\n{ w: 5" } so: {"a": 1}\n```',
            ]) {
                expect(parseAsJSON(text).value, text).toEqual({ a: 1 });
            }
            // …and in a code block, whether it is closed or not
            for (const text of [
                '{ a: 1,\n```json\n{"foo": 1}\n```\n',
                '{ a: 1,\n```\n{"foo": 1}\n```\n',
                '{ a: 1,\n  ```json\n  {"foo": 1}\n  ```',
                '{ a: 1,\n```json\n{"foo": 1}\n```\n}',
            ]) {
                expect(parseAsJSON(text).value, text).toEqual({ foo: 1 });
            }
            // (each code block in turn: here the JSON is in the second)
            const twoBlocks = parseAsJSON(
                '{ a: 1,\n```\nx\n```\n{ b: 2,\n```json\n{"foo": 1}\n```\nThat is all of it, as asked.',
            );
            expect(twoBlocks.value).toEqual({ foo: 1 });
            expect(twoBlocks.postscript).toBe('That is all of it, as asked.');
            // (whatever its quote marks say: one with no pair (an inches mark,
            // say) does not hide the code block after it…)
            for (const text of [
                'Note:\n{ size: 5" wide\n```json\n{"foo": 1}\n```',
                'Spec:\n{\n  width: 5",\n  height: 3\n}\n```\n{"foo": 1}\n```',
                'Spec:\n{\n  screen: "a 13" laptop",\n  ports: 2\n}\nAs JSON:\n```json\n{"foo": 1}\n```',
                'You gave me:\n{\n  name: \'the 13" laptop\',\n  ports: 2\n}\nAs JSON:\n```json\n{"foo": 1}\n```',
            ]) {
                expect(parseAsJSON(text).value, text).toEqual({ foo: 1 });
            }
            // (…at the cost of a code block with JSON in it in what may be one
            // of its strings or comments, which is read too, also as it streams
            // in. Since the fences are not counted, that goes for JSON right
            // after the fence that closes a block of code there as well.)
            for (const [text, value] of [
                ['{ content: "see:\n```json\n{"foo": 1}\n```\n", b: 2 }', { foo: 1 }],
                ['{ content: "see:\n```json\n{"foo": "x', { foo: 'x' }],
                ['{\n  a: 1,\n  /* e.g.\n```\n[1, 2]\n```\n  */\n}\n{"real": 2}', [1, 2]],
                [
                    'Note:\n{ a: "q\n```sh\nnpm i\n```\n{"foo": 1} then",\n  b: {"c": 1}\n}\n{"real": 2}',
                    { foo: 1 },
                ],
            ] as const) {
                expect(parseAsJSON(text).value, text).toEqual(value);
            }
            // no other fence in one of its strings or comments ends it, so its
            // members after one are still not read: a block in another language
            // or one that does not start with JSON, the fence that closes one
            // where no JSON follows it, a block whose JSON cannot be read (which
            // has no value to give), and a line that starts with code written
            // in a line of prose
            for (const text of [
                'Note:\n{ a: "q\n```sh\nnpm i\n```\nthen",\n  b: {"c": 1}\n}\n{"real": 2}',
                'Note:\n{ a: "q\n```\nls\n```\nthen", b: {"c": 1} }\n{"real": 2}',
                'Note:\n{ doc: "Example:\n```json\n{ a: 1 }\n```\n", b: {"c": 1} }\n{"real": 2}',
                'Note:\n{ a: "Run\n```npm i``` first", b: {"c": 1} }\n{"real": 2}',
                'Note:\n{\n  a: 1,\n  /* e.g.\n```\nls\n```\n  */\n  b: {"c": 1}\n}\n{"real": 2}',
            ]) {
                expect(parseAsJSON(text).value, text).toEqual({ real: 2 });
            }
            for (const text of [
                'Note:\n{ content: "see:\n```\nls\n```\n", data: {"x": 1} }',
                'Note:\n{ doc: "Example:\n```json\n{ a: 1 }\n```\n", b: {"c": 1} }',
                // (nor does that block end it where a quote mark with no pair
                // comes before it, though what follows its closing fence does)
                'Note:\n{ size: 5" wide\n```json\n{ a: 1 }\n```',
            ]) {
                expect(parseAsJSON(text).value, text).toBe(null);
            }
            expect(
                parseAsJSON('Note:\n{ size: 5" wide\n```json\n{ a: 1 }\n```\n{"real": 2}')
                    .value,
            ).toEqual({ real: 2 });
            // (the next block with JSON in it is looked for again for a root
            // that comes after the last one found: here that one is in a string
            // of the value between the two roots, which is passed over)
            expect(
                parseAsJSON(
                    '{ a: 1 }\n{"y": "see:\n```json\n{"inner": 1}\n```\ndone"}\n```json\n{ b: 2 }\n```\n{"real": 2}',
                ).value,
            ).toEqual({ real: 2 });
            expect(parseAsJSON('{ a: 1,\n``b`` is code\n{"foo": 1}').value).toBe(null);
            // (a fence that is in none of them does, as far as it is not closed,
            // whatever the block holds)
            for (const text of [
                'Result: {status: ok\n```\nlog output\n```\nSo: {"foo": 1}',
                '{ a: 1,\n```js\n{"foo": 1}\n```',
                '{ a: 1,\n```json\n,{"foo": 1}\n```',
            ]) {
                expect(parseAsJSON(text).value, text).toEqual({ foo: 1 });
            }

            // any other bracket has nothing inside it, closed or not, so the JSON
            // after it or within it is read: a bracketed word or phrase…
            for (const preamble of [
                '[Aside] Here’s the result:',
                '[Sounds good:',
                '[draft',
                'Note: [draft',
                'See the [draft',
                'Note: [5" pipe]',
                '[Pipe size 5"]',
                '[He said "hi]:',
                'if (x)\n{ // say "hi\n  go();\n}',
                // (nor is anything but a bracket where the JSON starts)
                '5" pipe sizes:',
            ]) {
                expect(parseAsJSON(preamble + '\n{"a": 1}'), preamble).toEqual(
                    read(preamble),
                );
            }
            expect(parseAsJSON('[Sounds good:\n```json\n{"a": 1}\n```\n')).toEqual(
                read('[Sounds good:'),
            );
            // …one that is closed after the JSON, also as the text streams in…
            expect(parseAsJSON('[Here is the JSON: {"a": 1}]')).toEqual(
                read('[Here is the JSON:'),
            );
            expect(parseAsJSON('Answer: [Here you go\n{"a": 1}\nbye]')).toEqual({
                postscript: 'bye]',
                preamble: 'Answer: [Here you go',
                value: { a: 1 },
            });
            expect(parseAsJSON('Use { to start:\n{"a": 1}\nUse } to end')).toEqual({
                postscript: 'Use } to end',
                preamble: 'Use { to start:',
                value: { a: 1 },
            });
            expect(parseAsJSON('See the [draft\n{"a": 1}\nOK]').value).toEqual({ a: 1 });
            // …a root in the middle of a line, which is not known for one…
            expect(parseAsJSON("The dict is {'a': 'b', 'c': {\"a\": 1}}").value).toEqual({
                a: 1,
            });
            // …and a bracket that another follows
            expect(parseAsJSON('{{"a": 1,').value).toEqual({ a: 1 });
            expect(parseAsJSON('Here it is:\n{\n  {"a": 1}\n}').value).toEqual({ a: 1 });
        });

        it('gets through a long text with code blocks in it in good time', () => {
            const time = (text: string) => {
                const start = performance.now();
                parseAsJSON(text);
                return performance.now() - start;
            };
            // (each takes a few milliseconds when the time grows with the length
            // of the text, and several seconds when it grows with its square)
            // roots that cannot be read, each of them cut short by a code block
            expect(time('Note:\n{ a: 1\n```\n'.repeat(16_000))).toBeLessThan(1000);
            expect(time("['a'\n```\n".repeat(16_000))).toBeLessThan(1000);
            // …and many of them before the one code block in the text
            expect(
                time('Note:\n{ a: 1 }\n'.repeat(32_000) + '```json\n{"a": 1}\n```'),
            ).toBeLessThan(1000);
            // values, each of them followed by a code block whose JSON cannot be
            // read, with the value closed and not
            for (const value of ['{"y": 1}', '{"y": 1']) {
                const text = `${value}\n\`\`\`json\n{ a: 1 }\n\`\`\`\nthen\n`.repeat(
                    16_000,
                );
                expect(time(text), value).toBeLessThan(1000);
            }
        });

        it('reads the JSON in a code block, whatever comes before the block', () => {
            const fence = '```';
            // code with an object in it, and then the answer in a code block, with
            // a language after the fence or without
            const code = 'if (x)\n{\n  go({"y": 1});\n}';
            for (const text of [
                `${code}\n${fence}\n{"a": 1}\n${fence}`,
                `${code}\n${fence}json\n{"a": 1}\n${fence}\n`,
                `${code}\n  ${fence}json\n  {"a": 1}\n  ${fence}`,
            ]) {
                expect(parseAsJSON(text).value, text).toEqual({ a: 1 });
            }
            expect(
                parseAsJSON(`${code}\n${fence}json\n{"a": 1}\n${fence}\nDone.`),
            ).toEqual({
                postscript: 'Done.',
                preamble: code,
                value: { a: 1 },
            });
            // (the JSON languages, in any case, with spaces around them and with
            // more than a name after them)
            for (const language of [
                'jsonc',
                'json5',
                'jsonl',
                'JSON',
                ' json',
                'json  ',
                ' ',
                'json title="a.json"',
                'json-ld',
            ]) {
                expect(
                    parseAsJSON(`${code}\n${fence}${language}\n{"a": 1}\n${fence}`).value,
                    language,
                ).toEqual({ a: 1 });
            }
            // …and after the comments that the block starts with
            for (const text of [
                `${code}\n${fence}jsonc\n// the config\n{"a": 1}\n${fence}`,
                `${code}\n${fence}jsonc\n// e.g. {"x": 1}\n{"a": 1}\n${fence}`,
                `${code}\n${fence}jsonc\n/* the config */\n\n// in full\n{"a": 1}\n${fence}`,
                `${fence}jsonc\n// the config\n{"a": 1}\n${fence}\nOr minimal:\n${fence}json\n{}\n${fence}`,
                `Note:\n${fence}jsonc\n// not ${fence} this\n{"a": 1}\n${fence}\nOr:\n${fence}json\n{"b": 2}\n${fence}`,
            ]) {
                expect(parseAsJSON(text).value, text).toEqual({ a: 1 });
            }
            // …also while the block is not closed yet, as the text streams in
            expect(parseAsJSON(`${code}\n${fence}json\n{"a": 1,`).value).toEqual({
                a: 1,
            });
            expect(parseAsJSON(`${code}\n${fence}json\n{`).value).toEqual({});
            // (until there is JSON in the block, the first value in the text is it)
            expect(parseAsJSON(`${code}\n${fence}json\n`).value).toEqual({ y: 1 });
            // a whole value before the block gives way to the block as well
            expect(parseAsJSON(`{"x": 1}\n${fence}json\n{"foo": 1}\n${fence}`)).toEqual({
                postscript: '',
                preamble: '{"x": 1}',
                value: { foo: 1 },
            });
            expect(
                parseAsJSON(`Sizes: {"x": 1}\n${fence}\n[1, 2]\n${fence}`).value,
            ).toEqual([1, 2]);
            // …whatever follows that value on its line, and closed or not
            expect(
                parseAsJSON(`A {"y": 1} is 5" wide\n${fence}json\n{"a": 1}\n${fence}`)
                    .value,
            ).toEqual({ a: 1 });
            expect(
                parseAsJSON(`foo({"y": 1\n${fence}json\n{"a": 1}\n${fence}`).value,
            ).toEqual({
                a: 1,
            });
            // …and if the JSON in a block with a JSON language cannot be read, the
            // value is not what comes before the block, from its first key on as
            // the text streams in
            for (const text of [
                `Use {"y": 1} like so:\n${fence}json\n{ a: "b" }\n${fence}`,
                `Use {"y": 1} like so:\n${fence}json\n{ a: "b`,
                `Use {"y": 1} like so:\n${fence}json\n{ a`,
            ]) {
                expect(parseAsJSON(text).value, text).toBe(null);
            }
            // (what comes after that block is read as it would be without it)
            expect(
                parseAsJSON(`Here:\n${fence}json\n{ a: "b" }\n${fence}\nor just {"x": 1}`)
                    .value,
            ).toEqual({ x: 1 });
            expect(
                parseAsJSON(
                    `${fence}json\n{ a: "b" }\nor just {"x": 1}\n${fence}json\n{"a": 1}\n${fence}`,
                ).value,
            ).toEqual({ a: 1 });
            // …and whatever fences come before the block: they are not counted
            // to tell one that opens a block from one that closes one, so a
            // block that was never closed does not hide the one after it…
            for (const text of [
                `Use {"y": 1}:\n${fence}\nnote\n${fence}json\n{"a": 1}\n${fence}`,
                `Use {"y": 1}:\n${fence}\nnote\n\n${fence}\n{"a": 1}\n${fence}`,
                // …nor does a fence in a string of the value before it
                `{"note": "run:\n${fence}js\nfoo()\n${fence}"}\nSo:\n${fence}\n{"a": 1}\n${fence}`,
                `{"note": "see\n${fence}\nx"}\n${fence}\n{"a": 1}\n${fence}`,
                `Call go({"s": "a\n${fence}js"}) first:\n${fence}\n{"a": 1}\n${fence}`,
                // …or of a root after it that cannot be read
                `Use {"y": 1}:\n{ note: "see\n${fence}\nx" }\n${fence}\n{"a": 1}\n${fence}`,
            ]) {
                expect(parseAsJSON(text).value, text).toEqual({ a: 1 });
            }
            // of two blocks with JSON in them, the first is it, also where the
            // text starts with it
            for (const text of [
                `Either\n${fence}json\n{"a": 1}\n${fence}\nor\n${fence}json\n{"b": 2}\n${fence}`,
                `${fence}json\n{"a": 1}\n${fence}\nor\n${fence}json\n{"b": 2}\n${fence}`,
                `  ${fence}json\n  {"a": 1}\n  ${fence}\n  or\n  ${fence}json\n  {"b": 2}\n  ${fence}`,
            ]) {
                expect(parseAsJSON(text).value, text).toEqual({ a: 1 });
            }
            // a block of code, then one of JSON: the JSON is it
            expect(
                parseAsJSON(
                    `${fence}js\nconst y = {"z": 2};\n${fence}\nand\n${fence}\n{"a": 1}\n${fence}\nDone.`,
                ).value,
            ).toEqual({ a: 1 });
            // (also where the text starts with the block of code and ends with the
            // fence of the one with the JSON in it)
            expect(
                parseAsJSON(
                    `${fence}js\nconst y = {"z": 2};\n${fence}\n${fence}\n{"a": 1}\n${fence}`,
                ).value,
            ).toEqual({ a: 1 });
            // (a text that is one block and no more is read without its fences, so
            // a string that the block ends in does not run on into the fence)
            expect(
                parseAsJSON(`${fence}json\n{"heading": "News\n${fence}`).value,
            ).toEqual({
                heading: 'News',
            });
            // (…also where that string has a fence of its own in it)
            expect(
                parseAsJSON(`${fence}json\n{"heading": "see\n${fence}\nNews\n${fence}`)
                    .value,
            ).toEqual({
                heading: 'see\n```\nNews',
            });
            // a block in any other language is code, whatever it starts with, and
            // the value before it stands
            const answer = '{"name": "Ann"}';
            for (const [language, line] of [
                ['python', "{'name': 'Ann'}"],
                ['python', "['a', 'b']"],
                ['python', "[{'name': 'Ann'}]"],
                ['python', '{"name": "Bo"}'],
                ['js', "{ name: 'Ann' }"],
                ['js', "['a', 'b'].map(f)"],
                ['js', '["a", "b"].map(f)'],
                ['js', "[{ name: 'Ann' }]"],
                ['ts', '{ name: string }'],
                ['php', "['name' => 'Ann']"],
                ['ruby', '{ "name" => "Ann" }'],
                ['yaml', '{name: Ann}'],
                ['hjson', '{name: Ann}'],
                ['jsonnet', "{ name: 'Ann' }"],
                ['jsonpath', "['name']"],
                ['jsonata', "{ 'name': name }"],
                ['bash', '[[ -f out.json ]] && cat out.json'],
                ['toml', '[[servers]]'],
            ]) {
                const text = `${answer}\nIn ${language}:\n${fence}${language}\n${line}\n${fence}`;
                expect(parseAsJSON(text).value, text).toEqual({ name: 'Ann' });
            }
            // (a value in such a block gives way to a block of JSON like any
            // other, and is read where nothing comes before it)
            expect(
                parseAsJSON(
                    `${fence}python\n{"x": 1}\n${fence}\nSo:\n${fence}json\n{"a": 1}\n${fence}`,
                ).value,
            ).toEqual({ a: 1 });
            expect(parseAsJSON(`Here:\n${fence}js\n{"a": 1}\n${fence}`).value).toEqual({
                a: 1,
            });
            // after a fence with no language, which may be the one that closes a
            // block of code, only JSON that can be read is it: not a root that
            // cannot be read, nor brackets that open on anything but a value
            for (const line of [
                "{ name: 'Ann' }",
                "{'name': 'Ann'}",
                '{ a: "b" }',
                "['a', 'b']",
                '[[ -f out.json ]] && cat out.json',
                '[[servers]]',
                "[{'name': 'Ann'}]",
                '[{ name: 1 }]',
            ]) {
                for (const text of [
                    `${answer}\nOr:\n${fence}\n${line}\n${fence}`,
                    `${answer}\n\nTo save it:\n${fence}sh\nsave ann.json\n${fence}\n${line}`,
                    `${answer}\n\nTo save it:\n${fence}sh\nsave ann.json\n${fence}\n${line} is what it stores.`,
                ]) {
                    expect(parseAsJSON(text).value, text).toEqual({ name: 'Ann' });
                }
            }
            // (brackets that open on a value are, as far as the text goes)
            for (const [block, value] of [
                ['[[1, 2], [3]]', [[1, 2], [3]]],
                ['[{"a": 1}]', [{ a: 1 }]],
                ['[ /* all */ ["a"]]', [['a']]],
                ['[[', [[]]],
                ['[{', [{}]],
                ['[{"na', [{}]],
            ] as const) {
                expect(
                    parseAsJSON(`${answer}\nOr:\n${fence}\n${block}`).value,
                    block,
                ).toEqual(value);
            }
            // a block that does not start with JSON is not it…
            for (const language of ['js', 'json', '']) {
                expect(
                    parseAsJSON(
                        `{"x": 1}\n${fence}${language}\nconst y = {"z": 2};\n${fence}`,
                    ).value,
                    language,
                ).toEqual({ x: 1 });
            }
            // (JSON that follows the fence that closes that block is taken
            // for one in a block, since the fences are not counted)
            expect(
                parseAsJSON(`{"x": 1}\n${fence}js\nfoo()\n${fence}\n{"a": 2}`).value,
            ).toEqual({
                a: 2,
            });
            // …nor is a line that starts with code written in a line of prose
            expect(
                parseAsJSON(`Use {"y": 1}, as in\n${fence}go()${fence} here:\n{"a": 1}`)
                    .value,
            ).toEqual({ y: 1 });
            expect(
                parseAsJSON(`Use {"y": 1}, as in\n${fence}json${fence} here:\n{"a": 1}`)
                    .value,
            ).toEqual({ y: 1 });
            expect(
                parseAsJSON(
                    `${fence}go()${fence} runs it:\n{"y": 1}\n${fence}json\n{"a": 1}\n${fence}`,
                ).value,
            ).toEqual({ a: 1 });
            // …nor is a block in one of the JSON’s own strings, whether its line
            // breaks are escaped, as they should be…
            expect(
                parseAsJSON(
                    '{"content": "see:\\n```json\\n{\\"inner\\": 1}\\n```", "b": 2,}',
                ).value,
            ).toEqual({ b: 2, content: 'see:\n```json\n{"inner": 1}\n```' });
            // …or not (the string is misread, but it is the root that is read)
            for (const text of [
                `{"content": "Here is code:\n${fence}json\n{"inner": 1}\n${fence}\ndone", "b": 2}`,
                `{"content": "Here is code:\n${fence}json\n{"inner": 1`,
                `{"content": "Here is code:\n${fence}json\n[1, 2`,
                `Here:\n${fence}json\n{"content": "see:\n${fence}json\n{"inner": 1}\n${fence}\ndone", "b": 2}\n${fence}`,
                // (also after words in quote marks of their own, which go by
                // pairs like any others)
                `{"content": "say "hi" then:\n${fence}json\n{"inner": 1}\n${fence}\ndone", "b": 2}`,
                `{"content": "set "port" to "8080" then:\n${fence}json\n{"inner": 1}\n${fence}\ndone"}`,
                `{"content": "say "hi" then:\n${fence}json\n{"inner": 1`,
            ]) {
                expect(parseAsJSON(text).value, text).toHaveProperty('content');
            }
            // (nor after a bracket of the other kind, which does not close the
            // value for this)
            expect(
                parseAsJSON(
                    `{"a": [1, 2}], "content": "see:\n${fence}json\n{"inner": 1}\n${fence}\ndone"}`,
                ).value,
            ).toEqual({ a: [1, 2] });
        });

        it('reads a value that is whole as it is, whatever follows it', () => {
            // a postscript, after spacing that the repairs do not expect
            expect(parseAsJSON('{"a": "b" , "c": "d"}\n\nHope this helps!')).toEqual({
                postscript: 'Hope this helps!',
                preamble: '',
                value: { a: 'b', c: 'd' },
            });
            // the end of a code block that a preamble comes before
            expect(
                parseAsJSON(
                    'Here you go:\n```json\n{"a":\t"b",\t"c":\t"d"}\n```\nLet me know!',
                ),
            ).toEqual({
                postscript: 'Let me know!',
                preamble: 'Here you go:',
                value: { a: 'b', c: 'd' },
            });
            // another value, which is left in the postscript
            expect(parseAsJSON('["a" , "b"] and then ["c"]')).toEqual({
                postscript: 'and then ["c"]',
                preamble: '',
                value: ['a', 'b'],
            });
            // a bracket that closes nothing
            expect(parseAsJSON('{"a": "b" , "c": {"d": []}}}')).toEqual({
                postscript: '',
                preamble: '',
                value: { a: 'b', c: { d: [] } },
            });
            // a comma, which the postscript is given without
            expect(parseAsJSON('{"a": "b" , "c": "d"}, and more')).toEqual({
                postscript: 'and more',
                preamble: '',
                value: { a: 'b', c: 'd' },
            });
            // …and whatever brackets the strings in it hold
            expect(parseAsJSON('{"a": "b]}" , "c": "d"} done')).toEqual({
                postscript: 'done',
                preamble: '',
                value: { a: 'b]}', c: 'd' },
            });
            // but not a key after an object: it was closed too early, which is
            // repaired
            expect(parseAsJSON('{"a": "b"}, "c": "d"} done')).toEqual({
                postscript: 'done',
                preamble: '',
                value: { a: 'b', c: 'd' },
            });
            // (after an array a key is one more thing that follows it)
            expect(parseAsJSON('["a" , "b"], "c": "d"')).toEqual({
                postscript: '"c": "d"',
                preamble: '',
                value: ['a', 'b'],
            });
        });

        describe('with a text that is JSON as far as it goes', () => {
            it('reads it whatever its spacing', () => {
                // as it does a text that is whole
                expect(parseAsJSON('{"a": "b" , "c": "d"}').value).toEqual({
                    a: 'b',
                    c: 'd',
                });
                for (const text of [
                    '{"a": "b" , "c": "d',
                    '{"a":"b",  "c":"d',
                    '{"a":\t"b",\t"c":\t"d',
                    '{ "a" : "b" , "c" : "d',
                    '{\r\n  "a": "b",\r\n  "c": "d',
                ]) {
                    expect(parseAsJSON(text), text).toEqual({
                        postscript: '',
                        preamble: '',
                        value: { a: 'b', c: 'd' },
                    });
                }
            });

            it('reads an array at its root', () => {
                expect(parseAsJSON('[1, 2, 3').value).toEqual([1, 2]);
                expect(parseAsJSON('[true, fal').value).toEqual([true]);
                expect(parseAsJSON('[\n  "a",\n  "b').value).toEqual(['a', 'b']);
                expect(parseAsJSON('["C:\\\\", "x').value).toEqual(['C:\\', 'x']);
                expect(parseAsJSON('[\n  {"a": true},\n  {"a": fal')).toEqual({
                    postscript: '',
                    preamble: '',
                    value: [{ a: true }, {}],
                });
            });

            it('reads it after a preamble, or after the opening of a code block', () => {
                expect(parseAsJSON('Here it is:\n{"a": "b" , "c": "d')).toEqual({
                    postscript: '',
                    preamble: 'Here it is:',
                    value: { a: 'b', c: 'd' },
                });
                expect(parseAsJSON('```json\n{"a": "b" , "c": "d')).toEqual({
                    postscript: '',
                    preamble: '',
                    value: { a: 'b', c: 'd' },
                });
            });

            it('reads a key that holds an escaped quote mark', () => {
                expect(parseAsJSON('{"a \\"b\\""').value).toEqual({ 'a "b"': '' });
                expect(parseAsJSON('{"a \\"b\\"": "c').value).toEqual({ 'a "b"': 'c' });
                expect(parseAsJSON('{"a": "b", "c \\"d').value).toEqual({ a: 'b' });
            });

            it('leaves a text that is not to the repairs', () => {
                // a comma is missing, which closing the text does not add
                expect(parseAsJSON('{"a": "b"\n"c": "d').value).toEqual({
                    a: 'b',
                    c: 'd',
                });
                // the object is closed, and more follows it
                expect(parseAsJSON('{"a": "b"} and then {"c": "d')).toEqual({
                    postscript: 'and then {"c": "d',
                    preamble: '',
                    value: { a: 'b' },
                });
                // what the text ends partway through is not the start of a member
                expect(parseAsJSON('{"a": "b", "c\n{').value).toEqual({ a: 'b', c: {} });
                expect(parseAsJSON('{"a": ["b", x tr')).toEqual({
                    postscript: ', x tr',
                    preamble: '',
                    value: { a: ['b'] },
                });
            });
        });

        // Each of these is read twice: by closing a text that is JSON as far as it
        // goes, and by repairing one that is not (it is missing a comma near its
        // start). Past that comma, both have to read the same text alike.
        describe.each(PAGE_STARTS)(
            'with an unfinished text, read by $reading it',
            ({ start, startProps }) => {
                const readTo = (props: Record<string, unknown>) =>
                    readPage({ ...startProps, ...props });

                it('reads on past a number that follows a string value', () => {
                    expect(parseAsJSON(start + '"rating":5,"description":"Go')).toEqual(
                        readTo({ description: 'Go', rating: 5 }),
                    );
                    expect(
                        parseAsJSON(
                            start +
                                '"items":[{"heading":"One","rating":5},{"heading":"Tw',
                        ),
                    ).toEqual(
                        readTo({
                            items: [{ heading: 'One', rating: 5 }, { heading: 'Tw' }],
                        }),
                    );
                });

                it('reads on past an object that holds no string and follows a string value', () => {
                    expect(
                        parseAsJSON(start + '"layout":{"columns":3},"description":"Go'),
                    ).toEqual(readTo({ description: 'Go', layout: { columns: 3 } }));
                    expect(parseAsJSON(start + '"layout":{},"description":"Go')).toEqual(
                        readTo({ description: 'Go', layout: {} }),
                    );
                });

                it('leaves out a key that the text ends partway through', () => {
                    expect(parseAsJSON(start + '"descr')).toEqual(readTo({}));
                    expect(parseAsJSON(start + '"')).toEqual(readTo({}));
                    expect(parseAsJSON(start + '"a \\"quoted\\" ke')).toEqual(readTo({}));
                    // one that ends on a backslash, the start of an escape sequence
                    expect(parseAsJSON(start + '"ke\\')).toEqual(readTo({}));
                    expect(parseAsJSON(start + '"ke\\u00')).toEqual(readTo({}));
                    // as its object’s first key, which no comma precedes
                    expect(parseAsJSON(start + '"buttonLink":{"ena')).toEqual(
                        readTo({ buttonLink: {} }),
                    );
                    // a key that spells an earlier one, as far as it goes, leaves that one be
                    expect(
                        parseAsJSON(
                            start +
                                '"button":"Book","buttonLink":{"enabled":true},"button',
                        ),
                    ).toEqual(readTo({ button: 'Book', buttonLink: { enabled: true } }));
                    // once the key is whole, it holds '' until its value starts
                    expect(parseAsJSON(start + '"description"')).toEqual(
                        readTo({ description: '' }),
                    );
                    expect(parseAsJSON(start + '"description":')).toEqual(
                        readTo({ description: '' }),
                    );
                    // a string that is a value, or an item in an array, is read as far as it goes
                    expect(parseAsJSON(start + '"description":"Go')).toEqual(
                        readTo({ description: 'Go' }),
                    );
                    expect(parseAsJSON(start + '"tags":["a","b')).toEqual(
                        readTo({ tags: ['a', 'b'] }),
                    );
                });

                it('tells a key with no value yet from a string that holds an escaped quote mark', () => {
                    // a value that, once closed, has a comma and then a quote mark in it
                    expect(parseAsJSON(start + '"quote":"Honestly, \\"the best')).toEqual(
                        readTo({ quote: 'Honestly, "the best' }),
                    );
                    expect(
                        parseAsJSON(
                            start + '"quote":"Honestly, \\"the best\\" in town, \\"and',
                        ),
                    ).toEqual(readTo({ quote: 'Honestly, "the best" in town, "and' }));
                    // a key that holds one, which is whole and has no value yet
                    expect(parseAsJSON(start + '"q\\"k"')).toEqual(readTo({ 'q"k': '' }));
                    expect(parseAsJSON(start + '"q\\"k":')).toEqual(
                        readTo({ 'q"k': '' }),
                    );
                });

                it('drops an escape sequence that the text ends partway through', () => {
                    expect(
                        parseAsJSON(start + '"description":"Private Dining\\'),
                    ).toEqual(readTo({ description: 'Private Dining' }));
                    expect(
                        parseAsJSON(start + '"description":"Private Dining\\nfor'),
                    ).toEqual(readTo({ description: 'Private Dining\nfor' }));
                    for (const escape of ['\\u', '\\u0', '\\u00', '\\u00e']) {
                        expect(
                            parseAsJSON(start + '"description":"Caf' + escape),
                            escape,
                        ).toEqual(readTo({ description: 'Caf' }));
                    }
                    expect(parseAsJSON(start + '"description":"Caf\\u00e9')).toEqual(
                        readTo({ description: 'Café' }),
                    );
                    // a whole escape of the backslash itself
                    expect(parseAsJSON(start + '"path":"C:\\\\')).toEqual(
                        readTo({ path: 'C:\\' }),
                    );
                });

                it('reads a string that ends in an escaped backslash', () => {
                    expect(parseAsJSON(start + '"path":"C:\\\\","name":"x')).toEqual(
                        readTo({ name: 'x', path: 'C:\\' }),
                    );
                    expect(parseAsJSON(start + '"path": "C:\\\\", "name": "x')).toEqual(
                        readTo({ name: 'x', path: 'C:\\' }),
                    );
                    // as a key, and as an item in an array
                    expect(
                        parseAsJSON(
                            start + '"C:\\\\":"a","paths":["C:\\\\","D:\\\\"],"b":"c',
                        ),
                    ).toEqual(readTo({ b: 'c', 'C:\\': 'a', paths: ['C:\\', 'D:\\'] }));
                    // where it is the last thing in its object, and in the text
                    expect(
                        parseAsJSON(start + '"link":{"path":"C:\\\\"},"b":"c'),
                    ).toEqual(readTo({ b: 'c', link: { path: 'C:\\' } }));
                    expect(parseAsJSON(start + '"path":"C:\\\\"')).toEqual(
                        readTo({ path: 'C:\\' }),
                    );
                    // a quote mark is escaped only by an odd number of backslashes
                    expect(
                        parseAsJSON(start + '"a":"b\\\\\\"c","d":"e\\\\\\\\","f":"g'),
                    ).toEqual(readTo({ a: 'b\\"c', d: 'e\\\\', f: 'g' }));
                });

                it('reads on past true, false and null', () => {
                    expect(
                        parseAsJSON(
                            start +
                                '"buttonLink":{"enabled":true,"type":"internal","value":"#a',
                        ),
                    ).toEqual(
                        readTo({
                            buttonLink: { enabled: true, type: 'internal', value: '#a' },
                        }),
                    );
                    expect(
                        parseAsJSON(
                            start +
                                '"background":{"type":"image","image":null,"alt":"A ta',
                        ),
                    ).toEqual(
                        readTo({
                            background: { alt: 'A ta', image: null, type: 'image' },
                        }),
                    );
                    expect(
                        parseAsJSON(start + '"isFeatured":false,"description":"Go'),
                    ).toEqual(readTo({ description: 'Go', isFeatured: false }));
                });

                it('reads on past a literal that is the last value in its object', () => {
                    expect(
                        parseAsJSON(
                            start +
                                '"buttonLink":{"type":"internal","enabled":true},"background":{"type":"image","image":null,"alt":"A ta',
                        ),
                    ).toEqual(
                        readTo({
                            background: { alt: 'A ta', image: null, type: 'image' },
                            buttonLink: { enabled: true, type: 'internal' },
                        }),
                    );
                    expect(
                        parseAsJSON(start + '"media":{"image":null},"description":"Go'),
                    ).toEqual(readTo({ description: 'Go', media: { image: null } }));
                });

                it('keeps true, false or null when the text ends on it', () => {
                    expect(parseAsJSON(start + '"buttonLink":{"enabled":true')).toEqual(
                        readTo({ buttonLink: { enabled: true } }),
                    );
                    expect(parseAsJSON(start + '"isFeatured":false')).toEqual(
                        readTo({ isFeatured: false }),
                    );
                    expect(parseAsJSON(start + '"image":null')).toEqual(
                        readTo({ image: null }),
                    );
                });

                it('reads negative, decimal and exponent numbers as their values', () => {
                    expect(
                        parseAsJSON(
                            start +
                                '"offset":-12,"ratio":0.25,"scale":1.5e3,"delta":-2E-2,"count":0,"description":"Go',
                        ),
                    ).toEqual(
                        readTo({
                            count: 0,
                            delta: -0.02,
                            description: 'Go',
                            offset: -12,
                            ratio: 0.25,
                            scale: 1500,
                        }),
                    );
                });

                it('drops a key whose literal the text ends partway through', () => {
                    for (const literal of ['true', 'false', 'null', '-12.5e+3']) {
                        for (let end = 1; end < literal.length; end++) {
                            const text =
                                start +
                                '"buttonLink":{"type":"internal","enabled":' +
                                literal.slice(0, end);
                            expect(parseAsJSON(text), text).toEqual(
                                readTo({ buttonLink: { type: 'internal' } }),
                            );
                        }
                    }
                    // as its object’s first key, which no comma precedes
                    expect(parseAsJSON(start + '"buttonLink":{"enabled":tr')).toEqual(
                        readTo({ buttonLink: {} }),
                    );
                    expect(parseAsJSON(start + '"image": nul')).toEqual(readTo({}));
                });

                it('holds a number back until the text shows where it ends', () => {
                    // 4 so far, which 4.5 and 45 also start with
                    expect(parseAsJSON(start + '"rating":4')).toEqual(readTo({}));
                    expect(parseAsJSON(start + '"rating":4.')).toEqual(readTo({}));
                    expect(parseAsJSON(start + '"rating":4.5')).toEqual(readTo({}));
                    expect(parseAsJSON(start + '"rating":4.5,')).toEqual(
                        readTo({ rating: 4.5 }),
                    );
                    expect(parseAsJSON(start + '"rating":4.5}')).toEqual(
                        readTo({ rating: 4.5 }),
                    );
                    // whitespace, a control token, or the end of a code block shows it too
                    expect(parseAsJSON(start + '"rating":4.5\n')).toEqual(
                        readTo({ rating: 4.5 }),
                    );
                    expect(parseAsJSON(start + '"rating":4.5<|im_end|>')).toEqual(
                        readTo({ rating: 4.5 }),
                    );
                    expect(
                        parseAsJSON('```json\n' + start + '"rating":4.5\n```'),
                    ).toEqual(readTo({ rating: 4.5 }));
                });

                it('reads literals as array items', () => {
                    expect(
                        parseAsJSON(
                            start +
                                '"flags":[true,false,null,0,-2.5e3],"description":"Go',
                        ),
                    ).toEqual(
                        readTo({
                            description: 'Go',
                            flags: [true, false, null, 0, -2500],
                        }),
                    );
                    expect(parseAsJSON(start + '"flags":[true, false, null')).toEqual(
                        readTo({ flags: [true, false, null] }),
                    );
                    expect(parseAsJSON(start + '"flags":[true,')).toEqual(
                        readTo({ flags: [true] }),
                    );
                });

                it('reads a literal that follows a string in an array', () => {
                    expect(
                        parseAsJSON(
                            start +
                                '"tags":["a",true,"b",1,"c",null,"d"],"description":"Go',
                        ),
                    ).toEqual(
                        readTo({
                            description: 'Go',
                            tags: ['a', true, 'b', 1, 'c', null, 'd'],
                        }),
                    );
                    expect(
                        parseAsJSON(
                            start + '"tags": ["a", -2.5e3, "b", false ], "c": "d',
                        ),
                    ).toEqual(readTo({ c: 'd', tags: ['a', -2500, 'b', false] }));
                    // as it reads an object or an array that follows one
                    expect(
                        parseAsJSON(
                            start + '"tags":["a",{"b":null},"c",["d",1],"e"],"f":"g',
                        ),
                    ).toEqual(
                        readTo({ f: 'g', tags: ['a', { b: null }, 'c', ['d', 1], 'e'] }),
                    );
                });

                it('drops an array item the text ends partway through', () => {
                    expect(parseAsJSON(start + '"flags":[true, false, nu')).toEqual(
                        readTo({ flags: [true, false] }),
                    );
                    expect(parseAsJSON(start + '"flags":[tr')).toEqual(
                        readTo({ flags: [] }),
                    );
                    expect(parseAsJSON(start + '"sizes":[1, 2, 3')).toEqual(
                        readTo({ sizes: [1, 2] }),
                    );
                    expect(parseAsJSON(start + '"sizes":[-')).toEqual(
                        readTo({ sizes: [] }),
                    );
                });

                it('reads literals inside a nested array of objects', () => {
                    expect(
                        parseAsJSON(
                            start +
                                '"items":[{"heading":"One","rating":5,"isNew":true,"image":null},{"heading":"Two","rating":4.5,"isNew":fal',
                        ),
                    ).toEqual(
                        readTo({
                            items: [
                                { heading: 'One', image: null, isNew: true, rating: 5 },
                                { heading: 'Two', rating: 4.5 },
                            ],
                        }),
                    );
                });

                it('leaves a string that holds the words true, false or null as it is', () => {
                    expect(
                        parseAsJSON(
                            start +
                                '"answer":"true","note":"false, or null: it depends","count":"12","description":"null and void, tru',
                        ),
                    ).toEqual(
                        readTo({
                            answer: 'true',
                            count: '12',
                            description: 'null and void, tru',
                            note: 'false, or null: it depends',
                        }),
                    );
                });
            },
        );

        describe('with bare literals', () => {
            it('reads literals on lines of their own', () => {
                const text = `\
{
  "sections": [
    {
      "props": {
        "heading": "Hi",
        "buttonLink": {
          "enabled": true,
          "type": "internal"
        },
        "rating": 4.5,
        "flags": [
          true,
          null
        ],
        "background": {
          "image": null,
          "alt": "A ta`;
                const page = readPage({
                    background: { alt: 'A ta', image: null },
                    buttonLink: { enabled: true, type: 'internal' },
                    flags: [true, null],
                    heading: 'Hi',
                    rating: 4.5,
                });
                expect(parseAsJSON(text)).toEqual(page);
                // with no indentation, where a literal is the first thing on a line
                const flushText = text.replace(/^ +/gm, '');
                expect(parseAsJSON(flushText)).toEqual(page);
                // and with a comma missing, which leaves each to the repairs
                expect(parseAsJSON(text.replace('"Hi",', '"Hi"'))).toEqual(page);
                expect(parseAsJSON(flushText.replace('"Hi",', '"Hi"'))).toEqual(page);
                expect(parseAsJSON('{\n"flags": [\ntrue,\nfal').value).toEqual({
                    flags: [true],
                });
                expect(parseAsJSON('{\n"a": "b"\n"flags": [\ntrue,\nfal').value).toEqual({
                    a: 'b',
                    flags: [true],
                });
            });

            it('reads literals in text that was never valid JSON', () => {
                // with a postscript
                expect(
                    parseAsJSON('{"enabled": true, "label": "Go"}\n\nHope this helps!'),
                ).toEqual({
                    postscript: 'Hope this helps!',
                    preamble: '',
                    value: { enabled: true, label: 'Go' },
                });
                // with commas missing after them
                expect(
                    parseAsJSON(`\
Here is the button:
{
"enabled": true
"label": "Go"
"rating": 5
"image": null
}`),
                ).toEqual({
                    postscript: '',
                    preamble: 'Here is the button:',
                    value: { enabled: true, image: null, label: 'Go', rating: 5 },
                });
                // with the opening quote of the next key missing after one
                expect(parseAsJSON('{"enabled": true\nlabel": "Go"}')).toEqual({
                    postscript: '',
                    preamble: '',
                    value: { enabled: true, label: 'Go' },
                });
            });

            it('reads a literal only where a value is due', () => {
                // a postscript that starts with a number, or with a word that spells one
                expect(
                    parseAsJSON(
                        '{"heading": "News"}\n\n3 things to note about this page',
                    ),
                ).toEqual({
                    postscript: '3 things to note about this page',
                    preamble: '',
                    value: { heading: 'News' },
                });
                expect(parseAsJSON('{"heading": "News"} null and void')).toEqual({
                    postscript: 'null and void',
                    preamble: '',
                    value: { heading: 'News' },
                });
            });
        });

        // …and so is this: as it was written, and with its first comma left out,
        // which leaves every prefix that reaches past there to the repairs
        describe.each(['closing', 'repairing'])(
            'on a page as its write stream delivered it, read by %s it',
            (reading) => {
                const pageText = getPageStreamPieces().join('');
                const page = JSON.parse(pageText) as unknown;
                const commaIndex = reading === 'repairing' ? pageText.indexOf(',') : -1;
                const text =
                    commaIndex > -1
                        ? pageText.slice(0, commaIndex) + pageText.slice(commaIndex + 1)
                        : pageText;
                // every prefix of the text, with how the page’s text reads once closed
                // (closeCutText) where it is cut at the same place
                const cuts = Array.from({ length: text.length }, (_, index) => {
                    const endIndex = index + 1;
                    const hasComma = commaIndex > -1 && endIndex > commaIndex;
                    const pagePrefix = pageText.slice(
                        0,
                        hasComma ? endIndex + 1 : endIndex,
                    );
                    return {
                        prefix: text.slice(0, endIndex),
                        ...closeCutText(pagePrefix.trimEnd()),
                    };
                });
                const readings: Array<ReturnType<typeof parseAsJSON>> = [];

                beforeAll(() => {
                    for (const { prefix } of cuts) readings.push(parseAsJSON(prefix));
                });

                it('reads every prefix of the text as a prefix of the page', () => {
                    const misread = cuts.filter(({ isAwaitingValue }, index) => {
                        const { postscript, preamble, value } = readings[index];
                        if (postscript !== '' || preamble !== '') return true;
                        return !isPrefixOf({
                            isAwaitingValue,
                            partial: value,
                            whole: page,
                        });
                    });
                    expect(
                        misread.slice(0, 3).map(({ prefix }) => prefix.slice(-60)),
                    ).toEqual([]);
                });

                it('reads all that every prefix of the text holds', () => {
                    // …wherever closing what the prefix leaves open says how it reads,
                    // which is everywhere but partway through a literal or an escape,
                    // and on a number
                    const misread = cuts.filter(
                        ({ closed }, index) =>
                            closed !== undefined &&
                            JSON.stringify(readings[index].value) !==
                                JSON.stringify(closed),
                    );
                    expect(
                        misread.slice(0, 3).map(({ prefix }) => prefix.slice(-60)),
                    ).toEqual([]);
                    const unclosedCount = cuts.filter(
                        ({ closed }) => closed === undefined,
                    ).length;
                    expect(unclosedCount).toBeLessThan(cuts.length / 20);
                });
            },
        );
    });
});

// How a well-formed JSON text that was cut short reads once what it leaves open
// is closed: its string, then its objects and arrays, less a trailing comma. In
// an object, a key that the text stops inside is left out first, and a key that
// it stops after (with or without its colon) is given '' as its value, which is
// how parseAsJSON reads a key whose value has yet to start. `closed` is undefined
// where none of that makes valid JSON (the text stops partway through a literal
// or an escape), and where the text stops on a number, which more digits could
// still follow.
function closeCutText(text: string): { closed: unknown; isAwaitingValue: boolean } {
    let closers = '';
    let isInString = false;
    for (let index = 0; index < text.length; index++) {
        const char = text[index];
        if (isInString) {
            if (char === '\\') index++;
            else if (char === '"') isInString = false;
        } else if (char === '"') {
            isInString = true;
        } else if (char === '{' || char === '[') {
            closers = (char === '{' ? '}' : ']') + closers;
        } else if (char === '}' || char === ']') {
            closers = closers.slice(1);
        }
    }
    const isInObject = closers.startsWith('}');
    const keyIndex = isInString && isInObject ? text.search(STOPS_IN_KEY_REGEXP) : -1;
    const isAwaitingValue =
        !isInString && isInObject && STOPS_AFTER_KEY_REGEXP.test(text);
    let closedText = isInString ? text + '"' : text;
    // keep the brace or comma that the key follows (a trailing comma goes next)
    if (keyIndex > -1) closedText = text.slice(0, keyIndex + 1);
    closedText = closedText.replace(/,\s*$/, '');
    if (isAwaitingValue) {
        closedText += (/:\s*$/.test(text) ? '' : ':') + '""';
    } else if (!isInString && /\d$/.test(text)) {
        return { closed: undefined, isAwaitingValue };
    }
    try {
        return { closed: JSON.parse(closedText + closers) as unknown, isAwaitingValue };
    } catch {
        return { closed: undefined, isAwaitingValue };
    }
}

function commentsTestCase() {
    const read = (value: unknown) => ({ postscript: '', preamble: '', value });
    // a comment on a line of its own, after the opening brace or between members
    expect(
        parseAsJSON(
            '{\n  // the heading\n  "heading": "Our Story",\n  // and its size\n  "props": {"size": 2}\n}',
        ),
    ).toEqual(read({ heading: 'Our Story', props: { size: 2 } }));
    // one that follows a member on its line, with a comma before it or without
    expect(
        parseAsJSON('{\n  "retries": 3, // at most\n  "isLive": true // for now\n}'),
    ).toEqual(read({ isLive: true, retries: 3 }));
    expect(
        parseAsJSON('{\n  "name": "Ann", // first\n  "city": "Oslo" // last\n}'),
    ).toEqual(read({ city: 'Oslo', name: 'Ann' }));
    // a block comment, over several lines or within one
    expect(
        parseAsJSON(
            '{\n  /* the heading,\n     as given */\n  "heading": "Our Story", /* size */ "size": 2\n}',
        ),
    ).toEqual(read({ heading: 'Our Story', size: 2 }));
    // with no space before it after a bracket, a comma or a line break, and with
    // one after a colon or another comment
    expect(
        parseAsJSON(
            '{// zero\n  "a": 1,// one\n// and\n  "b": // two\n    2, /* three */ /* four */\n}',
        ),
    ).toEqual(read({ a: 1, b: 2 }));
    // in an array, after a preamble and in a code block
    expect(
        parseAsJSON(
            'Here you go:\n```json\n[\n  // first\n  {"a": 1},\n  {"a": 2} // second\n]\n```\nDone.',
        ),
    ).toEqual({
        postscript: 'Done.',
        preamble: 'Here you go:',
        value: [{ a: 1 }, { a: 2 }],
    });
    // (an array of numbers is found by what follows the comment after its
    // bracket, and with a comment after its first item or after the array)
    expect(parseAsJSON('Sizes:\n[ // two of them\n  1,\n  2,\n]')).toEqual({
        postscript: '',
        preamble: 'Sizes:',
        value: [1, 2],
    });
    expect(parseAsJSON('[\n  1 // one\n]')).toEqual(read([1]));
    expect(parseAsJSON('[ 1 /* one */, 2 ]')).toEqual(read([1, 2]));
    expect(parseAsJSON('[\n  true // yes\n  , false\n]')).toEqual(read([true, false]));
    expect(parseAsJSON('[1, 2, 3] // sizes')).toEqual({
        postscript: '// sizes',
        preamble: '',
        value: [1, 2, 3],
    });
    expect(parseAsJSON('Here:\n[1, 2, 3] /* inches */\nDone')).toEqual({
        postscript: '/* inches */\nDone',
        preamble: 'Here:',
        value: [1, 2, 3],
    });
    expect(parseAsJSON('[1, 2] /* 2 * 1 */').value).toEqual([1, 2]);
    // (the comment has to end the line: with prose after it, the array is in
    // the middle of a line of it)
    expect(parseAsJSON('Sizes:\n[1, 2] /* in */ inches').value).toBe(null);
    expect(parseAsJSON('Sizes:\n[1, 2] /* in */ \nDone').value).toEqual([1, 2]);
    expect(
        parseAsJSON(
            'The sizes are:\n[1, 2] /* a */ and the rest\nNext line /* b */\n{"a": 1}',
        ).value,
    ).toEqual({ a: 1 });
    // …and with whatever else needs repairing (a comment goes with the spaces
    // before it, so what it stood between is spaced as it would be without it)
    expect(
        parseAsJSON('{\n  // config\n  "a": "b", // one\n  "c": "d", // two\n}'),
    ).toEqual(read({ a: 'b', c: 'd' }));
    expect(parseAsJSON('{\n  "a": "b", /* one */ "c": "d",\n}')).toEqual(
        read({ a: 'b', c: 'd' }),
    );

    // as the text streams in, a comment that it ends on is left out as any other
    expect(parseAsJSON('{\n  /')).toEqual(read({}));
    expect(parseAsJSON('{\n  // the head')).toEqual(read({}));
    const streamed = read({ heading: 'Our Story' });
    expect(parseAsJSON('{\n  "heading": "Our Story", /')).toEqual(streamed);
    expect(parseAsJSON('{\n  "heading": "Our Story", // and its si')).toEqual(streamed);
    expect(parseAsJSON('{\n  "heading": "Our Story", /* and its si')).toEqual(streamed);
    expect(parseAsJSON('{\n  /* the hea')).toEqual(read({}));
    expect(parseAsJSON('[ 1 /')).toEqual(read([1]));
    expect(parseAsJSON('[1, 2] /')).toEqual(read([1, 2]));
    expect(parseAsJSON('[1, 2] /* in inc')).toEqual({
        postscript: '/* in inc',
        preamble: '',
        value: [1, 2],
    });
    // …and a number or literal before it is whole, as it is before a space
    expect(parseAsJSON('{\n  "retries": 3 // at mo')).toEqual(read({ retries: 3 }));
    expect(parseAsJSON('{"flags": [true,\nnull\n// tw')).toEqual(
        read({ flags: [true, null] }),
    );

    // what is in a string is not a comment
    expect(
        parseAsJSON(
            '{\n  "url": "https://example.com/a", // the link\n  "steps": "1, // 2, /* 3 */"\n}',
        ),
    ).toEqual(read({ steps: '1, // 2, /* 3 */', url: 'https://example.com/a' }));
    // …also where an unescaped quote mark before that string leaves it unclear
    // where the strings are: a comment follows a bracket, a comma, a colon or a
    // value, or starts a line, and these follow a word
    expect(
        parseAsJSON('{"size": "5" tall", "note": "see a // b", "code": "f(x) /* y */"}'),
    ).toEqual(read({ code: 'f(x) /* y */', note: 'see a // b', size: '5" tall' }));
    // (nor do these, which have no space before them and follow a quote mark or
    // a colon)
    expect(
        parseAsJSON(
            '{"size": "5" tall", "src": "//cdn.example.com/a.js", "url": "https://example.com"}',
        ),
    ).toEqual(
        read({
            size: '5" tall',
            src: '//cdn.example.com/a.js',
            url: 'https://example.com',
        }),
    );
    // nor is the comment that markdown has, which holds the bracket’s closer
    expect(parseAsJSON('[//]: # (hidden note)\n{"a": 1}')).toEqual({
        postscript: '',
        preamble: '[//]: # (hidden note)',
        value: { a: 1 },
    });
    // nor is what is outside the value: the preamble and postscript keep theirs
    expect(parseAsJSON('// the result\n{"a": 1} // that is all')).toEqual({
        postscript: '// that is all',
        preamble: '// the result',
        value: { a: 1 },
    });
    // and a brace is not where the JSON starts for the comment after it
    expect(parseAsJSON('function f() { // note\n  return 1;\n}\n{"a": 1}')).toEqual({
        postscript: '',
        preamble: 'function f() { // note\n  return 1;\n}',
        value: { a: 1 },
    });
}

function convertToJSONTestCase() {
    const response = `\
  Here is the JSON output for the "About Us" page based on the provided props:
{
"heading": "Our Story",
"subheading": "A Passion for Sourdough"
}
`;

    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble:
            'Here is the JSON output for the "About Us" page based on the provided props:',
        value: {
            heading: 'Our Story',
            subheading: 'A Passion for Sourdough',
        },
    });
}

function extraClosingCurliesTestCase() {
    let response = `\
{
"heading": "Notable Projects",
"subheading": "Explore some of our most successful and innovative designs",
"projects": [
{
"description": "Design for a new skyscraper in the city center, featuring a sleek and modern aesthetic. The building features a large atrium and floor-to-ceiling windows, providing an abundance of natural light and stunning views of the city skyline.",
"image": "https://pentagram.com/images/skyscraper.jpg",
"altText": "Skyscraper"
},
{
"description": "Website design for a non-profit organization, featuring a clean and intuitive layout, with a focus on accessibility and user experience. The goal was to create a user-friendly platform that would allow the organization to effectively communicate their mission and goals.",
"image": "https://pentagram.com/images/non-profit.jpg",
"altText": "Non-Profit Organization"
}

]
}}`;
    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble: '',
        value: {
            heading: 'Notable Projects',
            projects: [
                {
                    altText: 'Skyscraper',
                    description:
                        'Design for a new skyscraper in the city center, featuring a sleek and modern aesthetic. The building features a large atrium and floor-to-ceiling windows, providing an abundance of natural light and stunning views of the city skyline.',
                    image: 'https://pentagram.com/images/skyscraper.jpg',
                },
                {
                    altText: 'Non-Profit Organization',
                    description:
                        'Website design for a non-profit organization, featuring a clean and intuitive layout, with a focus on accessibility and user experience. The goal was to create a user-friendly platform that would allow the organization to effectively communicate their mission and goals.',
                    image: 'https://pentagram.com/images/non-profit.jpg',
                },
            ],
            subheading: 'Explore some of our most successful and innovative designs',
        },
    });

    response = `\
  Here is the JSON output for the "Locations" page based on the provided props:
{"contactEmail1":"info@example.net","contactPhoneNumber1":"772.555.8989","addressLine1":"123 Main St.","addressLine2":"North Lake Tahoe CA 96150","officeHours":"Monday - Friday: 9:00am - 4:30pm","officeHoursDays":"Mon - Fri"}"}`;

    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble:
            'Here is the JSON output for the "Locations" page based on the provided props:',
        value: {
            addressLine1: '123 Main St.',
            addressLine2: 'North Lake Tahoe CA 96150',
            contactEmail1: 'info@example.net',
            contactPhoneNumber1: '772.555.8989',
            officeHours: 'Monday - Friday: 9:00am - 4:30pm',
            officeHoursDays: 'Mon - Fri',
        },
    });
}

function extractPreambleTestCase() {
    expect(
        parseAsJSON(
            `To create a section prompt for a block-quote section on the "Home" page at index 1, I will consider the context and existing section prompts.\n\nThe "Home" page already has a hero section that introduces Franklin Investments, a brief introduction to the company, a gallery of key projects, a features section highlighting their strategic advantages, and a call-to-action section. \n\nA block-quote section at index 1 would logically serve as a highlight or a key message that the company wants to emphasize to its visitors right after they are introduced to the company. \n\nGiven the description of the block-quote section as “Bold statement, phrase or quote,” it seems this section is meant to capture the essence of Franklin Investments' mission, philosophy, or value proposition in a concise and impactful way.\n\nHere's a JSON-formatted section prompt:\n\n\`\`\`\n{\n  "prompt": "A bold statement that encapsulates Franklin Investments' commitment to innovation and excellence in infrastructure solutions, resonating with their mission and values."\n}\n\`\`\`\n\nThis prompt is designed to elicit a concise yet powerful statement that can reinforce the company's message and leave a lasting impression on visitors.`,
        ),
    ).toEqual({
        postscript: `This prompt is designed to elicit a concise yet powerful statement that can reinforce the company's message and leave a lasting impression on visitors.`,
        preamble: `To create a section prompt for a block-quote section on the "Home" page at index 1, I will consider the context and existing section prompts.\n\nThe "Home" page already has a hero section that introduces Franklin Investments, a brief introduction to the company, a gallery of key projects, a features section highlighting their strategic advantages, and a call-to-action section. \n\nA block-quote section at index 1 would logically serve as a highlight or a key message that the company wants to emphasize to its visitors right after they are introduced to the company. \n\nGiven the description of the block-quote section as “Bold statement, phrase or quote,” it seems this section is meant to capture the essence of Franklin Investments' mission, philosophy, or value proposition in a concise and impactful way.\n\nHere's a JSON-formatted section prompt:`,
        value: {
            prompt: "A bold statement that encapsulates Franklin Investments' commitment to innovation and excellence in infrastructure solutions, resonating with their mission and values.",
        },
    });
}

function extraneousEscapeCharactersTestCase() {
    const response =
        '```json\n{"heading":"Print Design","description":"\\\nAt Cinco Design, we believe that print design is not just about creating visually appealing materials, but also about effectively communicating your message to your target audience. Our team of experienced designers works closely with you to understand your brand, your audience, and your goals, and then crafts a unique print design solution that captures your essence and resonates with your audience.\n\nOur print design services include:\n\n- Branding and identity design: We create a cohesive visual identity for your brand, including logos, business cards, letterheads, and more.\n- Marketing collateral: We design brochures, flyers, posters, and other marketing materials that effectively promote your products or services.\n- Packaging design: We design packaging that not only protects your products but also enhances their appeal and makes them stand out on the shelf.\n- Publication design: We design magazines, newspapers, books, and other publications that are visually engaging and easy to navigate.\n\nLet us help you make a lasting impression with our print design services. Contact us today to discuss your project and see how we can bring your vision to life."}\n```';

    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble: '',
        value: {
            description:
                '\nAt Cinco Design, we believe that print design is not just about creating visually appealing materials, but also about effectively communicating your message to your target audience. Our team of experienced designers works closely with you to understand your brand, your audience, and your goals, and then crafts a unique print design solution that captures your essence and resonates with your audience.\n\nOur print design services include:\n\n- Branding and identity design: We create a cohesive visual identity for your brand, including logos, business cards, letterheads, and more.\n- Marketing collateral: We design brochures, flyers, posters, and other marketing materials that effectively promote your products or services.\n- Packaging design: We design packaging that not only protects your products but also enhances their appeal and makes them stand out on the shelf.\n- Publication design: We design magazines, newspapers, books, and other publications that are visually engaging and easy to navigate.\n\nLet us help you make a lasting impression with our print design services. Contact us today to discuss your project and see how we can bring your vision to life.',
            heading: 'Print Design',
        },
    });

    // an escaped backslash before a raw line break is whole: only a lone one is extraneous
    expect(parseAsJSON('{"path": "C:\\\\\nD:\\\\"}').value).toEqual({
        path: 'C:\\\nD:\\',
    });
}

function fencedJSONVariantsTestCase() {
    expect(
        parseAsJSON(`\
\`\`\`json

{
  "heading": "News"
}

\`\`\``),
    ).toEqual({
        postscript: '',
        preamble: '',
        value: { heading: 'News' },
    });

    expect(
        parseAsJSON(`\
\`\`\`JSON
{
  "heading": "News"
}
\`\`\``),
    ).toEqual({
        postscript: '',
        preamble: '',
        value: { heading: 'News' },
    });

    expect(
        parseAsJSON(`\
  \`\`\`json
  {
    "heading": "News"
  }
  \`\`\``),
    ).toEqual({
        postscript: '',
        preamble: '',
        value: { heading: 'News' },
    });
}

function fencedJSONWithPercentSignsTestCase() {
    const response = `\
\`\`\`json
{
  "heading": "Our Impact & Milestones",
  "subheading": "Rooted in the earth and woven with intention, our achievements reflect a commitment to a kinder, more sustainable world.",
  "imagePrompt": "A high-resolution, minimalist composition of natural elements: a bundle of raw flax, a smooth river stone, and a recycled paper certificate with a botanical seal, all bathed in soft, golden morning light on a light oak surface.",
  "items": [
    {
      "heading": "12 Global Artisan Communities",
      "subheading": "Supporting traditional craftsmanship in 8 countries.",
      "description": "We partner directly with small-scale cooperatives from Kyoto to Oregon, ensuring fair wages and preserving ancestral techniques that have been passed down for generations.",
      "button": "Meet the Makers",
      "buttonLink": {
        "enabled": true,
        "label": "Meet the Makers",
        "type": "internal",
        "value": "/journal"
      },
      "imageAlt": "An artisan's hands weaving on a traditional wooden loom",
      "imagePrompt": "Close-up of weathered hands working on a large wooden loom, weaving cream-colored linen thread, soft-focus background of a sunlit workshop.",
      "id": "0"
    },
    {
      "heading": "450k Gallons of Water Saved",
      "subheading": "Through organic flax and closed-loop dyeing.",
      "description": "By prioritizing organic Belgian flax over conventional cotton and utilizing rainwater harvesting in our ceramic studios, we significantly reduce our environmental footprint.",
      "button": "Our Sourcing Journey",
      "buttonLink": {
        "enabled": true,
        "label": "Our Sourcing Journey",
        "type": "internal",
        "value": "fbbe35e2-c76b-4ae4-9c26-774160ebbda2"
      },
      "imageAlt": "A serene view of a lush flax field under a clear sky",
      "imagePrompt": "A wide, cinematic shot of a flowering flax field in the European countryside, soft blue flowers swaying in the breeze under a pale morning sky.",
      "id": "1"
    },
    {
      "heading": "100% GOTS & OEKO-TEX Certified",
      "subheading": "Rigorous standards for textile safety and ecology.",
      "description": "Every thread in our collection is verified free from harmful chemicals and synthetic dyes, ensuring a healthy, non-toxic sanctuary for your family.",
      "button": "View Standards",
      "buttonLink": {
        "enabled": true,
        "label": "View Standards",
        "type": "external",
        "value": "https://www.global-standard.org/"
      },
      "imageAlt": "A close-up of a GOTS certification tag on a linen throw",
      "imagePrompt": "Macro photography of a recycled paper hangtag with a green botanical logo attached to a heavily textured oatmeal-colored linen fabric.",
      "id": "2"
    },
    {
      "heading": "Carbon-Neutral Shipping",
      "subheading": "Offsetting every delivery through reforestation.",
      "description": "We partner with global reforestation projects to offset 100% of the carbon emitted from our studio to your doorstep, keeping the air as clean as our designs.",
      "button": "Read Our Report",
      "buttonLink": {
        "enabled": true,
        "label": "Read Our Report",
        "type": "internal",
        "value": "/ethos"
      },
      "imageAlt": "A young sapling growing in a sunlit forest",
      "imagePrompt": "A delicate green sapling emerging from rich, dark forest soil, dappled sunlight filtering through tall trees in the background.",
      "id": "3"
    }
  ]
}
\`\`\``;

    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble: '',
        value: {
            heading: 'Our Impact & Milestones',
            imagePrompt:
                'A high-resolution, minimalist composition of natural elements: a bundle of raw flax, a smooth river stone, and a recycled paper certificate with a botanical seal, all bathed in soft, golden morning light on a light oak surface.',
            items: [
                {
                    button: 'Meet the Makers',
                    buttonLink: {
                        enabled: true,
                        label: 'Meet the Makers',
                        type: 'internal',
                        value: '/journal',
                    },
                    description:
                        'We partner directly with small-scale cooperatives from Kyoto to Oregon, ensuring fair wages and preserving ancestral techniques that have been passed down for generations.',
                    heading: '12 Global Artisan Communities',
                    id: '0',
                    imageAlt: "An artisan's hands weaving on a traditional wooden loom",
                    imagePrompt:
                        'Close-up of weathered hands working on a large wooden loom, weaving cream-colored linen thread, soft-focus background of a sunlit workshop.',
                    subheading: 'Supporting traditional craftsmanship in 8 countries.',
                },
                {
                    button: 'Our Sourcing Journey',
                    buttonLink: {
                        enabled: true,
                        label: 'Our Sourcing Journey',
                        type: 'internal',
                        value: 'fbbe35e2-c76b-4ae4-9c26-774160ebbda2',
                    },
                    description:
                        'By prioritizing organic Belgian flax over conventional cotton and utilizing rainwater harvesting in our ceramic studios, we significantly reduce our environmental footprint.',
                    heading: '450k Gallons of Water Saved',
                    id: '1',
                    imageAlt: 'A serene view of a lush flax field under a clear sky',
                    imagePrompt:
                        'A wide, cinematic shot of a flowering flax field in the European countryside, soft blue flowers swaying in the breeze under a pale morning sky.',
                    subheading: 'Through organic flax and closed-loop dyeing.',
                },
                {
                    button: 'View Standards',
                    buttonLink: {
                        enabled: true,
                        label: 'View Standards',
                        type: 'external',
                        value: 'https://www.global-standard.org/',
                    },
                    description:
                        'Every thread in our collection is verified free from harmful chemicals and synthetic dyes, ensuring a healthy, non-toxic sanctuary for your family.',
                    heading: '100% GOTS & OEKO-TEX Certified',
                    id: '2',
                    imageAlt: 'A close-up of a GOTS certification tag on a linen throw',
                    imagePrompt:
                        'Macro photography of a recycled paper hangtag with a green botanical logo attached to a heavily textured oatmeal-colored linen fabric.',
                    subheading: 'Rigorous standards for textile safety and ecology.',
                },
                {
                    button: 'Read Our Report',
                    buttonLink: {
                        enabled: true,
                        label: 'Read Our Report',
                        type: 'internal',
                        value: '/ethos',
                    },
                    description:
                        'We partner with global reforestation projects to offset 100% of the carbon emitted from our studio to your doorstep, keeping the air as clean as our designs.',
                    heading: 'Carbon-Neutral Shipping',
                    id: '3',
                    imageAlt: 'A young sapling growing in a sunlit forest',
                    imagePrompt:
                        'A delicate green sapling emerging from rich, dark forest soil, dappled sunlight filtering through tall trees in the background.',
                    subheading: 'Offsetting every delivery through reforestation.',
                },
            ],
            subheading:
                'Rooted in the earth and woven with intention, our achievements reflect a commitment to a kinder, more sustainable world.',
        },
    });
}

// A page as its write stream delivered it: a model’s JSON text in the pieces a
// client received, so every prefix that ends where a piece does is a text that
// was really parsed mid-stream. Trimmed to the page’s first three sections,
// with the last piece cut where the third ends and closed as the page closes.
function getPageStreamPieces() {
    return [
        '{\n  "sections": [\n    {\n      "category": "hero",\n      "variant": "variant-',
        'e",\n      "props": {\n        "eyebrow": "Baltimore Private Dining",\n        "heading',
        '": "Private Multi-Course Dining\\nfor Milestone Celebrations",\n        "subheading": "Custom chef tasting',
        ' menus prepared, plated, and served in your Baltimore home for unforgettable birthdays and anniversaries.",\n        "button": "Check Availability',
        '",\n        "buttonLink": {\n          "enabled": true,\n          "type": "internal",\n',
        '          "value": "#calendar",\n          "label": "Check Availability"\n        },\n        "buttonMicro',
        'copy": "Select your date on the calendar",\n        "foreground": {\n          "type": "image",\n',
        '          "image": null,\n          "alt": "Private chef carefully garnishing an elegant multi-course dish in a',
        ' residential kitchen",\n          "prompt": "A professional chef delicately garnishing a fine dining course with fresh herbs on a dark',
        ' ceramic plate inside a stylish residential kitchen"\n        }\n      },\n      "layoutPropsOnOff": {\n        "ey',
        'ebrow": true,\n        "buttonMicrocopy": true\n      }\n    },\n    {\n      ',
        '"category": "social-proof",\n      "variant": "variant-b",\n      "props": {',
        '\n        "items": [\n          {\n            "name": "Baltimore Event Host",\n            "rating": 5,\n',
        '            "description": "People have raved about the professionalism and the taste of the food. I can not say enough',
        ' about this business.",\n            "source": "Google Review",\n            "foreground": {\n              "type":',
        ' "image",\n              "image": null,\n              "alt": "Table of dinner guests enjoying a shared private',
        ' celebration meal",\n              "prompt": "An intimate dinner party table setting with smiling guests in soft warm lighting enjoying wine',
        ' and plated food"\n            }\n          }\n        ]\n      },\n      "layoutItemPropsOnOff": {\n',
        '        "source": true\n      }\n    },\n    {\n      "category": "services",\n      ',
        '"variant": "variant-d",\n      "props": {\n        "heading": "Custom Multi-Course',
        ' Menus for Your Special Occasions",\n        "items": [\n          {\n            "heading": "Mil',
        'estone Birthdays",\n            "description": "Celebrate milestone birthdays with a tailored 5- to 7-course',
        ' tasting menu centered on your favorite ingredients, presented at an easy, celebratory pace.",\n            "foreground": {\n              "type": "',
        'image",\n              "image": null,\n              "alt": "Artistically plated birthday entrée course",\n              "prompt":',
        ' "Close-up of a beautifully composed gourmet entrée on artisan stoneware with microgreens and reduction sauce"\n            }\n',
        '          },\n          {\n            "heading": "Anniversary Dinners",\n            "description": "Experience fine',
        '-dining intimacy at your own dining table. Enjoy personalized course-by-course presentation without crowded restaurant noise or rushed seat',
        'ings.",\n            "foreground": {\n              "type": "image",\n              "image": null,\n              ',
        '"alt": "Romantic candlelit private dinner place setting",\n              "prompt": "Candlelit dinner place setting with polished',
        ' silverware, crystal glassware, and an elegant printed menu card"\n            }\n          },\n          {\n            "heading": "',
        'Curated Tasting Menus",\n            "description": "Enjoy a seasonal culinary journey highlighting peak Mid-Atlantic ingredients and',
        ' fresh local seafood, crafted from scratch in your home for close friends and family.",\n            "foreground": {\n              "type',
        '": "image",\n              "image": null,\n              "alt": "Seasonal seafood course preparation",\n              "prompt": "',
        'Delicate pan-seared scallops plated with seasonal purée and fresh herb oil garnish"\n            }\n          }\n        ]\n',
        '      }\n    }\n  ]\n}',
    ];
}

// Whether `partial` is `whole` as far as it had been written: equal to it
// everywhere but at its open end (the last value, and that value’s last value,
// and so on down), where a string is a prefix of the whole one and an array or
// object holds the first of the whole one’s items or keys, in order.
//
// `isAwaitingValue` is for a text that stops between a key and its value, which
// parseAsJSON reads as that key holding '' whatever its value turns out to be.
function isPrefixOf({
    isAwaitingValue = false,
    isOpenEnd = true,
    partial,
    whole,
}: {
    isAwaitingValue?: boolean;
    isOpenEnd?: boolean;
    partial: unknown;
    whole: unknown;
}): boolean {
    if (typeof partial === 'string') {
        if (typeof whole !== 'string') return false;
        return isOpenEnd ? whole.startsWith(partial) : whole === partial;
    }
    if (partial == null || typeof partial !== 'object') return partial === whole;
    if (whole == null || typeof whole !== 'object') return false;
    if (Array.isArray(partial) !== Array.isArray(whole)) return false;
    // an array’s keys are its indices
    const keys = Object.keys(partial);
    const wholeKeys = Object.keys(whole);
    if (keys.length > wholeKeys.length) return false;
    if (!isOpenEnd && keys.length < wholeKeys.length) return false;
    return keys.every((key, index) => {
        if (key !== wholeKeys[index]) return false;
        const isLast = isOpenEnd && index === keys.length - 1;
        const value = (partial as Record<string, unknown>)[key];
        if (isLast && isAwaitingValue && value === '' && !Array.isArray(partial)) {
            return true;
        }
        return isPrefixOf({
            isAwaitingValue,
            isOpenEnd: isLast,
            partial: value,
            whole: (whole as Record<string, unknown>)[key],
        });
    });
}

function markdownTableTestCase() {
    // a table in the preamble is part of the preamble
    expect(
        parseAsJSON(`\
Here is what changed:

| Field | Value |
| --- | --- |
| heading | Hello |

\`\`\`json
{"heading": "Hello", "sub": "World"}
\`\`\``),
    ).toEqual({
        postscript: '',
        preamble:
            'Here is what changed:\n\n| Field | Value |\n| --- | --- |\n| heading | Hello |',
        value: { heading: 'Hello', sub: 'World' },
    });
    // one after the JSON is the postscript
    expect(
        parseAsJSON(
            '{"heading": "Hello", "sub": "World"}\n\n| Field | Value |\n| heading | Hello |',
        ),
    ).toEqual({
        postscript: '| Field | Value |\n| heading | Hello |',
        preamble: '',
        value: { heading: 'Hello', sub: 'World' },
    });
    // and one on its own is not JSON
    expect(parseAsJSON('| Field | Value |\n| heading | Hello |')).toEqual({
        postscript: '',
        preamble: '| Field | Value |\n| heading | Hello |',
        value: null,
    });
}

function missingCommasTestCase() {
    const response = `\
  Sure, here's an example of a JSON response for the "Contact Form" page:
{
"heading": "Get in Touch",
"subheading": "We'd love to hear from you!"
"props": {
"form": {
"name": "Contact Form",
"email": "info@example.net",
"message": "Please enter your message or inquiry below"
"submit": "Submit"
}
}
`;
    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble:
            'Sure, here\'s an example of a JSON response for the "Contact Form" page:',
        value: {
            heading: 'Get in Touch',
            props: {
                form: {
                    email: 'info@example.net',
                    message: 'Please enter your message or inquiry below',
                    name: 'Contact Form',
                    submit: 'Submit',
                },
            },
            subheading: "We'd love to hear from you!",
        },
    });
}

function missingOpeningQuoteTestCase() {
    const response =
        '{"heading":"The Unbreakable Bond"\ndescription":"In a world ravaged by chaos and despair, the heartwarming relationship between Big Man and Sweet Tooth stands as a beacon of hope and love. As Big Man takes the young hybrid under his wing, nurturing him with unwavering devotion, the two forge an unbreakable bond that transcends the boundaries of blood and biology."}<|im_end|>';
    expect(parseAsJSON(response).value).toEqual({
        description:
            'In a world ravaged by chaos and despair, the heartwarming relationship between Big Man and Sweet Tooth stands as a beacon of hope and love. As Big Man takes the young hybrid under his wing, nurturing him with unwavering devotion, the two forge an unbreakable bond that transcends the boundaries of blood and biology.',
        heading: 'The Unbreakable Bond',
    });
}

function missingValuesTestCase() {
    const response = `\
\`\`\`json
{"heading":"Digg FAQ","subheading":"Get the Answers You Need","items":[{"heading":"What is Digg?","subheading":"","description":"Digg is an American news aggregator that curates a front page of the most popular stories on the Internet. It covers topics such as science, trending political issues, and viral Internet issues.","button":""},{"heading":"How does Digg work?","subheading","description":"Digg uses a combination of editorial curation and algorithmic sorting to select the most popular stories on the Internet. Users can submit stories, which are then voted on by other users. The stories with the most votes appear on the Digg front page.","button":""},{"heading":"How do I submit a story to Digg?","subheading","description":"To submit a story to Digg, you need to create an account and then click on the 'Submit a Story' button. You will then be prompted to enter the URL of the story you want to submit. Once submitted, other users can vote on your story, and if it gains enough votes, it may appear on the Digg front page.","button":""}]}
\`\`\``;

    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble: '',
        value: {
            heading: 'Digg FAQ',
            items: [
                {
                    button: '',
                    description:
                        'Digg is an American news aggregator that curates a front page of the most popular stories on the Internet. It covers topics such as science, trending political issues, and viral Internet issues.',
                    heading: 'What is Digg?',
                    subheading: '',
                },
                {
                    button: '',
                    description:
                        'Digg uses a combination of editorial curation and algorithmic sorting to select the most popular stories on the Internet. Users can submit stories, which are then voted on by other users. The stories with the most votes appear on the Digg front page.',
                    heading: 'How does Digg work?',
                    subheading: '',
                },
                {
                    button: '',
                    description:
                        "To submit a story to Digg, you need to create an account and then click on the 'Submit a Story' button. You will then be prompted to enter the URL of the story you want to submit. Once submitted, other users can vote on your story, and if it gains enough votes, it may appear on the Digg front page.",
                    heading: 'How do I submit a story to Digg?',
                    subheading: '',
                },
            ],
            subheading: 'Get the Answers You Need',
        },
    });
}

function nestedArraysTestCase() {
    const response = `{"heading": "Registration Form", "items": [{"heading": "Personal Information", "fields": [{"label": "Name", "name": "name", "type": "text", "placeholder": "Enter your name"}, {"label": "Gender", "name": "gender", "type": "select", "options": ["Male", "Female", "Other"], "placeholder": "Select your gender"}]}], "button": "Next: Security Details"}]}<|im_end|>`;

    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble: '',
        value: {
            button: 'Next: Security Details',
            heading: 'Registration Form',
            items: [
                {
                    fields: [
                        {
                            label: 'Name',
                            name: 'name',
                            placeholder: 'Enter your name',
                            type: 'text',
                        },
                        {
                            label: 'Gender',
                            name: 'gender',
                            options: ['Male', 'Female', 'Other'],
                            placeholder: 'Select your gender',
                            type: 'select',
                        },
                    ],
                    heading: 'Personal Information',
                },
            ],
        },
    });
}

function nestedJSONTestCase() {
    const response = `\
  Sure, here's an example of a JSON response for the "Contact Form" page:
{
"heading": "Get in Touch",
"subheading": "We'd love to hear from you!",
"props": {
"form": {
"email": "info@example.net",
"message": "Please enter your message or inquiry below"
}
}
`;

    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble:
            'Sure, here\'s an example of a JSON response for the "Contact Form" page:',
        value: {
            heading: 'Get in Touch',
            props: {
                form: {
                    email: 'info@example.net',
                    message: 'Please enter your message or inquiry below',
                },
            },
            subheading: "We'd love to hear from you!",
        },
    });
}

function numberValuesTestCase() {
    const response = '[{"foo":0}\n{"bar": 1}{"baz": "qux"}]<|im_end|>';
    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble: '',
        value: [{ foo: 0 }, { bar: 1 }, { baz: 'qux' }],
    });
}

function partialResponsesTestCase() {
    let response = `\
Sure, here's an example JSON output for the "Services" section based on the provided information:
{
"bodyCopy": "At the Cleveland Clinic Wound Center in Vero Beach, Florida, our team of experienced healthcare professionals is dedicated to getting you back to your normal life as quickly as possible.
Here are some of the services we offer:
{
"contentLi`;
    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble:
            'Sure, here\'s an example JSON output for the "Services" section based on the provided information:',
        value: {
            bodyCopy:
                'At the Cleveland Clinic Wound Center in Vero Beach, Florida, our team of experienced healthcare professionals is dedicated to getting you back to your normal life as quickly as possible.',
            'Here are some of the services we offer': {},
        },
    });

    response = '  Here is a sample JSON output for the "Branding Portfolio"';
    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble: 'Here is a sample JSON output for the "Branding Portfolio"',
        value: null,
    });

    response = `\
  Here is the JSON output for the "Meet the Team" page:
{
"callToAction": "Learn More",
"heading": "Meet the Team",
"subheading": "Our bakery is built on the foundation of passionate individuals who are dedicated to creating the best sourdough bread in North Lake Tahoe. Meet the team behind Masa Madre."
[
"teamMembers": [
{
"`;
    expect(parseAsJSON(response).value).toEqual({
        callToAction: 'Learn More',
        heading: 'Meet the Team',
        subheading:
            'Our bakery is built on the foundation of passionate individuals who are dedicated to creating the best sourdough bread in North Lake Tahoe. Meet the team behind Masa Madre.',
    });

    response = `\
  Here is the JSON output for the "Benefits" page:
{
"teamMemberName1": "Jane Smith",
"teamMemberImage1": "/images/team-member-1.jpg",
"teamMemberJobTitle1": "Product  Here is the JSON output for the "Testimonials" page based on the provided props:`;

    expect(parseAsJSON(response)).toEqual({
        postscript: 'page based on the provided props:',
        preamble: 'Here is the JSON output for the "Benefits" page:',
        value: {
            teamMemberImage1: '/images/team-member-1.jpg',
            // first quote mark is recognized as an unescaped character, final quote mark is treated as string terminus
            teamMemberJobTitle1: 'Product  Here is the JSON output for the "Testimonials',
            teamMemberName1: 'Jane Smith',
        },
    });

    response = '```json\n{\n  "heading": "News",\n  "';
    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble: '',
        value: { heading: 'News' },
    });

    response = `\
\`\`\`json
{"items":[{"heading":"Welcome to Lava","subheading":"Your One-Stop Shop for Lava Lamps and Whisky Ice Cream","description":"Lava is a unique store located in the heart of Noe Valley, San Francisco. We specialize in selling a wide variety of lava lamps, from classic designs to modern and quirky creations. But that's not all! We also offer a delicious treat that's sure to tantalize your taste buds: free whisky ice cream for those who come in before noon. Come visit us and experience the Lava magic for yourself!","\`\`\`json
{
    "heading": "Lava Lamps",
    "subheading": "Choose from our wide selection of lava lamps in different sizes, colors, and features.",
    "items": [
      {
        "heading": "Classic Lava Lamp",
        "price": "$39.99",
        "button": "Add to Cart",
        "imageURL": "/classic-lava-lamp.jpg",
        "imageAlt": "Classic Lava Lamp"
      },
      {
        "heading": "Glowing Lava Lamp",
        "price": "$44.99",
        "button": "Add to Cart",
        "imageURL": "/`;

    expect(parseAsJSON(response).value).toEqual({
        items: [
            {
                '```json': {
                    heading: 'Lava Lamps',
                    items: [
                        {
                            button: 'Add to Cart',
                            heading: 'Classic Lava Lamp',
                            imageAlt: 'Classic Lava Lamp',
                            imageURL: '/classic-lava-lamp.jpg',
                            price: '$39.99',
                        },
                        {
                            button: 'Add to Cart',
                            heading: 'Glowing Lava Lamp',
                            imageURL: '/',
                            price: '$44.99',
                        },
                    ],
                    subheading:
                        'Choose from our wide selection of lava lamps in different sizes, colors, and features.',
                },
                description:
                    "Lava is a unique store located in the heart of Noe Valley, San Francisco. We specialize in selling a wide variety of lava lamps, from classic designs to modern and quirky creations. But that's not all! We also offer a delicious treat that's sure to tantalize your taste buds: free whisky ice cream for those who come in before noon. Come visit us and experience the Lava magic for yourself!",
                heading: 'Welcome to Lava',
                subheading: 'Your One-Stop Shop for Lava Lamps and Whisky Ice Cream',
            },
        ],
    });
}

function preambleTestCase() {
    const preamble = `Sure, here's an example JSON output for the "Types of Lessons" section based on the provided props:`;
    const postscript = `This output includes the following props:

* "sectionSubtitle": A subtitle for the section, which is "Dance Lessons for All Levels".
* "sectionTitle": The title of the section, which is "Lessons Offered".
* "itemSubtitle1", "itemTitle1", "itemDescription1": These props are used to define the first item in the list of lessons, which is beginner. The subtitle is "Beginner", the title is "Introduction to Latin Dance", and the description is "Learn the basics of Latin dance, including salsa, bachata, and cha cha cha. Perfect for beginners looking to get started or those who want to refresh their skills."
* "itemSubtitle2", "itemTitle2", "itemDescription2": These props are used to define the second item in the list of lessons, which is intermediate. The subtitle is "Intermediate", the title is "Advanced Techniques", and the description is "Build on your existing skills and learn more complex moves and patterns. Suitable for those with some experience in Latin dance."
* "link": The link prop is used to define the URL of the lessons page, which is "https://marteeeen.com/lessons/".".`;
    const response = `\
  ${preamble}
{
"sectionSubtitle": "Dance Lessons for All Levels",
"sectionTitle": "Lessons Offered",
"itemSubtitle1": "Beginner",
"itemTitle1": "Introduction to Latin Dance",
"itemDescription1": "Learn the basics of Latin dance, including salsa, bachata, and cha cha cha. Perfect for beginners looking to get started or those who want to refresh their skills.",
"itemSubtitle2": "Intermediate",
"itemTitle2": "Advanced Techniques",
"itemDescription2": "Build on your existing skills and learn more complex moves and patterns. Suitable for those with some experience in Latin dance.",
"link": "https://marteeeen.com/lessons/"
}

${postscript}`;

    expect(parseAsJSON(response)).toEqual({
        postscript,
        preamble,
        value: {
            itemDescription1:
                'Learn the basics of Latin dance, including salsa, bachata, and cha cha cha. Perfect for beginners looking to get started or those who want to refresh their skills.',
            itemDescription2:
                'Build on your existing skills and learn more complex moves and patterns. Suitable for those with some experience in Latin dance.',
            itemSubtitle1: 'Beginner',
            itemSubtitle2: 'Intermediate',
            itemTitle1: 'Introduction to Latin Dance',
            itemTitle2: 'Advanced Techniques',
            link: 'https://marteeeen.com/lessons/',
            sectionSubtitle: 'Dance Lessons for All Levels',
            sectionTitle: 'Lessons Offered',
        },
    });

    // before an array, which may be empty
    expect(parseAsJSON('Here are the tags: ["a", "b"]')).toEqual({
        postscript: '',
        preamble: 'Here are the tags:',
        value: ['a', 'b'],
    });
    expect(parseAsJSON('Here are the tags: []')).toEqual({
        postscript: '',
        preamble: 'Here are the tags:',
        value: [],
    });
    // as is one that the wrong bracket closes, which is as far as it is read
    expect(parseAsJSON('Here are the tags: [}')).toEqual({
        postscript: '',
        preamble: 'Here are the tags:',
        value: [],
    });

    // what follows a preamble is parsed as it is where it is whole, so its
    // spacing is of no account
    expect(parseAsJSON('Here it is: {"a": "b" , "c": "d"}')).toEqual({
        postscript: '',
        preamble: 'Here it is:',
        value: { a: 'b', c: 'd' },
    });
    expect(parseAsJSON('Here are the tags:\n["a" , "b",\t"c"]')).toEqual({
        postscript: '',
        preamble: 'Here are the tags:',
        value: ['a', 'b', 'c'],
    });
}

function prematureClosingCurliesTestCase() {
    let response =
        '```json\n{"heading":"Organic Produce","subheading":"The Benefits of Going Organic","description":"Organic produce is grown without the use of synthetic pesticides, herbicides, or fertilizers."},"items":[{"heading":"Organic Fruits","subheading":"Nature\'s Sweet Treats"},{"heading":"Organic Vegetables","subheading":"Fresh from the Garden"}]}\n```';

    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble: '',
        value: {
            description:
                'Organic produce is grown without the use of synthetic pesticides, herbicides, or fertilizers.',
            heading: 'Organic Produce',
            items: [
                {
                    heading: 'Organic Fruits',
                    subheading: "Nature's Sweet Treats",
                },
                {
                    heading: 'Organic Vegetables',
                    subheading: 'Fresh from the Garden',
                },
            ],
            subheading: 'The Benefits of Going Organic',
        },
    });

    response =
        '{"heading": "Get in Touch"}\n"items": [{"heading": "Contact Information","subheading": "Reach out to us using the following details."}]<|im_end|>';

    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble: '',
        value: {
            heading: 'Get in Touch',
            items: [
                {
                    heading: 'Contact Information',
                    subheading: 'Reach out to us using the following details.',
                },
            ],
        },
    });

    // an object that is closed before its first key has nothing yet for a comma
    // to separate that key from
    expect(parseAsJSON('Here it is: {}"a": "b"}')).toEqual({
        postscript: '',
        preamble: 'Here it is:',
        value: { a: 'b' },
    });
    expect(parseAsJSON('{},\n"a": "b", "c": "d"}').value).toEqual({ a: 'b', c: 'd' });
}

function preservesNewLinesTestCase() {
    const response = `\
\`\`\`json
{
    "items": [
        {
            "heading": "The Zombie",
            "subheading": "A Tiki Drink with a Twist",
            "description": "Ingredients\\n\\n1 ounce fresh lime juice\n1 ounce falernum\\n1 ounce passion fruit purée\\n1 ounce pineapple juice\\n1 ounce white rum\\n1 ounce dark rum\\n1 dash Angostura bitters\\n1 dash Pernod\\n\\nInstructions\\n\\n1. Combine all ingredients in a cocktail shaker with ice.\\n2. Shake until well chilled.\\n3. Strain into a chilled tiki mug or highball glass filled with crushed ice.\\n4. Garnish with a sprig of mint and a cherry.",
            "imageURL": "/the-zombie-tiki-drink.jpg",
            "imageAlt": "",
            "imageCaption": ""
        }
    ]
}
\`\`\``;

    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble: '',
        value: {
            items: [
                {
                    description:
                        'Ingredients\n\n1 ounce fresh lime juice\n1 ounce falernum\n1 ounce passion fruit purée\n1 ounce pineapple juice\n1 ounce white rum\n1 ounce dark rum\n1 dash Angostura bitters\n1 dash Pernod\n\nInstructions\n\n1. Combine all ingredients in a cocktail shaker with ice.\n2. Shake until well chilled.\n3. Strain into a chilled tiki mug or highball glass filled with crushed ice.\n4. Garnish with a sprig of mint and a cherry.',
                    heading: 'The Zombie',
                    imageAlt: '',
                    imageCaption: '',
                    imageURL: '/the-zombie-tiki-drink.jpg',
                    subheading: 'A Tiki Drink with a Twist',
                },
            ],
        },
    });
}

function quoteMarkStartTestCase() {
    // a quoted word in the preamble is part of the preamble
    expect(parseAsJSON('I went with "warm" for the tone.\n{"tone": "warm"}')).toEqual({
        postscript: '',
        preamble: 'I went with "warm" for the tone.',
        value: { tone: 'warm' },
    });
    // …also where a colon follows it, as it does a key
    expect(
        parseAsJSON(
            'The "title": field was too long, so I shortened it.\n{"title": "Short"}',
        ),
    ).toEqual({
        postscript: '',
        preamble: 'The "title": field was too long, so I shortened it.',
        value: { title: 'Short' },
    });
    // a text with no JSON in it is all preamble
    expect(parseAsJSON('I think the answer is "yes".')).toEqual({
        postscript: '',
        preamble: 'I think the answer is "yes".',
        value: null,
    });
    // as is a list of keys and values that no brace opens
    expect(
        parseAsJSON('Props:\n"heading": "Our Story",\n"subheading": "Est. 1999",'),
    ).toEqual({
        postscript: '',
        preamble: 'Props:\n"heading": "Our Story",\n"subheading": "Est. 1999",',
        value: null,
    });
    // and an object whose brace something other than its first key follows
    expect(parseAsJSON('{\n  ...\n  "heading": "Our Story"\n}').value).toBe(null);
}

// what an unfinished page reads to, given the props of its first section: the
// page’s own root, with nothing left over
function readPage(props: Record<string, unknown>) {
    return {
        postscript: '',
        preamble: '',
        value: { sections: [{ props }] },
    };
}

function restartsMidResponseTestCase() {
    // a response that starts over partway through: the first attempt is the
    // value, as far as it can be read, and the second is the postscript…
    const first = parseAsJSON(`\
Here is the JSON output for the "Benefits" page:
{
"teamMemberName1": "John Doe",
"teamMemberJobTitle2": "Product  Here is the JSON output for the "Testimonials" page based on the provided props:
{
"teamMemberName1": "John Doe",
"teamMemberImage3": "/images/bob-johnson.jpg"
}`);
    expect(first).toEqual({
        postscript:
            'page based on the provided props:\n{\n"teamMemberName1": "John Doe",\n"teamMemberImage3": "/images/bob-johnson.jpg"\n}',
        preamble: 'Here is the JSON output for the "Benefits" page:',
        value: {
            teamMemberJobTitle2: 'Product  Here is the JSON output for the "Testimonials',
            teamMemberName1: 'John Doe',
        },
    });
    // …which can be parsed in its turn
    expect(parseAsJSON(first.postscript)).toEqual({
        postscript: '',
        preamble: 'page based on the provided props:',
        value: {
            teamMemberImage3: '/images/bob-johnson.jpg',
            teamMemberName1: 'John Doe',
        },
    });

    // a value is not passed over for a larger one that follows it
    expect(
        parseAsJSON(
            'Here: {"heading": "A", "sub": "B"} oops\nHere is the full one: {"heading": "A", "sub": "B", "body": "C"}',
        ),
    ).toEqual({
        postscript:
            'oops\nHere is the full one: {"heading": "A", "sub": "B", "body": "C"}',
        preamble: 'Here:',
        value: { heading: 'A', sub: 'B' },
    });
    expect(parseAsJSON('{"a": "b"} {"c": "d", "e": "f", "g": "h"}')).toEqual({
        postscript: '{"c": "d", "e": "f", "g": "h"}',
        preamble: '',
        value: { a: 'b' },
    });
    // nor is the root of a text that goes wrong partway through passed over for
    // what follows the mistake
    expect(parseAsJSON('{"a": ["b"\n-1, {"name": "Ann"')).toEqual({
        postscript: '-1, {"name": "Ann"',
        preamble: '',
        value: { a: ['b'] },
    });
}

function stripInvalidJSONTestCase() {
    const response = `\
  Here is the JSON output for the "Meet the Team" page:
{
"callToAction": "Learn More",
"heading": "Meet the Team",
"subheading": "Our bakery is built on the foundation of passionate individuals who are dedicated to creating the best sourdough bread in North Lake Tahoe. Meet the team behind Masa Madre."
[
"teamMembers": [
{
"name": "Jenny Lee",
"role": "Head Baker",
"description": "Jenny is the mastermind behind Masa Madre's delicious sourdough bread. With over 10 years of experience in the baking industry, she brings a wealth of knowledge and expertise to the table. Jenny's passion for sourdough bread is evident in every loaf she creates, and her dedication to using only the finest ingredients has earned her a loyal following of customers."
},
{
"name": "Emily Chen",
"role": "Marketing Manager",
"description": "Emily is the marketing genius behind Masa Madre's success. With a background in advertising and a passion for food, she has helped to create a strong brand identity for the bakery. Emily's creativity and attention to detail have been instrumental in building a loyal customer base."

]

}
`;
    expect(parseAsJSON(response).value).toEqual({
        callToAction: 'Learn More',
        heading: 'Meet the Team',
        subheading:
            'Our bakery is built on the foundation of passionate individuals who are dedicated to creating the best sourdough bread in North Lake Tahoe. Meet the team behind Masa Madre.',
    });

    // a comma that follows an opening bracket is not between two items or two
    // key/value pairs, so the text is read up to it
    expect(parseAsJSON('{"heading": "Hi", "tags": [, "a"]}')).toEqual({
        postscript: ', "a"]}',
        preamble: '',
        value: { heading: 'Hi', tags: [] },
    });
    expect(parseAsJSON('{"heading": "Hi", "link": {, "a": "b"}}')).toEqual({
        postscript: ', "a": "b"}}',
        preamble: '',
        value: { heading: 'Hi', link: {} },
    });
}

function trailingCommasTestCase() {
    const response = `\
{
"sectionTitle": "Meet the Team",
"item1Content": "Tom Ryder - Owner & Wine Director",
"item1AttributionLine1": "Learn more about Tom's passion for wine and his journey to opening Ryders",
"item1AttributionLine2": "Read about Tom's experience in the wine industry and his approach to curating Ryders' wine list",
"item2Content": "Sarah Johnson - Wine Educator",
"item2AttributionLine1": "Discover Sarah's background in wine and her role in educating customers at Ryders",
"item2AttributionLine2": "Learn about Sarah's favorite wine pairings and her recommendations for beginners",
}`;
    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble: '',
        value: {
            item1AttributionLine1:
                "Learn more about Tom's passion for wine and his journey to opening Ryders",
            item1AttributionLine2:
                "Read about Tom's experience in the wine industry and his approach to curating Ryders' wine list",
            item1Content: 'Tom Ryder - Owner & Wine Director',
            item2AttributionLine1:
                "Discover Sarah's background in wine and her role in educating customers at Ryders",
            item2AttributionLine2:
                "Learn about Sarah's favorite wine pairings and her recommendations for beginners",
            item2Content: 'Sarah Johnson - Wine Educator',
            sectionTitle: 'Meet the Team',
        },
    });

    // in an array, the comma is left out and what follows the array is read
    expect(parseAsJSON('{"tags":["a","b",],"x":"y"}')).toEqual({
        postscript: '',
        preamble: '',
        value: { tags: ['a', 'b'], x: 'y' },
    });
    // after an item of any kind, with or without whitespace before the bracket
    expect(
        parseAsJSON(`\
{
  "tags": [
    "a",
    "b",
  ],
  "sizes": [1, 2, ],
  "flags": [true, null,],
  "items": [
    { "name": "A" },
    ["b"],
  ]
}`),
    ).toEqual({
        postscript: '',
        preamble: '',
        value: {
            flags: [true, null],
            items: [{ name: 'A' }, ['b']],
            sizes: [1, 2],
            tags: ['a', 'b'],
        },
    });
    // in an array at the root, and in one inside it
    expect(parseAsJSON('["a", ["b", "c",], ]')).toEqual({
        postscript: '',
        preamble: '',
        value: ['a', ['b', 'c']],
    });
    // in a text that is unfinished
    expect(parseAsJSON('{"tags":["a","b",],"x":"y')).toEqual({
        postscript: '',
        preamble: '',
        value: { tags: ['a', 'b'], x: 'y' },
    });
    expect(parseAsJSON('{"tags":["a","b",]').value).toEqual({ tags: ['a', 'b'] });

    // in an object inside another, or inside an array, what follows it is read
    expect(parseAsJSON('{"a":{"b":"c",},"x":"y"}')).toEqual({
        postscript: '',
        preamble: '',
        value: { a: { b: 'c' }, x: 'y' },
    });
    expect(parseAsJSON('{"a": [{"b": "c",},], "d": "e"}')).toEqual({
        postscript: '',
        preamble: '',
        value: { a: [{ b: 'c' }], d: 'e' },
    });
    // after every item and every pair, as a model that writes them does
    expect(
        parseAsJSON(`\
{
  "items": [
    {
      "name": "A",
      "tags": ["x", "y",],
    },
    {
      "name": "B",
    },
  ],
  "total": 2,
}`),
    ).toEqual({
        postscript: '',
        preamble: '',
        value: {
            items: [{ name: 'A', tags: ['x', 'y'] }, { name: 'B' }],
            total: 2,
        },
    });
    // in an object at the root, the postscript starts after its closing brace
    expect(parseAsJSON('{"a":"b","c":"d",}\n\nHope this helps!')).toEqual({
        postscript: 'Hope this helps!',
        preamble: '',
        value: { a: 'b', c: 'd' },
    });
    // after the end of the root value, where the text ends on it
    expect(parseAsJSON('{"a": "b"},').value).toEqual({ a: 'b' });
    expect(parseAsJSON('{"a": true,},\n').value).toEqual({ a: true });
    expect(parseAsJSON('["a", "b",],').value).toEqual(['a', 'b']);
    // a comma that follows a key with no value yet is not a trailing one: that
    // key is given '', as it is where the text ends on it
    expect(parseAsJSON('{"c",}').value).toEqual({ c: '' });
    expect(parseAsJSON('{"a": 1, "c",}').value).toEqual({ a: 1, c: '' });
    expect(parseAsJSON('{"a": "b", "c",}').value).toEqual({ a: 'b', c: '' });
    expect(parseAsJSON('{"a": "b", "c":,}').value).toEqual({ a: 'b', c: '' });
    expect(parseAsJSON('{"a": ,}').value).toEqual({ a: '' });

    // only a comma is left out, and only where the bracket that closes its array
    // or object follows it: the text is read up to anything else that is not JSON
    expect(parseAsJSON('{"tags": ["a" x], "b": "c"}')).toEqual({
        postscript: 'x], "b": "c"}',
        preamble: '',
        value: { tags: ['a'] },
    });
    expect(parseAsJSON('{"tags": ["a", } and more')).toEqual({
        postscript: ', } and more',
        preamble: '',
        value: { tags: ['a'] },
    });
    expect(parseAsJSON('{"a": "b", ] and more')).toEqual({
        postscript: ', ] and more',
        preamble: '',
        value: { a: 'b' },
    });
}

function unescapedDoubleQuotesTestCase() {
    let response =
        '```json\n{"heading":"The Team","subheading":"Meet the Starters","items":[{"heading":"Offense","subheading":"Quarterbacks","items":[{"heading":"1","subheading":"Jared Goff","description":"Jared Goff is a 6\'4", 225-pound quarterback who was drafted by the Rams in the first round of the 2016 NFL Draft. He has been the starting quarterback for the Rams since his rookie season and has led the team to multiple playoff appearances.","imageURL":"/players/jared-goff.jpg","imageAlt":"Jared Goff","imageCaption":"Jared Goff in action","linkURL":"/players/jared-goff"}],';

    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble: '',
        value: {
            heading: 'The Team',
            items: [
                {
                    heading: 'Offense',
                    items: [
                        {
                            description:
                                'Jared Goff is a 6\'4", 225-pound quarterback who was drafted by the Rams in the first round of the 2016 NFL Draft. He has been the starting quarterback for the Rams since his rookie season and has led the team to multiple playoff appearances.',
                            heading: '1',
                            imageAlt: 'Jared Goff',
                            imageCaption: 'Jared Goff in action',
                            imageURL: '/players/jared-goff.jpg',
                            linkURL: '/players/jared-goff',
                            subheading: 'Jared Goff',
                        },
                    ],
                    subheading: 'Quarterbacks',
                },
            ],
            subheading: 'Meet the Starters',
        },
    });

    response =
        '```json\n{"items":[{"heading":"Our History","description":"Something Awful was founded in 1999 by Richard "Lowtax" Kyanka, who started the website as a humble message board for fans of video games. Over the years, it has grown into a popular comedy website, featuring blog entries, forums, feature articles, digitally edited pictures, and humorous media reviews. Today, Something Awful continues to be a hub for fans of all things geeky, providing them with a unique blend of humor and community.","imageURL":"/something-awful-history.jpg","imageAlt":"Something Awful Founder Richard \'Lowtax\' Kyanka"}]}\n```';

    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble: '',
        value: {
            items: [
                {
                    description:
                        'Something Awful was founded in 1999 by Richard "Lowtax" Kyanka, who started the website as a humble message board for fans of video games. Over the years, it has grown into a popular comedy website, featuring blog entries, forums, feature articles, digitally edited pictures, and humorous media reviews. Today, Something Awful continues to be a hub for fans of all things geeky, providing them with a unique blend of humor and community.',
                    heading: 'Our History',
                    imageAlt: "Something Awful Founder Richard 'Lowtax' Kyanka",
                    imageURL: '/something-awful-history.jpg',
                },
            ],
        },
    });
}

function unterminatedStringsAndInvalidNestingTestCase() {
    const response = `\
  Sure, here's an example JSON output for the "Services" section based on the provided information:
{
"bodyCopy": "At the Cleveland Clinic Wound Center in Vero Beach, Florida, our team of experienced healthcare professionals is dedicated to getting you back to your normal life as quickly as possible.
Here are some of the services we offer:
{
"contentList1": [
{
"title": "Surgical Debridement",
"description": "Surgical debridement is a procedure that involves removing dead tissue from a wound to promote healing. Our experienced surgeons use the latest techniques and technologies to ensure the best possible outcomes.",
"content": "Surgical debridement"
}
]

"contentList2": [
{
"title": "Other Services",
"description": "In addition to our core services, we also offer a range of other services to help you manage your wounds and promote healing. These include wound assessment and monitoring, pain management, and education on wound care and prevention.",
"content": "Other services"
}
]

"contentList3": [
{
"title": "Our Team",
"description": "Our team of experienced healthcare professionals is dedicated to providing high-quality, personalized care to help you recover and get back to your normal life as quickly as possible. Meet our team of experts today.",
"content": "Our team"
}
]

}}`;
    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble:
            'Sure, here\'s an example JSON output for the "Services" section based on the provided information:',
        value: {
            bodyCopy:
                'At the Cleveland Clinic Wound Center in Vero Beach, Florida, our team of experienced healthcare professionals is dedicated to getting you back to your normal life as quickly as possible.',
            'Here are some of the services we offer': {
                contentList1: [
                    {
                        content: 'Surgical debridement',
                        description:
                            'Surgical debridement is a procedure that involves removing dead tissue from a wound to promote healing. Our experienced surgeons use the latest techniques and technologies to ensure the best possible outcomes.',
                        title: 'Surgical Debridement',
                    },
                ],
                contentList2: [
                    {
                        content: 'Other services',
                        description:
                            'In addition to our core services, we also offer a range of other services to help you manage your wounds and promote healing. These include wound assessment and monitoring, pain management, and education on wound care and prevention.',
                        title: 'Other Services',
                    },
                ],
                contentList3: [
                    {
                        content: 'Our team',
                        description:
                            'Our team of experienced healthcare professionals is dedicated to providing high-quality, personalized care to help you recover and get back to your normal life as quickly as possible. Meet our team of experts today.',
                        title: 'Our Team',
                    },
                ],
            },
        },
    });

    // the line is made a key however the string was repaired before it: with no
    // line break, with several, or with an escaped backslash before one
    for (const [body, value] of [
        ['We care. ', 'We care.'],
        ['We care.\n\nWe heal.\n', 'We care.\n\nWe heal.'],
        ['In C:\\\\\nWe care.\n', 'In C:\\\nWe care.'],
    ]) {
        expect(
            parseAsJSON(
                `{"a": "b",\n"body": "${body}Here is what we offer:\n{\n"c": "d"\n}}`,
            ),
        ).toEqual({
            postscript: '',
            preamble: '',
            value: { a: 'b', body: value, 'Here is what we offer': { c: 'd' } },
        });
    }

    // a string that is itself a key is not cut there: the read ends inside it, as
    // it does wherever a text stops inside a key
    expect(
        parseAsJSON(
            'Here is the JSON output for the "Benefits{" page:\n{\n"teamMemberName1": "John Doe"\n}',
        ).value,
    ).toEqual({ teamMemberName1: 'John Doe' });
    // …which keeps what was read before that key, and leaves the rest unread
    expect(parseAsJSON('{"a": "b",\n"Options:\n{\n"c": "d"\n}}')).toEqual({
        postscript: '{\n"c": "d"\n}}',
        preamble: '',
        value: { a: 'b' },
    });
}

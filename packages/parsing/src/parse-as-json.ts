type IndexOfClosestCharFullPayload = {
    char: string;
    chars: Array<string> | Set<string>;
    index?: number; // defaults to last character in text
    step?: number; // defaults to 1
    text: string;
};

type IndexOfClosestCharPayload =
    | Optional<IndexOfClosestCharFullPayload, 'char'>
    | Optional<IndexOfClosestCharFullPayload, 'chars'>;

type Optional<Type, Key extends keyof Type> = Omit<Type, Key> & Partial<Pick<Type, Key>>;

const WHITESPACE_CHARS = new Set([' ', '\n', '\r', '\t']);

type FollowedByFullPayload = Omit<IndexOfClosestCharFullPayload, 'step'>;

type FollowedByPayload =
    | Optional<FollowedByFullPayload, 'char'>
    | Optional<FollowedByFullPayload, 'chars'>;

// a helper function that takes a start index, a char or chars representing
// the next non-whitespace character to look for, and the text itself.
function indexOfClosestChar({
    char,
    chars,
    step = 1,
    text,
    index = step < 0 ? text.length : text.length - 1,
}: IndexOfClosestCharPayload) {
    const charsSet = chars instanceof Set ? chars : chars ? new Set(chars) : null;
    for (index += step; index >= 0 && index < text.length; index += step) {
        const nextCharacter = text[index];
        // if this is a match, return true
        if (char && nextCharacter === char) return index;
        if (charsSet && charsSet.has(nextCharacter)) return index;
        // if this is not a match but it is a whitespace character, keep iterating
        if (WHITESPACE_CHARS.has(nextCharacter)) continue;

        return -1;
    }

    return -1;
}

function isFollowedBy(payload: FollowedByPayload) {
    return indexOfClosestChar(payload) > -1;
}

function isPreceededBy(payload: FollowedByPayload) {
    return indexOfClosestChar({ ...payload, step: -1 }) > -1;
}

const VALUE_DELIMITER_CHARS = new Set([
    '"',
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
]);

const VALUE_START_CHARS = new Set([...VALUE_DELIMITER_CHARS, '{', '[']);
const VALUE_END_CHARS = new Set([...VALUE_DELIMITER_CHARS, '}', ']']);
// what a [ has to be followed by to be taken for the start of an array rather
// than part of the preamble: a quote mark, a digit, or a bracket of either kind
const ARRAY_BODY_START_CHARS = new Set([...VALUE_START_CHARS, ']', '}']);

// a bare literal (true, false, null, or a number) starts with one of these…
const LITERAL_START_CHARS = new Set('-0123456789fnt');
// …and ends with one of these (outside of a string, nothing else has letters)
const LITERAL_END_CHARS = new Set('0123456789el');
// …and is over once one of these follows it
const LITERAL_DELIMITER_CHARS = new Set([...WHITESPACE_CHARS, ',', ']', '}']);
// …and, as an item in an array, follows one of these
const ITEM_OPENING_CHARS = new Set('[,');

// what a comma can come between: any of the values above, or a bare literal
const ITEM_START_CHARS = new Set([...VALUE_START_CHARS, ...LITERAL_START_CHARS]);
const ITEM_END_CHARS = new Set([...VALUE_END_CHARS, ...LITERAL_END_CHARS]);
// the end of a string or of a bare literal
const SCALAR_END_CHARS = new Set(['"', ...LITERAL_END_CHARS]);

const LITERAL_PATTERN = 'true|false|null|-?(?:0|[1-9]\\d*)(?:\\.\\d+)?(?:[eE][+-]?\\d+)?';
const LITERAL_REGEXP = new RegExp(LITERAL_PATTERN, 'y');
// a comma and the next array item, where that item is not a string: the start
// of an object or array, or a whole bare literal
const NEXT_ITEM_REGEXP = new RegExp(
    `\\s*,\\s*(?:[{[]|(?:${LITERAL_PATTERN})\\s*[,\\]])`,
    'y',
);
// the start of a bare literal that runs to the end of the text
const UNFINISHED_LITERAL_REGEXP =
    /(?:t(?:ru?)?|f(?:a(?:ls?)?)?|n(?:ul?)?|-?\d*(?:\.\d*)?(?:[eE][+-]?\d*)?)$/y;

// the key that a text ends on, with its colon and the comma that precedes it
const LAST_KEY_REGEXP = /,?\s*"(?:[^"\\]|\\.)*"\s*:\s*$/;
const LAST_COMMA_REGEXP = /,?\s*$/;
// the key that a text ends on, if it has no colon or value yet (a key follows a
// brace or a comma, and may hold escaped quote marks, as may a value, in which
// a comma and a quote mark are not the start of one)
const LAST_KEY_WITHOUT_VALUE_REGEXP = /[{,]\s*"(?:[^"\\]|\\.)*"\s*$/;
// the key that a text ends partway through (on a backslash, if it ends on the
// start of an escape sequence), with the brace or comma before it
const UNFINISHED_KEY_REGEXP = /([{,])\s*"(?:[^"\\]|\\.)*\\?$/;

type GenericObject = Record<string, unknown>;

// the last index at which the text has a quote mark, the separator, and then
// (after no more than one space) another quote mark, no further back than minIndex
function lastIndexOfSeparator(text: string, separator: string, minIndex: number) {
    const start = '"' + separator;
    let index = text.lastIndexOf(start);
    while (index > -1 && index >= minIndex) {
        const next = text[index + 2];
        if (next === '"' || (next === ' ' && text[index + 3] === '"')) return index;
        index = index === 0 ? -1 : text.lastIndexOf(start, index - 1);
    }
    return -1;
}

// whether the last string in the text is a key or a value, going by which ended
// later: a string that a colon and another string follow, or a comma and one
export function getPreviousStringType(text: string): 'KEY' | 'VALUE' | null {
    const lastEndKeyIndex = lastIndexOfSeparator(text, ':', 0);
    // the end of a value only matters if it is after the end of the last key, so
    // look no further back than that (the whole text, at every comma, adds up)
    const lastEndValueIndex = lastIndexOfSeparator(
        text,
        ',',
        Math.max(lastEndKeyIndex, 0),
    );
    // if cannot determine the type, return null
    if (lastEndKeyIndex <= 0 && lastEndValueIndex <= 0) return null;
    // if last token is an array
    const lastEndIndex = Math.max(lastEndKeyIndex, lastEndValueIndex);
    if (text.indexOf(']', lastEndIndex + 1) > -1) return null;

    return lastEndValueIndex > lastEndKeyIndex ? 'VALUE' : 'KEY';
}

function isValidContext({
    char,
    controlChar,
    original,
    originalIndex,
    text,
}: {
    char: string;
    controlChar?: string;
    original: string;
    originalIndex: number;
    text: string;
}) {
    const index = text.length - 1 + char.length;
    switch (char) {
        case ' ':
        case '\r':
        case '\n':
        case '\t':
            return true;
        case ',':
            // valid context for a comma in an array is in between array items
            if (controlChar === ']') {
                return (
                    isPreceededBy({ chars: ITEM_END_CHARS, index, text }) &&
                    isFollowedBy({
                        chars: ITEM_START_CHARS,
                        index: originalIndex,
                        text: original,
                    })
                );
            }
            // valid context for a comma in an object is in between key/value pairs
            if (controlChar === '}') {
                return (
                    isPreceededBy({ chars: ITEM_END_CHARS, index, text }) &&
                    isFollowedBy({
                        char: '"',
                        index: originalIndex,
                        text: original,
                    })
                );
            }
            return true;
        case ':':
            return controlChar === '}' && isPreceededBy({ char: '"', index, text });
        case '"':
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
            if (text.length === 0) return true; // 1st character in text is a valid context
            if (controlChar === ']') return true; // as an item inside an array is a valid context
            if (controlChar === '}') return true; // as key or value inside an object is a valid context
            return false;
        case '[':
        case '{':
            if (text.length === 0) return true; // 1st character in text is a valid context
            if (controlChar === ']') return true; // as an item inside an array is a valid context
            // as the value of a key/value pair is a valid context
            return isPreceededBy({ char: ':', index, text });
        case ']':
        case '}':
            return char === controlChar;
        default:
            return false;
    }
}

// a bare literal can only stand where a value is due: as an item in an array,
// or after the colon that follows a key in an object
function isValueDue({ controlChar, text }: { controlChar?: string; text: string }) {
    if (controlChar === ']') return isPreceededBy({ chars: ITEM_OPENING_CHARS, text });
    return controlChar === '}' && isPreceededBy({ char: ':', text });
}

// a sticky regular expression matches at its lastIndex only
function matchAt({
    index,
    regexp,
    text,
}: {
    index: number;
    regexp: RegExp;
    text: string;
}) {
    regexp.lastIndex = index;
    return regexp.exec(text)?.[0];
}

// get the length of anything (vs JSON.stringify: https://jsperf.app/qisaso/2)
function lengthOf(item: unknown): number {
    switch (typeof item) {
        case 'number':
            return 1;
        case 'object':
            if (!item) return 0;
            if (Array.isArray(item)) {
                return item.reduce(
                    (acc: number, _item) => acc + lengthOf(_item),
                    0,
                ) as number;
            }
            return Object.keys(item).reduce(
                (acc, key) => acc + key.length + lengthOf((item as GenericObject)[key]),
                0,
            );
        case 'string':
            return item.length;
        default:
            return 0;
    }
}

// Reads the bare literal (true, false, null, or a number) that starts at index.
// Returns it once the text shows it to be whole, an empty string if the text
// ends partway through it, and null if what starts there is not a literal.
function readLiteral({
    index,
    isEndDelimited,
    text,
}: {
    index: number;
    isEndDelimited: boolean; // whether anything followed the end of the text
    text: string;
}) {
    const literal = matchAt({ index, regexp: LITERAL_REGEXP, text });
    if (literal) {
        const endIndex = index + literal.length;
        if (endIndex < text.length) {
            if (LITERAL_DELIMITER_CHARS.has(text[endIndex])) return literal;
        } else if (isEndDelimited || /^[tfn]/.test(literal)) {
            // true, false, and null are whole as soon as they are spelled out, but
            // a number that the text ends on may have more digits still to come
            return literal;
        }
    }
    const isUnfinished =
        matchAt({ index, regexp: UNFINISHED_LITERAL_REGEXP, text }) != null;
    return isUnfinished ? '' : null;
}

// drops the escape sequence that a string ends partway through, if it does
// (an even number of backslashes is escaped backslashes, which are whole)
function dropUnfinishedEscape(text: string) {
    const escape = UNFINISHED_ESCAPE_REGEXP.exec(text);
    if (escape == null || escape[1].length % 2 === 0) return text;
    return text.slice(0, escape.index + escape[1].length - 1);
}

// whether the character at index is escaped, which it is if it follows an odd
// number of backslashes (an even number is escaped backslashes, which are whole)
function isEscaped(text: string, index: number) {
    let backslashIndex = index - 1;
    while (text[backslashIndex] === '\\') backslashIndex--;
    return (index - backslashIndex) % 2 === 0;
}

// the index of the quote mark that closes the string that opens at index, or -1
// if the text ends first
function indexOfStringEnd(text: string, index: number) {
    let endIndex = text.indexOf('"', index + 1);
    while (endIndex > -1 && isEscaped(text, endIndex)) {
        endIndex = text.indexOf('"', endIndex + 1);
    }
    return endIndex;
}

// Closes a text that is JSON as far as it goes, by the rules that the repairs in
// parseAsJSON follow: a string is closed where it stops (less an escape sequence
// that it ends partway through); a key, or a bare literal, that the text ends
// partway through is left out; and a key with no value yet is given ''.
//
// Only strings and brackets are followed, so what is returned may not be valid
// JSON. Returns null for a text that leaves nothing open, for one that does not
// start with an object or array, and for one where what is left out is not the
// start of a member (since nothing else would catch that).
function closeJSON({ isEndDelimited, text }: { isEndDelimited: boolean; text: string }) {
    if (text[0] !== '{' && text[0] !== '[') return null;
    // the brackets that are open, as the characters that close them
    const stack: Array<string> = [];
    // how far the last member of an object, or item in an array, has got…
    let progress: 'colon' | 'key' | 'none' | 'value' = 'none';
    // …and where it starts, which is at a comma or an opening bracket
    let memberIndex = 0;
    // where the bare literal that the text ends on starts
    let literalIndex = -1;
    // where the text is to be cut, and what is to follow it there
    let endIndex = text.length;
    let ending = '';
    // what would make valid JSON of a member that is left out
    let memberEnding = '';

    for (let index = 0; index < text.length; index++) {
        const char = text[index];
        if (char === '"') {
            const isKey: boolean = progress === 'none' && stack.at(-1) === '}';
            const stringEndIndex = indexOfStringEnd(text, index);
            if (stringEndIndex === -1) {
                // the text ends inside this string
                endIndex = index + dropUnfinishedEscape(text.slice(index)).length;
                if (isKey) {
                    memberEnding = '": 0';
                } else {
                    ending = '"';
                    progress = 'value';
                }
                break;
            }
            index = stringEndIndex;
            progress = isKey ? 'key' : 'value';
        } else if (char === '{' || char === '[') {
            stack.push(char === '{' ? '}' : ']');
            progress = 'none';
            memberIndex = index;
        } else if (char === '}' || char === ']') {
            stack.pop();
            // whether this is where the text ends or not, nothing is left open
            if (stack.length === 0) return null;
            progress = 'value';
        } else if (char === ',') {
            progress = 'none';
            memberIndex = index;
        } else if (char === ':') {
            progress = 'colon';
        } else if (!WHITESPACE_CHARS.has(char)) {
            if (literalIndex === -1) literalIndex = index;
            continue;
        }
        literalIndex = -1;
    }

    const controlChar = stack.at(-1);
    if (literalIndex > -1) {
        const literal = readLiteral({ index: literalIndex, isEndDelimited, text });
        if (literal == null) return null;
        if (literal === '') {
            // the text ends partway through the literal, so the member that it is
            // the value of is left out
            progress = 'none';
            endIndex = literalIndex;
            memberEnding = '0';
        } else {
            progress = 'value';
        }
    }
    if (progress === 'none') {
        // leave out what there is of the member, and the comma that it follows,
        // as long as it would be a member had the text gone on
        if (memberEnding !== '') {
            const member = text.slice(memberIndex + 1, endIndex) + memberEnding;
            if (!isJSON(controlChar === '}' ? `{${member}}` : `[${member}]`)) return null;
        }
        endIndex = text[memberIndex] === ',' ? memberIndex : memberIndex + 1;
    } else if (progress === 'key') {
        ending = ': ""';
    } else if (progress === 'colon') {
        ending = '""';
    }

    return text.slice(0, endIndex) + ending + stack.reverse().join('');
}

function isJSON(text: string) {
    try {
        JSON.parse(text);
        return true;
    } catch (error) {
        return false;
    }
}

// the value of a text that is JSON as far as it goes, or undefined if it isn’t
// (exported for its tests; the package’s own export is parseAsJSON)
export function parseUnfinishedJSON(payload: { isEndDelimited: boolean; text: string }) {
    const closedText = closeJSON(payload);
    if (closedText == null) return undefined;
    try {
        return JSON.parse(closedText) as ParsedValue;
    } catch (error) {
        return undefined;
    }
}

const hasTextContent = (text: string) => /\w/.test(text);

// LLMs often demarcate the JSON part of the response with ``` or ```json
const cleanThinkingText = (preamble: string) =>
    preamble
        .trim()
        .replace(/^```(?:[a-z0-9]{1,9})?$/im, '')
        .trim();

const FENCED_CODE_BLOCK_REGEXP =
    /^([ \t]*)```(?:[a-z0-9_-]{1,20})?[ \t]*\n([\s\S]*?)\n\1```[ \t]*$/i;

const getObjectKeyFromIndex = (index: number) =>
    `"key${index === 1 ? '' : '-' + index}":`;

const OBJECT_KEY_REGEXP = /^\s*"[^"]+":/;

const CONTROL_TOKENS_REGEXP = /(^<\|im_start\|>|<\|im_end\|>$)/;

// the backslashes that a text ends on, or that precede the unicode escape it
// ends partway through
const UNFINISHED_ESCAPE_REGEXP = /(\\+)(?:u[0-9a-fA-F]{0,3})?$/;

type ParsedValue = Array<unknown> | boolean | GenericObject | number | string;
// naming from https://www.oreilly.com/library/view/prompt-engineering-for/9781098156145/ch07.html
type ParsedResult = {
    postscript: string;
    preamble: string;
    value: null | ParsedValue;
};

export function parseAsJSON(text: string): ParsedResult {
    return parseText(text, false);
}

// isEndDelimited is whether anything is known to have followed the text, as it
// is from the outset for what is left of a text that something followed
function parseText(text: string, isEndDelimited: boolean): ParsedResult {
    let preamble = '';
    let postscript = '';
    if (text == null) {
        text = '';
    } else {
        const input = text;
        text = text.replace(CONTROL_TOKENS_REGEXP, '').trim();
        // if payload is entirely wrapped in a fenced code block, unwrap it first
        const fencedBlockMatch = text.match(FENCED_CODE_BLOCK_REGEXP);
        const fencedContent = fencedBlockMatch?.[2]?.trim();
        if (fencedContent) {
            text = fencedContent;
        }
        // if anything followed the text (whitespace, a control token, or the end
        // of a code block), then a number that the text ends on is a whole one
        if (!input.endsWith(text)) isEndDelimited = true;
    }
    // if the input is empty, use value: null to indicate failure
    if (text === '') return { postscript, preamble, value: null };

    // attempt to parse the string as-is (minus control tokens), unless it opens
    // an object or array and does not end by closing one, in which case it can’t
    // be whole (and is likely to be a response that is still streaming in)
    const lastChar = text.at(-1);
    if ((text[0] !== '{' && text[0] !== '[') || lastChar === '}' || lastChar === ']') {
        try {
            return { postscript, preamble, value: JSON.parse(text) as ParsedValue };
        } catch (error) {
            // let’s try to fix it
        }
    }

    // if it is JSON as far as it goes, closing what it leaves open is all it needs
    const firstText = text;
    const unfinishedValue = parseUnfinishedJSON({ isEndDelimited, text });
    if (unfinishedValue !== undefined) {
        return { postscript, preamble, value: unfinishedValue };
    }

    // if this is a two-column markdown table, convert it to JSON key/value pairs
    text = text.replace(
        /^\| (.+?) \| (.+?)(?: \|)+$/gm,
        (_match, key: string, value: string) =>
            `"${key.replace(/(^"|"$)/g, '')}": "${value.replace(/(^"|"$)/g, '')}",`,
    );

    // initialize variables
    const stack: Array<string> = [];
    let isInsideString = false;
    let newText = '';

    // identify start of JSON
    let previousText;
    do {
        if (previousText) {
            preamble += previousText.substring(0, previousText.length - text.length);
        }
        previousText = text;
        // if text starts with a control char, it didn’t pass the while condition
        // (unless it opens an object onto a key, which is where the JSON starts
        // even when that key is as far as the text goes)
        text = text.replace(/^(?!\{\s*")[[{"]?[^[{"]+/, '');
    } while (
        previousText !== text &&
        // if new start is [, ensure it’s an array & not part of preamble
        ((text[0] === '[' &&
            !isFollowedBy({ chars: ARRAY_BODY_START_CHARS, index: 0, text })) ||
            // if new start is ", ensure it’s a JSON string & not part of preamble
            (text[0] === '"' && !OBJECT_KEY_REGEXP.test(text)))
    );

    const extraPreamble = previousText.substring(0, previousText.length - text.length);
    if (hasTextContent(extraPreamble)) {
        preamble += extraPreamble;
    }
    preamble = cleanThinkingText(preamble);

    // if the first character is a key, add opening curly brace
    if (OBJECT_KEY_REGEXP.test(text)) {
        text = '{' + text;
    }

    // if the text has changed since closing it was first tried (rows of a table
    // were converted, a preamble or the opening of a code block was taken off,
    // or a missing first brace was added), it may now be JSON as far as it goes
    if (text !== firstText) {
        const remainingValue = parseUnfinishedJSON({ isEndDelimited, text });
        if (remainingValue !== undefined) {
            return { postscript, preamble, value: remainingValue };
        }
    }

    const originalText = text;
    let textLengthDelta = 0;
    let index = 0;
    // process each character in the string one at a time
    for (; index < text.length; index++) {
        let char = text[index];
        if (isInsideString) {
            if (char === '"' && !isEscaped(text, index)) {
                // set state to not insideString (will set back to true if is unescaped quote mark)
                isInsideString = false;
                // if quote mark is followed by ':', ', "', or new line, treat it as a string terminus
                // (as it is in an array, if followed by a next item that is not a string)
                if (
                    !/^( ?:|, ?"|,?\n)/.test(text.substring(index + 1)) &&
                    !(
                        stack.at(-1) === ']' &&
                        matchAt({ index: index + 1, regexp: NEXT_ITEM_REGEXP, text })
                    )
                ) {
                    const nextQuoteMarkIndex = text.indexOf('"', index + 1);
                    if (nextQuoteMarkIndex > index + 1) {
                        const lastControlChar = stack.at(-1);
                        const nextControlCharIndex = lastControlChar
                            ? text.indexOf(lastControlChar, index + 1)
                            : -1;
                        // does a closing control char occur before the next quote mark?
                        if (
                            !lastControlChar ||
                            nextControlCharIndex === -1 ||
                            nextControlCharIndex > nextQuoteMarkIndex
                        ) {
                            const nextNewLineIndex = text.indexOf('\n', index + 1);
                            isInsideString =
                                nextNewLineIndex === -1 ||
                                nextNewLineIndex > nextQuoteMarkIndex;
                        }
                    }
                }

                if (isInsideString) {
                    char = '\\"';
                } else {
                    // ensure the closing quote is followed by a comma if a new string follows
                    if (isFollowedBy({ char: '"', index, text })) {
                        char = '",';
                    }
                }
            } else if (char === '\n') {
                const controlCharIndex = indexOfClosestChar({
                    chars: ['{', '['],
                    index,
                    text,
                });

                if (controlCharIndex > index && text[controlCharIndex]) {
                    // if not escaped, but a new control structure is next, break out
                    isInsideString = false;

                    // if this is a valid context for a control char, just break out of the string
                    if (
                        isValidContext({
                            char: text[controlCharIndex],
                            controlChar: stack.at(-1),
                            original: text,
                            originalIndex: controlCharIndex,
                            text: newText + '"',
                        })
                    ) {
                        char = '",';
                    } else {
                        // if not valid context for new object/array, find an existing key or add one
                        const lastColonIndex = indexOfClosestChar({
                            char: ':',
                            index,
                            step: -1,
                            text,
                        });
                        if (
                            lastColonIndex > -1 &&
                            stack.at(-1) === '}' &&
                            UNFINISHED_KEY_REGEXP.test(newText)
                        ) {
                            // the string is a key: end the read inside it, as where
                            // the text stops inside any key
                            isInsideString = true;
                            break;
                        }
                        if (lastColonIndex > -1) {
                            // convert last bit of text into a key (its colon is the
                            // last one in newText, since only whitespace follows it)
                            const colonIndex = newText.lastIndexOf(':');
                            const minimumStartIndex = newText.lastIndexOf('"') + 1;
                            const lastLineStartIndex = newText.lastIndexOf('\\n') + 2;
                            const lastSentenceStartIndex = newText.lastIndexOf('. ') + 2;
                            const lastWordStartIndex = newText.lastIndexOf(' ') + 1;
                            const keyStartIndex = Math.min(
                                Math.max(
                                    lastLineStartIndex,
                                    lastSentenceStartIndex,
                                    minimumStartIndex,
                                ),
                                lastWordStartIndex,
                            );
                            newText =
                                newText
                                    .substring(0, keyStartIndex)
                                    .replace(/(\\n|\s)+$/, '') +
                                '", "' +
                                newText.substring(keyStartIndex, colonIndex) +
                                '"' +
                                newText.substring(colonIndex);
                        } else if (getPreviousStringType(newText) === 'VALUE') {
                            // if previous string is a value, convert current string into a key
                            char = '":';
                        } else {
                            // if no key was found, add one
                            let keyIndex = 1;
                            while (text.includes(getObjectKeyFromIndex(keyIndex))) {
                                keyIndex++;
                            }
                            char = `", ${getObjectKeyFromIndex(keyIndex)} `;
                        }
                    }
                } else if (OBJECT_KEY_REGEXP.test(text.substring(index + 1))) {
                    // if not escaped but we seem to no longer be in a string, break out
                    char = '",\n';
                } else {
                    // if not escaped, escape the newline character now
                    char = '\\n';
                    // check if there is already an extraneous escape character
                    if (isEscaped(text, index)) {
                        newText = newText.slice(0, -1);
                    }
                }
            }
        } else {
            const controlChar = stack.at(-1);
            // read a bare literal (true, false, null, or a number) as a whole
            if (
                LITERAL_START_CHARS.has(char) &&
                isValueDue({ controlChar, text: newText })
            ) {
                const literal = readLiteral({ index, isEndDelimited, text });
                if (literal === '') {
                    // the text ends partway through the literal, so its value is not
                    // yet known: leave it out (with its key) rather than guess at it
                    newText = newText.replace(
                        controlChar === '}' ? LAST_KEY_REGEXP : LAST_COMMA_REGEXP,
                        '',
                    );
                    index = text.length;
                    break;
                }
                if (literal != null) {
                    newText += literal;
                    index += literal.length - 1;
                    continue;
                }
            }

            const validContextPayload = {
                char,
                controlChar,
                original: text,
                originalIndex: index,
                text: newText,
            };
            // handle invalid characters outside of a string value
            if (!isValidContext(validContextPayload)) {
                // a trailing comma (one that the end of its array or object
                // follows) is left out, and the text is read on from there, unless
                // in an object it follows a key with no value yet (given '' below)
                if (
                    char === ',' &&
                    controlChar != null &&
                    isFollowedBy({ char: controlChar, index, text }) &&
                    (controlChar === ']' ||
                        (isPreceededBy({ chars: ITEM_END_CHARS, text: newText }) &&
                            !LAST_KEY_WITHOUT_VALUE_REGEXP.test(newText)))
                ) {
                    continue;
                }
                // if previous character was a comma, remove it
                const trailingPayload = { char: ',', step: -1, text: newText };
                const trailingCommaIndex = indexOfClosestChar(trailingPayload);
                if (trailingCommaIndex > 0) {
                    newText = newText.substring(0, trailingCommaIndex);
                }
                break;
            }

            if (char === '"') {
                isInsideString = true;
            } else if (char === '{') {
                stack.push('}');
            } else if (char === '[') {
                stack.push(']');
            } else if (char === '}' || char === ']') {
                if (stack.length && stack.at(-1) === char) {
                    if (char === '}' && stack.length === 1) {
                        // if this is the last closing brace, it should be the end of the JSON.
                        // if it is followed by a key, skip this closing brace and continue to process.
                        const commaIndex = indexOfClosestChar({
                            char: ',',
                            index,
                            text,
                        });
                        const startIndex = commaIndex > index ? commaIndex : index;
                        const quoteIndex = indexOfClosestChar({
                            char: '"',
                            index: startIndex,
                            text,
                        });
                        const maybeKey = quoteIndex > index ? text.slice(quoteIndex) : '';
                        if (OBJECT_KEY_REGEXP.test(maybeKey)) {
                            // if missing a comma, add it here
                            if (
                                quoteIndex > startIndex &&
                                !text.slice(startIndex, quoteIndex).includes(',')
                            ) {
                                newText += ',';
                            }
                            continue;
                        }
                    }

                    stack.pop();
                    // ensure that we have a trailing comma if needed
                    if (isFollowedBy({ chars: ['"', '{', '['], index, text })) {
                        newText += char;
                        char = ',';
                    }
                }
            } else if (char === ',' && stack.at(-1) === '}') {
                // ensure comma follows a full key/value pair
                // if not, convert current string into a key and add an empty value
                // (only a string can be a key: after a number, object, or array,
                // the previous string type is that of an earlier pair)
                if (
                    isPreceededBy({ char: '"', text: newText }) &&
                    getPreviousStringType(newText) === 'VALUE'
                ) {
                    char = ': "",';
                }
            } else if (char === '\n') {
                // treat new lines outside strings as separators
                const remainingText = text.substring(index + 1);
                // first, check if there is a missing opening quote mark in rest of text
                // (a bare literal where a value is due is not missing one)
                if (
                    /^[a-zA-Z]/.test(remainingText) &&
                    !(
                        isValueDue({ controlChar, text: newText }) &&
                        readLiteral({ index: index + 1, isEndDelimited, text }) != null
                    )
                ) {
                    text = text.substring(0, index + 1) + '"' + remainingText;
                    textLengthDelta++;
                }
                // if a comma is missing but needed, add one now
                if (
                    (isPreceededBy({ chars: SCALAR_END_CHARS, text: newText }) &&
                        isFollowedBy({ char: '"', index, text })) ||
                    (isPreceededBy({ char: '}', text: newText }) &&
                        isFollowedBy({ char: '{', index, text })) ||
                    (isPreceededBy({ char: ']', text: newText }) &&
                        isFollowedBy({ char: '[', index, text }))
                ) {
                    char = ',';
                }
            }
        }

        // append the processed character to the new string
        newText += char;
    }

    if (isInsideString && stack.at(-1) === '}' && UNFINISHED_KEY_REGEXP.test(newText)) {
        // if the text ends partway through a key, the key it would become is not
        // yet known: leave it out rather than close it as a key of another name
        newText = newText.replace(UNFINISHED_KEY_REGEXP, (_match, opener: string) =>
            opener === '{' ? opener : '',
        );
    } else if (isInsideString) {
        // if we’re still inside a string, close it
        newText = dropUnfinishedEscape(newText) + '"';
    }

    if (stack.at(-1) === '}') {
        // if we are in the key of a key/value pair, append ': ""' to close the pair
        if (LAST_KEY_WITHOUT_VALUE_REGEXP.test(newText)) {
            newText += ': ""';
        } else if (/": ?$/.test(newText)) {
            // if we are in between a key/value pair, append '""' to close the pair
            newText += '""';
        }
    }

    // a comma that the text ends on separates nothing, so it is left out (the
    // walk only keeps one there after the end of the root value)
    newText = newText.replace(LAST_COMMA_REGEXP, '');

    // close any remaining open structures in the reverse order that they were opened
    for (let stackIndex = stack.length - 1; stackIndex >= 0; stackIndex--) {
        newText += stack[stackIndex];
    }

    // attempt to parse the modified string as JSON
    let value = null;
    try {
        value = JSON.parse(newText) as ParsedValue;
    } catch (error) {
        // in case of error, check remainder of text, else return value: null
    }

    // if there’s still unparsed text and parsing failed or its more than ½
    // what we already parsed, the model might’ve restarted partway through.
    // try parsing the rest to see if we get a larger result and use it if so.
    postscript = originalText.substring(index - textLengthDelta).trim();
    // if postscript doesn’t have any actual content, empty it
    if (!hasTextContent(postscript)) {
        postscript = '';
    }
    // eslint-disable-next-line typescript/strict-boolean-expressions
    if (postscript.length > 5 && (!value || postscript.length > index)) {
        // (the rest runs to the end of the text, so what followed one followed both)
        const { postscript: remainingPostscript, value: remainingValue } = parseText(
            postscript,
            isEndDelimited,
        );
        // eslint-disable-next-line typescript/strict-boolean-expressions
        if (remainingValue) {
            // eslint-disable-next-line typescript/strict-boolean-expressions
            if (!value)
                return {
                    postscript: cleanThinkingText(remainingPostscript),
                    preamble,
                    value: remainingValue,
                };
            // choose whichever has more keys (or, if equal, more characters)
            if (
                typeof value === 'object' &&
                typeof remainingValue === 'object' &&
                !Array.isArray(value) &&
                !Array.isArray(remainingValue)
            ) {
                const keysLength = Object.keys(value).length;
                const remainingKeysLength = Object.keys(remainingValue).length;
                if (keysLength > remainingKeysLength) {
                    return { postscript: cleanThinkingText(postscript), preamble, value };
                }
                if (remainingKeysLength > keysLength) {
                    return {
                        postscript: cleanThinkingText(remainingPostscript),
                        preamble,
                        value: remainingValue,
                    };
                }
            }
            // if not objects or same number of keys, choose longer item
            if (lengthOf(remainingValue) > lengthOf(value)) {
                return {
                    postscript: cleanThinkingText(remainingPostscript),
                    preamble,
                    value: remainingValue,
                };
            }
        }
    }

    return { postscript: cleanThinkingText(postscript), preamble, value };
}

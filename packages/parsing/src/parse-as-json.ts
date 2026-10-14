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

// a bare literal (true, false, null, or a number) starts with one of these…
const LITERAL_START_CHARS = new Set('-0123456789fnt');
// …and ends with one of these (outside of a string, nothing else has letters)
const LITERAL_END_CHARS = new Set('0123456789el');
// …and is over once one of these follows it
const LITERAL_DELIMITER_CHARS = new Set([...WHITESPACE_CHARS, ',', ']', '}']);
// …and, as an item in an array, follows one of these
const ITEM_OPENING_CHARS = new Set('[,');
// what a value follows, as an item in an array or after its key in an object
const VALUE_OPENING_CHARS = new Set([...ITEM_OPENING_CHARS, ':']);

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

// Whether what comes before the comma or closing brace at index, in an object,
// is a key with no value: a string (the one that opens at stringIndex) that no
// colon comes before, so that it stands where a key is due. Which of the two
// was left out, its value or its own key, can’t be told from the text, and it
// is kept as a key either way.
//
// Not as the first member of the root, though: with no colon after it, a brace
// and a string are how a set is written (`{"a", "b"}`), which is no more JSON
// where a value would stand than it is in a preamble (see isStartOfJSON).
function isAfterKeyWithoutValue({
    index,
    isRoot,
    stringIndex,
    text,
}: {
    index: number;
    isRoot: boolean;
    stringIndex: number;
    text: string;
}) {
    return (
        isPreceededBy({ char: '"', index, text }) &&
        !isPreceededBy({ char: ':', index: stringIndex, text }) &&
        !(isRoot && isPreceededBy({ char: '{', index: stringIndex, text }))
    );
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

// a comment, which JSON has none of: the rest of a line from `//`, or all from
// `/*` to `*/` (or to the end of the text, while it is not closed)
const COMMENT_REGEXP = /\/(?:\/[^\n]*|\*[^]*?(?:\*\/|$))/y;
// What a comment comes after: a line break, a comma or a bracket, or, with a
// space between, a colon or a value. Anything else is not one (text that only
// seems to be outside a string, because of an unescaped quote mark before it).
const BEFORE_COMMENT_REGEXP = /[\n,{}[\]]$/;
const BEFORE_SPACED_COMMENT_REGEXP = /(?:[\n,{}[\]:"'\d]|true|false|null)$/;
// a letter, a digit or an underscore, in any script
const WORD_CHAR_REGEXP = /[\p{L}\p{N}_]/u;
// a string in quote marks of either kind that is closed on the line that it
// opens on, with none of those right after it (a backslash escapes what
// follows it)
const LINE_STRING_REGEXP = /(["'])(?:(?!\1)[^\\\n]|\\.)*\1(?![\p{L}\p{N}_])/uy;

// whether the line that follows the line break at index opens a code block or
// closes one
function isBeforeCodeFence(text: string, index: number) {
    index++;
    while (text[index] === ' ' || text[index] === '\t') index++;
    return text.startsWith('```', index);
}

// Reads the object or array that the text opens with, following only its
// strings, its brackets and its comments. Gives the index of the bracket that
// closes it (-1 if the text ends first) and where its comments are, each from
// the spaces before it to its end.
//
// With isEndedByFence, the read can also end at a code block. It is asked of
// the line break before each code fence that is not in a string or a comment
// (which is part of the object or array), and where it says so the read ends
// there: endIndex is -1, as where the text ends first, and fenceIndex is that
// index. The bracket that closes the object or array then has to be of its own
// kind: after any other, only a code block ends the read, so that a bracket
// that was mistyped does not open the strings after it to the search for a
// code block.
//
// With isUnreadable, it is a root that cannot be read (see getNotStart). That
// is JavaScript or Python more often than JSON, so its strings are read as
// those have them too: in quote marks of either kind, closed on the line that
// they open on, and with no letter, digit or underscore (in any script) right
// outside their quote marks. So a quote mark right after one opens no string
// (it is an inches mark, an apostrophe, or the end of a string with quote
// marks of its own kind in it), nor does one whose pair comes right before one
// (the start of another string, or of a word), nor one with no pair on its
// line. A backslash escapes the character after it.
//
// A string in double quote marks may also run over line breaks, as it does
// in JSON with markdown in it: from a quote mark with no pair on its line
// that stands where a value starts, to the next with no pair on its line.
// All that is in it is part of it (brackets, and a code block). Anywhere
// else, a quote mark with no pair on its line is a stray one.
function readRoot(
    text: string,
    {
        isEndedByFence,
        isUnreadable,
    }: { isEndedByFence?: (index: number) => boolean; isUnreadable?: boolean } = {},
) {
    const comments: Array<[number, number]> = [];
    const closingBracket = text[0] === '{' ? '}' : ']';
    let depth = 0;
    let fromIndex = 0;
    // whether a string in double quote marks is open that runs over line breaks
    let isStringOpen = false;
    for (let index = 0; index < text.length; index++) {
        const char = text[index];
        if (isUnreadable && (char === '"' || char === "'")) {
            const string = WORD_CHAR_REGEXP.test(text[index - 1])
                ? undefined
                : matchAt({ index, regexp: LINE_STRING_REGEXP, text });
            if (string) {
                index += string.length - 1;
            } else if (char === '"') {
                isStringOpen =
                    !isStringOpen &&
                    isPreceededBy({ chars: VALUE_OPENING_CHARS, index, text });
            }
        } else if (isUnreadable && char === '\\') {
            index++;
        } else if (isStringOpen) {
            continue;
        } else if (char === '"') {
            index = indexOfStringEnd(text, index);
            if (index === -1) break;
        } else if (char === '{' || char === '[') {
            depth++;
        } else if (char === '}' || char === ']') {
            depth--;
            if (depth === 0) {
                if (!isEndedByFence || char === closingBracket) {
                    return { comments, endIndex: index, fenceIndex: -1 };
                }
                depth = Infinity;
            }
        } else if (char === '\n' && isEndedByFence) {
            if (isBeforeCodeFence(text, index) && isEndedByFence(index)) {
                return { comments, endIndex: -1, fenceIndex: index };
            }
        } else if (char === '/') {
            let startIndex = index;
            while (text[startIndex - 1] === ' ' || text[startIndex - 1] === '\t') {
                startIndex--;
            }
            const precedingText = text.slice(
                Math.max(fromIndex, startIndex - 5),
                startIndex,
            );
            const isAfterComment = fromIndex > 0 && startIndex <= fromIndex;
            const regexp =
                startIndex < index ? BEFORE_SPACED_COMMENT_REGEXP : BEFORE_COMMENT_REGEXP;
            COMMENT_REGEXP.lastIndex = index;
            const comment =
                isAfterComment || regexp.test(precedingText)
                    ? COMMENT_REGEXP.exec(text)
                    : null;
            if (comment) {
                comments.push([
                    Math.max(fromIndex, startIndex),
                    index + comment[0].length,
                ]);
                fromIndex = index + comment[0].length;
                index = fromIndex - 1;
            }
        }
    }
    return { comments, endIndex: -1, fenceIndex: -1 };
}

// the index of the bracket that closes the object or array that the text opens
// with, or -1 if the text ends first
function indexOfRootEnd(text: string) {
    return readRoot(text).endIndex;
}

// Takes the comments out of the object or array that the text opens with, each
// with the spaces before it; what follows the end of the object or array is left
// as it is. Where the text ends on a comment, what precedes the comment is known
// to be whole (isEndDelimited).
function stripComments(text: string) {
    const { comments } = readRoot(text);
    let newText = '';
    let fromIndex = 0;
    for (const [startIndex, endIndex] of comments) {
        newText += text.slice(fromIndex, startIndex);
        fromIndex = endIndex;
    }
    const isEndDelimited = fromIndex > 0 && fromIndex === text.length;
    return {
        isEndDelimited,
        text: isEndDelimited ? newText.trimEnd() : newText + text.slice(fromIndex),
    };
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

// the value of a text that is JSON as it is, or undefined if it isn’t. A text
// that opens an object or array and does not end by closing one can’t be whole
// (and is likely to be a response that is still streaming in), so it isn’t tried.
function parseWholeJSON(text: string) {
    const lastChar = text.at(-1);
    if ((text[0] === '{' || text[0] === '[') && lastChar !== '}' && lastChar !== ']') {
        return undefined;
    }
    try {
        return JSON.parse(text) as ParsedValue;
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
// what follows the brace that closes an object too early: a key, after a comma
// or without one
const NEXT_KEY_REGEXP = /^\s*,?\s*"[^"]+":/;

// What a brace or bracket has to be followed by to be taken for the start of
// the JSON and not for part of the preamble.
//
// a string from its opening quote mark, as far as the text goes (which may be
// partway through an escape sequence) and not past a line break that a bracket
// follows (where the walk would cut the string short)
const STRING_START_PATTERN = '"(?:[^"\\\\\\n]|\\\\(?:.|$)|\\n(?!\\s*[{[]))*';
// a bare literal as far as it goes, where the text ends on it or partway through
const LITERAL_START_PATTERN =
    't(?:r(?:ue?)?)?|f(?:a(?:l(?:se?)?)?)?|n(?:u(?:ll?)?)?|-?\\d[\\d.eE+-]*|-';
// Wherever it stands: after a brace, a key and its colon (as far as the text
// goes), or a key that has lost its opening quote mark (which the walk restores
// where the key follows a line break); after a bracket, a string, an object or
// an array.
const KEY_AFTER_BRACE_REGEXP = new RegExp(
    `^\\s*(?:${STRING_START_PATTERN}(?:"\\s*(?::|$)|$)|\\n[a-zA-Z][^"\\n]*"\\s*:)`,
);
const ITEM_AFTER_BRACKET_REGEXP = /^\s*["[{]/;
// Only where a value would stand (isValuePosition), since prose has these too:
// after a brace, the brace that closes it, the end of the text, or a string
// that no colon follows; after a bracket, a closing bracket, the end of the
// text, or a bare literal (a whole one, which a comma, a closing bracket or a
// comment follows, or as much of one as the text has).
const SCALAR_AFTER_BRACE_REGEXP = new RegExp(`^\\s*(?:\\}|$|${STRING_START_PATTERN}")`);
const SCALAR_AFTER_BRACKET_REGEXP = new RegExp(
    `^\\s*(?:[\\]}]|$|(?:${LITERAL_PATTERN})\\s*(?:[,\\]]|\\/(?:[/*]|$))|(?:${LITERAL_START_PATTERN})$)`,
);
// the text after a value that is not in the middle of a line of prose: nothing
// on its line but a full stop, comma or semicolon, and a comment (a block
// comment as far as its own `*/`, so that nothing can follow it on the line)
const END_OF_LINE_REGEXP =
    /^[ \t]*[.,;]?[ \t]*(?:\/\/[^\n]*|\/\*(?:[^*]|\*(?!\/))*(?:\*\/[ \t]*|$)|\/$)?(?:\r?\n|$)/;
// a comment where the text has got to, and the whitespace before it: all of one
// that runs to the end of its line, as far as the `/*` of one that does not,
// and the `/` that the text ends on. (Not `//]:`, which is how markdown writes
// a comment, in a bracket that it closes.)
const COMMENT_START_REGEXP = /\s*\/(?:\/(?!\]:)[^\n]*|\*|$)/y;
// what is not where the JSON starts: a brace or bracket that the text starts
// with (isStartOfJSON has ruled it out), and all that is not one of the two
const NOT_START_REGEXP = /^(?:[[{][^[{]*|[^[{]+)/;

// Whether the text before a value leaves it out of the middle of a line of
// prose: a colon comes before it, or it starts a line (or the text). Only the
// end of that text is read, since it is all of the text up to each bracket.
function isBeforeValue(precedingText: string) {
    let index = precedingText.length - 1;
    while (precedingText[index] === ' ' || precedingText[index] === '\t') index--;
    return index === -1 || precedingText[index] === '\n' || precedingText[index] === ':';
}

// Whether a value could stand where the text starts, going by the text around
// it. It has to start a line or follow a colon, and once it is closed it has to
// end its line, unless it is an object that a key follows (one that was closed
// too early).
function isValuePosition(text: string, precedingText: string) {
    if (!isBeforeValue(precedingText)) return false;
    const endIndex = indexOfRootEnd(text);
    if (endIndex === -1) return true;
    const rest = text.slice(endIndex + 1);
    return (
        END_OF_LINE_REGEXP.test(rest) || (text[0] === '{' && NEXT_KEY_REGEXP.test(rest))
    );
}

// What the search for the start of the JSON has found out about the text, kept
// so that it is not found out again for each bracket: whether there is no `*/`
// from where the search has got to, and where the next code block is that
// starts with JSON that can be read, by the index of its fence in the whole
// text (-1 if there is none).
type Search = { hasNoBlockCommentEnd?: boolean; jsonFenceIndex?: number };

// The index of what follows the bracket that the text starts with, past the
// comments after it (or of what follows the comments from another index). Only
// the comments are read, since this is asked of every bracket in a preamble.
function indexOfBody(text: string, search: Search, index = 1) {
    for (;;) {
        COMMENT_START_REGEXP.lastIndex = index;
        const comment = COMMENT_START_REGEXP.exec(text)?.[0];
        if (!comment) return index;
        index += comment.length;
        if (comment.endsWith('/*')) {
            const endIndex = search.hasNoBlockCommentEnd ? -1 : text.indexOf('*/', index);
            if (endIndex === -1) {
                search.hasNoBlockCommentEnd = true;
                return text.length;
            }
            index = endIndex + 2;
        }
    }
}

// The first member of an object or array, written as JSON does not allow: after
// a brace, a key with no quote marks (as far as the text goes, so that it is
// known for one before its colon streams in), with single ones or with only
// its closing one, a comma, or the wrong closing bracket; after a bracket, a
// string in single quote marks or a comma.
const UNREADABLE_AFTER_BRACE_REGEXP = /^\s*(?:[a-zA-Z_$][\w$]*"?\s*(?::|$)|['\],])/;
const UNREADABLE_AFTER_BRACKET_REGEXP = /^\s*[',]/;
// the line break before a line that opens a code block or closes one
const CODE_FENCE_REGEXP = /\n[ \t]*```/g;
// A code fence: a line of three backticks and, where it opens a block that
// names one, a language. No other backticks are on its line (so it is not
// code that is written in a line of prose). It is looked for from an index
// on, or at one.
const CODE_FENCE_LINE_PATTERN = '(?:^|\\n)[ \\t]*```([^\\n`]*)(?=\\n|$)';
const NEXT_CODE_FENCE_LINE_REGEXP = new RegExp(CODE_FENCE_LINE_PATTERN, 'g');
const CODE_FENCE_LINE_REGEXP = new RegExp(CODE_FENCE_LINE_PATTERN, 'y');
// the language of a code block that JSON is put in: json, jsonc, json5 or
// jsonl, with anything after it but more of a name (jsonnet is code)
const JSON_LANGUAGE_REGEXP = /^json(?:c|5|l)?\b/i;

// Makes a test of whether an index in the text is inside one of its strings,
// going by its quote marks. The indexes it is asked about have to come in
// order, so that the text is only read through once.
function createStringTest(text: string) {
    let quoteIndex = text.indexOf('"');
    let endIndex: number | undefined;
    return (index: number) => {
        while (quoteIndex > -1 && quoteIndex < index) {
            endIndex ??= indexOfStringEnd(text, quoteIndex);
            if (endIndex === -1 || endIndex > index) return true;
            quoteIndex = text.indexOf('"', endIndex + 1);
            endIndex = undefined;
        }
        return false;
    };
}

// The index of the first code fence in the text that is not in one of its
// strings (of the line break before it), or -1. A code block in a string is part
// of the string: markdown, say.
function indexOfCodeFence(text: string) {
    const isInString = createStringTest(text);
    for (const { index } of text.matchAll(CODE_FENCE_REGEXP)) {
        if (!isInString(index)) return index;
    }
    return -1;
}

// Whether the text starts with the root of a document that cannot be read: a
// bracket where a value would stand, with a first member after it that JSON does
// not allow.
function isUnreadableRoot({
    precedingText,
    search,
    text,
}: {
    precedingText: string;
    search: Search;
    text: string;
}) {
    if ((text[0] !== '{' && text[0] !== '[') || !isBeforeValue(precedingText)) {
        return false;
    }
    const regexp =
        text[0] === '{' ? UNREADABLE_AFTER_BRACE_REGEXP : UNREADABLE_AFTER_BRACKET_REGEXP;
    return regexp.test(text.slice(indexOfBody(text, search)));
}

// What to pass over where the JSON does not start at the start of the text: all
// up to the next bracket, which has nothing inside it (the JSON may come before
// it is closed), unless it is the root of a document that cannot be read. That
// is a bracket where a value would stand with a first member after it that JSON
// does not allow. It is passed over with all that is inside it, so that none of
// its members is taken for the JSON: up to the bracket that closes it, or to
// the end of the text while it is not closed. That bracket is found with its
// strings read as JavaScript and Python have them too (see readRoot): read as
// JSON has them, an inches mark, or a quote mark in single quote marks, opens
// a string that runs on into the answer after it.
//
// A code block is not inside it, and ends it where it is not closed before the
// block: one that is not in one of its strings or comments, which are part of
// it. A code block that starts with JSON that can be read ends it wherever the
// block is, by its fence alone and by none of the root’s quote marks: one with
// no pair (a string that was never closed, say) would have a string run on past
// the fence and hide the block. So such a block in one of the root’s strings or
// comments ends it too. (Not one whose JSON cannot be read: it has no value to
// give, and would only open the members after it to the search.) What follows
// the fence is searched like any other text.
function getNotStart({
    precedingText,
    search,
    text,
    wholeText,
}: {
    precedingText: string;
    search: Search;
    text: string;
    wholeText: string;
}) {
    if (!isUnreadableRoot({ precedingText, search, text })) {
        return text.match(NOT_START_REGEXP)?.[0] ?? text;
    }

    const offset = precedingText.length;
    if (
        search.jsonFenceIndex == null ||
        (search.jsonFenceIndex > -1 && search.jsonFenceIndex < offset)
    ) {
        // (this reads ahead of where the search for the start has got to, so
        // what it finds out about the text is its own)
        search.jsonFenceIndex = indexOfJSONFence({
            index: offset,
            isReadableOnly: true,
            search: {},
            text: wholeText,
        });
    }
    // (read once, as far as the bracket that closes it, the code block that it
    // is not closed before, or the next code block with JSON in it, whichever
    // comes first)
    const readText =
        search.jsonFenceIndex === -1
            ? text
            : text.slice(0, search.jsonFenceIndex - offset);
    const { endIndex, fenceIndex } = readRoot(readText, {
        isEndedByFence: () => true,
        isUnreadable: true,
    });
    if (endIndex > -1) return text.slice(0, endIndex + 1);
    return fenceIndex === -1 ? readText : readText.slice(0, fenceIndex);
}

// whether the JSON starts where the text does, given the text that precedes it
// (a bracket is taken by what follows the comments after it)
function isStartOfJSON({
    precedingText,
    search,
    text,
}: {
    precedingText: string;
    search: Search;
    text: string;
}) {
    if (text[0] !== '{' && text[0] !== '[') return false;
    const isObject = text[0] === '{';
    const body = text.slice(indexOfBody(text, search));
    return (
        (isObject ? KEY_AFTER_BRACE_REGEXP : ITEM_AFTER_BRACKET_REGEXP).test(body) ||
        ((isObject ? SCALAR_AFTER_BRACE_REGEXP : SCALAR_AFTER_BRACKET_REGEXP).test(
            body,
        ) &&
            isValuePosition(text, precedingText))
    );
}

// Whether the brackets that the text starts with, one inside the other, come
// to what a value starts with, each going by what follows it alone: `[[1, 2]]`
// and `[{"a": 1}]` do, and `[[ -f a.json ]]` and `[{ id: 1 }]` do not.
function isNestedStart(text: string, search: Search) {
    let index = 0;
    for (;;) {
        const body = text.slice(indexOfBody(text, search, index + 1));
        if (text[index] === '{') {
            return (
                KEY_AFTER_BRACE_REGEXP.test(body) || SCALAR_AFTER_BRACE_REGEXP.test(body)
            );
        }
        if (SCALAR_AFTER_BRACKET_REGEXP.test(body)) return true;
        const item = body.trimStart();
        if (item[0] !== '[' && item[0] !== '{') return item[0] === '"';
        index = text.length - item.length;
    }
}

// The index at which the JSON starts in the code block that the fence at
// fenceIndex opens, or -1 if that is no block with JSON in it. It is one if:
//
// - the fence has no language after it, or a JSON one. A block in any other
//   language is code, whatever it starts with.
// - JSON is what the block starts with, after any comments: a start as it is
//   anywhere, with the brackets after a bracket taken more strictly, since it
//   takes the place of what comes before it (`[[ -f a.json ]]` is a line of
//   shell). In a block with a JSON language, a root that cannot be read is
//   JSON too, so that the value is null and not what comes before the block.
//   After a fence with no language it is not, since that fence may be the
//   one that closes a block of code, and nor is it where only JSON that can
//   be read is asked for (isReadableOnly).
function indexOfBlockJSON({
    fenceIndex,
    isReadableOnly = false,
    search,
    text,
}: {
    fenceIndex: number;
    isReadableOnly?: boolean;
    search: Search;
    text: string;
}) {
    CODE_FENCE_LINE_REGEXP.lastIndex = fenceIndex;
    const fence = CODE_FENCE_LINE_REGEXP.exec(text);
    if (!fence) return -1;
    const language = fence[1].trim();
    const isJSONBlock = JSON_LANGUAGE_REGEXP.test(language);
    if (language !== '' && !isJSONBlock) return -1;

    let index = indexOfBody(text, search, fenceIndex + fence[0].length);
    while (WHITESPACE_CHARS.has(text[index])) index++;
    const payload = {
        precedingText: text.slice(0, index),
        search,
        text: text.slice(index),
    };
    const hasJSON = isStartOfJSON(payload)
        ? isNestedStart(payload.text, search)
        : isJSONBlock && !isReadableOnly && isUnreadableRoot(payload);
    return hasJSON ? index : -1;
}

// The index of the next fence from an index on that opens a code block with
// JSON in it (of the line break before the fence), or -1.
function indexOfJSONFence({
    index,
    isReadableOnly,
    search,
    text,
}: {
    index: number;
    isReadableOnly?: boolean;
    search: Search;
    text: string;
}) {
    NEXT_CODE_FENCE_LINE_REGEXP.lastIndex = index;
    for (;;) {
        const fence = NEXT_CODE_FENCE_LINE_REGEXP.exec(text);
        if (!fence) return -1;
        const fenceIndex = fence.index;
        if (indexOfBlockJSON({ fenceIndex, isReadableOnly, search, text }) > -1) {
            return fenceIndex;
        }
    }
}

// the index of the fence that is nearest before an index in the text (of the
// line break before it, or 0 for a fence that the text starts with), or -1
function lastIndexOfCodeFence(text: string, index: number) {
    index = text.lastIndexOf('```', index);
    while (index > -1) {
        const fenceIndex = Math.max(text.lastIndexOf('\n', index), 0);
        CODE_FENCE_LINE_REGEXP.lastIndex = fenceIndex;
        if (CODE_FENCE_LINE_REGEXP.test(text)) return fenceIndex;
        index = fenceIndex === 0 ? -1 : text.lastIndexOf('```', fenceIndex - 1);
    }
    return -1;
}

// The index at which the JSON starts in a code block, if the text has one after
// where the JSON was taken to start (startIndex), or -1. The JSON in a code
// block is the value whatever comes before the block, so the first fence that
// JSON follows is where it starts (see indexOfBlockJSON): with no fence after
// it too, while the text streams in. The fences are not counted to tell one
// that opens a block from one that closes one: a block that was never closed,
// or a fence in a string, would throw the count off and hide the block. Not a
// fence in one of the strings of the value before it, which is part of that
// value.
//
// The text is read once from startIndex on, and no further than the fence that
// is returned, where the search moves to.
function indexOfFencedStart({
    search,
    startIndex,
    text,
}: {
    search: Search;
    startIndex: number;
    text: string;
}) {
    if (!text.includes('```', startIndex)) return -1;

    // the JSON may be in a code block where it is
    const lastFenceIndex = lastIndexOfCodeFence(text, startIndex);
    if (
        lastFenceIndex > -1 &&
        indexOfBlockJSON({ fenceIndex: lastFenceIndex, search, text }) === startIndex
    ) {
        return -1;
    }

    let fencedStartIndex = -1;
    const isBlockJSONAt = (fenceIndex: number) => {
        fencedStartIndex = indexOfBlockJSON({ fenceIndex, search, text });
        return fencedStartIndex > -1;
    };
    // the fences in the value that it was taken to start with, which readRoot
    // leaves out if they are in one of its strings…
    const { endIndex } = readRoot(text.slice(startIndex), {
        isEndedByFence: (index) => isBlockJSONAt(startIndex + index),
    });
    if (fencedStartIndex > -1 || endIndex === -1) return fencedStartIndex;

    // …and those after it, once it is closed, whatever its quote marks make of
    // them (a stray one may follow the value)
    const fenceIndex = indexOfJSONFence({ index: startIndex + endIndex, search, text });
    return fenceIndex === -1 ? -1 : indexOfBlockJSON({ fenceIndex, search, text });
}

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
    let preamble = '';
    let postscript = '';
    // whether anything is known to have followed the text
    let isEndDelimited = false;
    if (text == null) {
        text = '';
    } else {
        const input = text;
        text = text.replace(CONTROL_TOKENS_REGEXP, '').trim();
        // if payload is entirely wrapped in a fenced code block, unwrap it first
        // (one block: a fence within it that is in no string closes it, and
        // what follows is not part of it)
        const fencedBlockMatch = text.match(FENCED_CODE_BLOCK_REGEXP);
        const fencedContent = fencedBlockMatch?.[2]?.trim();
        if (fencedContent && indexOfCodeFence(fencedContent) === -1) {
            text = fencedContent;
        }
        // if anything followed the text (whitespace, a control token, or the end
        // of a code block), then a number that the text ends on is a whole one
        if (!input.endsWith(text)) isEndDelimited = true;
    }
    // if the input is empty, use value: null to indicate failure
    if (text === '') return { postscript, preamble, value: null };

    // attempt to parse the string as-is (minus control tokens)
    const wholeValue = parseWholeJSON(text);
    if (wholeValue !== undefined) return { postscript, preamble, value: wholeValue };

    // if it is JSON as far as it goes, closing what it leaves open is all it needs
    const firstText = text;
    const unfinishedValue = parseUnfinishedJSON({ isEndDelimited, text });
    if (unfinishedValue !== undefined) {
        return { postscript, preamble, value: unfinishedValue };
    }

    // initialize variables
    const stack: Array<string> = [];
    let isInsideString = false;
    // where the last string opened: in the text, where what came before it can
    // be read without reading newText back (which costs more as it grows)
    let stringIndex = -1;
    let newText = '';

    // identify start of JSON: the first brace that opens an object or bracket
    // that opens an array, or the one in a code block if there is a code block
    // with JSON in it further on. Any other is part of the preamble, with all
    // that follows it up to the next one, or all that is inside it if it is a
    // root that cannot be read (the last such part only joins the preamble if
    // it has a word in it).
    const search: Search = {};
    let lastPart = '';
    while (text !== '') {
        const precedingText = firstText.slice(0, firstText.length - text.length);
        let notStart;
        if (isStartOfJSON({ precedingText, search, text })) {
            const fencedStartIndex = indexOfFencedStart({
                search,
                startIndex: precedingText.length,
                text: firstText,
            });
            if (fencedStartIndex === -1) break;
            notStart = text.slice(0, fencedStartIndex - precedingText.length);
        } else {
            notStart = getNotStart({
                precedingText,
                search,
                text,
                wholeText: firstText,
            });
        }
        if (text[0] === '{' || text[0] === '[') {
            preamble += lastPart;
            lastPart = notStart;
        } else {
            lastPart += notStart;
        }
        text = text.slice(notStart.length);
    }
    if (hasTextContent(lastPart)) preamble += lastPart;
    preamble = cleanThinkingText(preamble);

    // comments are no part of the JSON: read it without them (a number that a
    // comment follows is whole, as it is before anything else)
    const withoutComments = stripComments(text);
    text = withoutComments.text;
    isEndDelimited ||= withoutComments.isEndDelimited;

    const rootEndIndex = indexOfRootEnd(text);
    if (rootEndIndex > -1) {
        // if the object or array that the JSON starts with is whole, it is the
        // value, and what follows it is the postscript, less a comma that it starts
        // with (unless a key follows an object: it was closed too early, which
        // is for the walk to repair)
        const rest = text.slice(rootEndIndex + 1);
        if (text[0] !== '{' || !NEXT_KEY_REGEXP.test(rest)) {
            const rootValue = parseWholeJSON(text.slice(0, rootEndIndex + 1));
            if (rootValue !== undefined) {
                postscript = hasTextContent(rest) ? rest.replace(/^\s*,/, '').trim() : '';
                return {
                    postscript: cleanThinkingText(postscript),
                    preamble,
                    value: rootValue,
                };
            }
        }
    } else if (text !== firstText) {
        // if the text has changed since it was first tried (a preamble or the
        // opening of a code block was taken off), it may now be JSON as far as
        // it goes
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
                stringIndex = index;
            } else if (char === '{') {
                stack.push('}');
            } else if (char === '[') {
                stack.push(']');
            } else if (char === '}' || char === ']') {
                if (stack.length && stack.at(-1) === char) {
                    // a key with no value before the brace is given an empty one
                    if (
                        char === '}' &&
                        isAfterKeyWithoutValue({
                            index,
                            isRoot: stack.length === 1,
                            stringIndex,
                            text,
                        })
                    ) {
                        newText += ': ""';
                    }
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
                            // if missing a comma, add it here (or skip the one
                            // that is there, if the object has nothing in it yet)
                            const isEmpty = isPreceededBy({ char: '{', text: newText });
                            if (
                                quoteIndex > startIndex &&
                                !text.slice(startIndex, quoteIndex).includes(',')
                            ) {
                                if (!isEmpty) newText += ',';
                            } else if (isEmpty) {
                                index = startIndex;
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
                // if not, the string before it is a key: give it an empty value
                if (
                    isAfterKeyWithoutValue({
                        index,
                        isRoot: stack.length === 1,
                        stringIndex,
                        text,
                    })
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

    // what the walk did not read is the postscript, unless it has no content
    postscript = originalText.substring(index - textLengthDelta).trim();
    if (!hasTextContent(postscript)) {
        postscript = '';
    }

    return { postscript: cleanThinkingText(postscript), preamble, value };
}

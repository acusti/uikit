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
    const charsSet = chars ? new Set(chars) : null;
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

const VALUE_START_CHARS = VALUE_DELIMITER_CHARS.add('{').add('[');
const VALUE_END_CHARS = VALUE_DELIMITER_CHARS.add('}').add(']');

type GenericObject = Record<string, unknown>;

export function getPreviousStringType(text: string): 'KEY' | 'VALUE' | null {
    const lastEndKeyIndexA = text.lastIndexOf('":"');
    const lastEndKeyIndexB = text.lastIndexOf('": "');
    const lastEndKeyIndex = Math.max(lastEndKeyIndexA, lastEndKeyIndexB);
    const lastEndValueIndexA = text.lastIndexOf('","');
    const lastEndValueIndexB = text.lastIndexOf('", "');
    const lastEndValueIndex = Math.max(lastEndValueIndexA, lastEndValueIndexB);
    // if cannot determine the type, return null
    if (lastEndKeyIndex <= 0 && lastEndValueIndex <= 0) return null;
    // if last token is an array
    const lastEndArrayIndex = text.lastIndexOf(']');
    if (lastEndArrayIndex > lastEndKeyIndex && lastEndArrayIndex > lastEndValueIndex) {
        return null;
    }

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
                    isPreceededBy({ chars: VALUE_END_CHARS, index, text }) &&
                    isFollowedBy({
                        chars: VALUE_START_CHARS,
                        index: originalIndex,
                        text: original,
                    })
                );
            }
            // valid context for a comma in an object is in between key/value pairs
            if (controlChar === '}') {
                return (
                    isPreceededBy({ chars: VALUE_END_CHARS, index, text }) &&
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

const hasTextContent = (text: string) => /\w/.test(text);

// LLMs often demarcate the JSON part of the response with ``` or ```json
const cleanThinkingText = (preamble: string) =>
    preamble
        .trim()
        .replace(/^```(?:[a-z0-9]{1,9})?$/im, '')
        .trim();

const getObjectKeyFromIndex = (index: number) =>
    `"key${index === 1 ? '' : '-' + index}":`;

const OBJECT_KEY_REGEXP = /^\s*"[^"]+":/;

const CONTROL_TOKENS_REGEXP = /(^<\|im_start\|>|<\|im_end\|>$)/;

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
    // if the input is undefined/null, use value: null to indicate failure
    if (text == null) return { postscript, preamble, value: null };

    text = text.replace(CONTROL_TOKENS_REGEXP, '');
    // attempt to parse the string as-is (minus control tokens)
    try {
        return { postscript, preamble, value: JSON.parse(text) as ParsedValue };
    } catch (error) {
        // let’s try to fix it
    }

    text = text.trim();

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
        text = text.replace(/^[[{"]?[^[{"]+/, '');
    } while (
        previousText !== text &&
        // if new start is [, ensure it’s an array & not part of preamble
        ((text[0] === '[' &&
            !isFollowedBy({ chars: VALUE_START_CHARS, index: 0, text })) ||
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

    const originalText = text;
    let textLengthDelta = 0;
    let index = 0;
    // process each character in the string one at a time
    for (; index < text.length; index++) {
        let char = text[index];
        if (isInsideString) {
            if (char === '"' && newText.at(-1) !== '\\') {
                // set state to not insideString (will set back to true if is unescaped quote mark)
                isInsideString = false;
                // if quote mark is followed by ':', ', "', or new line, treat it as a string terminus
                if (!/^( ?:|, ?"|,?\n)/.test(text.substring(index + 1))) {
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
                        if (lastColonIndex > -1) {
                            // convert last bit of text into a key
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
                                newText.substring(keyStartIndex, lastColonIndex + 1) +
                                '"' +
                                newText.substring(lastColonIndex + 1);
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
                    if (newText.at(-1) === '\\') {
                        newText = newText.slice(0, -1);
                    }
                }
            }
        } else {
            const validContextPayload = {
                char,
                controlChar: stack.at(-1),
                original: text,
                originalIndex: index,
                text: newText,
            };
            // handle invalid characters outside of a string value
            if (!isValidContext(validContextPayload)) {
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
                if (getPreviousStringType(newText) === 'VALUE') {
                    char = ': "",';
                }
            } else if (char === '\n') {
                // treat new lines outside strings as separators
                const remainingText = text.substring(index + 1);
                // first, check if there is a missing opening quote mark in rest of text
                if (/^[a-zA-Z]/.test(remainingText)) {
                    text = text.substring(0, index + 1) + '"' + remainingText;
                    textLengthDelta++;
                }
                // if a comma is missing but needed, add one now
                if (
                    (isPreceededBy({ char: '"', text: newText }) &&
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

    // if we’re still inside a string, close it
    if (isInsideString) {
        newText += '"';
    }

    if (stack.at(-1) === '}') {
        // if we are in the key of a key/value pair, append ': ""' to close the pair
        if (/[{,][^:"]*"[^"]*"\s*?$/.test(newText)) {
            newText += ': ""';
        } else if (/": ?$/.test(newText)) {
            // if we are in between a key/value pair, append '""' to close the pair
            newText += '""';
        }
    }

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
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (postscript.length > 5 && (!value || postscript.length > index)) {
        const { postscript: remainingPostscript, value: remainingValue } =
            parseAsJSON(postscript);
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (remainingValue) {
            // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
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

type Optional<Type, Key extends keyof Type> = Omit<Type, Key> & Partial<Pick<Type, Key>>;

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

const WHITESPACE_CHARS = new Set([' ', '\n', '\r', '\t']);

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

type FollowedByFullPayload = Omit<IndexOfClosestCharFullPayload, 'step'>;

type FollowedByPayload =
    | Optional<FollowedByFullPayload, 'char'>
    | Optional<FollowedByFullPayload, 'chars'>;

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
        case '{':
        case '[':
            if (text.length === 0) return true; // 1st character in text is a valid context
            if (controlChar === ']') return true; // as an item inside an array is a valid context
            // as the value of a key/value pair is a valid context
            return isPreceededBy({ char: ':', index, text });
        case '}':
        case ']':
            return char === controlChar;
        case '"':
            if (text.length === 0) return true; // 1st character in text is a valid context
            if (controlChar === ']') return true; // as an item inside an array is a valid context
            if (controlChar === '}') return true; // as key or value inside an object is a valid context
            return false;
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
        case ' ':
        case '\r':
        case '\n':
        case '\t':
            return true;
        default:
            return false;
    }
}

type GenericObject = Record<string, unknown>;

// get the length of anything (vs JSON.stringify: https://jsperf.app/qisaso/2)
function lengthOf(item: unknown): number {
    switch (typeof item) {
        case 'string':
            return item.length;
        case 'number':
            return 1;
        case 'object':
            if (!item) return 0;
            if (Array.isArray(item)) {
                return item.reduce(
                    (acc: number, item) => acc + lengthOf(item),
                    0,
                ) as number;
            }
            return Object.keys(item).reduce(
                (acc, key) => acc + key.length + lengthOf((item as GenericObject)[key]),
                0,
            );
        default:
            return 0;
    }
}

const OBJECT_KEY_REGEXP = /^"[^"]+":/;

type ParsedValue = string | boolean | number | GenericObject | Array<unknown>;

export function parseAsJSON(text: string): ParsedValue | null {
    // if the input is undefined/null, return null to indicate failure
    if (text == null) return null;

    // attempt to parse the string as-is
    try {
        return JSON.parse(text) as ParsedValue;
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

    // if the first character is a key, add opening curly brace
    if (OBJECT_KEY_REGEXP.test(text)) {
        text = '{' + text;
    }

    let index = 0;
    // process each character in the string one at a time
    for (; index < text.length; index++) {
        let char = text[index];
        if (isInsideString) {
            if (char === '"' && newText.at(-1) !== '\\') {
                // if this quote mark starts a new string value, there was a
                // missing closing quote amd comma from the last string value
                const nextChar = text[index + 1];
                if (nextChar && /[a-z]/i.test(nextChar)) {
                    newText += '",';
                } else {
                    isInsideString = false;
                    // ensure the closing quote is followed by a comma if a key follows
                    if (isFollowedBy({ char: '"', index, text })) {
                        newText += char;
                        char = ',';
                    }
                }
            } else if (char === '\n' && newText.at(-1) !== '\\') {
                // if not escaped, escape the newline character now
                char = '\\n';
            } else if (char === '\\' && text[index + 1] !== '"') {
                // handle character escaping ourselves unless it’s a quote
                continue;
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
        if (/[{,][^:"]*"[^"]+"\s*?$/.test(newText)) {
            newText += ': ""';
        } else if (/": ?$/.test(newText)) {
            // if we are in between a key/value pair, append '""' to close the pair
            newText += '""';
        }
    }

    // close any remaining open structures in the reverse order that they were opened
    for (let index = stack.length - 1; index >= 0; index--) {
        newText += stack[index];
    }

    // attempt to parse the modified string as JSON
    let result = null;
    try {
        result = JSON.parse(newText) as ParsedValue;
    } catch (error) {
        // in case of error, return null (after checking remainder of text)
    }

    // if there’s still unparsed text and parsing failed or its more than ½
    // what we already parsed, the model might’ve restarted partway through.
    // try parsing the rest to see if we get a larger result and use it if so.
    const remainingText = text.substring(index);
    if (remainingText.length > 5 && (!result || remainingText.length > index)) {
        const remainingResult = parseAsJSON(remainingText);
        if (remainingResult) {
            if (!result) return remainingResult;
            // choose whichever has more keys (or, if equal, more characters)
            if (
                typeof result === 'object' &&
                typeof remainingResult === 'object' &&
                !Array.isArray(result) &&
                !Array.isArray(remainingResult)
            ) {
                const keysLength = Object.keys(result).length;
                const remainingKeysLength = Object.keys(remainingResult).length;
                if (keysLength > remainingKeysLength) return result;
                if (remainingKeysLength > keysLength) return remainingResult;
            }
            // if not objects or same number of keys, choose longer item
            if (lengthOf(remainingResult) > lengthOf(result)) {
                return remainingResult;
            }
        }
    }

    return result;
}

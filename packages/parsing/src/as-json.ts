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
    index = text.length - 1,
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
        default:
            return true;
    }
}

type ReturnValue = string | boolean | number | Record<string, unknown> | Array<unknown>;

// Adapted from https://github.com/langchain-ai/langchainjs/blob/215dd52/langchain-core/src/output_parsers/json.ts#L58
// MIT License
export function asJSON(text: string): ReturnValue | null {
    // if the input is undefined/null, return null to indicate failure
    if (text == null) return null;

    // attempt to parse the string as-is
    try {
        return JSON.parse(text);
    } catch (error) {
        // let’s try to fix it
    }

    text = text.trim();

    // initialize variables
    let newText = '';
    const stack = [];
    let isInsideString = false;

    // identify start of JSON
    do {
        text = text.replace(/^[^{[]+/, '');
    } while (
        // if new start is [, ensure it’s an array & not part of preamble
        text[0] === '[' &&
        !isFollowedBy({ chars: VALUE_START_CHARS, index: 0, text })
    );

    // process each character in the string one at a time
    for (let index = 0; index < text.length; index++) {
        let char = text[index];
        if (isInsideString) {
            if (char === '"' && newText.at(-1) !== '\\') {
                // if this quotemark starts a new string value, there was a
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
            }
        } else {
            const controlChar = stack.at(-1);
            const previousStackLength = stack.length;
            if (char === '"') {
                isInsideString = true;
            } else if (char === '{') {
                stack.push('}');
            } else if (char === '[') {
                stack.push(']');
            } else if (char === '}' || char === ']') {
                if (stack.length && stack.at(-1) === char) {
                    stack.pop();
                    // ensure that we have a trailing comma if needed
                    if (isFollowedBy({ chars: ['"', '{', '['], index, text })) {
                        newText += char;
                        char = ',';
                    }
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
                // if we just added to the stack, remove it
                if (stack.length > previousStackLength) {
                    stack.pop();
                }
                // if previous character was a comma, remove it
                const trailingCommaIndex = indexOfClosestChar({
                    char: ',',
                    step: -1,
                    text: newText,
                });
                if (trailingCommaIndex > 0) {
                    newText = newText.substring(0, trailingCommaIndex);
                }
                break;
            }
        }

        // append the processed character to the new string
        newText += char;
    }

    // if we’re still inside a string, close it
    if (isInsideString) {
        newText += '"';
    }

    // if we are in the key of a key/value pair, append ': ""' to close the pair
    if (stack.at(-1) === '}' && /[{,][^:"]*"[^"]*"$/.test(newText)) {
        newText += ': ""';
    }
    // close any remaining open structures in the reverse order that they were opened
    for (let index = stack.length - 1; index >= 0; index--) {
        newText += stack[index];
    }
    // attempt to parse the modified string as JSON
    try {
        return JSON.parse(newText);
    } catch (error) {
        return null;
    }
}

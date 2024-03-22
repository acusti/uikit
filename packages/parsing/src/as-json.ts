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

type ReturnValue = string | boolean | number | Record<string, unknown> | Array<unknown>;

// Adapted from https://github.com/langchain-ai/langchainjs/blob/215dd52/langchain-core/src/output_parsers/json.ts#L58
// MIT License
export const parsePartialJSON = (text: string): ReturnValue | null => {
    // If the input is undefined/null, return null to indicate failure.
    if (text == null) return null;

    // Attempt to parse the string as-is.
    try {
        return JSON.parse(text);
    } catch (error) {
        // Pass
    }

    text = text.trim();

    // Initialize variables.
    let newText = '';
    const stack = [];
    let isInsideString = false;

    // Process each character in the string one at a time.
    for (let index = 0; index < text.length; index++) {
        let char = text[index];
        if (isInsideString) {
            if (char === '"' && text[index - 1] !== '\\') {
                // If this quotemark starts a new string value, there was a
                // missing closing quote + comma from the last string value.
                const nextChar = text[index + 1];
                if (nextChar && /[a-z]/i.test(nextChar)) {
                    char = '","';
                } else {
                    isInsideString = false;
                    // Ensure that the closing quote is followed by a comma
                    // if another string key follows.
                    if (isFollowedBy({ char: '"', index, text })) {
                        char += ',';
                    }
                }
            } else if (char === '\n') {
                // If not escaped, escape the newline character now.
                if (text[index - 1] !== '\\') {
                    char = '\\n';
                }
            }
        } else {
            if (char === '"') {
                isInsideString = true;
            } else if (char === '{') {
                stack.push('}');
            } else if (char === '[') {
                stack.push(']');
            } else if (char === '}' || char === ']') {
                if (stack && stack.at(-1) === char) {
                    stack.pop();
                    // Ensure that we have a trailing comma if needed.
                    if (isFollowedBy({ chars: ['"', '{', '['], index, text })) {
                        char += ',';
                    }
                } else {
                    // Mismatched closing character; the input is malformed.
                    char = '';
                }
            } else if (char === ',') {
                // If this is a trailing comma, remove it.
                if (!isFollowedBy({ char: '"', index, text })) {
                    char = '';
                }
            }
        }

        // Append the processed character to the new string.
        newText += char;
    }

    // If we’re still inside a string at the end of processing,
    // we need to close the string.
    if (isInsideString) {
        newText += '"';
    }

    // Close any remaining open structures in the reverse order that they were opened.
    for (let index = stack.length - 1; index >= 0; index--) {
        newText += stack[index];
    }

    // Attempt to parse the modified string as JSON.
    try {
        return JSON.parse(newText);
    } catch (error) {
        // Try again from before the closest delimiter.
        let resetText = newText;
        while (resetText && /["[\]{}]/.test(resetText.at(-1)!)) {
            resetText = resetText.slice(0, -1);
        }
        const endIndex = resetText.search(/[^"[\]{}]*$/);
        if (endIndex > 4 && endIndex < newText.length - 2) {
            return parsePartialJSON(newText.substring(0, endIndex - 1));
        }
        // If we still can't parse the string as JSON,
        // return null to indicate failure.
        return null;
    }
};

export function asJSON(result: string): ReturnValue | null {
    result = result.substring(
        Math.max(result.indexOf('{'), 0),
        Math.max(result.lastIndexOf('}'), result.length),
    );
    return parsePartialJSON(result);
}

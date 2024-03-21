type Optional<Type, Key extends keyof Type> = Omit<Type, Key> & Partial<Pick<Type, Key>>;

type FollowedByFullPayload = {
    char: string;
    chars: Array<string>;
    index: number;
    text: string;
};

type FollowedByPayload =
    | Optional<FollowedByFullPayload, 'char'>
    | Optional<FollowedByFullPayload, 'chars'>;

const WHITESPACE_CHARS = new Set([' ', '\n', '\r', '\t']);

// A helper function that takes a start index, a char or chars representing
// the next non-whitespace character to look for, and the text itself.
function isFollowedBy({ char, chars, index, text }: FollowedByPayload) {
    const charsSet = chars ? new Set(chars) : null;
    for (index += 1; index < text.length; index++) {
        const nextCharacter = text[index];
        // if this is a match, return true
        if (char && nextCharacter === char) return true;
        if (charsSet && charsSet.has(nextCharacter)) return true;
        // if this is not a match but it is a whitespace character, keep iterating
        if (WHITESPACE_CHARS.has(nextCharacter)) {
            continue;
        }
        return false;
    }

    return false;
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
                    // If this is the last character in the text, just remove it.
                    // Otherwise, return null.
                    if (index === text.length - 1) {
                        char = '';
                    } else {
                        return null;
                    }
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
        // Some repairs enable further repairs if we try again.
        // If repairs were made, try again with the partially repaired text.
        if (text !== newText) {
            return parsePartialJSON(newText);
        }
        // If we still can't parse the string as JSON, return null to indicate failure.
        return null;
    }
};

export function asJSON(result: string): ReturnValue | null {
    result = result.substring(
        Math.max(result.indexOf('{'), 0),
        Math.max(result.lastIndexOf('}'), result.length),
    );
    const props = parsePartialJSON(result);
    if (props) return props;

    // If initial attempt was unsuccessful, remove any arrays (TODO make this better)
    result = result.split('[')[0];
    return parsePartialJSON(result);
}

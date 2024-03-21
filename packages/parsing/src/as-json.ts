// Adapted from https://github.com/langchain-ai/langchainjs/blob/215dd52/langchain-core/src/output_parsers/json.ts#L58
// MIT License
const parsePartialJSON = (text: string) => {
    // If the input is undefined/null, return null to indicate failure.
    if (text == null) return null;

    // Attempt to parse the string as-is.
    try {
        return JSON.parse(text);
    } catch (error) {
        // Pass
    }

    // Initialize variables.
    let newText = '';
    const stack = [];
    let isInsideString = false;
    let escaped = false;

    // Process each character in the string one at a time.
    for (let char of text) {
        if (isInsideString) {
            if (char === '"' && !escaped) {
                isInsideString = false;
            } else if (char === '\n' && !escaped) {
                char = '\\n'; // Replace the newline character with the escape sequence.
            } else if (char === '\\') {
                escaped = !escaped;
            } else {
                escaped = false;
            }
        } else {
            if (char === '"') {
                isInsideString = true;
                escaped = false;
            } else if (char === '{') {
                stack.push('}');
            } else if (char === '[') {
                stack.push(']');
            } else if (char === '}' || char === ']') {
                if (stack && stack[stack.length - 1] === char) {
                    stack.pop();
                } else {
                    // Mismatched closing character; the input is malformed.
                    return null;
                }
            }
        }

        // Append the processed character to the new string.
        newText += char;
    }

    // If we're still inside a string at the end of processing,
    // we need to close the string.
    if (isInsideString) {
        newText += '"';
    }

    // Close any remaining open structures in the reverse order that they were opened.
    for (let i = stack.length - 1; i >= 0; i -= 1) {
        newText += stack[i];
    }

    // Attempt to parse the modified string as JSON.
    try {
        return JSON.parse(newText);
    } catch (error) {
        // If we still can't parse the string as JSON, return null to indicate failure.
        return null;
    }
};

type ReturnValue = string | boolean | number | Record<string, unknown> | Array<unknown>;

export function asJSON(result: string): ReturnValue | null {
    // because props are Record<string, string>, there should only be 1 '{' and 1 '}'
    const startJSONIndex = result.indexOf('{');
    let endJSONIndex = result.indexOf('}');
    if (endJSONIndex === -1) {
        result += '}';
        endJSONIndex = result.length;
    }
    result = result.substring(startJSONIndex, endJSONIndex + 1);
    // remove any arrays (TODO make this better)
    result = result.split('[')[0];

    return parsePartialJSON(result);
    // const props: LayoutProps | null = parsePartialJSON(result);
    // return props;
}

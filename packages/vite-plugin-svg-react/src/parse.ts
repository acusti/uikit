// A minimal XML parser for SVG sources. It handles the constructs that show
// up in real-world SVG files — XML prologs, doctypes (including internal
// subsets), comments, CDATA sections, character references, self-closing
// tags, and namespaced names — and throws on malformed markup rather than
// guessing. It is not a general-purpose XML parser: it ignores content
// outside the root element and doesn’t validate namespaces.

export type XMLElement = {
    // insertion-ordered; a repeated attribute name updates the value in place
    attributes: Map<string, string>;
    children: Array<XMLNode>;
    name: string;
    type: 'element';
};

export type XMLNode = XMLElement | XMLText;

export type XMLText = { type: 'text'; value: string };

const NAME_START = /[A-Za-z_:]/;
const NAME_CHARS = /[^\s='"/>]+/y;
const WHITESPACE = /\s*/y;

// Decode the five predefined XML entities plus decimal/hex character
// references. Unrecognized names (e.g. HTML-only ones like &nbsp;, which XML
// doesn’t define) pass through literally — and stay literal in the rendered
// output, because attribute values are fully re-escaped at emission, so the
// JSX compiler never gets a second pass at them. That’s a deliberate
// trade-off: the reference pipeline left values raw for the JSX layer to
// decode, which double-decoded entity-shaped text and emitted invalid JSX
// for values containing double quotes.
export function decodeEntities(text: string): string {
    if (!text.includes('&')) return text;
    return text.replace(
        /&(?:#x([0-9A-Fa-f]+)|#([0-9]+)|(amp|apos|gt|lt|quot));/g,
        (match, hex: string | undefined, dec: string | undefined, named?: string) => {
            if (named) {
                if (named === 'amp') return '&';
                if (named === 'apos') return "'";
                if (named === 'gt') return '>';
                if (named === 'lt') return '<';
                return '"';
            }
            const codePoint = parseInt(hex ?? dec ?? '', hex == null ? 10 : 16);
            try {
                return String.fromCodePoint(codePoint);
            } catch (_error) {
                return match;
            }
        },
    );
}

// Parse an SVG document and return its root element. Comments, doctypes,
// processing instructions, and anything else outside the root element are
// discarded; CDATA sections become text nodes with their literal contents.
export function parseSVG(svg: string, filePath?: string): XMLElement {
    // strip a leading BOM
    const input = svg.charCodeAt(0) === 0xfeff ? svg.slice(1) : svg;
    const { length } = input;
    let index = 0;
    let root: null | XMLElement = null;
    const stack: Array<XMLElement> = [];

    const fail = (message: string): never => {
        // report 1-based line:column, which editors understand better than
        // a character offset
        let column = 1;
        let line = 1;
        for (let position = 0; position < index; position += 1) {
            if (input[position] === '\n') {
                line += 1;
                column = 1;
            } else {
                column += 1;
            }
        }
        const source = filePath == null ? '' : ` in ${filePath}`;
        throw new Error(`Invalid SVG${source}: ${message} (${line}:${column})`);
    };

    const skipPast = (needle: string, description: string) => {
        const end = input.indexOf(needle, index);
        if (end === -1) fail(`unterminated ${description}`);
        index = end + needle.length;
    };

    while (index < length) {
        if (input[index] !== '<') {
            // text run
            const end = input.indexOf('<', index);
            const value = input.slice(index, end === -1 ? length : end);
            const parent: undefined | XMLElement = stack[stack.length - 1];
            if (parent != null) {
                parent.children.push({ type: 'text', value: decodeEntities(value) });
            } else if (value.trim() !== '') {
                fail('text content outside of the root element');
            }
            if (end === -1) break;
            index = end;
            continue;
        }

        if (input.startsWith('<?', index)) {
            // processing instruction (e.g. the <?xml …?> prolog)
            skipPast('?>', 'processing instruction');
        } else if (input.startsWith('<!--', index)) {
            skipPast('-->', 'comment');
        } else if (input.startsWith('<![CDATA[', index)) {
            const start = index + '<![CDATA['.length;
            const end = input.indexOf(']]>', start);
            if (end === -1) fail('unterminated CDATA section');
            const parent = stack[stack.length - 1];
            // CDATA contents are literal text: no entity decoding
            parent?.children.push({ type: 'text', value: input.slice(start, end) });
            index = end + ']]>'.length;
        } else if (input.startsWith('<!', index)) {
            // doctype: scan to the terminating '>', ignoring '>' characters
            // inside quoted literals and inside the bracketed internal subset
            // (which can hold entity declarations with their own '>'s), and
            // skipping comment and processing-instruction bodies so their
            // contents can't derail the quote/bracket tracking
            let end = -1;
            let inSubset = false;
            let quote = '';
            for (let scan = index + 2; scan < length; scan += 1) {
                const character = input[scan];
                if (quote !== '') {
                    if (character === quote) quote = '';
                } else if (input.startsWith('<!--', scan)) {
                    const commentEnd = input.indexOf('-->', scan + 4);
                    if (commentEnd === -1) {
                        // point the error at the comment, not the doctype
                        index = scan;
                        fail('unterminated comment');
                    }
                    scan = commentEnd + 2;
                } else if (input.startsWith('<?', scan)) {
                    const instructionEnd = input.indexOf('?>', scan + 2);
                    if (instructionEnd === -1) {
                        index = scan;
                        fail('unterminated processing instruction');
                    }
                    scan = instructionEnd + 1;
                } else if (character === '"' || character === "'") {
                    quote = character;
                } else if (character === '[') {
                    inSubset = true;
                } else if (character === ']') {
                    inSubset = false;
                } else if (character === '>' && !inSubset) {
                    end = scan;
                    break;
                }
            }
            if (end === -1) fail('unterminated doctype');
            index = end + 1;
        } else if (input.startsWith('</', index)) {
            index += 2;
            const name = readName();
            skipWhitespace();
            if (input[index] !== '>') fail(`malformed closing tag </${name}`);
            index += 1;
            const element = stack.pop();
            if (!element) fail(`unexpected closing tag </${name}>`);
            if (element && element.name !== name) {
                fail(`expected </${element.name}> but found </${name}>`);
            }
        } else {
            // opening tag
            index += 1;
            const element: XMLElement = {
                attributes: new Map(),
                children: [],
                name: readName(),
                type: 'element',
            };
            readAttributes(element);
            const parent: undefined | XMLElement = stack[stack.length - 1];
            if (parent != null) {
                parent.children.push(element);
            } else if (root == null) {
                root = element;
            } else {
                fail('multiple root elements');
            }
            const isSelfClosing = input.startsWith('/>', index);
            if (isSelfClosing) {
                index += 2;
            } else if (input[index] === '>') {
                index += 1;
                stack.push(element);
            } else {
                fail(`malformed tag <${element.name}`);
            }
        }
    }

    if (stack.length > 0) fail(`unclosed element <${stack[stack.length - 1].name}>`);
    // fail never returns; the return satisfies control-flow analysis
    if (root == null) return fail('no root element found');
    return root;

    function readAttributes(element: XMLElement) {
        for (;;) {
            skipWhitespace();
            const character = input[index];
            if (character == null) fail(`unterminated tag <${element.name}`);
            if (character === '>' || character === '/') return;
            const name = readName();
            skipWhitespace();
            if (input[index] !== '=') {
                // tolerate a minimized (valueless) attribute
                element.attributes.set(name, '');
                continue;
            }
            index += 1;
            skipWhitespace();
            const quote = input[index];
            if (quote !== '"' && quote !== "'") {
                fail(`attribute ${name} is missing a quoted value`);
            }
            index += 1;
            const end = input.indexOf(quote, index);
            if (end === -1) fail(`unterminated value for attribute ${name}`);
            element.attributes.set(name, decodeEntities(input.slice(index, end)));
            index = end + 1;
        }
    }

    function readName(): string {
        const character = input[index];
        if (character == null || !NAME_START.test(character)) {
            fail('expected a name');
        }
        NAME_CHARS.lastIndex = index;
        const match = NAME_CHARS.exec(input);
        // NAME_CHARS is a superset of NAME_START, so match is always non-null
        index = NAME_CHARS.lastIndex;
        return match?.[0] ?? '';
    }

    function skipWhitespace() {
        WHITESPACE.lastIndex = index;
        WHITESPACE.exec(input);
        index = WHITESPACE.lastIndex;
    }
}

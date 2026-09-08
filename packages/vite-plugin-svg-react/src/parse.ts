// A minimal XML parser for SVG sources. It handles the constructs that show
// up in real-world SVG files — XML prologs, doctypes (including internal
// subsets), comments, CDATA sections, character references, self-closing
// tags, and namespaced names — and throws on malformed markup rather than
// guessing, with one deliberate exception: a minimized attribute (`<svg
// hidden>`) is read as an empty value. XML requires a value and browsers
// reject such a file as image/svg+xml, but the same markup is legal inline
// in HTML, so it reaches these files in practice and `hidden=""` is what it
// means. It is not a general-purpose XML parser: it ignores content outside
// the root element and doesn’t validate namespaces.

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

// XML 1.0 Char: tab, LF, CR, then the scalar ranges, excluding surrogates
// and the two noncharacters at the end of the BMP
const isXMLCharacter = (codePoint: number) =>
    codePoint === 0x9 ||
    codePoint === 0xa ||
    codePoint === 0xd ||
    (codePoint >= 0x20 && codePoint <= 0xd7ff) ||
    (codePoint >= 0xe000 && codePoint <= 0xfffd) ||
    (codePoint >= 0x10000 && codePoint <= 0x10ffff);

// Offset of the root element’s opening `<`, or -1 if there isn’t one to find
// (an empty document, text before the root, an unterminated prolog construct).
// Everything before that offset — a BOM, the xml prolog, a doctype, header
// comments — is prolog that parseSVG discards, so slicing to it yields the
// only part of the source a consumer of the parsed tree can observe.
export function getRootElementOffset(svg: string): number {
    let index = svg.charCodeAt(0) === 0xfeff ? 1 : 0;
    while (index < svg.length) {
        WHITESPACE.lastIndex = index;
        WHITESPACE.exec(svg);
        index = WHITESPACE.lastIndex;
        if (svg[index] !== '<') return -1;
        if (svg.startsWith('<?', index)) {
            const end = svg.indexOf('?>', index + 2);
            if (end === -1) return -1;
            index = end + 2;
        } else if (svg.startsWith('<!--', index)) {
            const end = svg.indexOf('-->', index + 4);
            if (end === -1) return -1;
            index = end + 3;
        } else if (svg.startsWith('<!', index)) {
            const end = scanDoctypeEnd(svg, index);
            if (end === -1) return -1;
            index = end + 1;
        } else {
            return index;
        }
    }
    return -1;
}

// Offset of the terminating '>' of the `<!…>` declaration (in practice, the
// doctype) starting at `start`, ignoring '>' characters inside quoted
// literals and inside the bracketed internal subset (which can hold entity
// declarations with their own '>'s), and skipping comment and
// processing-instruction bodies so their contents can’t derail the
// quote/bracket tracking. Returns -1 when the declaration is unterminated,
// reporting it through `fail` first when one is given.
//
// `fail` returns never, and that’s load-bearing rather than descriptive:
// parseSVG advances past the returned offset unconditionally, so a callback
// that returned instead of throwing would send it back to offset 0 and loop
// over the document forever. Typing it this way makes the compiler hold the
// caller to it.
const scanDoctypeEnd = (
    input: string,
    start: number,
    fail?: (message: string, at: number) => never,
): number => {
    let inSubset = false;
    let quote = '';
    for (let scan = start + 2; scan < input.length; scan += 1) {
        const character = input[scan];
        if (quote !== '') {
            if (character === quote) quote = '';
        } else if (input.startsWith('<!--', scan)) {
            const commentEnd = input.indexOf('-->', scan + 4);
            if (commentEnd === -1) {
                // point the error at the comment, not the doctype
                if (fail) fail('unterminated comment', scan);
                return -1;
            }
            scan = commentEnd + 2;
        } else if (input.startsWith('<?', scan)) {
            const instructionEnd = input.indexOf('?>', scan + 2);
            if (instructionEnd === -1) {
                if (fail) fail('unterminated processing instruction', scan);
                return -1;
            }
            scan = instructionEnd + 1;
        } else if (character === '"' || character === "'") {
            quote = character;
        } else if (character === '[') {
            inSubset = true;
        } else if (character === ']') {
            inSubset = false;
        } else if (character === '>' && !inSubset) {
            return scan;
        }
    }
    if (fail) fail('unterminated doctype', start);
    return -1;
};

// Decode the five predefined XML entities plus decimal/hex character
// references. Unrecognized names (e.g. HTML-only ones like &nbsp;, which XML
// doesn’t define) pass through literally, and stay literal in the rendered
// output: emission escapes the `&` to `&amp;`, which the JSX compiler decodes
// back to a literal `&nbsp;` rather than to a non-breaking space. That’s the
// deliberate trade-off — the reference pipeline left values raw for the JSX
// layer to decode, which double-decoded entity-shaped text and emitted
// invalid JSX for values containing double quotes.
//
// A reference naming a character XML forbids is a different case: it can’t
// pass through literally without smuggling e.g. a NUL into the generated
// module, so it fails the parse instead.
export function decodeEntities(text: string, fail?: (message: string) => never): string {
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
            if (!isXMLCharacter(codePoint)) {
                if (fail) fail(`${match} is not a valid XML character`);
                return match;
            }
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
    // offset of the root's opening tag, so a wrong root points at itself
    // rather than at wherever parsing happened to finish
    let rootStart = 0;
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
                parent.children.push({
                    type: 'text',
                    value: decodeEntities(value, fail),
                });
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
            const end = scanDoctypeEnd(input, index, (message, at) => {
                index = at;
                return fail(message);
            });
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
            const tagStart = index;
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
                rootStart = tagStart;
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
    // a .svg?react module is a component typed SVGProps<SVGSVGElement> that
    // spreads onto its root, so a root that isn’t <svg> makes the wrapper a
    // lie and emits an element nobody asked for
    if (root.name !== 'svg') {
        index = rootStart;
        return fail(`root element must be <svg> but found <${root.name}>`);
    }
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
            element.attributes.set(name, decodeEntities(input.slice(index, end), fail));
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

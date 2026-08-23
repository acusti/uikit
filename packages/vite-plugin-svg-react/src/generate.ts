import {
    ATTRIBUTE_MAPPINGS,
    ELEMENT_ATTRIBUTE_MAPPINGS,
    TAG_NAME_MAPPINGS,
} from './mappings.js';
import { parseSVG, type XMLElement, type XMLText } from './parse.js';

// The options this plugin supports: a deliberately small subset of svgr’s
// Config, limited to options that shape the generated <svg> element itself.
// Their semantics match what @svgr/core did for the same options; the module
// wrapper (typed, default-export, props spread at the end) is fixed.
export type ComponentOptions = {
    /** Remove width/height from the root <svg> (default: keep them). */
    dimensions?: boolean;
    /** Set width/height to 1em (true) or the given value (default: false). */
    icon?: boolean | number | string;
    /** Extra props for the root <svg>; `{expression}` values are inserted verbatim. */
    svgProps?: Record<string, string>;
};

// runtime mirror of the ComponentOptions keys, used to reject options this
// plugin doesn’t support instead of silently ignoring them; the satisfies
// clause makes tsc fail if the two ever drift apart
const componentOptionNames = {
    dimensions: true,
    icon: true,
    svgProps: true,
} satisfies Record<keyof Required<ComponentOptions>, true>;

export const COMPONENT_OPTION_NAMES: ReadonlySet<string> = new Set(
    Object.keys(componentOptionNames),
);

// An svgProps value wrapped in braces is inserted into the JSX verbatim as
// an expression container; anything else is emitted as a quoted string.
const isExpressionValue = (value: string) => value.startsWith('{') && value.endsWith('}');

// Whether the leading brace closes only at the final one, i.e. the value is a
// single expression container rather than `{a} {b}` or `{props.width}}`.
// Braces inside quoted strings don’t count, so `{t("}")}` stays balanced.
//
// Returns null for “can’t tell”: a slash may open a regex literal or a
// comment, either of which can hold an unmatched brace, and telling those
// from division needs real tokenization rather than a scanner. Those values
// go unvalidated instead of risking a false positive on a working config —
// rejecting valid config is worse than the oxc error this check front-runs.
const isBalancedExpression = (value: string): boolean | null => {
    let depth = 0;
    let escaped = false;
    let quote = '';
    for (let index = 0; index < value.length; index += 1) {
        const character = value[index];
        if (escaped) {
            escaped = false;
        } else if (character === '\\') {
            escaped = true;
        } else if (quote !== '') {
            if (character === quote) quote = '';
        } else if (character === '"' || character === "'" || character === '`') {
            quote = character;
        } else if (character === '/') {
            return null;
        } else if (character === '{') {
            depth += 1;
        } else if (character === '}') {
            depth -= 1;
            // closing early means the rest sits outside the container
            if (depth === 0) return index === value.length - 1;
        }
    }
    return false;
};

// Report the first option that would produce silently wrong output or invalid
// JSX, or null if the options are usable. TypeScript catches these on an
// object literal, but a plain-JS vite.config gets no diagnostic at all — and
// svgProps names and expression values reach the generated module verbatim,
// so a malformed one would otherwise surface as an oxc parse error blamed on
// the SVG file rather than on the config that caused it.
export const getComponentOptionsError = (options: ComponentOptions): null | string => {
    // only undefined counts as “not provided”: an explicit null means the
    // config meant something by it, and every option silently ignores it
    // (icon: null is the loud one — it renders as width="null")
    const { dimensions, icon, svgProps } = options;
    if (dimensions !== undefined && typeof dimensions !== 'boolean') {
        return 'dimensions must be a boolean';
    }
    if (
        icon !== undefined &&
        typeof icon !== 'boolean' &&
        typeof icon !== 'number' &&
        typeof icon !== 'string'
    ) {
        return 'icon must be a boolean, number, or string';
    }
    if (svgProps === undefined) return null;
    if (typeof svgProps !== 'object' || svgProps === null || Array.isArray(svgProps)) {
        return 'svgProps must be an object';
    }
    for (const [name, value] of Object.entries(svgProps)) {
        if (!SVG_PROP_NAME_REGEX.test(name)) {
            return `svgProps name ${JSON.stringify(name)} isn’t a valid JSX attribute name`;
        }
        if (typeof value !== 'string') {
            return `svgProps.${name} must be a string`;
        }
        // a leading brace means an expression was intended, which is wider
        // than the both-ends rule isExpressionValue emits on: `{props.width`
        // would otherwise pass as a literal string and render as one. A
        // trailing brace alone doesn’t qualify — `d="M0 0}"` is a fine string
        // value. Brace balance only, and only when confidently lexed: the
        // expression’s own syntax is the JSX compiler’s to judge, and by then
        // the message names the config value.
        if (value.startsWith('{') && isBalancedExpression(value) === false) {
            return `svgProps.${name} value ${JSON.stringify(value)} isn’t a balanced {expression}`;
        }
    }
    return null;
};

const IDENTIFIER_REGEX = /^[A-Za-z_$][\w$]*$/;
// lowercase-initial (intrinsic) JSX element names: JSX resolves these as
// string tags; dashes and underscores are allowed after the first character
// (custom elements inside <foreignObject>, generated XML names)
const INTRINSIC_TAG_REGEX = /^[a-z][\w-]*$/;
const KEBAB_REGEX = /[A-ZÀ-ÖØ-Þ]/g;
const MS_PREFIX_REGEX = /^-ms-/;
// tabs, newlines, and exotic line separators collapse to a single space in
// attribute values (regular spaces are preserved as-is)
const SPACES_REGEX = /[\t\n\r\u0085\u2028\u2029]+/g;
// svgProps names are emitted as JSX attribute names verbatim, so they have
// to be spellable as one: an identifier-ish head plus dashes for data-*/aria-*
const SVG_PROP_NAME_REGEX = /^[A-Za-z_][\w-]*$/;
const WHITESPACE_ONLY_REGEX = /^\s+$/;

// # Name and value conversion

const escapeAttributeValue = (value: string) =>
    value.replace(SPACES_REGEX, ' ').replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const hyphenToCamelCase = (name: string) =>
    name.replace(/-(.)/g, (_, character: string) => character.toUpperCase());

const isNumericValue = (value: string) =>
    value.trim() !== '' &&
    !Number.isNaN(Number(value)) &&
    !Number.isNaN(parseFloat(value));

const kebabCase = (name: string) =>
    name.replace(KEBAB_REGEX, (match) => `-${match.toLowerCase()}`);

// Convert an SVG attribute name to its React prop name: mapped names (e.g.
// stroke-width → strokeWidth, class → className, xlink:href → xlinkHref) come
// from the reference tables, aria-*/data-* attributes pass through in
// kebab-case, and anything else passes through unchanged.
const toPropName = (name: string, elementName: string) => {
    const lowerCaseName = name.toLowerCase();
    const mappedName =
        ELEMENT_ATTRIBUTE_MAPPINGS[elementName]?.[lowerCaseName] ??
        ATTRIBUTE_MAPPINGS[lowerCaseName];
    if (mappedName != null) return mappedName;
    const kebabName = kebabCase(name);
    if (kebabName.startsWith('aria-')) {
        const [aria, ...rest] = kebabName.split('-');
        return `${aria}-${rest.join('').toLowerCase()}`;
    }
    if (kebabName.startsWith('data-')) return kebabName;
    return name;
};

// Split a style string into declarations at semicolons, ignoring semicolons
// inside quotes or parentheses (e.g. url(data:image/png;base64,…)) and
// honoring backslash escapes inside quoted strings.
const splitStyleDeclarations = (style: string) => {
    const declarations: Array<string> = [];
    let current = '';
    let depth = 0;
    let escaped = false;
    let quote = '';
    for (const character of style) {
        if (escaped) {
            escaped = false;
        } else if (character === '\\') {
            escaped = true;
        } else if (quote !== '') {
            if (character === quote) quote = '';
        } else if (character === '"' || character === "'") {
            quote = character;
        } else if (character === '(') {
            depth += 1;
        } else if (character === ')') {
            if (depth > 0) depth -= 1;
        } else if (character === ';' && depth === 0) {
            declarations.push(current);
            current = '';
            continue;
        }
        current += character;
    }
    declarations.push(current);
    return declarations;
};

// Convert a style="…" string to a JSX style object literal, e.g.
// style="fill: red; stroke-width: 2" → {{ fill: "red", strokeWidth: 2 }}.
// Values with units stay strings: React only auto-appends px to properties
// outside its unitless list, so converting "20px" to 20 would corrupt
// unitless properties (line-height) and custom properties (--*).
const toStyleObject = (style: string) => {
    const properties: Array<string> = [];
    for (const declaration of splitStyleDeclarations(style)) {
        const trimmed = declaration.trim();
        const firstColon = trimmed.indexOf(':');
        if (firstColon <= 0) continue;
        const name = trimmed.slice(0, firstColon).trim();
        const value = trimmed.slice(firstColon + 1).trim();
        let key = '';
        if (name.startsWith('--')) {
            // custom properties keep their literal name
            key = JSON.stringify(name);
        } else {
            key = hyphenToCamelCase(name.toLowerCase().replace(MS_PREFIX_REGEX, 'ms-'));
            if (!IDENTIFIER_REGEX.test(key)) key = JSON.stringify(key);
        }
        const formattedValue = isNumericValue(value)
            ? String(Number(value))
            : JSON.stringify(value);
        properties.push(`${key}: ${formattedValue}`);
    }
    if (properties.length === 0) return '{}';
    return `{ ${properties.join(', ')} }`;
};

// # JSX emission

const toJSXAttribute = (name: string, value: string, elementName: string) => {
    const propName = toPropName(name, elementName);
    if (propName === 'style') return `style={${toStyleObject(value)}}`;
    if (isNumericValue(value)) return `${propName}={${Number(value)}}`;
    return `${propName}="${escapeAttributeValue(value)}"`;
};

const toJSXElement = (
    element: XMLElement,
    trailingAttributes?: Array<string>,
): string => {
    // like the reference, tag names are looked up as written (attribute
    // names, by contrast, are lowercased before their table lookup)
    const name = TAG_NAME_MAPPINGS[element.name] ?? element.name;
    // namespaced names compile to string tags, but React renders them as
    // unknown elements (an svg:rect is not a rect), so reject them with an
    // accurate message instead of emitting markup that renders wrong
    if (name.includes(':')) {
        throw new Error(`namespaced element names aren’t supported (<${element.name}>)`);
    }
    // JSX treats capitalized or dotted names as component references, so a
    // name that isn’t a valid intrinsic (lowercase-initial) element must
    // fail the build here instead of compiling into a runtime ReferenceError
    if (!INTRINSIC_TAG_REGEX.test(name)) {
        throw new Error(`<${element.name}> is not a valid SVG element name`);
    }
    const attributes: Array<string> = [];
    for (const [attributeName, value] of element.attributes) {
        attributes.push(toJSXAttribute(attributeName, value, element.name));
    }
    if (trailingAttributes) attributes.push(...trailingAttributes);
    const attributesText = attributes.length ? ` ${attributes.join(' ')}` : '';
    let children = '';
    for (const child of element.children) {
        children += child.type === 'text' ? toJSXText(child) : toJSXElement(child);
    }
    if (children === '') return `<${name}${attributesText} />`;
    return `<${name}${attributesText}>${children}</${name}>`;
};

// Text becomes a string-literal expression container ({"…"}) so that braces,
// quotes, and backslashes in the source text can’t break the JSX.
const toJSXText = (text: XMLText) => {
    if (text.value === '' || WHITESPACE_ONLY_REGEX.test(text.value)) return '';
    return `{${JSON.stringify(text.value)}}`;
};

// # Component module generation

// Derive the component’s identifier from the SVG’s file name the same way
// svgr did: Svg + PascalCase(basename), e.g. arrow-left.svg → SvgArrowLeft.
export const getComponentName = (filePath: string) => {
    const baseName = filePath.split(/[\\/]/).pop() ?? '';
    const fileName = baseName.replace(/\.[^.]*$/, '');
    const pascalCased = fileName
        .split(/[^0-9A-Za-z]+/)
        .filter(Boolean)
        .map((part) =>
            part.replace(
                /^([0-9]*)([A-Za-z])/,
                (_, digits: string, letter: string) => digits + letter.toUpperCase(),
            ),
        )
        .join('');
    return `Svg${pascalCased}`;
};

// Generate the component module (TSX) for an SVG source. The output matches
// the shape svgr produced by default: a typed arrow-function component named
// after the file that spreads its props onto the root <svg>, exported as the
// default export.
export function generateComponentModule(
    svg: string,
    filePath: string,
    options: ComponentOptions = {},
): string {
    const { dimensions, icon = false, svgProps } = options;

    const root = parseSVG(svg, filePath);

    if (dimensions === false) {
        root.attributes.delete('width');
        root.attributes.delete('height');
    } else if (icon !== false) {
        // Map.set preserves the position of existing width/height attributes
        // and appends missing ones, matching svgr’s icon behavior
        const size = icon === true ? '1em' : String(icon);
        root.attributes.set('width', size);
        root.attributes.set('height', size);
    }

    const trailing: Array<string> = [];
    if (svgProps) {
        for (const [name, value] of Object.entries(svgProps)) {
            // drop any root attribute the prop overrides: emitting both would
            // be a duplicate JSX attribute (a TS error, and only last-wins by
            // oxc's grace). svgr replaced the attribute in place; appending
            // instead keeps the same rendered result with unambiguous JSX.
            for (const attributeName of root.attributes.keys()) {
                if (toPropName(attributeName, root.name) === name) {
                    root.attributes.delete(attributeName);
                }
            }
            trailing.push(
                isExpressionValue(value)
                    ? `${name}=${value}`
                    : `${name}="${escapeAttributeValue(value)}"`,
            );
        }
    }
    trailing.push('{...props}');

    let jsx = '';
    try {
        jsx = toJSXElement(root, trailing);
    } catch (error) {
        // prefix emitter errors with the source file, matching parseSVG’s
        // own diagnostics
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Invalid SVG in ${filePath}: ${message}`);
    }

    const componentName = getComponentName(filePath);
    return [
        `import type { SVGProps } from 'react';`,
        `const ${componentName} = (props: SVGProps<SVGSVGElement>) => ${jsx};`,
        `export default ${componentName};`,
        '',
    ].join('\n');
}

import {
    ATTRIBUTE_MAPPINGS,
    ELEMENT_ATTRIBUTE_MAPPINGS,
    TAG_NAME_MAPPINGS,
} from './mappings.js';
import { parseSVG, type XMLElement, type XMLText } from './parse.js';

// The subset of svgr’s Config that this plugin supports natively now that it
// generates the component module directly (no svgr, no Babel). Defaults and
// behavior match what @svgr/core produced for the same options.
export type ComponentOptions = {
    /** Remove width/height from the root <svg> (default: keep them). */
    dimensions?: boolean;
    /** Where to spread props onto the root <svg> (default: 'end'; true is an alias for 'end'). */
    expandProps?: boolean | 'end' | 'start';
    /** Emit `export default` or a named `ReactComponent` export (default: 'default'). */
    exportType?: 'default' | 'named';
    /** Set width/height to 1em (true) or the given value (default: false). */
    icon?: boolean | number | string;
    /** With 'classic', compile against React.createElement (default: 'automatic'). */
    jsxRuntime?: 'automatic' | 'classic';
    /** Wrap the component with React.memo (default: false). */
    memo?: boolean;
    /** Forward refs to the root <svg> via React.forwardRef (default: false). */
    ref?: boolean;
    /** Extra props for the root <svg>; `{expression}` values are inserted verbatim. */
    svgProps?: Record<string, string>;
    /** Type the component with SVGProps<SVGSVGElement> (default: true). */
    typescript?: boolean;
};

// runtime mirror of the ComponentOptions keys, used to reject svgr options
// that this plugin no longer supports instead of silently ignoring them
export const COMPONENT_OPTION_NAMES: ReadonlySet<string> = new Set([
    'dimensions',
    'expandProps',
    'exportType',
    'icon',
    'jsxRuntime',
    'memo',
    'ref',
    'svgProps',
    'typescript',
]);

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

type RootAttributes = {
    /** Attribute tokens inserted before the element’s own (expandProps: 'start'). */
    leading?: Array<string>;
    /** Attribute tokens appended after the element’s own (svgProps, ref, spread). */
    trailing?: Array<string>;
};

const toJSXElement = (element: XMLElement, rootAttributes?: RootAttributes): string => {
    // like the reference, tag names are looked up as written (attribute
    // names, by contrast, are lowercased before their table lookup)
    const name = TAG_NAME_MAPPINGS[element.name] ?? element.name;
    // JSX treats capitalized or dotted names as component references, so a
    // name that isn’t a valid intrinsic (lowercase-initial) element must
    // fail the build here instead of compiling into a runtime ReferenceError
    if (!INTRINSIC_TAG_REGEX.test(name)) {
        throw new Error(`Invalid SVG: <${element.name}> is not a valid SVG element name`);
    }
    const attributes: Array<string> = [...(rootAttributes?.leading ?? [])];
    for (const [attributeName, value] of element.attributes) {
        attributes.push(toJSXAttribute(attributeName, value, element.name));
    }
    attributes.push(...(rootAttributes?.trailing ?? []));
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

// Generate the component module (TSX by default) for an SVG source. The
// output matches the shape svgr produced: a props-spreading arrow-function
// component named after the file, exported as the default export (or as
// ReactComponent for exportType: 'named').
export function generateComponentModule(
    svg: string,
    filePath: string,
    options: ComponentOptions = {},
): string {
    const {
        dimensions,
        expandProps = 'end',
        exportType = 'default',
        icon = false,
        jsxRuntime = 'automatic',
        memo = false,
        ref = false,
        svgProps,
        typescript = true,
    } = options;

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
            const isExpression = value.startsWith('{') && value.endsWith('}');
            trailing.push(
                isExpression
                    ? `${name}=${value}`
                    : `${name}="${escapeAttributeValue(value)}"`,
            );
        }
    }
    if (ref) trailing.push('ref={ref}');
    // svgr typed expandProps as boolean | 'start' | 'end'; true means 'end'
    const spreadPosition = expandProps === true ? 'end' : expandProps;
    if (spreadPosition === 'end') trailing.push('{...props}');

    const jsx = toJSXElement(root, {
        leading: spreadPosition === 'start' ? ['{...props}'] : [],
        trailing,
    });

    const withProps = spreadPosition !== false;
    const lines: Array<string> = [];
    if (jsxRuntime === 'classic') lines.push(`import * as React from 'react';`);
    if (typescript && (withProps || ref)) {
        lines.push(`import type { SVGProps } from 'react';`);
    }
    if (ref || memo) {
        const reactImports = [
            ref && typescript ? 'type Ref' : null,
            ref ? 'forwardRef' : null,
            memo ? 'memo' : null,
        ].filter(Boolean);
        lines.push(`import { ${reactImports.join(', ')} } from 'react';`);
    }

    const propsType = typescript ? ': SVGProps<SVGSVGElement>' : '';
    const parameters: Array<string> = [];
    if (withProps) {
        parameters.push(`props${propsType}`);
    } else if (ref) {
        parameters.push(`_props${propsType}`);
    }
    if (ref) parameters.push(`ref${typescript ? ': Ref<SVGSVGElement>' : ''}`);

    const componentName = getComponentName(filePath);
    lines.push(`const ${componentName} = (${parameters.join(', ')}) => ${jsx};`);

    let exportedName = componentName;
    if (ref) {
        lines.push(`const ForwardRef = forwardRef(${componentName});`);
        exportedName = 'ForwardRef';
    }
    if (memo) {
        lines.push(`const Memo = memo(${exportedName});`);
        exportedName = 'Memo';
    }
    lines.push(
        exportType === 'named'
            ? `export { ${exportedName} as ReactComponent };`
            : `export default ${exportedName};`,
    );

    return `${lines.join('\n')}\n`;
}

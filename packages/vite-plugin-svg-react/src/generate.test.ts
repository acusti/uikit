import { describe, expect, it } from 'vitest';

import { generateComponentModule, getComponentName } from './generate.js';

const SIMPLE_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h1v1H0z"/></svg>';

const generate = (
    svg: string,
    options?: Parameters<typeof generateComponentModule>[2],
    filePath = '/x/icon.svg',
) => generateComponentModule(svg, filePath, options);

describe('generateComponentModule', () => {
    it('emits a typed default-export component that spreads props onto the root <svg>', () => {
        const code = generate(SIMPLE_SVG);
        expect(code).toContain(`import type { SVGProps } from 'react';`);
        expect(code).toContain('const SvgIcon = (props: SVGProps<SVGSVGElement>) =>');
        expect(code).toContain('{...props}><path d="M0 0h1v1H0z" /></svg>');
        expect(code).toContain('export default SvgIcon;');
    });

    it('strips the XML prolog, doctype, and comments', () => {
        const code = generate(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- leading comment -->
<svg><!-- inner comment --><path d="M0 0"/></svg>`);
        expect(code).not.toContain('xml version');
        expect(code).not.toContain('DOCTYPE');
        expect(code).not.toContain('comment');
    });

    it('handles doctypes with quoted ">" and internal subsets', () => {
        // ">" inside a quoted literal doesn’t terminate the doctype
        expect(
            generate('<!DOCTYPE svg SYSTEM "weird>name.dtd"><svg><path d="M0 0"/></svg>'),
        ).toContain('<path d="M0 0" />');
        // Illustrator-style internal subset with entity declarations
        expect(
            generate(
                '<!DOCTYPE svg [ <!ENTITY ns_a "http://a.example"> <!ENTITY gt-ish "a > b"> ]><svg/>',
            ),
        ).toContain('<svg {...props} />');
        // brackets and apostrophes inside subset comments don't derail the scan
        expect(generate("<!DOCTYPE svg [ <!-- don't strip ] --> ]><svg/>")).toContain(
            '<svg {...props} />',
        );
    });

    it('converts kebab-case, class, and namespaced attributes to React prop names', () => {
        const code = generate(
            '<svg xmlns:xlink="http://www.w3.org/1999/xlink" class="icon" stroke-width="2" fill-rule="evenodd" clip-rule="evenodd"><use xlink:href="#a" xml:space="preserve"/></svg>',
        );
        expect(code).toContain('xmlnsXlink="http://www.w3.org/1999/xlink"');
        expect(code).toContain('className="icon"');
        expect(code).toContain('strokeWidth={2}');
        expect(code).toContain('fillRule="evenodd"');
        expect(code).toContain('clipRule="evenodd"');
        expect(code).toContain('xlinkHref="#a"');
        expect(code).toContain('xmlSpace="preserve"');
    });

    it('passes data-* and aria-* attributes through unchanged', () => {
        const code = generate(
            '<svg data-foo="bar" aria-hidden="true" aria-labelledby="t"/>',
        );
        expect(code).toContain('data-foo="bar"');
        expect(code).toContain('aria-hidden="true"');
        expect(code).toContain('aria-labelledby="t"');
    });

    it('converts numeric-looking attribute values to expressions', () => {
        const code = generate(
            '<svg width="24" x="-1.5" viewBox="0 0 24 24" opacity="50%"/>',
        );
        expect(code).toContain('width={24}');
        expect(code).toContain('x={-1.5}');
        // multi-number and unit values stay strings
        expect(code).toContain('viewBox="0 0 24 24"');
        expect(code).toContain('opacity="50%"');
    });

    it('converts style strings to JSX style object literals', () => {
        const code = generate(
            '<svg><path style="fill: red; stroke-width: 2; margin-top: 4px; -webkit-transform: rotate(3deg); -ms-transform: none; --custom: 4"/></svg>',
        );
        expect(code).toContain(
            'style={{ fill: "red", strokeWidth: 2, marginTop: "4px", WebkitTransform: "rotate(3deg)", msTransform: "none", "--custom": 4 }}',
        );
    });

    it('keeps px style values as strings so React-unitless properties stay correct', () => {
        // converting "20px" to 20 would make React render line-height: 20 (a
        // font-size multiplier) and strip the unit from custom properties
        const code = generate('<svg><text style="line-height: 20px; --gap: 6px"/></svg>');
        expect(code).toContain('style={{ lineHeight: "20px", "--gap": "6px" }}');
    });

    it('ignores semicolons inside parentheses and quotes in style values', () => {
        const code = generate(
            '<svg><rect style="background: url(data:image/png;base64,aa;bb); fill: red"/></svg>',
        );
        expect(code).toContain(
            'style={{ background: "url(data:image/png;base64,aa;bb)", fill: "red" }}',
        );
        // a backslash-escaped quote doesn't end the quoted run early
        const escaped = generate(
            `<svg><text style="font-family: 'a\\'b; c'; fill: red"/></svg>`,
        );
        expect(escaped).toContain(`fontFamily: "'a\\\\'b; c'", fill: "red"`);
    });

    it('maps lowercased camelCase tag names back to their JSX names', () => {
        const code = generate(
            '<svg><clippath id="c"/><lineargradient id="g"/><foreignobject/></svg>',
        );
        expect(code).toContain('<clipPath id="c" />');
        expect(code).toContain('<linearGradient id="g" />');
        expect(code).toContain('<foreignObject />');
    });

    it('decodes XML entities in text and attribute values', () => {
        const code = generate(
            '<svg><text font-family="A &amp; B &quot;C&quot;">a&#65;&lt;b&gt;&#x2603;</text></svg>',
        );
        // re-encoded for the JSX attribute context; decoded again at compile time
        expect(code).toContain('fontFamily="A &amp; B &quot;C&quot;"');
        expect(code).toContain('{"aA<b>☃"}');
    });

    it('escapes text content containing braces, quotes, and backslashes', () => {
        // \u2028 as an escape, not the raw character: a bare line separator is
        // invisible in review and some tooling silently normalizes it away
        const code = generate(
            '<svg><text>braces {here} "quoted" \\ and \u2028</text></svg>',
        );
        expect(code).toContain('{"braces {here} \\"quoted\\" \\\\ and \u2028"}');
    });

    it('preserves CDATA sections as literal text', () => {
        const code = generate(
            '<svg><style><![CDATA[.a > .b { fill: red; }]]></style></svg>',
        );
        expect(code).toContain('<style>{".a > .b { fill: red; }"}</style>');
    });

    it('drops whitespace-only text but keeps <title> and <desc> content', () => {
        const code = generate(
            '<svg>\n  <title>My Title</title>\n  <desc>My Desc</desc>\n</svg>',
        );
        expect(code).toContain('<title>{"My Title"}</title>');
        expect(code).toContain('<desc>{"My Desc"}</desc>');
        expect(code).not.toContain('{"\\n');
    });

    it('collapses tabs and newlines in attribute values to single spaces', () => {
        const code = generate('<svg><path d="M0 0\n  h1v1\tH0z"/></svg>');
        expect(code).toContain('d="M0 0   h1v1 H0z"');
    });

    it('supports icon and dimensions', () => {
        expect(generate('<svg viewBox="0 0 24 24"/>', { icon: true })).toContain(
            '<svg viewBox="0 0 24 24" width="1em" height="1em" {...props} />',
        );
        expect(generate(SIMPLE_SVG, { icon: 32 })).toContain('width={32} height={32}');
        expect(generate(SIMPLE_SVG, { dimensions: false })).not.toContain('width=');
    });

    it('supports svgProps, including expression values', () => {
        const code = generate(SIMPLE_SVG, {
            svgProps: { height: '{props.width}', role: 'img' },
        });
        expect(code).toContain('role="img"');
        expect(code).toContain('height={props.width}');
        // the overridden root attribute is dropped, not duplicated
        expect(code).not.toContain('height={24}');
        expect(code.match(/height/g)).toHaveLength(1);
    });

    it('drops root attributes that svgProps override via their prop names', () => {
        const code = generate('<svg class="icon"><path d="M0 0"/></svg>', {
            svgProps: { className: 'overridden' },
        });
        expect(code).toContain('className="overridden"');
        expect(code.match(/className/g)).toHaveLength(1);
    });

    it('throws on tag names that aren’t intrinsic JSX elements', () => {
        // an uppercase-initial or dotted name would compile into a component
        // reference and throw a ReferenceError at render time; the message
        // names the source file like the parser’s own diagnostics
        expect(() => generate('<svg><CLIPPATH/></svg>')).toThrow(
            /in \/x\/icon\.svg: <CLIPPATH>/,
        );
        expect(() => generate('<svg><a.b/></svg>')).toThrow(/a\.b/);
        // namespaced names compile to string tags but render as unknown
        // elements, so they’re rejected with an accurate message
        expect(() => generate('<svg><svg:rect/></svg>')).toThrow(
            /namespaced element names aren’t supported \(<svg:rect>\)/,
        );
        // lowercase-initial names with dashes or underscores are string tags
        expect(generate('<svg><my-widget/><my_widget/></svg>')).toContain(
            '<my-widget /><my_widget />',
        );
    });

    it('throws on malformed SVG, naming the file and position', () => {
        expect(() => generate('<svg><path></svg>')).toThrow(
            /Invalid SVG in \/x\/icon\.svg: expected <\/path>.*\(1:\d+\)/,
        );
        expect(() => generate('just text')).toThrow(/Invalid SVG/);
        expect(() => generate('<svg>')).toThrow(/unclosed element/);
        expect(() => generate('<!-- no root -->')).toThrow(
            /in \/x\/icon\.svg: no root element found/,
        );
    });
});

describe('getComponentName', () => {
    it('derives Svg-prefixed PascalCase names from file paths', () => {
        expect(getComponentName('/x/icon.svg')).toBe('SvgIcon');
        expect(getComponentName('/x/arrow-left.svg')).toBe('SvgArrowLeft');
        expect(getComponentName('/x/my_icon.svg')).toBe('SvgMyIcon');
        expect(getComponentName('/x/2fast.svg')).toBe('Svg2Fast');
    });
});

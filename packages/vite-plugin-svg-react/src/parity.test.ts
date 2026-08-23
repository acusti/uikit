import { describe, expect, it } from 'vitest';

import { type ComponentOptions, generateComponentModule } from './generate.js';

// The differential corpus behind the conversion-fidelity claim: these
// outputs were verified against @svgr/core@8.1 + @svgr/plugin-jsx before the
// dependency was removed — byte-for-byte modulo quote style, except for the
// documented deliberate divergences (CDATA preserved, px style values kept
// as strings, semicolons inside url()/quotes not treated as declaration
// boundaries, attribute values fully escaped at emission, svgProps overrides
// appended instead of replaced in place, and namespaced element names
// rejected at build time). The corpus covers the supported options
// (dimensions, icon, svgProps) and the markup edge cases; svgr options the
// plugin deliberately dropped are rejected at config time and aren’t
// represented here. If a change to generate.ts, parse.ts, or mappings.ts
// alters a snapshot, that’s a fidelity break: update deliberately, with the
// divergence documented, or not at all.

const COMPLEX_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- a comment -->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24" class="icon" stroke-width="2" fill-rule="evenodd">
  <title>My &amp; Icon</title>
  <desc>It's a "nice" icon {with braces}</desc>
  <defs>
    <linearGradient id="g"><stop offset="0%" stop-color="#fff"/></linearGradient>
  </defs>
  <style>.cls-1{fill:red}</style>
  <path d="M0 0h1v1H0z" style="fill: red; stroke-width: 2; -webkit-transform: rotate(3deg); --custom: 4"/>
  <use xlink:href="#g" xml:space="preserve" data-foo="bar" aria-hidden="true"/>
  <text>braces {here} and "quotes"</text>
</svg>`;

const SIMPLE_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h1v1H0z"/></svg>';

const generate = (svg: string, options?: ComponentOptions, filePath = '/x/icon.svg') =>
    generateComponentModule(svg, filePath, options);

describe('svgr parity corpus', () => {
    it('defaults with the complex document', () => {
        expect(generate(COMPLEX_SVG)).toMatchSnapshot();
    });

    it('defaults with the simple document', () => {
        expect(generate(SIMPLE_SVG)).toMatchSnapshot();
    });

    it('icon true without dimensions', () => {
        const svg = '<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>';
        expect(generate(svg, { icon: true }, '/x/arrow-left.svg')).toMatchSnapshot();
    });

    it('icon numeric', () => {
        expect(generate(SIMPLE_SVG, { icon: 32 })).toMatchSnapshot();
    });

    it('dimensions false', () => {
        expect(generate(SIMPLE_SVG, { dimensions: false })).toMatchSnapshot();
    });

    it('svgProps with an expression value', () => {
        const svgProps = { height: '{props.width}', role: 'img' };
        expect(generate(SIMPLE_SVG, { svgProps })).toMatchSnapshot();
    });

    it('CDATA, entities, and multiline attributes', () => {
        const svg =
            '<svg><style><![CDATA[.a > .b { fill: red; }]]></style><text font-family="A &amp; B &quot;C&quot;" x="5">a&#65;&lt;b&gt;</text><path d="M0 0\n  h1v1\tH0z"/></svg>';
        expect(generate(svg)).toMatchSnapshot();
    });

    it('component naming from a digit-initial file name', () => {
        expect(generate(SIMPLE_SVG, undefined, '/x/2fast.svg')).toMatchSnapshot();
    });
});

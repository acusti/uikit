import { describe, expect, it } from 'vitest';

import { type ComponentOptions, generateComponentModule } from './generate.js';

// The differential corpus behind the PR’s parity claim: these outputs were
// verified against @svgr/core@8.1 + @svgr/plugin-jsx before the dependency
// was removed — byte-for-byte modulo quote style, except for the documented
// deliberate divergences (CDATA preserved, px style values kept as strings,
// semicolons inside url()/quotes not treated as declaration boundaries,
// attribute values fully escaped at emission, svgProps overrides appended
// instead of replaced in place, and namespaced element names rejected at
// build time). If a change to generate.ts,
// parse.ts, or mappings.ts alters a snapshot, that’s a parity break: update
// deliberately, with the divergence documented, or not at all.

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

const CASES: Array<{
    filePath?: string;
    name: string;
    options?: ComponentOptions;
    svg?: string;
}> = [
    { name: 'defaults with the complex document', svg: COMPLEX_SVG },
    { name: 'defaults with the simple document' },
    { name: 'exportType named', options: { exportType: 'named' } },
    {
        filePath: '/x/arrow-left.svg',
        name: 'icon true without dimensions',
        options: { icon: true },
        svg: '<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>',
    },
    { name: 'icon numeric', options: { icon: 32 } },
    { name: 'dimensions false', options: { dimensions: false } },
    { filePath: '/x/my_icon.svg', name: 'ref', options: { ref: true } },
    { name: 'memo', options: { memo: true } },
    { name: 'ref and memo', options: { memo: true, ref: true } },
    {
        name: 'svgProps with an expression value',
        options: { svgProps: { height: '{props.width}', role: 'img' } },
    },
    { name: 'typescript false', options: { typescript: false } },
    { name: 'jsxRuntime classic', options: { jsxRuntime: 'classic' } },
    { name: 'expandProps start', options: { expandProps: 'start' } },
    { name: 'expandProps false', options: { expandProps: false } },
    {
        name: 'CDATA, entities, and multiline attributes',
        svg: '<svg><style><![CDATA[.a > .b { fill: red; }]]></style><text font-family="A &amp; B &quot;C&quot;" x="5">a&#65;&lt;b&gt;</text><path d="M0 0\n  h1v1\tH0z"/></svg>',
    },
    {
        filePath: '/x/2fast.svg',
        name: 'component naming from a digit-initial file name',
    },
];

describe('svgr parity corpus', () => {
    for (const parityCase of CASES) {
        it(parityCase.name, () => {
            const code = generateComponentModule(
                parityCase.svg ?? SIMPLE_SVG,
                parityCase.filePath ?? '/x/icon.svg',
                parityCase.options,
            );
            expect(code).toMatchSnapshot();
        });
    }
});

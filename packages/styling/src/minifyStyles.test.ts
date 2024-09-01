import { describe, expect, it } from 'vitest';

import { minifyStyles } from './minifyStyles.js';

describe('@acusti/styling', () => {
    describe('minifyStyles.ts', () => {
        it('minifies basic CSS declarations', () => {
            expect(
                minifyStyles(`
.foo {
    padding: 10px;
    color: red;
}`),
            ).toBe('.foo{padding:10px;color:red}');
        });

        it('preserves whitespace where needed in selectors', () => {
            expect(
                minifyStyles(`
.foo > .bar :hover {
    background-color: cyan;
}`),
            ).toBe('.foo>.bar :hover{background-color:cyan}');
        });

        it('minifies 0.6 to .6, but only when preceded by : or a whitespace', () => {
            expect(
                minifyStyles(`
.foo {
    opacity: 0.6;
}`),
            ).toBe('.foo{opacity:.6}');
        });
    });
});

import { describe, expect, it } from 'vitest';

import { minifyStyles } from './minifyStyles.js';

describe('@acusti/styling', () => {
    describe('minifyStyles.ts', () => {
        it("replaces consecutive whitespace (including \\n) with ' '", () => {
            expect(
                minifyStyles(`.foo {
    color: red;
}`),
            ).toBe('.foo { color: red; }');
        });
    });
});

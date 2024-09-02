// @vitest-environment happy-dom
import { render } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import Style from './Style.js';
import { getStyleRegistry } from './useStyles.js';

describe('@acusti/styling', () => {
    describe('useStyles.ts', () => {
        const mockStylesA = '.test-a {\n  color: cyan;\n}';
        const mockStylesB = '.test-b {\n  padding: 10px;\n}';

        // reset styleRegistry before each test
        beforeEach(() => {
            getStyleRegistry().clear();
        });

        it('should cache minified styles in the registry keyed by the style string', () => {
            const styleRegistry = getStyleRegistry();

            const { rerender } = render(
                <React.Fragment>
                    <Style>{mockStylesA}</Style>
                    <Style>{mockStylesA}</Style>
                </React.Fragment>,
            );

            let stylesItemA = styleRegistry.get(mockStylesA);
            expect(stylesItemA?.referenceCount).toBe(2);
            expect(stylesItemA?.styles).toBe('.test-a{color:cyan}');
            expect(styleRegistry.size).toBe(1);

            rerender(<Style>{mockStylesA}</Style>);
            expect(stylesItemA?.referenceCount).toBe(1);
            expect(stylesItemA).toBe(styleRegistry.get(mockStylesA));
            expect(styleRegistry.size).toBe(1);

            rerender(<Style>{mockStylesB}</Style>);
            stylesItemA = styleRegistry.get(mockStylesA);
            expect(stylesItemA).toBe(undefined);
            let stylesItemB = styleRegistry.get(mockStylesB);
            expect(stylesItemB?.referenceCount).toBe(1);
            expect(styleRegistry.size).toBe(1);

            rerender(
                <React.Fragment>
                    <Style>{mockStylesA}</Style>
                    <Style>{mockStylesB}</Style>
                </React.Fragment>,
            );
            stylesItemA = styleRegistry.get(mockStylesA);
            expect(stylesItemA?.referenceCount).toBe(1);
            expect(stylesItemA).toBe(styleRegistry.get(mockStylesA));
            stylesItemB = styleRegistry.get(mockStylesB);
            expect(stylesItemB?.referenceCount).toBe(1);
            expect(styleRegistry.size).toBe(2);

            rerender(<div />);
            expect(styleRegistry.size).toBe(0);
        });

        it('should sanitize styles used as href prop if no href prop provided', () => {
            render(<Style>{`div[data-foo-bar] { color: cyan; }`}</Style>);
            // the two-dash attribute selector results in “Range out of order in character class”
            // and render() fails with SyntaxError: Invalid regular expression if not sanitized
            expect(true).toBeTruthy();
        });
    });
});

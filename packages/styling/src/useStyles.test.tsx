// @vitest-environment happy-dom
import { render } from '@testing-library/react';
import { Fragment } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import Style from './Style.js';
import { getStyleCache } from './useStyles.js';

describe('@acusti/styling', () => {
    describe('useStyles.ts', () => {
        const mockStylesA = '.test-a {\n  color: cyan;\n}';
        const mockStylesB = '.test-b {\n  padding: 10px;\n}';

        // reset styleCache before each test
        beforeEach(() => {
            getStyleCache().clear();
        });

        it('should cache minified styles in the registry keyed by the style string', () => {
            const styleCache = getStyleCache();

            const { rerender } = render(
                <Fragment>
                    <Style>{mockStylesA}</Style>
                    <Style>{mockStylesA}</Style>
                </Fragment>,
            );

            let stylesItemA = styleCache.get(mockStylesA);
            expect(stylesItemA?.referenceCount).toBe(2);
            expect(stylesItemA?.styles).toBe('.test-a{color:cyan}');
            expect(styleCache.size).toBe(1);

            rerender(<Style>{mockStylesA}</Style>);
            expect(stylesItemA?.referenceCount).toBe(1);
            expect(stylesItemA).toBe(styleCache.get(mockStylesA));
            expect(styleCache.size).toBe(1);

            rerender(<Style>{mockStylesB}</Style>);
            stylesItemA = styleCache.get(mockStylesA);
            expect(stylesItemA).toBe(undefined);
            let stylesItemB = styleCache.get(mockStylesB);
            expect(stylesItemB?.referenceCount).toBe(1);
            expect(styleCache.size).toBe(1);

            rerender(
                <Fragment>
                    <Style>{mockStylesA}</Style>
                    <Style>{mockStylesB}</Style>
                </Fragment>,
            );
            stylesItemA = styleCache.get(mockStylesA);
            expect(stylesItemA?.referenceCount).toBe(1);
            expect(stylesItemA).toBe(styleCache.get(mockStylesA));
            stylesItemB = styleCache.get(mockStylesB);
            expect(stylesItemB?.referenceCount).toBe(1);
            expect(styleCache.size).toBe(2);

            rerender(<div />);
            expect(styleCache.size).toBe(0);
        });

        it('should preserve style cache across component position changes and re-keying', () => {
            const styleCache = getStyleCache();

            const { rerender } = render(
                <Fragment>
                    <Style>{mockStylesA}</Style>
                </Fragment>,
            );

            const stylesItemA = styleCache.get(mockStylesA);
            expect(stylesItemA?.referenceCount).toBe(1);
            expect(stylesItemA?.styles).toBe('.test-a{color:cyan}');
            expect(styleCache.size).toBe(1);

            rerender(
                <Fragment>
                    <Style>{mockStylesB}</Style>
                    <Style>{mockStylesA}</Style>
                </Fragment>,
            );
            expect(stylesItemA?.referenceCount).toBe(1);
            expect(stylesItemA).toBe(styleCache.get(mockStylesA));

            rerender(<Style key="new-a">{mockStylesA}</Style>);
            expect(stylesItemA?.referenceCount).toBe(1);
            expect(stylesItemA).toBe(styleCache.get(mockStylesA));

            rerender(
                <Fragment>
                    <Style>{mockStylesA}</Style>
                    <Style key="new-a">{mockStylesA}</Style>
                </Fragment>,
            );
            expect(stylesItemA?.referenceCount).toBe(2);
            expect(stylesItemA).toBe(styleCache.get(mockStylesA));

            rerender(<div />);
            expect(stylesItemA?.referenceCount).toBe(0);
            expect(styleCache.size).toBe(0);
        });

        it('should sanitize styles used as href prop if no href prop provided', () => {
            render(<Style>{`div[data-foo-bar] { color: cyan; }`}</Style>);
            // the two-dash attribute selector results in “Range out of order in character class”
            // and render() fails with SyntaxError: Invalid regular expression if not sanitized
            expect(true).toBeTruthy();
        });
    });
});

import { describe, expect, it } from 'vitest';

import {
    getCSSValueWithUnit,
    getMillisecondsFromCSSValue,
    getUnitFromCSSValue,
} from './index.js';

describe('@acusti/css-values', () => {
    describe('getUnitFromCSSValue', () => {
        it('returns any valid unit (according to CSS value type) already on the CSS value', () => {
            expect(
                getUnitFromCSSValue({
                    cssValueType: 'angle',
                    defaultUnit: 'deg',
                    value: '1.75turn',
                }),
            ).toBe('turn');

            expect(
                getUnitFromCSSValue({
                    cssValueType: 'length',
                    defaultUnit: 'px',
                    value: '47vw',
                }),
            ).toBe('vw');

            expect(
                getUnitFromCSSValue({
                    cssValueType: 'time',
                    defaultUnit: 'ms',
                    value: '  1.25s ',
                }),
            ).toBe('s');

            expect(
                getUnitFromCSSValue({
                    cssValueType: 'integer',
                    defaultUnit: '',
                    value: '42',
                }),
            ).toBe('');

            // Percent is a simpler case because there is only one valid unit
            // Though passing defaultUnit as an empty string would mean empty unit if no match
            expect(
                getUnitFromCSSValue({
                    cssValueType: 'percent',
                    defaultUnit: '',
                    value: '1.75%',
                }),
            ).toBe('%');
        });

        it('returns the default unit when the given value has no valid unit', () => {
            expect(
                getUnitFromCSSValue({
                    cssValueType: 'angle',
                    defaultUnit: 'deg',
                    value: '1.75%',
                }),
            ).toBe('deg');

            expect(
                getUnitFromCSSValue({
                    cssValueType: 'length',
                    defaultUnit: 'px',
                    value: '47deg',
                }),
            ).toBe('px');

            expect(
                getUnitFromCSSValue({
                    cssValueType: 'time',
                    defaultUnit: 'ms',
                    value: '1.25em',
                }),
            ).toBe('ms');

            expect(
                getUnitFromCSSValue({
                    cssValueType: 'percent',
                    defaultUnit: '%',
                    value: '23px',
                }),
            ).toBe('%');
        });

        it('returns the default unit when the given value is a number', () => {
            expect(
                getUnitFromCSSValue({
                    cssValueType: 'length',
                    defaultUnit: 'vh',
                    value: 10,
                }),
            ).toBe('vh');
        });
    });

    describe('getCSSValueWithUnit', () => {
        it('returns numeric value with the pre-existing unit appended when it matches the CSS value type', () => {
            expect(
                getCSSValueWithUnit({
                    cssValueType: 'angle',
                    defaultUnit: 'deg',
                    value: '1.75turn',
                }),
            ).toBe('1.75turn');

            expect(
                getCSSValueWithUnit({
                    cssValueType: 'length',
                    defaultUnit: 'px',
                    value: '    47vw  ',
                }),
            ).toBe('47vw');

            expect(
                getCSSValueWithUnit({
                    cssValueType: 'time',
                    defaultUnit: 'ms',
                    value: '1.25s',
                }),
            ).toBe('1.25s');

            expect(
                getCSSValueWithUnit({
                    cssValueType: 'percent',
                    defaultUnit: '',
                    value: '23%',
                }),
            ).toBe('23%');
        });

        it('returns the default unit when the given value has no valid unit', () => {
            expect(
                getCSSValueWithUnit({
                    cssValueType: 'angle',
                    defaultUnit: 'deg',
                    value: '1.75%',
                }),
            ).toBe('1.75deg');

            expect(
                getCSSValueWithUnit({
                    cssValueType: 'length',
                    defaultUnit: 'px',
                    value: '47deg',
                }),
            ).toBe('47px');

            expect(
                getCSSValueWithUnit({
                    cssValueType: 'time',
                    defaultUnit: 'ms',
                    value: '250px',
                }),
            ).toBe('250ms');

            expect(
                getCSSValueWithUnit({
                    cssValueType: 'percent',
                    defaultUnit: '%',
                    value: '23px',
                }),
            ).toBe('23%');
        });
        // Also test empty value

        it('returns the value without unit when the given value is not numeric', () => {
            // This example is modeled on letter-spacing (defaults to 'px', also accepts 'normal')
            expect(
                getCSSValueWithUnit({
                    cssValueType: 'length',
                    defaultUnit: 'px',
                    value: 'normal',
                }),
            ).toBe('normal');
        });

        it('returns an empty string when trimmed value is empty', () => {
            expect(
                getCSSValueWithUnit({
                    cssValueType: 'length',
                    defaultUnit: 'px',
                    value: '',
                }),
            ).toBe('');

            expect(
                getCSSValueWithUnit({
                    cssValueType: 'length',
                    defaultUnit: 'px',
                    value: '   ',
                }),
            ).toBe('');
        });
    });

    describe('getMillisecondsFromCSSValue', () => {
        it('returns value converted to number of milliseconds for CSS time values', () => {
            expect(getMillisecondsFromCSSValue('250ms')).toBe(250);
            expect(getMillisecondsFromCSSValue('  1.75s ')).toBe(1750);
        });

        it('returns same value that was passed in if value is numeric or 0 if NaN', () => {
            expect(getMillisecondsFromCSSValue(1263)).toBe(1263);
            expect(getMillisecondsFromCSSValue(-62.56)).toBe(-62.56);
            expect(getMillisecondsFromCSSValue(NaN)).toBe(0);
        });

        it('returns 0 for any non-time values', () => {
            expect(getMillisecondsFromCSSValue('1.75turn')).toBe(0);
            expect(getMillisecondsFromCSSValue('90%')).toBe(0);
            expect(getMillisecondsFromCSSValue(' ')).toBe(0);
        });
    });
});

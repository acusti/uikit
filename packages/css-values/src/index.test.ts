import { getCSSValueWithUnit, getUnitForCSSValue } from './';

describe('css-units.js utilities', () => {
    describe('getUnitForCSSValue', () => {
        it('returns any valid unit (according to CSS value type) already on the CSS value', () => {
            expect(
                getUnitForCSSValue({
                    cssValueType: 'angle',
                    defaultUnit: 'deg',
                    value: '1.75turn',
                }),
            ).toBe('turn');

            expect(
                getUnitForCSSValue({
                    cssValueType: 'length',
                    defaultUnit: 'px',
                    value: '47vw',
                }),
            ).toBe('vw');

            expect(
                getUnitForCSSValue({
                    cssValueType: 'time',
                    defaultUnit: 'ms',
                    value: '  1.25s ',
                }),
            ).toBe('s');

            // Percent is a simpler case because there is only one valid unit
            // Though passing defaultUnit as an empty string would mean empty unit if no match
            expect(
                getUnitForCSSValue({
                    cssValueType: 'percent',
                    defaultUnit: '',
                    value: '1.75%',
                }),
            ).toBe('%');
        });

        it('returns the default unit when the given value has no valid unit', () => {
            expect(
                getUnitForCSSValue({
                    cssValueType: 'angle',
                    defaultUnit: 'deg',
                    value: '1.75%',
                }),
            ).toBe('deg');

            expect(
                getUnitForCSSValue({
                    cssValueType: 'length',
                    defaultUnit: 'px',
                    value: '47deg',
                }),
            ).toBe('px');

            expect(
                getUnitForCSSValue({
                    cssValueType: 'time',
                    defaultUnit: 'ms',
                    value: '1.25em',
                }),
            ).toBe('ms');

            expect(
                getUnitForCSSValue({
                    cssValueType: 'percent',
                    defaultUnit: '%',
                    value: '23px',
                }),
            ).toBe('%');
        });

        it('returns the default unit when the given value is a number', () => {
            expect(
                getUnitForCSSValue({
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
});

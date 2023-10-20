import { describe, expect, it } from 'vitest';

import { getMonthFromDate, getMonthNameFromMonth } from './utils.js';

describe('@acusti/date-picker', () => {
    describe('utils', () => {
        describe('getMonthNameFromMonth', () => {
            it('returns the correct month name for a post-unix epoch month', () => {
                expect(
                    getMonthNameFromMonth(getMonthFromDate(new Date(2023, 5, 19))),
                ).toBe('June');
            });

            it('returns the correct month name for a pre-unix epoch month', () => {
                expect(
                    getMonthNameFromMonth(getMonthFromDate(new Date(1865, 5, 19))),
                ).toBe('June');
            });

            it('returns an empty string if given NaN (e.g. if dealing with an Invalid Date)', () => {
                expect(getMonthNameFromMonth(getMonthFromDate(new Date('')))).toBe('');
            });
        });
    });
});

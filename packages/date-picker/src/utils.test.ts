import { describe, expect, it } from 'vitest';

import { getMonthFromDate, getMonthNameFromMonth } from './utils.js';

const INVALID_DATE = new Date('');

describe('@acusti/date-picker', () => {
    describe('utils', () => {
        describe('getMonthFromDate', () => {
            it('returns the correct month digit for a post-unix epoch month', () => {
                expect(getMonthFromDate(new Date(1970, 0, 8))).toBe(0); // january 8, 1970
                expect(getMonthFromDate(new Date(1971, 11, 1))).toBe(23); // november 1, 1971
            });

            it('returns the correct month digit for a pre-unix epoch month', () => {
                expect(getMonthFromDate(new Date(1969, 11, 31))).toBe(-1); // december 31, 1969
                expect(getMonthFromDate(new Date(1968, 3, 30))).toBe(-21); // april 30, 1968
            });

            it('returns NaN for an Invalid Date', () => {
                expect(getMonthFromDate(INVALID_DATE)).toBe(NaN);
            });
        });

        describe('getMonthNameFromMonth', () => {
            it('returns the correct month name for a post-unix epoch month', () => {
                expect(
                    getMonthNameFromMonth(getMonthFromDate(new Date(2023, 5, 19))),
                ).toBe('June');
            });

            it('returns the correct month name for a pre-unix epoch month', () => {
                expect(
                    getMonthNameFromMonth(getMonthFromDate(new Date(1865, 5, 2))),
                ).toBe('June');
            });

            it('returns an empty string if given NaN (e.g. if dealing with an Invalid Date)', () => {
                expect(getMonthNameFromMonth(getMonthFromDate(INVALID_DATE))).toBe('');
            });
        });
    });
});

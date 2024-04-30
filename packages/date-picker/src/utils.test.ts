import { describe, expect, it } from 'vitest';

import {
    getDateFromMonthAndDay,
    getMonthFromDate,
    getMonthNameFromMonth,
    getLastDateFromMonth,
    getYearFromMonth,
} from './utils.js';

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

        describe('getYearFromMonth', () => {
            it('returns the correct year for a post-unix epoch date', () => {
                expect(getYearFromMonth(getMonthFromDate(new Date(1970, 0, 1)))).toBe(
                    1970,
                );
                expect(getYearFromMonth(getMonthFromDate(new Date(2048, 4, 31)))).toBe(
                    2048,
                );
            });

            it('returns the correct year digit for a pre-unix epoch date', () => {
                expect(getYearFromMonth(getMonthFromDate(new Date(1970, 0, 0)))).toBe(
                    1969,
                );
                expect(getYearFromMonth(getMonthFromDate(new Date(100, 11, 31)))).toBe(
                    100,
                );
            });

            it('returns NaN for an Invalid Date', () => {
                expect(getYearFromMonth(getMonthFromDate(INVALID_DATE))).toBe(NaN);
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

        describe('getDateFromMonthAndDay', () => {
            it('returns the date of the specified day for a post-unix epoch month', () => {
                expect(
                    getDateFromMonthAndDay(getMonthFromDate(new Date(2008, 2, 13)), 1),
                ).toEqual(new Date(2008, 2, 1));
                expect(
                    getDateFromMonthAndDay(getMonthFromDate(new Date(1999, 11, 1)), 31),
                ).toEqual(new Date(1999, 11, 31));
                expect(
                    getDateFromMonthAndDay(getMonthFromDate(new Date(2000, 0, 0)), 31),
                ).toEqual(new Date(1999, 11, 31));
            });

            it('returns the correct date for a pre-unix epoch month', () => {
                expect(
                    getDateFromMonthAndDay(getMonthFromDate(new Date(1865, 5, 2)), 30),
                ).toEqual(new Date(1865, 5, 30));
                expect(
                    getDateFromMonthAndDay(getMonthFromDate(new Date(101, 0, 0)), 1),
                ).toEqual(new Date(100, 11, 1));
            });

            it('returns date for start of day as UTC time if asUTC is true', () => {
                expect(
                    getDateFromMonthAndDay(
                        getMonthFromDate(new Date(1865, 5, 2)),
                        30,
                        true,
                    ),
                ).toEqual(new Date(Date.UTC(1865, 5, 30)));
                expect(
                    getDateFromMonthAndDay(
                        getMonthFromDate(new Date(101, 0, 0)),
                        1,
                        true,
                    ),
                ).toEqual(new Date(Date.UTC(100, 11, 1)));
            });

            it('returns an invalid date if given NaN (e.g. if dealing with an Invalid Date)', () => {
                expect(getDateFromMonthAndDay(getMonthFromDate(INVALID_DATE), 1)).toEqual(
                    INVALID_DATE,
                );
            });
        });

        describe('getLastDateFromMonth', () => {
            it('returns the date of the last day for a post-unix epoch month', () => {
                expect(
                    getLastDateFromMonth(getMonthFromDate(new Date(2008, 2, 13))),
                ).toEqual(new Date(2008, 2, 31));
                // february in a leap year
                expect(
                    getLastDateFromMonth(getMonthFromDate(new Date(2024, 1, 23))),
                ).toEqual(new Date(2024, 1, 29));
                // february in a non-leap year
                expect(
                    getLastDateFromMonth(getMonthFromDate(new Date(1985, 1, 1))),
                ).toEqual(new Date(1985, 1, 28));
            });

            it('returns the correct date for a pre-unix epoch month', () => {
                expect(
                    getLastDateFromMonth(getMonthFromDate(new Date(1865, 5, 2))),
                ).toEqual(new Date(1865, 5, 30));
            });

            it('returns date for start of day as UTC time if asUTC is true', () => {
                expect(
                    getLastDateFromMonth(getMonthFromDate(new Date(1865, 5, 2)), true),
                ).toEqual(new Date(Date.UTC(1865, 5, 30)));
            });

            it('returns an invalid date if given NaN (e.g. if dealing with an Invalid Date)', () => {
                expect(getLastDateFromMonth(getMonthFromDate(INVALID_DATE))).toEqual(
                    INVALID_DATE,
                );
            });
        });
    });
});

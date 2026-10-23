import { describe, expect, it } from 'vitest';

import { getBestMatch, getMatchScore, sortByBestMatch } from './index.js';

const STATES = [
    'Alabama',
    'Alaska',
    'Arizona',
    'Arkansas',
    'California',
    'Colorado',
    'Connecticut',
    'Delaware',
    'Florida',
    'Georgia',
    'Hawaii',
    'Idaho',
    'Illinois',
    'Indiana',
    'Iowa',
    'Kansas',
    'Kentucky',
    'Louisiana',
    'Maine',
    'Maryland',
    'Massachusetts',
    'Michigan',
    'Minnesota',
    'Mississippi',
    'Missouri',
    'Montana',
    'Nebraska',
    'Nevada',
    'New Hampshire',
    'New Jersey',
    'New Mexico',
    'New York',
    'North Carolina',
    'North Dakota',
    'Ohio',
    'Oklahoma',
    'Oregon',
    'Pennsylvania',
    'Rhode Island',
    'South Carolina',
    'South Dakota',
    'Tennessee',
    'Texas',
    'Utah',
    'Vermont',
    'Virginia',
    'Washington',
    'West Virginia',
    'Wisconsin',
    'Wyoming',
];

const CSS_VALUES = ['7px', '11px', '18px', '36px', '128px'];

const FONT_WEIGHT_VALUES = [
    '',
    'Font Weight - 100',
    'Font Weight - 200',
    'Font Weight - 300',
    'Font Weight - 400',
    'Font Weight - 500',
    'Font Weight - 600',
    'Font Weight - 700',
    'Font Weight - 800',
    'Font Weight - 900',
];

describe('@acusti/matchmaking', () => {
    describe('sortByBestMatch', () => {
        it('returns items sorted from best to worst match based on case-insensitive alphabetical proximity and in the order in which they were provided in the case of equal proximity', () => {
            expect(sortByBestMatch({ items: STATES, text: 'w' }).slice(0, 6)).toEqual([
                'Washington',
                'West Virginia',
                'Wisconsin',
                'Wyoming',
                'New Hampshire',
                'New Jersey',
            ]);

            expect(sortByBestMatch({ items: STATES, text: 'MIP' }).slice(0, 4)).toEqual([
                'Minnesota',
                'Mississippi',
                'Missouri',
                'Michigan',
            ]);

            expect(sortByBestMatch({ items: STATES, text: 'mass' }).slice(0, 2)).toEqual([
                'Massachusetts',
                'Maryland',
            ]);

            expect(
                sortByBestMatch({ items: STATES, text: 'nassadgysrtys' }).slice(0, 3),
            ).toEqual([
                'Massachusetts',
                'Kansas', // 3 exact matches
                'Maine', // 1 exact match, 1 close match, rest close-ish
            ]);

            expect(sortByBestMatch({ items: CSS_VALUES, text: '1' })).toEqual([
                '11px',
                '18px',
                '128px',
                '7px', // nearest number to 1 that doesn’t start with it
                '36px',
            ]);

            expect(sortByBestMatch({ items: CSS_VALUES, text: '12p' })).toEqual([
                '11px',
                '7px',
                '18px',
                '36px',
                '128px',
            ]);

            expect(
                sortByBestMatch({ items: ['QUx', 'foo', 'BaR', 'baZ'], text: 'bux' }),
            ).toEqual([
                'QUx', // closest match
                'baZ', // same starting letter, closer last letter
                'BaR', // same starting letter, further last letter
                'foo',
            ]);

            // sortByBestMatch({items: ['QUx', 'fOO', 'BAR', 'baz'], text: 'bux'});
        });

        it('returns passed-in text items if no search text or only whitespace is passed to it', () => {
            expect(sortByBestMatch({ items: STATES, text: '' })).toBe(STATES);
            expect(sortByBestMatch({ items: STATES, text: '    ' })).toBe(STATES);
        });

        it('excludes non-matches when excludeMismatches is true', () => {
            expect(
                sortByBestMatch({ excludeMismatches: true, items: STATES, text: 'ma' }),
            ).toEqual([
                'Maine', // exact match
                'Maryland', // exact match
                'Massachusetts', // exact match
                'Alabama', // end-of-text exact match
                'Oklahoma', // end-of-text exact match
                'Kansas', // partial match
                'Hawaii', // partial match
                'Michigan', // partial match (further distance on 2nd letter)
                'Minnesota', // partial match (further distance on 2nd letter)
                'Mississippi', // partial match (further distance on 2nd letter)
                'Missouri', // partial match (further distance on 2nd letter)
                'Nebraska', // short distance from match
                'Nevada', // short distance from match
                'New Hampshire', // short distance from match
                'New Jersey', // short distance from match
                'New Mexico', // short distance from match
                'New York', // short distance from match
            ]);

            expect(
                sortByBestMatch({
                    excludeMismatches: true,
                    items: CSS_VALUES,
                    text: '11',
                }),
            ).toEqual(['11px']);
        });

        it('ranks an item that contains the text above every item that doesn’t, and an earlier match above a later one', () => {
            expect(sortByBestMatch({ items: ['Cart', 'Bobcat'], text: 'cat' })).toEqual([
                'Bobcat',
                'Cart',
            ]);
            expect(
                sortByBestMatch({ items: ['Bobcat', 'Catalog'], text: 'cat' }),
            ).toEqual(['Catalog', 'Bobcat']);
            expect(
                sortByBestMatch({ items: ['Find and Replace', 'Cart'], text: 'a' }),
            ).toEqual(['Cart', 'Find and Replace']);
            // an item that is part of the text doesn’t contain it
            expect(
                sortByBestMatch({
                    items: ['New York', 'New York City'],
                    text: 'new york c',
                }),
            ).toEqual(['New York City', 'New York']);
            // a two-character item that starts with the text
            expect(sortByBestMatch({ items: ['em', 'px', 'rem'], text: 'p' })).toEqual([
                'px',
                'rem',
                'em',
            ]);
        });

        it('keeps every item that contains the text when excludeMismatches is true', () => {
            expect(
                sortByBestMatch({
                    excludeMismatches: true,
                    items: [
                        'Pacific',
                        'Toronto Eastern',
                        'Easter Island',
                        'Northeastern',
                    ],
                    text: 'eastern',
                }),
            ).toEqual(['Northeastern', 'Toronto Eastern', 'Easter Island']);
        });
    });

    describe('getBestMatch', () => {
        it('returns best match from text items for search text', () => {
            expect(getBestMatch({ items: CSS_VALUES, text: '6' })).toEqual('7px');
            expect(getBestMatch({ items: FONT_WEIGHT_VALUES, text: '300' })).toBe(
                'Font Weight - 300',
            );
            expect(getBestMatch({ items: FONT_WEIGHT_VALUES, text: '9' })).toBe(
                'Font Weight - 900',
            );
            // 'rpyrg' is close to 'south', so best match is the first “south *” item
            expect(getBestMatch({ items: STATES, text: 'rpyrg' })).toBe('South Carolina');
        });

        it('returns the item with the nearest number when the text is a number', () => {
            const sizes = ['8px', '10px', '12px', '16px', '24px'];
            expect(getBestMatch({ items: sizes, text: '15' })).toBe('16px');
            expect(getBestMatch({ items: sizes, text: '13px' })).toBe('12px');
            expect(getBestMatch({ items: ['12px', '8px'], text: '0' })).toBe('8px');
            expect(getBestMatch({ items: CSS_VALUES, text: '14' })).toBe('11px');
            expect(getBestMatch({ items: CSS_VALUES, text: '70' })).toBe('36px');
            expect(
                getBestMatch({
                    items: ['0.5rem', '1rem', '1.25rem', '2rem'],
                    text: '1.9',
                }),
            ).toBe('2rem');
            // the same number in another unit is the closest match short of exact
            expect(getMatchScore('12em', '12px')).toBeLessThan(1);
            expect(getMatchScore('12em', '12px')).toBeGreaterThan(
                getMatchScore('11px', '12px'),
            );
            // with a sign
            expect(
                getBestMatch({ items: ['-20px', '-9px', '0', '10px'], text: '-10' }),
            ).toBe('-9px');
            expect(getMatchScore('-9px', '-10')).toBeLessThan(1);
            expect(getMatchScore('-9px', '-10')).toBeGreaterThan(
                getMatchScore('-20px', '-10'),
            );
            // an item that starts with the typed digits still comes first
            expect(getBestMatch({ items: sizes, text: '2' })).toBe('24px');
            // text with more than a number compares as text
            expect(
                getBestMatch({ items: ['3 Idiots', '3 Body Problem'], text: '3 bdy' }),
            ).toBe('3 Body Problem');
        });

        it('breaks a tie between equally near numbers with the typed unit', () => {
            const mixed = ['0.5em', '1em', '2em', '4em', '1px', '2px', '4px', '8px'];
            expect(getBestMatch({ items: mixed, text: '3px' })).toBe('2px');
            expect(getBestMatch({ items: mixed, text: '3p' })).toBe('2px');
            expect(getBestMatch({ items: mixed, text: '6px' })).toBe('4px');
            expect(
                getBestMatch({
                    items: ['25%', '50%', '75%', '100%', '50px', '100px'],
                    text: '60px',
                }),
            ).toBe('50px');
            // a nearer number in another unit still wins
            expect(getBestMatch({ items: mixed, text: '0.6px' })).toBe('0.5em');
        });

        it('reads a thousands separator in an item as part of its number', () => {
            expect(
                getBestMatch({
                    items: ['100', '500', '1,000', '5,000', '10,000'],
                    text: '2000',
                }),
            ).toBe('1,000');
            const companySizes = [
                '1-10',
                '11-50',
                '51-200',
                '201-500',
                '501-1,000',
                '1,001-5,000',
                '5,001-10,000',
                '10,001+',
            ];
            expect(getBestMatch({ items: companySizes, text: '3000' })).toBe(
                '1,001-5,000',
            );
            expect(getBestMatch({ items: companySizes, text: '20000' })).toBe('10,001+');
            // a decimal comma isn’t a thousands separator
            expect(getBestMatch({ items: ['1,5 cm', '2 cm'], text: '15' })).toBe('2 cm');
            expect(
                getBestMatch({ items: ['100,000', '1,000,000'], text: '900000' }),
            ).toBe('1,000,000');
        });

        it('tells close inexact matches apart when items share a long start', () => {
            const timeZones = [
                'America/Adak',
                'America/Nassau',
                'America/New_York',
                'Europe/Amsterdam',
                'Europe/Paris',
            ];
            expect(getBestMatch({ items: timeZones, text: 'america/new_yrok' })).toBe(
                'America/New_York',
            );
            expect(getBestMatch({ items: timeZones, text: 'europe/parsi' })).toBe(
                'Europe/Paris',
            );
            expect(
                getBestMatch({ items: ['Calistoga', 'California'], text: 'califrnia' }),
            ).toBe('California');
            expect(
                getBestMatch({
                    items: ['Missouri', 'Mississauga', 'Mississippi'],
                    text: 'missisipi',
                }),
            ).toBe('Mississippi');
            expect(
                getBestMatch({
                    items: ['Torino', 'Tortola', 'Toronto'],
                    text: 'torotno',
                }),
            ).toBe('Toronto');
        });

        it('prefers an item that contains the text to one that only starts like it', () => {
            expect(getBestMatch({ items: ['Cart', 'Bobcat'], text: 'cat' })).toBe(
                'Bobcat',
            );
            expect(
                getBestMatch({
                    items: ['Easter Island', 'Toronto Eastern'],
                    text: 'eastern',
                }),
            ).toBe('Toronto Eastern');
            expect(
                getBestMatch({ items: ['Jakarta', 'Tokyo Japan'], text: 'japan' }),
            ).toBe('Tokyo Japan');
            // with no item containing the text, the fuzzy match still finds a typo
            expect(getBestMatch({ items: ['Tortola', 'Toronto'], text: 'torotno' })).toBe(
                'Toronto',
            );
        });

        it('matches an item that the text contains, e.g. after a stray keystroke', () => {
            expect(getBestMatch({ items: STATES, text: 'aalabama' })).toBe('Alabama');
            expect(getBestMatch({ items: STATES, text: 'oohio' })).toBe('Ohio');
            expect(getBestMatch({ items: STATES, text: 'new yorkk' })).toBe('New York');
            const timeZones = [
                'America/Adak',
                'America/New_York',
                'Europe/Amsterdam',
                'Europe/Paris',
            ];
            expect(getBestMatch({ items: timeZones, text: 'america/new_yorkk' })).toBe(
                'America/New_York',
            );
            expect(getBestMatch({ items: timeZones, text: 'europe/pariss' })).toBe(
                'Europe/Paris',
            );
            expect(
                getBestMatch({ items: FONT_WEIGHT_VALUES, text: 'font weight - 2000' }),
            ).toBe('Font Weight - 200');
        });

        it('ranks an item that neither contains a number nor starts with one below every near value', () => {
            // neither the number’s unit nor a keyword outranks a value
            const clothingSizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
            expect(getBestMatch({ items: clothingSizes, text: '4xl' })).toBe('3XL');
            expect(getBestMatch({ items: clothingSizes, text: '5xl' })).toBe('3XL');
            const scale = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'];
            expect(getBestMatch({ items: scale, text: '5xl' })).toBe('4xl');
            expect(
                getBestMatch({
                    items: ['auto', 'px', '4px', '8px', '12px'],
                    text: '6px',
                }),
            ).toBe('4px');
            const spacing = ['auto', '4px', '8px', '16px', '32px'];
            expect(getBestMatch({ items: spacing, text: '1px' })).toBe('4px');
            expect(getBestMatch({ items: spacing, text: '1p' })).toBe('4px');
            expect(
                getBestMatch({
                    items: ['none', 'thin', 'medium', 'thick', '4px', '8px'],
                    text: '1px',
                }),
            ).toBe('4px');
            // while such items still rank among themselves: a digit typed for a letter
            expect(getBestMatch({ items: STATES, text: '0hio' })).toBe('Ohio');
            expect(getBestMatch({ items: STATES, text: '1daho' })).toBe('Idaho');
            expect(getBestMatch({ items: ['px', 'em', '%'], text: '50%' })).toBe('%');
        });
    });

    describe('getMatchScore', () => {
        it('scores an exact match 1, regardless of case and surrounding whitespace', () => {
            expect(getMatchScore('Toronto', 'toronto')).toBe(1);
            expect(getMatchScore(' Toronto', 'TORONTO ')).toBe(1);
        });

        it('scores an item that contains the text above every item that doesn’t', () => {
            expect(getMatchScore('Bobcat', 'cat')).toBeGreaterThan(
                getMatchScore('Cart', 'cat'),
            );
            expect(getMatchScore('Toronto Eastern', 'eastern')).toBeGreaterThan(
                getMatchScore('Easter Island', 'eastern'),
            );
            expect(getMatchScore('New York City', 'new york c')).toBeGreaterThan(
                getMatchScore('New York', 'new york c'),
            );
            expect(getMatchScore('px', 'p')).toBeGreaterThan(getMatchScore('rem', 'p'));
            expect(getMatchScore('xp', 'p')).toBeGreaterThan(getMatchScore('rem', 'p'));
            expect(getMatchScore('xp', 'p')).toBeLessThan(getMatchScore('px', 'p'));
        });

        it('scores an item that the text contains like the best inexact match at most', () => {
            expect(getMatchScore('New York', 'new york c')).toBeGreaterThan(
                getMatchScore('New Jersey', 'new york c'),
            );
            expect(getMatchScore('p', 'px')).toBeGreaterThan(getMatchScore('r', 'px'));
            expect(getMatchScore('x', 'px')).toBeGreaterThanOrEqual(0.81);
            expect(getMatchScore('x', 'px')).toBeLessThan(getMatchScore('p', 'px'));
        });

        it('scores an empty item or text 0', () => {
            expect(getMatchScore('', 'cat')).toBe(0);
            expect(getMatchScore('Cart', ' ')).toBe(0);
        });
    });
});

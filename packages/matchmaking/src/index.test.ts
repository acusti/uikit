import { describe, expect, it } from 'vitest';

import { getBestMatch, sortByBestMatch } from './index.js';

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
                '36px',
                '7px',
            ]);

            expect(sortByBestMatch({ items: CSS_VALUES, text: '12p' })).toEqual([
                '11px',
                '128px',
                '18px',
                '36px',
                '7px',
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
    });
});

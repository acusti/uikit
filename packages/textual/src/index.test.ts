import { describe, expect, it } from 'vitest';

import { capitalize, getInitials, getNameFromEmail } from './index.js';

describe('@acusti/text-transform', () => {
    describe('capitalize', () => {
        it('uppercases the first letter of each word', () => {
            expect(capitalize('breonna')).toBe('Breonna');
            expect(capitalize('breonna taylor')).toBe('Breonna Taylor');
            expect(capitalize('justice 4 breonna Taylor!')).toBe(
                'Justice 4 Breonna Taylor!',
            );
        });

        it('preserves existing capitalization outside of the first letter of each word', () => {
            expect(capitalize('brEONnA')).toBe('BrEONnA');
            expect(capitalize('jusTicE 4 breonNa TAYlor!')).toBe(
                'JusTicE 4 BreonNa TAYlor!',
            );
        });

        it('preserves existing whitespace between words', () => {
            expect(capitalize('   breonna ')).toBe('   Breonna ');
            expect(capitalize('justice  4   breonna  Taylor!   ')).toBe(
                'Justice  4   Breonna  Taylor!   ',
            );
            expect(capitalize(' \njustice 4\nbreonna\t \tTaylor!\n\n ')).toBe(
                ' \nJustice 4\nBreonna\t \tTaylor!\n\n ',
            );
        });

        it('uppercases the first letter of each part of a hyphenated word', () => {
            expect(
                capitalize('\tmother-of-pearl father-in-law\njack-of-all-trades\n'),
            ).toBe('\tMother-Of-Pearl Father-In-Law\nJack-Of-All-Trades\n');
            expect(capitalize('this iS copy-editing_4')).toBe('This IS Copy-Editing_4');
        });
    });

    describe('getInitials', () => {
        it('captures the first letter of each word and returns them all uppercase', () => {
            expect(getInitials('franklin delano roosevelt')).toBe('FDR');
        });

        it('defaults to only returning a maximum of 3 initials', () => {
            expect(getInitials('martin luther king jr')).toBe('MLK');
            expect(getInitials('breonna taylor')).toBe('BT');
        });

        it('supports specifying the max length via its 2nd argument', () => {
            expect(getInitials('martin luther king jr', 4)).toBe('MLKJ');
            expect(
                getInitials('Benicio Monserrate Rafael del Toro Sánchez', Infinity),
            ).toBe('BMRDTS');
        });

        it('treats the individual parts of a hyphenated word as separate initials', () => {
            expect(getInitials('Beyoncé Giselle Knowles-Carter', 4)).toBe('BGKC');
            expect(getInitials('Jamie-Lee Curtis')).toBe('JLC');
        });

        it('ignores any extra whitespace in the input text', () => {
            expect(getInitials(' \nfranklin\t\t delano   roosevelt \n ')).toBe('FDR');
        });

        it('ignores any non alphanumeric characters', () => {
            expect(getInitials('**franklin delano !! roosevelt 3rd', 4)).toBe('FDR3');
        });
    });

    describe('getNameFromEmail', () => {
        it('converts an email address like “breonna@taylor.justice” into “Breonna”', () => {
            expect(getNameFromEmail('breonna@taylor.justice')).toBe('Breonna');
            expect(getNameFromEmail('fdroosevelt@whitehouse.gov')).toBe('Fdroosevelt');
        });

        it('converts an email address like “breonna.taylor@blackallianceforpeace.com” into “Breonna Taylor”', () => {
            expect(getNameFromEmail('breonna.taylor@blackallianceforpeace.com')).toBe(
                'Breonna Taylor',
            );
            expect(getNameFromEmail('franklin.delano.roosevelt@whitehouse.gov')).toBe(
                'Franklin Delano Roosevelt',
            );
            expect(getNameFromEmail('franklin+delano+roosevelt@whitehouse.gov')).toBe(
                'Franklin Delano Roosevelt',
            );
            expect(getNameFromEmail('franklin.delano+roosevelt@whitehouse.gov')).toBe(
                'Franklin Delano Roosevelt',
            );
        });

        it('treats consecutive “.” and/or “+” as a single word separator', () => {
            expect(getNameFromEmail('breonna...@blackallianceforpeace.com')).toBe(
                'Breonna',
            );
            expect(getNameFromEmail('...breonna@blackallianceforpeace.com')).toBe(
                'Breonna',
            );
            expect(getNameFromEmail('.+.breonna++.@blackallianceforpeace.com')).toBe(
                'Breonna',
            );
            expect(getNameFromEmail('breonna...taylor@blackallianceforpeace.com')).toBe(
                'Breonna Taylor',
            );
            expect(
                getNameFromEmail('breonna.++++.taylor@blackallianceforpeace.com'),
            ).toBe('Breonna Taylor');
        });

        it('ignores the capitalization of the original email address', () => {
            expect(getNameFromEmail('brEONNA.TAylor@blackallianceforpeace.com')).toBe(
                'Breonna Taylor',
            );
            expect(getNameFromEmail('FDRoosevelt@whitehouse.gov')).toBe('Fdroosevelt');
        });
    });
});

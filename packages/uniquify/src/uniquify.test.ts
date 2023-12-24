import { describe, expect, it } from 'vitest';

import uniquify from './uniquify.js';

describe('uniquify', () => {
    const baseItems = ['bear', 'chickaree', 'coyote', 'marmot', 'pika'];
    const baseItemObjects = [{ slug: 'home' }, { slug: 'about' }];

    it('creates a unique string that starts numbering at 2 separated by ‘-’', () => {
        expect(
            uniquify({
                items: baseItems,
                value: 'bear',
            }),
        ).toBe('bear 2');

        expect(
            uniquify({
                items: baseItems.concat('coyote 2'),
                value: 'coyote',
            }),
        ).toBe('coyote 3');

        expect(
            uniquify({
                items: baseItems
                    .slice(0, 1)
                    .concat(baseItems.slice(2))
                    .concat('chickaree 2'),
                value: 'chickaree',
            }),
        ).toBe('chickaree');

        expect(
            uniquify({
                items: baseItems.concat('marmot-2'),
                value: 'marmot',
            }),
        ).toBe('marmot 2');

        expect(
            uniquify({
                items: baseItems.concat('bear 2', 'bear 2 14'),
                value: 'bear 2',
            }),
        ).toBe('bear 3');

        expect(
            uniquify({
                items: baseItems.concat('chickaree 2 2', 'chickaree 2 13'),
                value: 'chickaree 2 13',
            }),
        ).toBe('chickaree 2 14');

        expect(
            uniquify({
                items: baseItems.concat('chickaree 2 2', 'chickaree 2 13'),
                value: 'chickaree 2 12',
            }),
        ).toBe('chickaree 2 12');
    });

    it('handles arrays of objects as items when passed a propertyPath', () => {
        expect(
            uniquify({
                items: baseItemObjects,
                propertyPath: ['slug'],
                separator: '-',
                value: 'about',
            }),
        ).toBe('about-2');

        expect(
            uniquify({
                items: baseItemObjects.concat({ slug: 'about-2' }),
                propertyPath: ['slug'],
                separator: '-',
                value: 'about',
            }),
        ).toBe('about-3');

        const nestedItems = [
            {
                content: { name: 'I ❤️ the Smell of Napalm in the Morning 2' },
                id: '04a1',
            },
            {
                content: { name: 'Hardcore History' },
                id: '17e1',
            },
            {
                content: { name: 'I ❤️ the Smell of Napalm in the Morning' },
                id: 'b883',
            },
        ];

        expect(
            uniquify({
                items: nestedItems,
                propertyPath: ['content', 'name'],
                value: 'I ❤️ the Smell of Napalm in the Morning',
            }),
        ).toBe('I ❤️ the Smell of Napalm in the Morning 3');

        // If using baseItemObjects, there will be no matching item
        expect(
            uniquify({
                items: baseItemObjects,
                propertyPath: ['content', 'name'],
                value: 'I ❤️ the Smell of Napalm in the Morning',
            }),
        ).toBe('I ❤️ the Smell of Napalm in the Morning');
    });

    describe('logic to determine if number at end of string is counter or content', () => {
        it('assumes any number with more than two digits is content', () => {
            const name = 'keeping-it-real-since-1949';
            expect(
                uniquify({
                    items: baseItems.concat(name),
                    separator: '-',
                    value: name,
                }),
            ).toBe('keeping-it-real-since-1949-2');

            const slug = 'the-highest-percent-is-100';
            expect(
                uniquify({
                    items: baseItemObjects.concat({ slug }),
                    propertyPath: ['slug'],
                    separator: '-',
                    value: slug,
                }),
            ).toBe('the-highest-percent-is-100-2');
        });

        it('checks any number less than 100 for another counter based on same stem', () => {
            const slug = 'but-this-one-goes-to-11';

            expect(
                uniquify({
                    items: baseItemObjects.concat({ slug }),
                    propertyPath: ['slug'],
                    separator: '-',
                    value: slug,
                }),
            ).toBe('but-this-one-goes-to-11-2');

            expect(
                uniquify({
                    items: baseItemObjects.concat(
                        { slug },
                        { slug: 'but-this-one-goes-to-2' },
                    ),
                    propertyPath: ['slug'],
                    separator: '-',
                    value: slug,
                }),
            ).toBe('but-this-one-goes-to-12');

            const name = 'testing the limits 99';

            expect(
                uniquify({
                    items: baseItems.concat(name, 'testing the limits'),
                    value: name,
                }),
            ).toBe('testing the limits 100');

            expect(
                uniquify({
                    items: baseItems.concat(name, 'testing the limits 2'),
                    value: name,
                }),
            ).toBe('testing the limits 100');

            expect(
                uniquify({
                    items: baseItems.concat(name, 'testing the limits 98'),
                    value: name,
                }),
            ).toBe('testing the limits 100');

            // Check should ignore 1 as a counter
            expect(
                uniquify({
                    items: baseItems.concat(name, 'testing the limits 1'),
                    value: name,
                }),
            ).toBe('testing the limits 99 2');
        });

        it('disregards 1 when determining if number at end of string is counter or content', () => {
            const slugBase = 'things-that-are-divisible-by';

            expect(
                uniquify({
                    items: baseItemObjects.concat(
                        { slug: `${slugBase}-2` },
                        { slug: `${slugBase}-7` },
                    ),
                    propertyPath: ['slug'],
                    separator: '-',
                    value: `${slugBase}-7`,
                }),
            ).toBe('things-that-are-divisible-by-8');

            expect(
                uniquify({
                    items: baseItemObjects.concat(
                        { slug: `${slugBase}-1` },
                        { slug: `${slugBase}-7` },
                    ),
                    propertyPath: ['slug'],
                    separator: '-',
                    value: `${slugBase}-7`,
                }),
            ).toBe('things-that-are-divisible-by-7-2');
        });
    });

    it('handles a custom separator string of any length', () => {
        expect(
            uniquify({
                items: baseItemObjects.concat({ slug: 'about-2' }),
                propertyPath: ['slug'],
                separator: '-',
                value: 'about',
            }),
        ).toBe('about-3');

        expect(
            uniquify({
                items: baseItemObjects.concat({ slug: 'about-2' }),
                propertyPath: ['slug'],
                separator: '_',
                value: 'about',
            }),
        ).toBe('about_2');

        expect(
            uniquify({
                items: baseItemObjects.concat({ slug: 'about_2' }),
                propertyPath: ['slug'],
                separator: '_',
                value: 'about',
            }),
        ).toBe('about_3');

        const separator = ' 🌮—🥑asdœ__–¢™º•ø¨∆as_____dbnm______ds®†ª™¢•b√awekj#Bfsªç∆å';
        expect(
            uniquify({
                items: baseItemObjects.concat({ slug: `about${separator}2` }),
                propertyPath: ['slug'],
                separator,
                value: 'about',
            }),
        ).toBe(`about${separator}3`);
    });

    it('handles a custom property path along with an alternate property path', () => {
        const items = [
            {
                content: { name: 'I ❤️ the Smell of Napalm in the Morning 2' },
                id: '04a1',
            },
            {
                content: { name: 'Hardcore History' },
                id: '17e1',
            },
            {
                id: 'b883',
                title: 'I ❤️ the Smell of Napalm in the Morning',
            },
        ];

        expect(
            uniquify({
                items,
                propertyPath: ['content', 'name'],
                propertyPathAlternate: ['title'],
                value: 'I ❤️ the Smell of Napalm in the Morning',
            }),
        ).toBe('I ❤️ the Smell of Napalm in the Morning 3');
    });

    it('handles adding a suffix before applying counter', () => {
        expect(
            uniquify({
                items: baseItems,
                suffix: 'copy',
                value: 'marmot',
            }),
        ).toBe('marmot copy');

        expect(
            uniquify({
                items: baseItems.concat('marmot copy'),
                suffix: 'copy',
                value: 'marmot copy',
            }),
        ).toBe('marmot copy 2');

        // Defaults to being case insensitive
        expect(
            uniquify({
                items: baseItems.concat('marmot Copy', 'marmot Copy 2', 'marmot copy 3'),
                suffix: 'copy',
                value: 'marmot',
            }),
        ).toBe('marmot copy 4');

        // Respects caseSensitive: true
        expect(
            uniquify({
                caseSensitive: true,
                items: baseItems.concat('marmot Copy', 'marmot Copy 2', 'marmot copy 3'),
                suffix: 'copy',
                value: 'marmot',
            }),
        ).toBe('marmot copy');

        expect(
            uniquify({
                items: baseItems.concat('copy me'),
                suffix: 'copy',
                value: 'copy me',
            }),
        ).toBe('copy me copy');
    });

    it('when isSuffixOptional is true, only adds the suffix if needed', () => {
        expect(
            uniquify({
                isSuffixOptional: true,
                items: baseItemObjects,
                propertyPath: ['slug'],
                suffix: 'copy',
                value: 'contact',
            }),
        ).toBe('contact');

        expect(
            uniquify({
                isSuffixOptional: false,
                items: baseItemObjects,
                propertyPath: ['slug'],
                suffix: 'copy',
                value: 'contact',
            }),
        ).toBe('contact copy');

        expect(
            uniquify({
                isSuffixOptional: true,
                items: baseItemObjects,
                propertyPath: ['slug'],
                suffix: 'copy',
                value: 'about',
            }),
        ).toBe('about copy');
    });

    it('handles option to make it identify counters that begin at 1', () => {
        expect(
            uniquify({
                identify1AsCounter: true,
                items: baseItemObjects
                    .slice(0, 1)
                    .concat(baseItemObjects.slice(2))
                    .concat({ slug: 'about-1' }),
                propertyPath: ['slug'],
                separator: '-',
                value: 'about-1',
            }),
        ).toBe('about-2');
    });

    it('handles empty string as any other value', () => {
        expect(
            uniquify({
                items: baseItems,
                value: '',
            }),
        ).toBe('');

        expect(
            uniquify({
                items: baseItems.concat(''),
                value: '',
            }),
        ).toBe(' 2');
    });

    it('handles sibling lists with null or undefined values', () => {
        expect(
            uniquify({
                items: [baseItems[0], null, baseItems[1], baseItems[2]],
                value: 'chickaree',
            }),
        ).toBe('chickaree 2');

        expect(
            uniquify({
                items: [undefined, baseItemObjects[0], baseItemObjects[1]],
                propertyPath: ['slug'],
                separator: '-',
                value: 'about',
            }),
        ).toBe('about-2');
    });

    describe('locale-friendly case sensitivity options', () => {
        it('defaults to case insensitive, overrideable via props', () => {
            expect(
                uniquify({
                    items: baseItemObjects,
                    propertyPath: ['slug'],
                    value: 'Home',
                }),
            ).toBe('Home 2');

            expect(
                uniquify({
                    caseSensitive: true,
                    items: baseItemObjects,
                    propertyPath: ['slug'],
                    value: 'Home',
                }),
            ).toBe('Home');
        });

        it('handles non-english locales for case insensitive checks', () => {
            const name = 'État «œil»';

            expect(
                uniquify({
                    items: baseItems.concat(name),
                    value: 'état «Œil»',
                }),
            ).toBe('état «Œil» 2');

            expect(
                uniquify({
                    caseSensitive: true,
                    items: baseItems.concat(name),
                    value: 'état «Œil»',
                }),
            ).toBe('état «Œil»');
        });
    });
});

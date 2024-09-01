import { useEffect, useState } from 'react';

import { minifyStyles } from './minifyStyles.js';

type StyleRegistry = Map<
    string,
    { href: string; referenceCount: number; styles: string }
>;

const styleRegistry: StyleRegistry = new Map();

export const getStyleRegistry = () => styleRegistry;

export function useStyles(styles: string, initialHref?: string) {
    const [stylesItem, setStylesItem] = useState(() => {
        if (!styles) return { href: '', referenceCount: 0, styles: '' };

        const key = initialHref ?? styles;
        let item = styleRegistry.get(key);

        if (item) {
            item.referenceCount++;
        } else {
            const minified = minifyStyles(styles);
            item = {
                href: sanitizeHref(initialHref ?? minified),
                referenceCount: 1,
                styles: minified,
            };
            styleRegistry.set(key, item);
        }

        return item;
    });

    useEffect(() => {
        if (!styles) return;

        const key = initialHref ?? styles;

        if (!styleRegistry.get(key)) {
            const minified = minifyStyles(styles);
            const item = {
                href: sanitizeHref(initialHref ?? minified),
                referenceCount: 1,
                styles: minified,
            };
            styleRegistry.set(key, item);
            setStylesItem(item);
        }

        return () => {
            const existingItem = styleRegistry.get(styles);
            if (existingItem) {
                existingItem.referenceCount--;
                if (!existingItem.referenceCount) {
                    // TODO try scheduling this via setTimeout
                    // and add another referenceCount check
                    // to deal with instance where existing <Style>
                    // component is moved in the tree or re-keyed
                    styleRegistry.delete(styles);
                }
            }
        };
    }, [initialHref, styles]);

    return stylesItem;
}

export default useStyles;

export const clearRegistry = () => {
    styleRegistry.clear();
};

// Dashes in selectors in href prop create happy-dom / jsdom test errors:
// Invalid regular expression (“Range out of order in character class”)
function sanitizeHref(text: string) {
    return text.replace(/-/g, '');
}

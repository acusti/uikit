import { useEffect, useState } from 'react';

import { minifyStyles } from './minifyStyles.js';

type StyleCache = Map<string, { href: string; referenceCount: number; styles: string }>;

const styleCache: StyleCache = new Map();

const EMPTY_STYLES_ITEM = { href: '', referenceCount: 0, styles: '' };

export function useStyles(styles: string, initialHref?: string) {
    const [stylesItem, setStylesItem] = useState(() => {
        if (!styles) return EMPTY_STYLES_ITEM;

        const key = initialHref ?? styles;
        let item = styleCache.get(key);

        if (item) {
            item.referenceCount++;
        } else {
            const minified = minifyStyles(styles);
            item = {
                href: sanitizeHref(initialHref ?? minified),
                referenceCount: 1,
                styles: minified,
            };
            styleCache.set(key, item);
        }

        return item;
    });

    useEffect(() => {
        if (!styles) return;

        const key = initialHref ?? styles;

        if (!styleCache.get(key)) {
            const minified = minifyStyles(styles);
            const item = {
                href: sanitizeHref(initialHref ?? minified),
                referenceCount: 1,
                styles: minified,
            };
            styleCache.set(key, item);
            setStylesItem(item);
        }

        return () => {
            const existingItem = styleCache.get(styles);
            if (existingItem) {
                existingItem.referenceCount--;
                if (!existingItem.referenceCount) {
                    // TODO try scheduling this via setTimeout
                    // and add another referenceCount check
                    // to deal with instance where existing <Style>
                    // component is moved in the tree or re-keyed
                    styleCache.delete(styles);
                }
            }
        };
    }, [initialHref, styles]);

    return stylesItem;
}

export default useStyles;

// Dashes in selectors in href prop create happy-dom / jsdom test errors:
// Invalid regular expression (“Range out of order in character class”)
function sanitizeHref(text: string) {
    return text.replace(/-/g, '');
}

// The following export is for test usage only
export const getStyleCache = () => styleCache;

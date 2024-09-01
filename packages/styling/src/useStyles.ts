import { useEffect, useState } from 'react';

import { minifyStyles } from './minifyStyles.js';

type StyleRegistry = Map<string, { referenceCount: number; styles: string }>;

const styleRegistry: StyleRegistry = new Map();

export const getStyleRegistry = () => styleRegistry;

export function useStyles(styles: string) {
    const [minifiedStyles, setMinifiedStyles] = useState(() => {
        if (!styles) return '';

        let minified = '';
        const existingStylesItem = styleRegistry.get(styles);
        if (existingStylesItem) {
            existingStylesItem.referenceCount++;
            minified = existingStylesItem.styles;
        } else {
            minified = minifyStyles(styles);
            styleRegistry.set(styles, { referenceCount: 1, styles: minified });
        }

        return minified;
    });

    useEffect(() => {
        if (!styles) return;
        if (!styleRegistry.get(styles)) {
            const minified = minifyStyles(styles);
            styleRegistry.set(styles, { referenceCount: 1, styles: minified });
            setMinifiedStyles(minified);
        }

        return () => {
            const stylesItem = styleRegistry.get(styles);
            if (stylesItem) {
                stylesItem.referenceCount--;
                if (!stylesItem.referenceCount) {
                    // TODO try scheduling this via setTimeout
                    // and add another referenceCount check
                    // to deal with instance where existing <Style>
                    // component is moved in the tree or re-keyed
                    styleRegistry.delete(styles);
                }
            }
        };
    }, [styles]);

    return minifiedStyles;
}

export default useStyles;

export const clearRegistry = () => {
    styleRegistry.clear();
};

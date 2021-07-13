import * as React from 'react';
import useBoundingClientRect from '@acusti/use-bounding-client-rect';

const { useEffect, useState } = React;

type MaybeHTMLElement = HTMLElement | null;
type OutOfBounds = {
    bottom: boolean;
    hasLayout: boolean;
    left: boolean;
    right: boolean;
    top: boolean;
};

const INITIAL_OUT_OF_BOUNDS: OutOfBounds = Object.freeze({
    bottom: false,
    hasLayout: false,
    left: false,
    right: false,
    top: false,
});

const INITIAL_OUT_OF_BOUNDS_HAS_LAYOUT: OutOfBounds = Object.freeze({
    ...INITIAL_OUT_OF_BOUNDS,
    hasLayout: true,
});

const getOverflowHiddenParent = (element: MaybeHTMLElement): MaybeHTMLElement => {
    while (element?.parentElement) {
        // If we’ve reached the body, use that as offsetParent
        if (element.parentElement.tagName === 'BODY') return element.parentElement;
        // Only need to check one overflow direction, because if either direction
        // is not visible, neither can be visible
        if (getComputedStyle(element.parentElement).overflowX !== 'visible') {
            return element.parentElement;
        }

        element = element.parentElement as MaybeHTMLElement;
    }

    return null;
};

const useIsOutOfBounds = (element: MaybeHTMLElement): OutOfBounds => {
    const [outOfBounds, setOutOfBounds] = useState<OutOfBounds>(INITIAL_OUT_OF_BOUNDS);
    const offsetParent = getOverflowHiddenParent(element);
    const offsetParentRect = useBoundingClientRect(offsetParent);
    const elementRect = useBoundingClientRect(element);

    useEffect(() => {
        if (elementRect.top === undefined) {
            setOutOfBounds(INITIAL_OUT_OF_BOUNDS);
            return;
        }

        if (offsetParentRect.top === undefined) {
            setOutOfBounds(INITIAL_OUT_OF_BOUNDS_HAS_LAYOUT);
            return;
        }

        // If element is out-of-bounds, UI will adjust its position to move it back in bounds.
        // To prevent that from causing this hook to wrongly think it can set it back to false,
        // only allow outOfBounds values to switch from true to false when resetting to initial.
        const bottom = outOfBounds.bottom || elementRect.bottom > offsetParentRect.bottom;
        const left = outOfBounds.left || elementRect.left < offsetParentRect.left;
        const right = outOfBounds.right || elementRect.right > offsetParentRect.right;
        const top = outOfBounds.top || elementRect.top < offsetParentRect.top;

        // Do nothing if none of the outOfBounds values have changed
        if (
            outOfBounds.hasLayout &&
            bottom === outOfBounds.bottom &&
            left === outOfBounds.left &&
            right === outOfBounds.right &&
            top === outOfBounds.top
        ) {
            return;
        }

        setOutOfBounds({ bottom, hasLayout: true, left, right, top });
    }, [
        outOfBounds.bottom,
        outOfBounds.hasLayout,
        outOfBounds.left,
        outOfBounds.right,
        outOfBounds.top,
        elementRect.bottom,
        elementRect.left,
        elementRect.right,
        elementRect.top,
        offsetParentRect.bottom,
        offsetParentRect.left,
        offsetParentRect.right,
        offsetParentRect.top,
    ]);

    return outOfBounds;
};

export default useIsOutOfBounds;

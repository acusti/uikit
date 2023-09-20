import useBoundingClientRect from '@acusti/use-bounding-client-rect';
import * as React from 'react';

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
    const elementRect = useBoundingClientRect(element);
    const offsetParent = getOverflowHiddenParent(element);
    const offsetParentRect = useBoundingClientRect(offsetParent);
    // If offsetParent is a collapsed <body> element, use viewport height as bottom
    if (offsetParent?.tagName === 'BODY' && !offsetParentRect.bottom) {
        offsetParentRect.bottom = offsetParent.ownerDocument.documentElement.clientHeight;
    }

    useEffect(() => {
        if (elementRect.top == null) {
            setOutOfBounds(INITIAL_OUT_OF_BOUNDS);
            return;
        }

        if (offsetParentRect.top == null) {
            setOutOfBounds(INITIAL_OUT_OF_BOUNDS_HAS_LAYOUT);
            return;
        }

        let bottom = elementRect.bottom > offsetParentRect.bottom;
        let left = elementRect.left < offsetParentRect.left;
        let right = elementRect.right > offsetParentRect.right;
        let top = elementRect.top < offsetParentRect.top;

        // If element is out-of-bounds, UI will reposition it to move it back in bounds.
        // To prevent the element from becoming out-of-bounds in the opposite direction,
        // check if there is room in the opposite direction for the element to render.
        // If there isn’t room, mark it as out-of-bounds in the opposite direction also.
        // Note: elementTop - elementHeight = (elementTop * 2) - elementBottom
        // Note: elementBottom + elementHeight = (elementBottom * 2) - elementTop
        const isDownward = !outOfBounds.bottom || outOfBounds.top; // defaults downward
        if (isDownward && !top) {
            top = elementRect.top! * 2 - elementRect.bottom! < offsetParentRect.top!;
        } else if (!isDownward && !bottom) {
            bottom =
                elementRect.bottom! * 2 - elementRect.top! > offsetParentRect.bottom!;
        }

        const isRightward = !outOfBounds.right || outOfBounds.left; // defaults rightward
        if (isRightward && !left) {
            left = elementRect.left! * 2 - elementRect.right! < offsetParentRect.left!;
        } else if (!isRightward && !right) {
            right = elementRect.right! * 2 - elementRect.left! > offsetParentRect.right!;
        }

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

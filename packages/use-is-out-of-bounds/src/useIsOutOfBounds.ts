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

// If element is out-of-bounds, UI will reposition it to move it back in bounds.
// To prevent the element from becoming out-of-bounds in the opposite direction,
// check if there is room in the opposite direction for the element to render.
// If there isn’t room, mark it as out-of-bounds in the opposite direction also.
// Note: elementTop - elementHeight = (elementTop * 2) - elementBottom
// Note: elementBottom + elementHeight = (elementBottom * 2) - elementTop
const getWillBeOutOfBounds = ({
    boundingValue,
    boundingValueOpposite,
    value,
    valueOpposite,
}: {
    boundingValue: number;
    boundingValueOpposite: number;
    value: number;
    valueOpposite: number;
}) => {
    const isEndValue = value > valueOpposite;
    const adjustedValue = value * 2 - valueOpposite;
    const adjustedOverlapValue = isEndValue
        ? // If checking bottom/right, overlap = element - offsetParent
          adjustedValue - boundingValue
        : // If checking top/left, overlap = offsetParent - element
          boundingValue - adjustedValue;
    if (adjustedOverlapValue <= 0) return false;
    // This util is only called if already outOfBounds in opposite direction.
    // Only consider adjusted value outOfBounds if more outOfBounds than that.
    const oppositeOverlapValue = isEndValue
        ? boundingValueOpposite - valueOpposite
        : valueOpposite - boundingValueOpposite;
    return adjustedOverlapValue > oppositeOverlapValue;
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

        const elementBottom = elementRect.bottom!;
        const elementLeft = elementRect.left!;
        const elementRight = elementRect.right!;
        const elementTop = elementRect.top!;
        const offsetParentBottom = offsetParentRect.bottom!;
        const offsetParentLeft = offsetParentRect.left!;
        const offsetParentRight = offsetParentRect.right!;
        const offsetParentTop = offsetParentRect.top!;

        let bottom = elementBottom > offsetParentBottom;
        let left = elementLeft < offsetParentLeft;
        let right = elementRight > offsetParentRight;
        let top = elementTop < offsetParentTop;

        const isDownward = !outOfBounds.bottom || outOfBounds.top; // defaults downward
        const willBeDownward = !bottom || top; // defaults downward
        if (isDownward && !willBeDownward) {
            top = getWillBeOutOfBounds({
                boundingValue: offsetParentTop,
                boundingValueOpposite: offsetParentBottom,
                value: elementTop,
                valueOpposite: elementBottom,
            });
            // If top would be *more* out-of-bounds, keep it downward
            bottom = !top;
        } else if (!isDownward && willBeDownward) {
            bottom = getWillBeOutOfBounds({
                boundingValue: offsetParentBottom,
                boundingValueOpposite: offsetParentTop,
                value: elementBottom,
                valueOpposite: elementTop,
            });
            // If bottom would be *more* out-of-bounds, keep it upward
            top = !bottom;
        }

        const isRightward = !outOfBounds.right || outOfBounds.left; // defaults rightward
        const willBeRightward = !right || left;
        if (isRightward && !willBeRightward) {
            left = getWillBeOutOfBounds({
                boundingValue: offsetParentLeft,
                boundingValueOpposite: offsetParentRight,
                value: elementLeft,
                valueOpposite: elementRight,
            });
            // If left would be *more* out-of-bounds, keep it rightward
            right = !left;
        } else if (!isRightward && willBeRightward) {
            right = getWillBeOutOfBounds({
                boundingValue: offsetParentRight,
                boundingValueOpposite: offsetParentLeft,
                value: elementRight,
                valueOpposite: elementLeft,
            });
            // If right would be *more* out-of-bounds, keep it leftward
            left = !right;
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
        elementRect.bottom,
        elementRect.left,
        elementRect.right,
        elementRect.top,
        offsetParentRect.bottom,
        offsetParentRect.left,
        offsetParentRect.right,
        offsetParentRect.top,
        outOfBounds.bottom,
        outOfBounds.hasLayout,
        outOfBounds.left,
        outOfBounds.right,
        outOfBounds.top,
    ]);

    return outOfBounds;
};

export default useIsOutOfBounds;

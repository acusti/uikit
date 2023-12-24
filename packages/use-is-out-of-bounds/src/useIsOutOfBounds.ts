import useBoundingClientRect from '@acusti/use-bounding-client-rect';
import * as React from 'react';

const { useRef } = React;

type MaybeHTMLElement = HTMLElement | null;
type OutOfBounds = {
    bottom: boolean;
    hasLayout: boolean;
    left: boolean;
    maxHeight: null | number;
    maxWidth: null | number;
    right: boolean;
    top: boolean;
};

const INITIAL_OUT_OF_BOUNDS: OutOfBounds = Object.freeze({
    bottom: false,
    hasLayout: false,
    left: false,
    maxHeight: null,
    maxWidth: null,
    right: false,
    top: false,
});

const INITIAL_OUT_OF_BOUNDS_HAS_LAYOUT: OutOfBounds = Object.freeze({
    ...INITIAL_OUT_OF_BOUNDS,
    hasLayout: true,
});

const getBoundingAncestor = (element?: MaybeHTMLElement): MaybeHTMLElement => {
    while (element?.parentElement) {
        // If we’ve reached the body, use that as boundingElement
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

// Opposite direction needs to have much more available space then current direction
const getShouldSwitchDirection = (
    spaceAvailable: number,
    spaceAvailableOpposite: number,
) => {
    // Give preference to current direction if it is within 10px out of bounds
    if (spaceAvailable > -10) return false;
    const difference = spaceAvailableOpposite - spaceAvailable;
    // If opposite direction doesn’t have a lot more available space, don’t switch
    if (difference <= 40) return false;
    // To be worth switching, opposite direction has to be at least ¼ less out of bounds
    return spaceAvailableOpposite >= spaceAvailable * 0.75;
};

const getIsCurrentDirectionBefore = ({
    length,
    positionAfter,
    positionBefore,
}: {
    length: number;
    positionAfter: number;
    positionBefore: number;
}) => {
    if (Number.isNaN(positionAfter)) return false;
    if (Number.isNaN(positionBefore)) return true;
    // If before position is already positive, it’s direction isn’t before
    if (positionBefore >= 0) return false;
    // Consider element in negative direction if more than ½ its length is before origin
    return positionAfter < length / 2;
};

const useIsOutOfBounds = (element?: MaybeHTMLElement): OutOfBounds => {
    const outOfBoundsRef = useRef<OutOfBounds>(INITIAL_OUT_OF_BOUNDS);
    const elementRef = useRef<MaybeHTMLElement>(element ?? null);
    const computedStyleRef = useRef<CSSStyleDeclaration | null>(null);
    const elementRect = useBoundingClientRect(element);
    const boundingElement = getBoundingAncestor(element);
    const boundingElementRect = useBoundingClientRect(boundingElement);
    // If boundingElement is the <body> element, use viewport height as bottom
    if (boundingElement?.tagName === 'BODY') {
        boundingElementRect.bottom =
            boundingElement.ownerDocument.documentElement.clientHeight;
    }

    if (element !== elementRef.current) {
        elementRef.current = element ?? null;
        computedStyleRef.current = null;
    }

    if (!element || elementRect.top == null) {
        outOfBoundsRef.current = INITIAL_OUT_OF_BOUNDS;
        return INITIAL_OUT_OF_BOUNDS;
    } else if (boundingElementRect.top == null) {
        outOfBoundsRef.current = INITIAL_OUT_OF_BOUNDS_HAS_LAYOUT;
        return INITIAL_OUT_OF_BOUNDS_HAS_LAYOUT;
    }

    const previousOutOfBounds = outOfBoundsRef.current;
    const elementBottom = elementRect.bottom!; // eslint-disable-line @typescript-eslint/no-unnecessary-type-assertion
    const elementLeft = elementRect.left!; // eslint-disable-line @typescript-eslint/no-unnecessary-type-assertion
    const elementRight = elementRect.right!; // eslint-disable-line @typescript-eslint/no-unnecessary-type-assertion
    const elementTop = elementRect.top!; // eslint-disable-line @typescript-eslint/no-unnecessary-type-assertion
    const boundingElementBottom = boundingElementRect.bottom!; // eslint-disable-line @typescript-eslint/no-unnecessary-type-assertion
    const boundingElementLeft = boundingElementRect.left!; // eslint-disable-line @typescript-eslint/no-unnecessary-type-assertion
    const boundingElementRight = boundingElementRect.right!; // eslint-disable-line @typescript-eslint/no-unnecessary-type-assertion
    const boundingElementTop = boundingElementRect.top!; // eslint-disable-line @typescript-eslint/no-unnecessary-type-assertion
    const elementHeight = elementBottom - elementTop;
    const elementWidth = elementRight - elementLeft;

    // If direction isn’t currently out-of-bounds, default to previous value.
    // This prevents us erroneously switching back if direction changed and new
    // direction causes the previous direction to seem to now have available space.
    let bottom = elementBottom > boundingElementBottom || previousOutOfBounds.bottom;
    let left = elementLeft < boundingElementLeft || previousOutOfBounds.left;
    let right = elementRight > boundingElementRight || previousOutOfBounds.right;
    let top = elementTop < boundingElementTop || previousOutOfBounds.top;

    if (bottom || left || right || top) {
        const style = computedStyleRef.current ?? getComputedStyle(element);
        if (!computedStyleRef.current) {
            computedStyleRef.current = style;
        }
        const isUpward = getIsCurrentDirectionBefore({
            length: elementHeight,
            positionAfter: parseFloat(style.getPropertyValue('bottom')),
            positionBefore: parseFloat(style.getPropertyValue('top')),
        });
        const isLeftward = getIsCurrentDirectionBefore({
            length: elementWidth,
            positionAfter: parseFloat(style.getPropertyValue('right')),
            positionBefore: parseFloat(style.getPropertyValue('left')),
        });
        // Identify available space in each direction
        const offsetBottom = isUpward ? elementHeight : 0;
        const offsetLeft = isLeftward ? 0 : elementWidth;
        const offsetRight = isLeftward ? elementWidth : 0;
        const offsetTop = isUpward ? 0 : elementHeight;
        const availableLeft = (elementLeft - offsetLeft) - boundingElementLeft; // prettier-ignore
        const availableRight = boundingElementRight - (elementRight + offsetRight); // prettier-ignore
        const availableTop = (elementTop - offsetTop) - boundingElementTop; // prettier-ignore
        const availableBottom = boundingElementBottom - (elementBottom + offsetBottom); // prettier-ignore
        // If element is out-of-bounds in direction it’s rendering, check if should switch
        if (isUpward && top) {
            top = getShouldSwitchDirection(availableTop, availableBottom);
            bottom = !top;
        } else if (!isUpward && bottom) {
            bottom = getShouldSwitchDirection(availableBottom, availableTop);
            top = !bottom;
        }

        if (isLeftward && left) {
            left = getShouldSwitchDirection(availableLeft, availableRight);
            right = !left;
        } else if (!isLeftward && right) {
            right = getShouldSwitchDirection(availableRight, availableLeft);
            left = !right;
        }
    }

    const maxHeight =
        !bottom || top
            ? boundingElementBottom - elementTop
            : elementBottom - boundingElementTop;
    const maxWidth =
        !right || left
            ? boundingElementRight - elementLeft
            : elementRight - boundingElementLeft;

    // Only overwrite outOfBoundsRef if one of the values has changed
    if (
        !previousOutOfBounds.hasLayout ||
        bottom !== previousOutOfBounds.bottom ||
        left !== previousOutOfBounds.left ||
        maxHeight !== previousOutOfBounds.maxHeight ||
        maxWidth !== previousOutOfBounds.maxWidth ||
        right !== previousOutOfBounds.right ||
        top !== previousOutOfBounds.top
    ) {
        outOfBoundsRef.current = {
            bottom,
            hasLayout: true,
            left,
            maxHeight,
            maxWidth,
            right,
            top,
        };
    }

    return outOfBoundsRef.current;
};

export default useIsOutOfBounds;

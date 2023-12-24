import * as React from 'react';

const { useEffect, useState } = React;

const noop = () => {}; // eslint-disable-line @typescript-eslint/no-empty-function

const RESIZE_OBSERVER_STUB = {
    disconnect: noop,
    observe: noop,
    unobserve: noop,
} as ResizeObserver;

type EmptyRect = { bottom: void; left: void; right: void; top: void };
type Rect = { bottom: number; left: number; right: number; top: number };
type SetRenderTime = (time: number) => void;
type Refs = {
    boundingClientRect: Rect | EmptyRect;
    maybeCleanupElement: () => void;
    maybeCleanupTimer: ReturnType<typeof setTimeout> | null;
    renderTimeSetters: Set<SetRenderTime>;
    retryCount: number;
    scheduleUpdate: () => void;
    updateBoundingClientRect: () => void;
    updaterFrameID: number | null;
};

const EMPTY_RECT: EmptyRect = Object.freeze({
    bottom: undefined,
    left: undefined,
    right: undefined,
    top: undefined,
});

const EMPTY_REFS = Object.freeze({
    boundingClientRect: EMPTY_RECT,
    maybeCleanupElement: noop,
    maybeCleanupTimer: null,
    renderTimeSetters: new Set(),
    retryCount: 0,
    scheduleUpdate: noop,
    updateBoundingClientRect: noop,
    updaterFrameID: null,
});

const MINUTE = 60 * 1000;

const refsByElement = new WeakMap<HTMLElement, Refs>();

let resizeObserver = RESIZE_OBSERVER_STUB;

if (typeof ResizeObserver === 'function') {
    resizeObserver = new ResizeObserver((entries, observer) => {
        for (const entry of entries) {
            const element = entry.target as HTMLElement;
            const refs = refsByElement.get(element);
            if (!refs) {
                observer.unobserve(element);
                return;
            }

            refs.scheduleUpdate();
        }
    });
}

const initializeUpdateHandlers = (element: HTMLElement) => {
    const refs = refsByElement.get(element);
    if (!refs) return;
    // If update handlers are already initialized, there’s no more work to do
    if (refs.scheduleUpdate && refs.scheduleUpdate !== noop) return;

    refs.updateBoundingClientRect = () => {
        refs.updaterFrameID = null;

        const rect = element.getBoundingClientRect();
        // If element has no width or height, its layout is still being calculated
        if (!rect.height && !rect.width) {
            if (refs.retryCount < 10) {
                refs.retryCount++;
                refs.updaterFrameID = requestAnimationFrame(
                    refs.updateBoundingClientRect,
                );
            }
            return;
        }

        if (refs.retryCount) {
            refs.retryCount = 0;
        }

        // Only update boundingClientRect if at least one of the values has changed
        if (
            refs.boundingClientRect.bottom === rect.bottom &&
            refs.boundingClientRect.left === rect.left &&
            refs.boundingClientRect.right === rect.right &&
            refs.boundingClientRect.top === rect.top
        ) {
            return;
        }

        refs.boundingClientRect = {
            bottom: rect.bottom,
            left: rect.left,
            right: rect.right,
            top: rect.top,
        };

        const renderTime = typeof Date.now === 'function' ? Date.now() : 0;
        for (const setRenderTime of refs.renderTimeSetters) {
            setRenderTime(renderTime);
        }
    };

    refs.scheduleUpdate = () => {
        // Use requestAnimationFrame-based throttling to prevent ResizeObserver loop limit exceeded
        if (refs.updaterFrameID) return;
        refs.updaterFrameID = requestAnimationFrame(refs.updateBoundingClientRect);
    };

    refs.maybeCleanupElement = () => {
        if (refs.maybeCleanupTimer) {
            clearTimeout(refs.maybeCleanupTimer);
            refs.maybeCleanupTimer = null;
        }
        // If components are using this element and element still in DOM, no cleanup needed
        if (refs.renderTimeSetters.size && element.closest('html')) {
            refs.maybeCleanupTimer = setTimeout(refs.maybeCleanupElement, MINUTE);
            return;
        }

        refsByElement.delete(element);
        resizeObserver.unobserve(element);
    };

    refs.maybeCleanupTimer = setTimeout(refs.maybeCleanupElement, MINUTE);
};

const cleanupHookInstance = (element: HTMLElement, setRenderTime: SetRenderTime) => {
    const refs = refsByElement.get(element);
    if (!refs) return;

    refs.renderTimeSetters.delete(setRenderTime);
    refs.maybeCleanupElement();
};

const useBoundingClientRect = (element?: HTMLElement | null): Rect | EmptyRect => {
    // Flip the bit to trigger a new return value from this hook
    const [, setRenderTime] = useState<number>(0);

    // If element isn’t in our refs map, initialize it
    let isInitializing = false;
    let refs: Refs | null = (element && refsByElement.get(element)) ?? null;
    if (element && !refs) {
        isInitializing = true;
        refs = {
            ...EMPTY_REFS,
            renderTimeSetters: new Set(),
        };
        refsByElement.set(element, refs);
        initializeUpdateHandlers(element);
        resizeObserver.observe(element);
    }

    if (refs) {
        refs.renderTimeSetters.add(setRenderTime);
        if (isInitializing) {
            refs.updateBoundingClientRect();
        }
    }

    useEffect(() => {
        if (!element) return noop;

        const _element = element;

        return () => {
            cleanupHookInstance(_element, setRenderTime);
        };
    }, [element]);

    return refs?.boundingClientRect ?? EMPTY_RECT;
};

export default useBoundingClientRect;

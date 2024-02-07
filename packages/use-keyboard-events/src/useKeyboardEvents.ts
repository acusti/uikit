import { useEffect } from 'react';

import { addHandler, addHandlers } from './handlers.js';
import type { Handler } from './handlers.js';

export {
    isEventTargetUsingKeyEvent,
    isPrimaryModifierPressed,
    usesKeyEvents,
} from './handlers.js';

type Props = {
    ignoreUsedKeyboardEvents?: boolean;
    onKeyDown?: Handler;
    onKeyPress?: Handler;
    onKeyUp?: Handler;
    /**
     * Priority defines what order handlers should be invoked and defaults to 0.
     * It can be any number between -50 (lowest priority) and 50 (highest priority).
     */
    priority?: number;
};

export default function useKeyboardEvents({
    ignoreUsedKeyboardEvents,
    onKeyDown,
    onKeyPress,
    onKeyUp,
    priority,
}: Props) {
    useEffect(() => {
        addHandlers(document);
        document.querySelectorAll('iframe').forEach((iframe: HTMLIFrameElement) => {
            if (!isSameOriginFrame(iframe) || !iframe.contentDocument) return;
            addHandlers(iframe.contentDocument);
        });
    }, []);

    useEffect(
        () =>
            addHandler({
                eventType: 'keydown',
                handler: onKeyDown,
                ignoreUsedKeyboardEvents,
                priority,
            }),
        [ignoreUsedKeyboardEvents, onKeyDown, priority],
    );

    useEffect(
        () =>
            addHandler({
                eventType: 'keypress',
                handler: onKeyPress,
                ignoreUsedKeyboardEvents,
                priority,
            }),
        [ignoreUsedKeyboardEvents, onKeyPress, priority],
    );

    useEffect(
        () =>
            addHandler({
                eventType: 'keyup',
                handler: onKeyUp,
                ignoreUsedKeyboardEvents,
                priority,
            }),
        [ignoreUsedKeyboardEvents, onKeyUp, priority],
    );
}

// https://github.com/facebook/react/blob/main/packages/react-dom-bindings/src/client/ReactInputSelection.js
function isSameOriginFrame(iframe: HTMLIFrameElement) {
    try {
        // Accessing the contentDocument of an HTMLIframeElement can cause the
        // browser to throw, e.g. if it has a cross-origin src attribute.
        // Safari will show a “Blocked a frame with origin…” error in the
        // console on e.g. iframe.contentDocument.defaultView if cross-origin.
        // To avoid this, try a cross-origin property, like location, which can
        // throw a “SecurityError” DOM Exception that’s compatible with Safari.
        // https://html.spec.whatwg.org/multipage/browsers.html#integration-with-idl

        return typeof iframe.contentWindow!.location.href === 'string';
    } catch (err) {
        return false;
    }
}

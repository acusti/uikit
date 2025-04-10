export type EventType = 'keydown' | 'keypress' | 'keyup';
export type Handler = (event: KeyboardEvent) => unknown;
type HandlerConfig = { ignoreUsedKeyboardEvents: boolean; priority: number };
type HandlersByPriority = Array<Set<Handler>>;

export const handlersData = {
    config: new Map() as Map<Handler, HandlerConfig>,
    keydown: [] as HandlersByPriority,
    keypress: [] as HandlersByPriority,
    keyup: [] as HandlersByPriority,
};

const PRIORITY_MIN = -50;
const PRIORITY_MAX = 50;
const PRIORITY_MODIFIER = PRIORITY_MIN * -1;

const noop = () => {}; // eslint-disable-line @typescript-eslint/no-empty-function

export function addHandler({
    eventType,
    handler,
    ignoreUsedKeyboardEvents = true,
    priority: _priority,
}: {
    eventType: EventType;
    handler: Handler | void;
    ignoreUsedKeyboardEvents?: boolean;
    priority?: number;
}) {
    if (!handler) return noop;
    // normalize priority to be zero-based between min and max (for use as an array index)
    const priority = Math.min(
        PRIORITY_MAX + PRIORITY_MODIFIER,
        Math.max(0, (_priority ?? 0) + PRIORITY_MODIFIER),
    );

    const handlersByPriority = handlersData[eventType];
    handlersByPriority[priority] ??= new Set();

    handlersByPriority[priority].add(handler);
    handlersData.config.set(handler, { ignoreUsedKeyboardEvents, priority });

    return () => {
        handlersData.config.delete(handler);
        if (handlersByPriority[priority] == null) return;

        handlersByPriority[priority].delete(handler);
        if (!handlersByPriority[priority].size) {
            delete handlersByPriority[priority];
            // if no other handlers have a higher priority, resize the array
            for (
                let index = priority;
                index > -1 &&
                handlersByPriority[index] == null &&
                handlersByPriority.length === index + 1;
                index--
            ) {
                handlersByPriority.length = index;
            }
        }
    };
}

const IS_APPLE_REGEXP = /mac|iphone|ipad|ipod/i;

export function isPrimaryModifierPressed(event: KeyboardEvent) {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const platform = globalThis.navigator?.platform ?? '';
    return IS_APPLE_REGEXP.test(platform) ? event.metaKey : event.ctrlKey;
}

const NON_TEXT_INPUT_TYPES = new Set([
    'button',
    'checkbox',
    'color',
    'file',
    'hidden',
    'image',
    'radio',
    'range',
    'reset',
    'submit',
]);

const NON_TEXT_INPUT_USES_KEYS = new Set([
    ' ',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'Enter',
]);

export const usesKeyEvents = (target: EventTarget) =>
    (target as HTMLElement).isContentEditable ||
    (target as HTMLElement).tagName === 'TEXTAREA' ||
    (target as HTMLElement).tagName === 'INPUT';

export const isEventTargetUsingKeyEvent = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    if (target == null || !usesKeyEvents(target)) return false;
    // Restrict special handling to only non-text <input> elements
    if (target.tagName !== 'INPUT') return true;
    if (!NON_TEXT_INPUT_TYPES.has((target as HTMLInputElement).type)) return true;
    // Non-text inputs can use arrow keys, escape, the spacebar, and return / enter
    return NON_TEXT_INPUT_USES_KEYS.has(event.key);
};

type DefaultView = { __useKeyboardEventsAttached__?: boolean } & Window;

export function addHandlers(doc: Document) {
    if (
        !doc?.defaultView ||
        (doc.defaultView as DefaultView).__useKeyboardEventsAttached__
    ) {
        return;
    }

    (doc.defaultView as DefaultView).__useKeyboardEventsAttached__ = true;
    doc.addEventListener('keydown', handleKeyboardEvent);
    doc.addEventListener('keypress', handleKeyboardEvent);
    doc.addEventListener('keyup', handleKeyboardEvent);

    return () => {
        if (doc.defaultView) {
            (doc.defaultView as DefaultView).__useKeyboardEventsAttached__ = false;
        }
        doc.removeEventListener('keydown', handleKeyboardEvent);
        doc.removeEventListener('keypress', handleKeyboardEvent);
        doc.removeEventListener('keyup', handleKeyboardEvent);
    };
}

function handleKeyboardEvent(event: KeyboardEvent) {
    const eventType = event.type as EventType;
    const handlersByPriority = handlersData[eventType];
    let index = handlersByPriority.length;
    const targetUsesKeyEvents = isEventTargetUsingKeyEvent(event);
    while (index--) {
        const handlers = handlersByPriority[index];
        if (handlers != null) {
            for (const handler of handlers) {
                const config = handlersData.config.get(handler);
                if (!targetUsesKeyEvents || config?.ignoreUsedKeyboardEvents === false) {
                    const shouldPropagate = handler(event);
                    if (shouldPropagate === false) return;
                }
            }
        }
    }
}

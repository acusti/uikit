export type EventType = 'keydown' | 'keypress' | 'keyup';
export type Handler = (event: KeyboardEvent) => unknown;
export type HandlersByPriority = Array<Set<Handler>>;
export type HandlerConfig = { ignoreUsedKeyboardEvents: boolean; priority: number };

export const handlersData = {
    config: new Map() as Map<Handler, HandlerConfig>,
    keydown: [] as HandlersByPriority,
    keypress: [] as HandlersByPriority,
    keyup: [] as HandlersByPriority,
};

const PRIORITY_MIN = -50;
const PRIORITY_MAX = 50;
const PRIORITY_MODIFIER = PRIORITY_MIN * -1;

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
    if (!handler) return () => {};
    // normalize priority to be zero-based between min and max (for use as an array index)
    const priority = Math.min(
        PRIORITY_MAX + PRIORITY_MODIFIER,
        Math.max(0, (_priority || 0) + PRIORITY_MODIFIER),
    );

    const handlersByPriority = handlersData[eventType];
    if (!handlersByPriority[priority]) {
        handlersByPriority[priority] = new Set();
    }

    handlersByPriority[priority].add(handler);
    handlersData.config.set(handler, { ignoreUsedKeyboardEvents, priority });

    return () => {
        handlersData.config.delete(handler);
        if (!handlersByPriority[priority]) return;

        handlersByPriority[priority].delete(handler);
        if (!handlersByPriority[priority].size) {
            delete handlersByPriority[priority];
            // if no other handlers have a higher priority, resize the array
            for (
                let index = priority;
                index > -1 &&
                !handlersByPriority[index] &&
                handlersByPriority.length === index + 1;
                index--
            ) {
                handlersByPriority.length = index;
            }
        }
    };
}

const KEY_EVENT_ELEMENTS = new Set(['INPUT', 'TEXTAREA']);

export const usesKeyEvents = (target: EventTarget) =>
    (target as HTMLElement).isContentEditable ||
    KEY_EVENT_ELEMENTS.has((target as HTMLElement).tagName);

function handleKeyboardEvent(event: KeyboardEvent) {
    const eventType = event.type as EventType;
    const handlersByPriority = handlersData[eventType];
    let index = handlersByPriority.length;
    const targetUsesKeyEvents = event.target && usesKeyEvents(event.target);
    while (index--) {
        const handlers = handlersByPriority[index];
        if (handlers) {
            for (const handler of handlers) {
                const config = handlersData.config.get(handler);
                if (!targetUsesKeyEvents || config?.ignoreUsedKeyboardEvents === false) {
                    const isHandled = handler(event);
                    if (isHandled === true) return;
                }
            }
        }
    }
}

type DefaultView = Window & { __useKeyboardEventsAttached__?: boolean };

export function addHandlers(doc: Document) {
    if (
        !doc ||
        !doc.defaultView ||
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

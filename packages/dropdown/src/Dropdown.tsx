/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/mouse-events-have-key-events, jsx-a11y/no-static-element-interactions */
import { Style } from '@acusti/styling';
import useBoundingClientRect from '@acusti/use-bounding-client-rect';
import useKeyboardEvents, {
    isEventTargetUsingKeyEvent,
} from '@acusti/use-keyboard-events';
import clsx from 'clsx';
import {
    Children,
    type CSSProperties,
    Fragment,
    isValidElement,
    type JSX,
    type MouseEvent as ReactMouseEvent,
    type ReactNode,
    type SyntheticEvent,
    useEffect,
    useRef,
    useState,
} from 'react';

import {
    getActiveItemElement,
    getItemElements,
    ITEM_SELECTOR,
    setActiveItem,
} from './helpers.js';
import {
    BODY_CLASS_NAME,
    BODY_MAX_HEIGHT_VAR,
    BODY_SELECTOR,
    LABEL_CLASS_NAME,
    LABEL_TEXT_CLASS_NAME,
    ROOT_CLASS_NAME,
    STYLES,
    TRIGGER_CLASS_NAME,
} from './styles.js';

export type Item = {
    element: MaybeHTMLElement;
    event: Event | SyntheticEvent<HTMLElement>;
    label: string;
    value: string;
};

export type Props = {
    /**
     * Boolean indicating if the user can submit a value not already in the
     * dropdown.
     */
    allowCreate?: boolean;
    /**
     * Boolean indicating if the user can submit an empty value (i.e. clear
     * the value). Defaults to true.
     */
    allowEmpty?: boolean;
    /**
     * Can take a single React element or exactly two renderable children.
     */
    children: ChildrenTuple | JSX.Element;
    className?: string;
    disabled?: boolean;
    /**
     * Group identifier string links dropdowns together into a menu
     * (like macOS top menubar).
     */
    group?: string;
    hasItems?: boolean;
    isOpenOnMount?: boolean;
    isSearchable?: boolean;
    keepOpenOnSubmit?: boolean;
    label?: string;
    minHeightBody?: number;
    minWidthBody?: number;
    /**
     * Only usable in conjunction with {isSearchable: true}.
     * Used as search input’s name.
     */
    name?: string;
    onActiveItem?: (payload: Item) => void;
    onClick?: (event: ReactMouseEvent<HTMLElement>) => unknown;
    onClose?: () => unknown;
    onMouseDown?: (event: ReactMouseEvent<HTMLElement>) => unknown;
    onMouseUp?: (event: ReactMouseEvent<HTMLElement>) => unknown;
    onOpen?: () => unknown;
    onSubmitItem?: (payload: Item) => void;
    /**
     * Only usable in conjunction with {isSearchable: true}.
     * Used as search input’s placeholder.
     */
    placeholder?: string;
    style?: CSSProperties;
    /**
     * Only usable in conjunction with {isSearchable: true}.
     * Used as search input’s tabIndex.
     */
    tabIndex?: number;
    /**
     * Used as search input’s value if props.isSearchable === true
     * Used to determine if value has changed to avoid triggering onSubmitItem if not
     */
    value?: string;
};

type ChildrenTuple = [ReactNode, ReactNode] | readonly [ReactNode, ReactNode];

type MaybeHTMLElement = HTMLElement | null;

type MousePosition = { clientX: number; clientY: number };

type TimeoutID = ReturnType<typeof setTimeout>;

const CHILDREN_ERROR =
    '@acusti/dropdown requires either 1 child (the dropdown body) or 2 children: the dropdown trigger and the dropdown body.';
const CLICKABLE_SELECTOR = 'button, a[href], input[type="button"], input[type="submit"]';
const TEXT_INPUT_SELECTOR =
    'input:not([type=radio]):not([type=checkbox]):not([type=range]),textarea';

export default function Dropdown({
    allowCreate,
    allowEmpty = true,
    children,
    className,
    disabled,
    hasItems = true,
    isOpenOnMount,
    isSearchable,
    keepOpenOnSubmit = !hasItems,
    label,
    minHeightBody = 30,
    minWidthBody = 100,
    name,
    onActiveItem,
    onClick,
    onClose,
    onMouseDown,
    onMouseUp,
    onOpen,
    onSubmitItem,
    placeholder,
    style: styleFromProps,
    tabIndex,
    value,
}: Props) {
    const childrenCount = Children.count(children);
    if (childrenCount !== 1 && childrenCount !== 2) {
        if (childrenCount === 0) {
            throw new Error(CHILDREN_ERROR + ' Received no children.');
        }
        console.error(`${CHILDREN_ERROR} Received ${childrenCount} children.`);
    }

    let trigger: React.ReactNode;
    if (childrenCount > 1) {
        trigger = (children as ChildrenTuple)[0];
    }

    const [isOpen, setIsOpen] = useState<boolean>(isOpenOnMount ?? false);
    const [isOpening, setIsOpening] = useState<boolean>(!isOpenOnMount);
    const [dropdownElement, setDropdownElement] = useState<MaybeHTMLElement>(null);
    const [dropdownBodyElement, setDropdownBodyElement] =
        useState<MaybeHTMLElement>(null);
    const inputElementRef = useRef<HTMLInputElement | null>(null);
    const closingTimerRef = useRef<null | TimeoutID>(null);
    const isOpeningTimerRef = useRef<null | TimeoutID>(null);
    const currentInputMethodRef = useRef<'keyboard' | 'mouse'>('mouse');
    const clearEnteredCharactersTimerRef = useRef<null | TimeoutID>(null);
    const enteredCharactersRef = useRef<string>('');
    const mouseDownPositionRef = useRef<MousePosition | null>(null);

    const allowCreateRef = useRef(allowCreate);
    const allowEmptyRef = useRef(allowEmpty);
    const hasItemsRef = useRef(hasItems);
    const isOpenRef = useRef(isOpen);
    const isOpeningRef = useRef(isOpening);
    const keepOpenOnSubmitRef = useRef(keepOpenOnSubmit);
    const onCloseRef = useRef(onClose);
    const onOpenRef = useRef(onOpen);
    const onSubmitItemRef = useRef(onSubmitItem);
    const valueRef = useRef(value);

    useEffect(() => {
        allowCreateRef.current = allowCreate;
        allowEmptyRef.current = allowEmpty;
        hasItemsRef.current = hasItems;
        isOpenRef.current = isOpen;
        isOpeningRef.current = isOpening;
        keepOpenOnSubmitRef.current = keepOpenOnSubmit;
        onCloseRef.current = onClose;
        onOpenRef.current = onOpen;
        onSubmitItemRef.current = onSubmitItem;
        valueRef.current = value;
    }, [
        allowCreate,
        allowEmpty,
        hasItems,
        isOpen,
        isOpening,
        keepOpenOnSubmit,
        onClose,
        onOpen,
        onSubmitItem,
        value,
    ]);

    const isMountedRef = useRef(false);

    useEffect(() => {
        if (!isMountedRef.current) {
            isMountedRef.current = true;
            // If isOpenOnMount, trigger onOpen right away
            if (isOpenRef.current && onOpenRef.current) {
                onOpenRef.current();
            }
            return;
        }

        if (isOpen && onOpenRef.current) {
            onOpenRef.current();
        } else if (!isOpen && onCloseRef.current) {
            onCloseRef.current();
        }
    }, [isOpen]);

    const closeDropdown = () => {
        setIsOpen(false);
        setIsOpening(false);
        mouseDownPositionRef.current = null;
        if (closingTimerRef.current != null) {
            clearTimeout(closingTimerRef.current);
            closingTimerRef.current = null;
        }
    };

    const handleSubmitItem = (event: Event | React.SyntheticEvent<HTMLElement>) => {
        if (isOpenRef.current && !keepOpenOnSubmitRef.current) {
            // A short timeout before closing is better UX when user selects an item so dropdown
            // doesn’t close before expected. It also enables using <Link />s in the dropdown body.
            closingTimerRef.current = setTimeout(closeDropdown, 90);
        }

        if (!hasItemsRef.current) return;

        const element = getActiveItemElement(dropdownElement);
        if (!element && !allowCreateRef.current) {
            // If not allowEmpty, don’t allow submitting an empty item
            if (!allowEmptyRef.current) return;
            // If we have an input element as trigger & the user didn’t clear the text, do nothing
            if (inputElementRef.current?.value) return;
        }

        let itemLabel = element?.innerText ?? '';
        if (inputElementRef.current) {
            if (!element) {
                itemLabel = inputElementRef.current.value;
            } else {
                inputElementRef.current.value = itemLabel;
            }

            if (
                inputElementRef.current ===
                inputElementRef.current.ownerDocument.activeElement
            ) {
                inputElementRef.current.blur();
            }
        }

        const nextValue = element?.dataset.uktValue ?? itemLabel;
        // If parent is controlling Dropdown via props.value and nextValue is the same, do nothing
        if (valueRef.current && valueRef.current === nextValue) return;

        // If the item is clickable or contains exactly one clickable element, invoke it
        // (but only if the event didn’t already originate from that element)
        if (element) {
            const eventTarget = event.target as HTMLElement;

            if (element.matches(CLICKABLE_SELECTOR)) {
                // The item element itself is clickable (e.g., <button data-ukt-value="…">)
                if (element !== eventTarget && !element.contains(eventTarget)) {
                    element.click();
                }
            } else {
                // Check if item contains exactly one clickable child element
                const clickableElements = element.querySelectorAll(CLICKABLE_SELECTOR);
                if (clickableElements.length === 1) {
                    const clickableElement = clickableElements[0] as HTMLElement;
                    if (
                        clickableElement !== eventTarget &&
                        !clickableElement.contains(eventTarget)
                    ) {
                        clickableElement.click();
                    }
                }
            }
        }

        onSubmitItemRef.current?.({
            element,
            event,
            label: itemLabel,
            value: nextValue,
        });
    };

    const handleMouseMove = ({ clientX, clientY }: ReactMouseEvent<HTMLElement>) => {
        currentInputMethodRef.current = 'mouse';
        const initialPosition = mouseDownPositionRef.current;
        if (!initialPosition) return;
        if (
            Math.abs(initialPosition.clientX - clientX) < 12 &&
            Math.abs(initialPosition.clientY - clientY) < 12
        ) {
            return;
        }
        setIsOpening(false);
    };

    const handleMouseOver = (event: ReactMouseEvent<HTMLElement>) => {
        if (!hasItemsRef.current) return;

        // If user isn’t currently using the mouse to navigate the dropdown, do nothing
        if (currentInputMethodRef.current !== 'mouse') return;

        // Ensure we have the dropdown root HTMLElement
        if (!dropdownElement) return;

        const itemElements = getItemElements(dropdownElement);
        if (!itemElements) return;

        const eventTarget = event.target as HTMLElement;
        const item = eventTarget.closest(ITEM_SELECTOR) as MaybeHTMLElement;
        const element = item ?? eventTarget;
        for (const itemElement of itemElements) {
            if (itemElement === element) {
                setActiveItem({ dropdownElement, element, event, onActiveItem });
                return;
            }
        }
    };

    const handleMouseOut = (event: ReactMouseEvent<HTMLElement>) => {
        if (!hasItemsRef.current) return;
        const activeItem = getActiveItemElement(dropdownElement);
        if (!activeItem) return;
        const eventRelatedTarget = event.relatedTarget as HTMLElement;
        if (activeItem !== event.target || activeItem.contains(eventRelatedTarget)) {
            return;
        }
        // If user moused out of activeItem (not into a descendant), it’s no longer active
        delete activeItem.dataset.uktActive;
    };

    const handleMouseDown = (event: ReactMouseEvent<HTMLElement>) => {
        if (onMouseDown) onMouseDown(event);
        if (isOpenRef.current) return;

        setIsOpen(true);
        setIsOpening(true);
        mouseDownPositionRef.current = {
            clientX: event.clientX,
            clientY: event.clientY,
        };
        isOpeningTimerRef.current = setTimeout(() => {
            setIsOpening(false);
            isOpeningTimerRef.current = null;
        }, 1000);
    };

    const handleMouseUp = (event: ReactMouseEvent<HTMLElement>) => {
        if (onMouseUp) onMouseUp(event);
        // If dropdown is still opening or isn’t open or is closing, do nothing
        if (
            isOpeningRef.current ||
            !isOpenRef.current ||
            closingTimerRef.current != null
        ) {
            return;
        }

        const eventTarget = event.target as HTMLElement;
        // If click was outside dropdown body, don’t trigger submit
        if (!eventTarget.closest(BODY_SELECTOR)) {
            // Don’t close dropdown if isOpening or search input is focused
            if (
                !isOpeningRef.current &&
                inputElementRef.current !== eventTarget.ownerDocument.activeElement
            ) {
                closeDropdown();
            }
            return;
        }

        // If dropdown has no items and click was within dropdown body, do nothing
        if (!hasItemsRef.current) return;

        handleSubmitItem(event);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        const { altKey, ctrlKey, key, metaKey } = event;
        const eventTarget = event.target as HTMLElement;
        if (!dropdownElement) return;

        const onEventHandled = () => {
            event.stopPropagation();
            event.preventDefault();
            currentInputMethodRef.current = 'keyboard';
        };

        const isEventTargetingDropdown = dropdownElement.contains(eventTarget);

        if (!isOpenRef.current) {
            // If dropdown is closed, don’t handle key events if event target isn’t within dropdown
            if (!isEventTargetingDropdown) return;
            // Open the dropdown on spacebar, enter, or if isSearchable and user hits the ↑/↓ arrows
            if (
                key === ' ' ||
                key === 'Enter' ||
                (hasItemsRef.current && (key === 'ArrowUp' || key === 'ArrowDown'))
            ) {
                onEventHandled();
                setIsOpen(true);
            }
            return;
        }

        const isTargetUsingKeyEvents = isEventTargetUsingKeyEvent(event);

        // If dropdown isOpen + hasItems & eventTargetNotUsingKeyEvents, handle characters
        if (hasItemsRef.current && !isTargetUsingKeyEvents) {
            let isEditingCharacters = !ctrlKey && !metaKey && /^[A-Za-z0-9]$/.test(key);
            // User could also be editing characters if there are already characters entered
            // and they are hitting delete or spacebar
            if (!isEditingCharacters && enteredCharactersRef.current) {
                isEditingCharacters = key === ' ' || key === 'Backspace';
            }

            if (isEditingCharacters) {
                onEventHandled();
                if (key === 'Backspace') {
                    enteredCharactersRef.current = enteredCharactersRef.current.slice(
                        0,
                        -1,
                    );
                } else {
                    enteredCharactersRef.current += key;
                }

                setActiveItem({
                    dropdownElement,
                    event,
                    // If props.allowCreate, only override the input’s value with an
                    // exact text match so user can enter a value not in items
                    isExactMatch: allowCreateRef.current,
                    onActiveItem,
                    text: enteredCharactersRef.current,
                });

                if (clearEnteredCharactersTimerRef.current != null) {
                    clearTimeout(clearEnteredCharactersTimerRef.current);
                }

                clearEnteredCharactersTimerRef.current = setTimeout(() => {
                    enteredCharactersRef.current = '';
                    clearEnteredCharactersTimerRef.current = null;
                }, 1500);

                return;
            }
        }

        // If dropdown isOpen, handle submitting the value
        if (key === 'Enter' || (key === ' ' && !inputElementRef.current)) {
            onEventHandled();
            handleSubmitItem(event);
            return;
        }

        // If dropdown isOpen, handle closing it on escape or spacebar if !hasItems
        if (
            key === 'Escape' ||
            (isEventTargetingDropdown && key === ' ' && !hasItemsRef.current)
        ) {
            // Close dropdown if hasItems or event target not using key events
            if (hasItemsRef.current || !isTargetUsingKeyEvents) {
                closeDropdown();
            }
            return;
        }

        // Handle ↑/↓ arrows
        if (hasItemsRef.current) {
            if (key === 'ArrowUp') {
                onEventHandled();
                if (altKey || metaKey) {
                    setActiveItem({ dropdownElement, event, index: 0, onActiveItem });
                } else {
                    setActiveItem({
                        dropdownElement,
                        event,
                        indexAddend: -1,
                        onActiveItem,
                    });
                }
                return;
            }
            if (key === 'ArrowDown') {
                onEventHandled();
                if (altKey || metaKey) {
                    // Using a negative index counts back from the end
                    setActiveItem({ dropdownElement, event, index: -1, onActiveItem });
                } else {
                    setActiveItem({
                        dropdownElement,
                        event,
                        indexAddend: 1,
                        onActiveItem,
                    });
                }
                return;
            }
        }
    };

    useKeyboardEvents({ ignoreUsedKeyboardEvents: false, onKeyDown: handleKeyDown });

    const handleRef = (ref: HTMLDivElement | null): (() => void) | void => {
        setDropdownElement(ref);
        if (!ref) return;

        const { ownerDocument } = ref;
        let inputElement = inputElementRef.current;
        // Check if trigger is a textual input or textarea element
        if (!inputElement && ref.firstElementChild) {
            if (ref.firstElementChild.matches(TEXT_INPUT_SELECTOR)) {
                inputElement = ref.firstElementChild as HTMLInputElement;
            } else {
                inputElement = ref.firstElementChild.querySelector(TEXT_INPUT_SELECTOR);
            }
            inputElementRef.current = inputElement;
        }

        const handleGlobalMouseDown = ({ target }: MouseEvent) => {
            const eventTarget = target as HTMLElement;
            if (!ref.contains(eventTarget)) {
                // Close dropdown on an outside click
                closeDropdown();
            }
        };

        const handleGlobalMouseUp = ({ target }: MouseEvent) => {
            if (!isOpenRef.current || closingTimerRef.current != null) return;

            // If still isOpening (gets set false 1s after open triggers), set it to false onMouseUp
            if (isOpeningRef.current) {
                setIsOpening(false);
                if (isOpeningTimerRef.current != null) {
                    clearTimeout(isOpeningTimerRef.current);
                    isOpeningTimerRef.current = null;
                }
                return;
            }

            const eventTarget = target as HTMLElement;
            // Only handle mouseup events from outside the dropdown here
            if (!ref.contains(eventTarget)) {
                closeDropdown();
            }
        };

        // Close dropdown if any element is focused outside of this dropdown
        const handleGlobalFocusIn = ({ target }: Event) => {
            if (!isOpenRef.current) return;

            const eventTarget = target as HTMLElement;
            // If focused element is a descendant or a parent of the dropdown, do nothing
            if (ref.contains(eventTarget) || eventTarget.contains(ref)) {
                return;
            }

            closeDropdown();
        };

        document.addEventListener('focusin', handleGlobalFocusIn);
        document.addEventListener('mousedown', handleGlobalMouseDown);
        document.addEventListener('mouseup', handleGlobalMouseUp);

        if (ownerDocument !== document) {
            ownerDocument.addEventListener('focusin', handleGlobalFocusIn);
            ownerDocument.addEventListener('mousedown', handleGlobalMouseDown);
            ownerDocument.addEventListener('mouseup', handleGlobalMouseUp);
        }

        // If dropdown should be open on mount, focus it
        if (isOpenOnMount) {
            ref.focus();
        }

        const handleInput = (event: Event) => {
            if (!isOpenRef.current) setIsOpen(true);

            const input = event.target as HTMLInputElement;
            const isDeleting = enteredCharactersRef.current.length > input.value.length;
            enteredCharactersRef.current = input.value;
            // When deleting text, if there’s already an active item and
            // input isn’t empty, preserve the active item, else update it
            if (isDeleting && input.value.length && getActiveItemElement(ref)) {
                return;
            }

            setActiveItem({
                dropdownElement: ref,
                event,
                // If props.allowCreate, only override the input’s value with an
                // exact text match so user can enter a value not in items
                isExactMatch: allowCreateRef.current,
                onActiveItem,
                text: enteredCharactersRef.current,
            });
        };

        if (inputElement) {
            inputElement.addEventListener('input', handleInput);
        }

        return () => {
            document.removeEventListener('focusin', handleGlobalFocusIn);
            document.removeEventListener('mousedown', handleGlobalMouseDown);
            document.removeEventListener('mouseup', handleGlobalMouseUp);

            if (ownerDocument !== document) {
                ownerDocument.removeEventListener('focusin', handleGlobalFocusIn);
                ownerDocument.removeEventListener('mousedown', handleGlobalMouseDown);
                ownerDocument.removeEventListener('mouseup', handleGlobalMouseUp);
            }

            if (inputElement) {
                inputElement.removeEventListener('input', handleInput);
            }
        };
    };

    if (!isValidElement(trigger)) {
        if (isSearchable) {
            trigger = (
                <input
                    autoComplete="off"
                    className={TRIGGER_CLASS_NAME}
                    defaultValue={value ?? ''}
                    disabled={disabled}
                    name={name}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    ref={inputElementRef}
                    tabIndex={tabIndex}
                    type="text"
                />
            );
        } else {
            trigger = (
                <button className={TRIGGER_CLASS_NAME} tabIndex={0} type="button">
                    {trigger}
                </button>
            );
        }
    }

    if (label) {
        trigger = (
            <label className={LABEL_CLASS_NAME}>
                <div className={LABEL_TEXT_CLASS_NAME}>{label}</div>
                {trigger}
            </label>
        );
    }

    const dropdownRect = useBoundingClientRect(dropdownElement);
    const dropdownBodyRect = useBoundingClientRect(dropdownBodyElement);
    const boundingElement = getBoundingAncestor(dropdownBodyElement);
    const boundingElementRect = useBoundingClientRect(boundingElement);
    let maxHeight;
    if (
        dropdownBodyRect.top != null &&
        dropdownRect.top != null &&
        boundingElementRect.top != null
    ) {
        const maxHeightUp = dropdownBodyRect.bottom - boundingElementRect.top;
        const maxHeightDown = boundingElementRect.bottom - dropdownBodyRect.top;
        maxHeight = Math.round(
            dropdownBodyRect.top > dropdownRect.top ? maxHeightDown : maxHeightUp,
        );
    }

    const style = {
        ...styleFromProps,
        ...(maxHeight != null && maxHeight > minHeightBody
            ? { [BODY_MAX_HEIGHT_VAR]: `calc(${maxHeight}px - var(--uktdd-body-buffer))` }
            : null),
    };

    return (
        <Fragment>
            <Style href="@acusti/dropdown/Dropdown">{STYLES}</Style>
            <div
                className={clsx(ROOT_CLASS_NAME, className, {
                    disabled,
                    'is-open': isOpen,
                    'is-searchable': isSearchable,
                })}
                onClick={onClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseOut={handleMouseOut}
                onMouseOver={handleMouseOver}
                onMouseUp={handleMouseUp}
                ref={handleRef}
                style={style}
            >
                {trigger}
                {/* TODO next version of Dropdown should use <Activity> for body https://react.dev/reference/react/Activity */}
                {isOpen ? (
                    <div className={BODY_CLASS_NAME} ref={setDropdownBodyElement}>
                        {childrenCount > 1 ? (children as ChildrenTuple)[1] : children}
                    </div>
                ) : null}
            </div>
        </Fragment>
    );
}

function getBoundingAncestor(element?: MaybeHTMLElement): MaybeHTMLElement {
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
}

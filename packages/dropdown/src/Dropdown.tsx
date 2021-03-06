import InputText from '@acusti/input-text';
import { Style } from '@acusti/styling';
import useIsOutOfBounds from '@acusti/use-is-out-of-bounds';
import classnames from 'classnames';
import * as React from 'react';

import {
    BODY_CLASS_NAME,
    BODY_SELECTOR,
    LABEL_CLASS_NAME,
    LABEL_TEXT_CLASS_NAME,
    ROOT_CLASS_NAME,
    STYLES,
    TRIGGER_CLASS_NAME,
} from './styles.js';
import {
    getActiveItemElement,
    getItemElements,
    ITEM_SELECTOR,
    KEY_EVENT_ELEMENTS,
    setActiveItem,
} from './helpers.js';

export type Item = { element: HTMLElement | null; value: string };

export type Props = {
    /** Boolean indicating if the user can submit an empty value (i.e. clear the value); defaults to true */
    allowEmpty?: boolean;
    /** Can take a single React element (e.g. ReactChild) or exactly two renderable children */
    children: React.ReactChild | [React.ReactNode, React.ReactNode];
    className?: string;
    disabled?: boolean;
    /** Group identifier string links dropdowns together into a menu (like macOS top menubar) */
    group?: string;
    hasItems?: boolean;
    isOpenOnMount?: boolean;
    isSearchable?: boolean;
    label?: string;
    onSubmitItem?: (payload: Item) => void;
    /** Only usable in conjunction with {isSearchable: true}; used as search input’s placeholder */
    placeholder?: string;
    /** Only usable in conjunction with {isSearchable: true}; used as search input’s tabIndex */
    tabIndex?: number;
    /**
     * Used as search input’s value if props.isSearchable === true
     * Resets internal currentItemRef if it no longer matches value to keep state in sync
     */
    value?: string;
};

type MousePosition = { clientX: number; clientY: number };

const { Children, Fragment, useCallback, useLayoutEffect, useRef, useState } = React;

const CHILDREN_ERROR =
    '@acusti/dropdown requires either 1 child (the dropdown body) or 2 children: the dropdown trigger and the dropdown body.';

const Dropdown: React.FC<Props> = ({
    allowEmpty = true,
    children,
    className,
    disabled,
    hasItems = true,
    isOpenOnMount,
    isSearchable,
    label,
    onSubmitItem,
    placeholder,
    tabIndex,
    value,
}) => {
    const childrenCount = Children.count(children);
    if (childrenCount !== 1 && childrenCount !== 2) {
        if (childrenCount === 0) {
            throw new Error(CHILDREN_ERROR + ' Received no children.');
        }
        console.error(`${CHILDREN_ERROR} Received ${childrenCount} children.`);
    }

    let trigger = childrenCount > 1 ? children[0] : null;
    const isTriggerFromProps = React.isValidElement(trigger);
    const [isOpen, setIsOpen] = useState<boolean>(isOpenOnMount || false);
    const [isOpening, setIsOpening] = useState<boolean>(!isOpenOnMount);
    const [dropdownBodyElement, setDropdownBodyElement] = useState<HTMLDivElement | null>(
        null,
    );

    const dropdownElementRef = useRef<HTMLDivElement | null>(null);
    const inputElementRef = useRef<HTMLInputElement | null>(null);
    const closingTimerRef = useRef<number | null>(null);
    const isOpeningTimerRef = useRef<number | null>(null);
    const currentInputMethodRef = useRef<'mouse' | 'keyboard'>('mouse');
    const clearEnteredCharactersTimerRef = useRef<number | null>(null);
    const enteredCharactersRef = useRef<string>('');
    const mouseDownPositionRef = useRef<MousePosition | null>(null);
    const currentItemRef = useRef<Item | null>(null);
    const outOfBounds = useIsOutOfBounds(dropdownBodyElement);

    const allowEmptyRef = useRef(allowEmpty);
    const hasItemsRef = useRef(hasItems);
    const isOpenRef = useRef(isOpen);
    const isOpeningRef = useRef(isOpening);
    const isTriggerFromPropsRef = useRef(isOpening);
    const onSubmitItemRef = useRef(onSubmitItem);
    const valueRef = useRef(value);

    useLayoutEffect(() => {
        allowEmptyRef.current = allowEmpty;
        hasItemsRef.current = hasItems;
        isOpenRef.current = isOpen;
        isOpeningRef.current = isOpening;
        isTriggerFromPropsRef.current = isTriggerFromProps;
        onSubmitItemRef.current = onSubmitItem;
        valueRef.current = value;
    }, [
        allowEmpty,
        hasItems,
        isOpen,
        isOpening,
        isTriggerFromProps,
        onSubmitItem,
        value,
    ]);

    const closeDropdown = useCallback(() => {
        setIsOpen(false);
        setIsOpening(false);
        mouseDownPositionRef.current = null;
        if (closingTimerRef.current) {
            clearTimeout(closingTimerRef.current);
            closingTimerRef.current = null;
        }
    }, []);

    const handleSubmitItem = useCallback(() => {
        if (isOpenRef.current) {
            // A short timeout before closing is better UX when user selects an item so dropdown
            // doesn’t close before expected. It also enables using <Link />s in the dropdown body.
            closingTimerRef.current = setTimeout(closeDropdown, 90);
        }

        if (!hasItemsRef.current) return;

        const nextElement = getActiveItemElement(dropdownElementRef.current);
        if (!nextElement) {
            // If not allowEmpty, don’t allow submitting an empty item
            if (!allowEmptyRef.current) return;
            // If we have an input element as trigger & the user didn’t clear the text, do nothing
            if (inputElementRef.current?.value) return;
        }

        const label = nextElement?.innerText || '';
        const nextValue = nextElement?.dataset.uktValue || label;
        const nextItem = { element: nextElement, value: nextValue };
        if (inputElementRef.current) {
            inputElementRef.current.value = label;
            if (
                inputElementRef.current ===
                inputElementRef.current.ownerDocument.activeElement
            ) {
                inputElementRef.current.blur();
            }
        }

        let currentValue = valueRef.current;
        if (typeof currentValue !== 'string' && currentItemRef.current) {
            currentValue = currentItemRef.current.value;
        }
        if (currentValue === nextValue) return;

        currentItemRef.current = nextItem;
        if (onSubmitItemRef.current) {
            onSubmitItemRef.current(nextItem);
        }
    }, [closeDropdown]);

    const handleMouseMove = useCallback(
        ({ clientX, clientY }: React.MouseEvent<HTMLElement>) => {
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
        },
        [],
    );

    const handleMouseOver = useCallback((event: React.MouseEvent<HTMLElement>) => {
        if (!hasItemsRef.current) return;

        // If user isn’t currently using the mouse to navigate the dropdown, do nothing
        if (currentInputMethodRef.current !== 'mouse') return;

        // Ensure we have the dropdown root HTMLElement
        const dropdownElement = dropdownElementRef.current;
        if (!dropdownElement) return;

        const itemElements = getItemElements(dropdownElement);
        if (!itemElements) return;

        const eventTarget = event.target as HTMLElement;
        const item = eventTarget.closest(ITEM_SELECTOR) as HTMLElement | null;
        const element = item || eventTarget;
        for (let index = 0; index < itemElements.length; index++) {
            if (itemElements[index] === element) {
                setActiveItem({
                    dropdownElement,
                    element,
                });
                return;
            }
        }
    }, []);

    const handleRef = useCallback(
        (ref: HTMLDivElement | null) => {
            dropdownElementRef.current = ref;
            if (!ref) return;

            const { ownerDocument } = ref;
            let inputElement = inputElementRef.current;
            // Check if trigger from props is an input or textarea element
            if (isTriggerFromProps && !inputElement && ref.firstElementChild) {
                inputElement = ref.firstElementChild.querySelector(
                    'input:not([type=radio]):not([type=checkbox]):not([type=range]),textarea',
                );
                inputElementRef.current = inputElement;
            }

            const handleMouseDown = ({ clientX, clientY, target }: MouseEvent) => {
                const eventTarget = target as HTMLElement;
                if (
                    dropdownElementRef.current &&
                    !dropdownElementRef.current.contains(eventTarget)
                ) {
                    // Close dropdown on an outside click
                    closeDropdown();
                    return;
                }

                if (isOpenRef.current) return;

                setIsOpen(true);
                setIsOpening(true);
                mouseDownPositionRef.current = { clientX, clientY };
                isOpeningTimerRef.current = setTimeout(() => {
                    setIsOpening(false);
                    isOpeningTimerRef.current = null;
                }, 1000);
            };

            const handleMouseUp = ({ target }: MouseEvent) => {
                if (!isOpenRef.current || closingTimerRef.current) return;

                // If still isOpening (gets set false 1s after open triggers), set it to false onMouseUp
                if (isOpeningRef.current) {
                    setIsOpening(false);
                    if (isOpeningTimerRef.current) {
                        clearTimeout(isOpeningTimerRef.current);
                        isOpeningTimerRef.current = null;
                    }
                    return;
                }

                const isTargetInBody = (target as HTMLElement).closest(BODY_SELECTOR);

                // If mouseup is on dropdown body and there are no items, don’t close the dropdown
                if (!hasItemsRef.current && isTargetInBody) return;

                // If mouseup is on an item, trigger submit item, else close the dropdown
                if (isTargetInBody) {
                    handleSubmitItem();
                } else if (
                    !inputElementRef.current ||
                    (dropdownElementRef.current &&
                        dropdownElementRef.current.contains(ownerDocument.activeElement))
                ) {
                    // If dropdown is searchable and ref is still focused, this won’t be invoked
                    closeDropdown();
                }
            };

            const handleKeyDown = (event: KeyboardEvent) => {
                const { altKey, ctrlKey, key, metaKey } = event;
                const eventTarget = event.target as HTMLElement;
                const dropdownElement = dropdownElementRef.current;
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
                    // Open the dropdown on spacebar, enter, or if isSearchable and user hits the up/down arrows
                    if (
                        key === ' ' ||
                        key === 'Enter' ||
                        (hasItemsRef.current &&
                            (key === 'ArrowUp' || key === 'ArrowDown'))
                    ) {
                        onEventHandled();
                        setIsOpen(true);
                        return;
                    }

                    return;
                }

                // If dropdown isOpen, hasItems, and not isSearchable, handle entering characters
                if (hasItemsRef.current && !inputElementRef.current) {
                    let isEditingCharacters =
                        !ctrlKey && !metaKey && /^[A-Za-z0-9]$/.test(key);
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
                            // If input element came from props, only override the input’s value
                            // with an exact text match so user can enter a value not in items
                            isExactMatch: isTriggerFromPropsRef.current,
                            text: enteredCharactersRef.current,
                        });

                        if (clearEnteredCharactersTimerRef.current) {
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
                    handleSubmitItem();
                    return;
                }
                // If dropdown isOpen, handle closing it on escape or spacebar if !hasItems
                if (
                    key === 'Escape' ||
                    (isEventTargetingDropdown && key === ' ' && !hasItemsRef.current)
                ) {
                    // If there are no items & event target element uses key events, don’t close it
                    if (
                        !hasItemsRef.current &&
                        (eventTarget.isContentEditable ||
                            KEY_EVENT_ELEMENTS.has(eventTarget.tagName))
                    ) {
                        return;
                    }
                    closeDropdown();
                    return;
                }
                // Handle ↑/↓ arrows
                if (hasItemsRef.current) {
                    if (key === 'ArrowUp') {
                        onEventHandled();
                        if (altKey || metaKey) {
                            setActiveItem({
                                dropdownElement,
                                index: 0,
                            });
                        } else {
                            setActiveItem({
                                dropdownElement,
                                indexAddend: -1,
                            });
                        }
                        return;
                    }
                    if (key === 'ArrowDown') {
                        onEventHandled();
                        if (altKey || metaKey) {
                            // Using a negative index counts back from the end
                            setActiveItem({
                                dropdownElement,
                                index: -1,
                            });
                        } else {
                            setActiveItem({
                                dropdownElement,
                                indexAddend: 1,
                            });
                        }
                        return;
                    }
                }
            };

            // Close dropdown if any element is focused outside of this dropdown
            const handleFocusIn = (event: Event) => {
                if (!isOpenRef.current) return;

                const eventTarget = event.target as HTMLElement;
                // If focused element is a descendant or a parent of the dropdown, do nothing
                if (
                    !dropdownElementRef.current ||
                    dropdownElementRef.current.contains(eventTarget) ||
                    eventTarget.contains(dropdownElementRef.current)
                ) {
                    return;
                }

                closeDropdown();
            };

            document.addEventListener('focusin', handleFocusIn);
            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('mousedown', handleMouseDown);
            document.addEventListener('mouseup', handleMouseUp);

            if (ownerDocument !== document) {
                ownerDocument.addEventListener('focusin', handleFocusIn);
                ownerDocument.addEventListener('keydown', handleKeyDown);
                ownerDocument.addEventListener('mousedown', handleMouseDown);
                ownerDocument.addEventListener('mouseup', handleMouseUp);
            }

            // If dropdown should be open on mount, focus it
            if (isOpenOnMount) {
                ref.focus();
            }

            const handleInput = (event: Event) => {
                const dropdownElement = dropdownElementRef.current;
                if (!dropdownElement) return;

                if (!isOpenRef.current) setIsOpen(true);

                const input = event.target as HTMLInputElement;
                const isDeleting =
                    enteredCharactersRef.current.length > input.value.length;
                enteredCharactersRef.current = input.value;
                // Don’t set a new active item if user is deleting text unless text is now empty
                if (isDeleting && input.value.length) return;

                setActiveItem({
                    dropdownElement,
                    // If input element came from props, only override the input’s value
                    // with an exact text match so user can enter a value not in items
                    isExactMatch: isTriggerFromPropsRef.current,
                    text: enteredCharactersRef.current,
                });
            };

            if (inputElement) {
                inputElement.addEventListener('input', handleInput);
            }

            return () => {
                document.removeEventListener('focusin', handleFocusIn);
                document.removeEventListener('keydown', handleKeyDown);
                document.removeEventListener('mousedown', handleMouseDown);
                document.removeEventListener('mouseup', handleMouseUp);
                if (ownerDocument !== document) {
                    ownerDocument.removeEventListener('focusin', handleFocusIn);
                    ownerDocument.removeEventListener('keydown', handleKeyDown);
                    ownerDocument.removeEventListener('mousedown', handleMouseDown);
                    ownerDocument.removeEventListener('mouseup', handleMouseUp);
                }

                if (inputElement) {
                    inputElement.removeEventListener('input', handleInput);
                }
            };
        },
        [closeDropdown, handleSubmitItem, isOpenOnMount, isTriggerFromProps],
    );

    const handleTriggerFocus = useCallback(() => {
        setIsOpen(true);
    }, []);

    if (!isTriggerFromProps) {
        if (isSearchable) {
            trigger = (
                <InputText
                    className={TRIGGER_CLASS_NAME}
                    disabled={disabled}
                    initialValue={value || ''}
                    onFocus={handleTriggerFocus}
                    placeholder={placeholder}
                    ref={inputElementRef}
                    tabIndex={tabIndex}
                    type="text"
                />
            );
        } else {
            trigger = (
                <button className={TRIGGER_CLASS_NAME} tabIndex={0}>
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

    return (
        <Fragment>
            <Style>{STYLES}</Style>
            <div
                className={classnames(ROOT_CLASS_NAME, className, {
                    disabled,
                    'is-open': isOpen,
                    'is-searchable': isSearchable,
                })}
                onMouseMove={handleMouseMove}
                onMouseOver={handleMouseOver}
                ref={handleRef}
                tabIndex={
                    isSearchable || inputElementRef.current || !isTriggerFromProps
                        ? undefined
                        : 0
                }
            >
                {trigger}
                {isOpen ? (
                    <div
                        className={classnames(BODY_CLASS_NAME, {
                            'calculating-position': !outOfBounds.hasLayout,
                            'has-items': hasItems,
                            'out-of-bounds-bottom': outOfBounds.bottom,
                            'out-of-bounds-left': outOfBounds.left,
                            'out-of-bounds-right': outOfBounds.right,
                            'out-of-bounds-top': outOfBounds.top,
                        })}
                        ref={setDropdownBodyElement}
                    >
                        {children[1] || children[0] || children}
                    </div>
                ) : null}
            </div>
        </Fragment>
    );
};

export default Dropdown;

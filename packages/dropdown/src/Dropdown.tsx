import InputText from '@acusti/input-text';
import { Style } from '@acusti/styling';
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

type Item = { element: HTMLElement; value: string };

export type Props = {
    /** Can take a single React element (e.g. ReactChild) or exactly two renderable children */
    children: React.ReactChild | [React.ReactNode, React.ReactNode];
    className?: string;
    /** Group identifier string links dropdowns together into a menu (like macOS top menubar) */
    group?: string;
    hasItems?: boolean;
    isOpenOnMount?: boolean;
    isSearchable?: boolean;
    label?: string;
    onSubmitItem?: (payload: Item) => void;
    placeholder?: string;
    /** Only usable in conjunction with {isSearchable: true}; used as search input’s value */
    value?: string;
};

type MousePosition = { clientX: number; clientY: number };

const { Children, Fragment, useCallback, useRef, useState } = React;

const CHILDREN_ERROR =
    '@acusti/dropdown requires props.children to contain either one element, the dropdown body, or two elements: the dropdown trigger and the dropdown body. Received %s elements.';

const Dropdown: React.FC<Props> = ({
    children,
    className,
    hasItems = true,
    isOpenOnMount,
    isSearchable,
    label,
    onSubmitItem,
    placeholder,
    value,
}) => {
    const childrenCount = Children.count(children);
    if (childrenCount !== 1 && childrenCount !== 2) {
        if (childrenCount === 0) {
            throw new Error(CHILDREN_ERROR.replace('%s', childrenCount.toString()));
        }
        console.error(CHILDREN_ERROR, childrenCount);
    }

    const [isOpen, setIsOpen] = useState<boolean>(isOpenOnMount || false);
    const [isOpening, setIsOpening] = useState<boolean>(!isOpenOnMount);

    const dropdownElementRef = useRef<HTMLElement | null>(null);
    const inputElementRef = useRef<HTMLInputElement | null>(null);
    const closingTimerRef = useRef<number | null>(null);
    const isOpeningTimerRef = useRef<number | null>(null);
    const currentInputMethodRef = useRef<'mouse' | 'keyboard'>('mouse');
    const clearEnteredCharactersTimerRef = useRef<number | null>(null);
    const enteredCharactersRef = useRef<string>('');
    const mouseDownPositionRef = useRef<MousePosition | null>(null);
    const currentItemRef = useRef<Item | null>(null);

    const isOpenRef = useRef(isOpen);
    isOpenRef.current = isOpen;
    const hasItemsRef = useRef(hasItems);
    hasItemsRef.current = hasItems;
    const isSearchableRef = useRef(isSearchable);
    isSearchableRef.current = isSearchable;
    const onSubmitItemRef = useRef(onSubmitItem);
    onSubmitItemRef.current = onSubmitItem;

    const closeDropdown = useCallback(() => {
        setIsOpen(false);
        setIsOpening(false);
        mouseDownPositionRef.current = null;
        if (closingTimerRef.current) {
            clearTimeout(closingTimerRef.current);
            closingTimerRef.current = null;
        }
    }, []);

    const openDropdown = useCallback(() => {
        setIsOpen(true);
    }, []);

    const handleSubmitItem = useCallback(() => {
        const nextElement = getActiveItemElement(dropdownElementRef.current);
        if (!nextElement) return;

        const label = nextElement.innerText;
        const nextValue = nextElement.dataset.uktValue || label;
        const nextItem = { element: nextElement, value: nextValue };
        if (inputElementRef.current) {
            inputElementRef.current.value = label;
        }

        if (currentItemRef.current?.value === nextValue) return;

        currentItemRef.current = nextItem;
        if (onSubmitItemRef.current) {
            onSubmitItemRef.current(nextItem);
        }

        if (isOpenRef.current) closeDropdown();
    }, [closeDropdown]);

    const handleMouseDown = useCallback(
        ({ clientX, clientY }: React.MouseEvent<HTMLElement>) => {
            if (isOpen) return;

            openDropdown();
            setIsOpening(true);
            mouseDownPositionRef.current = { clientX, clientY };
            isOpeningTimerRef.current = setTimeout(() => {
                setIsOpening(false);
                isOpeningTimerRef.current = null;
            }, 1000);
        },
        [isOpen, openDropdown],
    );

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

    const handleMouseOver = useCallback(
        (event: React.MouseEvent<HTMLElement>) => {
            if (!hasItems) return;
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
        },
        [hasItems],
    );

    const handleMouseUp = useCallback(
        ({ target }: React.MouseEvent<HTMLElement>) => {
            if (!isOpen || closingTimerRef.current) return;
            // If still isOpening (gets set false 1s after open triggers), set it to false onMouseUp
            if (isOpening) {
                setIsOpening(false);
                if (isOpeningTimerRef.current) {
                    clearTimeout(isOpeningTimerRef.current);
                    isOpeningTimerRef.current = null;
                }
                return;
            }
            // If mouseup is on dropdown body and there are no items, don’t close the dropdown
            const targetElement = target as HTMLElement;
            if (!hasItems && targetElement.closest(BODY_SELECTOR)) {
                return;
            }
            // A short timeout before closing is better UX when user selects an item so that dropdown
            // doesn’t close before expected. It also enables using <Link />s in the dropdown body.
            closingTimerRef.current = setTimeout(handleSubmitItem, 90);
        },
        [handleSubmitItem, hasItems, isOpen, isOpening],
    );

    const handleRef = useCallback(
        (ref: HTMLElement | null) => {
            dropdownElementRef.current = ref;
            if (!ref) return;

            const handleMouseDown = (event: MouseEvent) => {
                if (!ref) return;

                const eventTarget = event.target as HTMLElement;
                if (ref.contains(eventTarget)) return;

                // Close dropdown on an outside click
                closeDropdown();
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
                        openDropdown();
                        return;
                    }

                    return;
                }

                // If dropdown isOpen, hasItems, and not isSearchable, handle entering characters
                if (hasItemsRef.current && !isSearchableRef.current) {
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
                if (key === 'Enter' || (key === ' ' && !isSearchableRef.current)) {
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

            const { ownerDocument } = ref;
            document.addEventListener('mousedown', handleMouseDown);
            document.addEventListener('keydown', handleKeyDown);
            if (ownerDocument !== document) {
                ownerDocument.addEventListener('mousedown', handleMouseDown);
                ownerDocument.addEventListener('keydown', handleKeyDown);
            }
            // If dropdown should be open on mount, focus it
            if (isOpenOnMount) {
                ref.focus();
            }

            return () => {
                document.removeEventListener('mousedown', handleMouseDown);
                document.removeEventListener('keydown', handleKeyDown);
                if (ownerDocument !== document) {
                    ownerDocument.removeEventListener('mousedown', handleMouseDown);
                    ownerDocument.removeEventListener('keydown', handleKeyDown);
                }
            };
        },
        [closeDropdown, handleSubmitItem, isOpenOnMount, openDropdown],
    );

    const handleChange = useCallback(
        (event: React.ChangeEvent<HTMLElement>) => {
            const dropdownElement = dropdownElementRef.current;
            if (!dropdownElement) return;

            if (!isOpen) openDropdown();

            const input = event.target as HTMLInputElement;
            enteredCharactersRef.current = input.value;
            setActiveItem({
                dropdownElement,
                text: enteredCharactersRef.current,
            });
        },
        [isOpen, openDropdown],
    );

    let trigger = childrenCount > 1 ? children[0] : null;
    const isTriggerFromProps = React.isValidElement(trigger);
    if (!isTriggerFromProps) {
        if (isSearchable) {
            trigger = (
                <InputText
                    className={TRIGGER_CLASS_NAME}
                    initialValue={value || ''}
                    onChange={handleChange}
                    onFocus={openDropdown}
                    placeholder={placeholder}
                    ref={inputElementRef}
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
                    'is-open': isOpen,
                    'is-searchable': isSearchable,
                })}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseOver={handleMouseOver}
                onMouseUp={handleMouseUp}
                ref={handleRef}
                tabIndex={isSearchable || !isTriggerFromProps ? undefined : 0}
            >
                {trigger}
                {isOpen ? (
                    <div
                        className={classnames(BODY_CLASS_NAME, {
                            'has-items': hasItems,
                        })}
                    >
                        {children[1] || children[0] || children}
                    </div>
                ) : null}
            </div>
        </Fragment>
    );
};

export default Dropdown;

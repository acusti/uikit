import InputText from '@acusti/input-text';
import { getBestMatch } from '@acusti/matchmaking';
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
} from './dropdown-styles.js';

export type Props = {
    /** Can take a single React element (e.g. ReactChild) or exactly two renderable children */
    children: React.ReactChild | [React.ReactNode, React.ReactNode];
    className?: string;
    hasItems?: boolean;
    isOpenOnMount?: boolean;
    isSearchable?: boolean;
    label?: string;
    onSubmitItem?: (payload: {
        element: HTMLElement | null;
        index: number;
        value: string;
    }) => void;
    placeholder?: string;
};

type Item = { label: string; value: string };

const { Children, Fragment, useCallback, useRef, useState } = React;

const CHILDREN_ERROR =
    '@acusti/dropdown requires props.children to contain either one element, the dropdown body, or two elements: the dropdown trigger and the dropdown body. Received %s elements.';

const KEY_EVENT_ELEMENTS = new Set(['INPUT', 'TEXTAREA']);

const ITEM_SELECTOR = '[data-ukt-item], [data-ukt-value]';

const Dropdown: React.FC<Props> = ({
    children,
    className,
    hasItems = true,
    isOpenOnMount,
    isSearchable,
    label,
    onSubmitItem,
    placeholder,
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
    const [currentItem, setCurrentItem] = useState<Item | null>(null);
    const [dropdownBodyItems, setDropdownBodyItems] = useState<Array<HTMLElement> | null>(
        null,
    );
    const dropdownBodyItemsCount = dropdownBodyItems ? dropdownBodyItems.length : 0;

    const dropdownElementRef = useRef<HTMLElement | null>(null);
    const inputElementRef = useRef<HTMLInputElement | null>(null);
    const closingTimerRef = useRef<number | null>(null);
    const isOpeningTimerRef = useRef<number | null>(null);
    const currentInputMethodRef = useRef<'mouse' | 'keyboard'>('mouse');
    const clearEnteredCharactersTimerRef = useRef<number | null>(null);
    const mouseDownPositionRef = useRef<{ clientX: number; clientY: number } | null>(
        null,
    );
    const enteredCharactersRef = useRef<string>('');

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

    const getCurrentActiveIndex = useCallback(
        () =>
            dropdownBodyItems
                ? dropdownBodyItems.findIndex((dropdownBodyItem) =>
                      dropdownBodyItem.hasAttribute('data-ukt-active'),
                  )
                : -1,
        [dropdownBodyItems],
    );

    const setActiveItem = useCallback(
        ({
            element,
            index,
            indexAddend,
            text,
        }:
            | { element: HTMLElement; index?: null; indexAddend?: null; text?: null }
            | { element?: null; index: number; indexAddend?: null; text?: null }
            | { element?: null; index?: null; indexAddend: number; text?: null }
            | { element?: null; index?: null; indexAddend?: null; text: string }) => {
            if (!dropdownBodyItems || !dropdownBodyItemsCount) return;

            const lastIndex = dropdownBodyItemsCount - 1;
            const currentActiveIndex = getCurrentActiveIndex();

            let nextActiveIndex = typeof index === 'number' ? index : currentActiveIndex;

            if (element) {
                nextActiveIndex = dropdownBodyItems.findIndex(
                    (dropdownBodyItem) => dropdownBodyItem === element,
                );
            } else if (typeof indexAddend === 'number') {
                // If there’s no currentActiveIndex and we are handling -1, start at lastIndex
                if (currentActiveIndex === -1 && indexAddend === -1) {
                    nextActiveIndex = lastIndex;
                } else {
                    nextActiveIndex += indexAddend;
                }
                // Keep it within the bounds of the items list
                if (nextActiveIndex < 0) {
                    nextActiveIndex = 0;
                } else if (nextActiveIndex > lastIndex) {
                    nextActiveIndex = lastIndex;
                }
            } else if (typeof text === 'string') {
                const itemTexts = dropdownBodyItems.map(
                    (dropdownBodyItem) => dropdownBodyItem.innerText,
                );
                const bestMatch = getBestMatch({ items: itemTexts, text });
                nextActiveIndex = itemTexts.findIndex((text) => text === bestMatch);
            }

            if (nextActiveIndex === -1 || nextActiveIndex === currentActiveIndex) return;

            // Clear any existing active dropdown body item state
            dropdownBodyItems.forEach((dropdownBodyItem, index) => {
                if (index === nextActiveIndex) return;
                if (!dropdownBodyItem.hasAttribute('data-ukt-active')) return;

                delete dropdownBodyItem.dataset.uktActive;
            });

            const nextActiveItem = dropdownBodyItems[nextActiveIndex];
            if (nextActiveItem) {
                nextActiveItem.setAttribute('data-ukt-active', '');
                // Find closest scrollable parent and ensure that next active item is visible
                let { parentElement } = nextActiveItem;
                let scrollableParent = null;
                while (
                    !scrollableParent &&
                    parentElement &&
                    parentElement !== dropdownElementRef.current
                ) {
                    const isScrollable =
                        parentElement.scrollHeight > parentElement.clientHeight + 15;
                    if (isScrollable) {
                        scrollableParent = parentElement;
                    } else {
                        parentElement = parentElement.parentElement;
                    }
                }

                if (scrollableParent) {
                    const parentRect = scrollableParent.getBoundingClientRect();
                    const itemRect = nextActiveItem.getBoundingClientRect();
                    const isAboveTop = itemRect.top < parentRect.top;
                    const isBelowBottom = itemRect.bottom > parentRect.bottom;
                    if (isAboveTop || isBelowBottom) {
                        let { scrollTop } = scrollableParent;
                        // Item isn’t fully visible; adjust scrollTop to put item within closest edge
                        if (isAboveTop) {
                            scrollTop -= parentRect.top - itemRect.top;
                        } else {
                            scrollTop += itemRect.bottom - parentRect.bottom;
                        }
                        scrollableParent.scrollTop = scrollTop;
                    }
                }
            }
        },
        [dropdownBodyItems, dropdownBodyItemsCount, getCurrentActiveIndex],
    );

    const handleSubmitItem = useCallback(() => {
        if (isOpen) closeDropdown();
        if (!dropdownBodyItems) return;

        let label = '';
        let value = '';
        const index = getCurrentActiveIndex();
        const element = dropdownBodyItems[index] || null;
        if (element) {
            label = element.innerText;
            value = element.dataset.uktValue || label;
            if (inputElementRef.current) {
                inputElementRef.current.value = label;
            }
        }

        if (currentItem?.value === value) return;

        setCurrentItem({ label, value });
        if (!onSubmitItem) return;

        onSubmitItem({ element, index, value });
    }, [currentItem, dropdownBodyItems, getCurrentActiveIndex, isOpen, onSubmitItem]);

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLElement>) => {
            const { altKey, ctrlKey, key, metaKey } = event;
            const eventTarget = event.target as HTMLElement;

            const onEventHandled = () => {
                event.stopPropagation();
                event.preventDefault();
                currentInputMethodRef.current = 'keyboard';
            };

            let isEditingCharacters = !ctrlKey && !metaKey && /^[A-Za-z0-9]$/.test(key);
            // User could also be editing characters if there are already characters entered
            // and they are hitting delete or spacebar
            if (!isEditingCharacters && enteredCharactersRef.current) {
                isEditingCharacters = key === ' ' || key === 'Backspace';
            }

            if (isEditingCharacters && hasItems && !isSearchable) {
                onEventHandled();
                if (key === 'Backspace') {
                    enteredCharactersRef.current = enteredCharactersRef.current.slice(
                        0,
                        -1,
                    );
                } else {
                    enteredCharactersRef.current += key;
                }

                setActiveItem({ text: enteredCharactersRef.current });

                if (clearEnteredCharactersTimerRef.current) {
                    clearTimeout(clearEnteredCharactersTimerRef.current);
                }

                clearEnteredCharactersTimerRef.current = setTimeout(() => {
                    enteredCharactersRef.current = '';
                    clearEnteredCharactersTimerRef.current = null;
                }, 1500);

                return;
            }

            switch (key) {
                case 'Escape':
                    if (!isOpen) return;
                    // If there are no items & event target element uses key events, don’t close it
                    if (!hasItems) {
                        if (
                            eventTarget.isContentEditable ||
                            KEY_EVENT_ELEMENTS.has(eventTarget.tagName)
                        ) {
                            return;
                        }
                    }

                    onEventHandled();
                    closeDropdown();
                    return;
                case ' ':
                case 'Enter':
                    // Only treat spacebar as toggle and select if no search input
                    if (key === ' ' && isSearchable) return;
                    // Do not close dropdown on spacebar or enter if there are no items
                    if (isOpen && !hasItems) return;

                    onEventHandled();
                    if (isOpen) {
                        if (hasItems) {
                            handleSubmitItem();
                        } else if (key === ' ') {
                            closeDropdown();
                        }
                    } else {
                        openDropdown();
                    }
                    return;
                case 'ArrowUp':
                    if (!hasItems) return;

                    onEventHandled();
                    if (altKey || metaKey) {
                        setActiveItem({ index: 0 });
                    } else {
                        setActiveItem({ indexAddend: -1 });
                    }
                    return;
                case 'ArrowDown':
                    if (!hasItems) return;

                    onEventHandled();
                    if (altKey || metaKey) {
                        setActiveItem({ index: dropdownBodyItemsCount - 1 });
                    } else {
                        setActiveItem({ indexAddend: 1 });
                    }
                    return;
            }
        },
        [
            closeDropdown,
            dropdownBodyItemsCount,
            handleSubmitItem,
            hasItems,
            isOpen,
            isSearchable,
            setActiveItem,
        ],
    );

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
        [isOpen],
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
        ({ target }: React.MouseEvent<HTMLElement>) => {
            if (!dropdownBodyItems) return;
            // If user isn’t currently using the mouse to navigate the dropdown, do nothing
            if (currentInputMethodRef.current !== 'mouse') return;

            const element = target as HTMLElement;
            if (dropdownBodyItems.includes(element)) {
                setActiveItem({ element });
            }
        },
        [dropdownBodyItems, setActiveItem],
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

            const { ownerDocument } = ref;
            document.addEventListener('mousedown', handleMouseDown);
            if (ownerDocument !== document) {
                ownerDocument.addEventListener('mousedown', handleMouseDown);
            }
            // If dropdown should be open on mount, focus it
            if (isOpenOnMount) {
                ref.focus();
            }

            return () => {
                document.removeEventListener('mousedown', handleMouseDown);
                if (ownerDocument !== document) {
                    ownerDocument.removeEventListener('mousedown', handleMouseDown);
                }
            };
        },
        [closeDropdown],
    );

    const handleBodyRef = useCallback(
        (ref: HTMLElement | null) => {
            if (!ref || !hasItems) {
                setDropdownBodyItems(null);
                return;
            }
            // If mounting the dropdown body, find the list items
            let items: NodeListOf<Element> | HTMLCollection = ref.querySelectorAll(
                ITEM_SELECTOR,
            );
            // If no items found via [data-ukt-item] selector or non-empty [data-ukt-value] selector,
            // use first instance of multiple children found
            if (!items.length) {
                items = ref.children;
                while (items.length === 1) {
                    if (!items[0].children) break;
                    items = items[0].children;
                }
                // If unable to find an element with more than one child, treat direct child as items
                if (items.length === 1) {
                    items = ref.children;
                }
            }

            setDropdownBodyItems(Array.from(items) as Array<HTMLElement>);
        },
        [hasItems],
    );

    const handleChange = useCallback(
        (event: React.ChangeEvent<HTMLElement>) => {
            if (!isOpen) openDropdown();

            const input = event.target as HTMLInputElement;
            enteredCharactersRef.current = input.value;
            setActiveItem({ text: enteredCharactersRef.current });
        },
        [isOpen, openDropdown, setActiveItem],
    );

    let trigger = childrenCount > 1 ? children[0] : null;
    const isTriggerFromProps = React.isValidElement(trigger);
    if (!isTriggerFromProps) {
        if (isSearchable) {
            trigger = (
                <InputText
                    className={TRIGGER_CLASS_NAME}
                    initialValue=""
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
                onKeyDown={handleKeyDown}
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
                        ref={handleBodyRef}
                    >
                        {children[1] || children[0] || children}
                    </div>
                ) : null}
            </div>
        </Fragment>
    );
};

export default Dropdown;

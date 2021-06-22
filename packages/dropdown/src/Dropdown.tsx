import { getBestMatch } from '@acusti/matchmaking';
import { Style, SYSTEM_UI_FONT } from '@acusti/styling';
import classnames from 'classnames';
import * as React from 'react';

export type Props = {
    children: [React.ReactNode, React.ReactNode];
    className?: string;
    isOpenOnMount?: boolean;
    onChangeItem?: (payload: {
        element: HTMLElement;
        index: number;
        value: string;
    }) => void;
};

const { Children, Fragment, useCallback, useMemo, useRef, useState } = React;

const ROOT_CLASS_NAME = 'uktdropdown';
const TRIGGER_CLASS_NAME = `${ROOT_CLASS_NAME}-trigger`;
const BODY_CLASS_NAME = `${ROOT_CLASS_NAME}-body`;

const BASE_STYLES = `
:root {
    --uktdropdown-font-family: ${SYSTEM_UI_FONT};
    --uktdropdown-body-bg-color: white;
    --uktdropdown-body-bg-color-hover: rgb(105, 162, 249);
    --uktdropdown-body-color-hover: white;
    --uktdropdown-body-pad-bottom: 10px;
    --uktdropdown-body-pad-left: 12px;
    --uktdropdown-body-pad-right: 12px;
    --uktdropdown-body-pad-top: 10px;
}
.${ROOT_CLASS_NAME},
.${TRIGGER_CLASS_NAME} {
    font-family: var(--uktdropdown-font-family);
}
.${ROOT_CLASS_NAME} {
    position: relative;
}
.${ROOT_CLASS_NAME} > * {
    cursor: default;
}
.${BODY_CLASS_NAME} {
    box-sizing: border-box;
    position: absolute;
    left: 0px;
    top: 100%;
    max-height: calc(100vh - 50px);
    overflow: auto;
    padding-bottom: var(--uktdropdown-body-pad-bottom);
    padding-left: var(--uktdropdown-body-pad-left);
    padding-right: var(--uktdropdown-body-pad-right);
    padding-top: var(--uktdropdown-body-pad-top);
    background-color: var(--uktdropdown-body-bg-color);
    box-shadow: 0px 8px 18px rgba(0, 0, 0, 0.25);
}
.${BODY_CLASS_NAME} [data-ukt-active] {
    background-color: var(--uktdropdown-body-bg-color-hover);
    color: var(--uktdropdown-body-color-hover);
}
`;

const CHILDREN_ERROR =
    '@acusti/dropdown requires props.children to contain exactly two elements: the dropdown trigger and the dropdown body. Received %s children.';

type Item = { label: string; value: string };

const Dropdown: React.FC<Props> = ({
    children,
    className,
    isOpenOnMount,
    onChangeItem,
}) => {
    const childrenCount = Children.count(children);
    if (childrenCount !== 2) {
        if (childrenCount < 2) {
            throw new Error(CHILDREN_ERROR.replace('%s', childrenCount.toString()));
        }
        console.error(CHILDREN_ERROR, childrenCount);
    }

    const firstChild = children[0];
    const [isOpen, setIsOpen] = useState<boolean>(isOpenOnMount || false);
    const [isOpening, setIsOpening] = useState<boolean>(!isOpenOnMount);
    const [ownerDocument, setOwnerDocument] = useState<Document | null>(null);
    const [currentItem, setCurrentItem] = useState<Item | null>(null);
    const [dropdownBodyItems, setDropdownBodyItems] = useState<Array<HTMLElement> | null>(
        null,
    );
    const dropdownBodyItemsCount = dropdownBodyItems ? dropdownBodyItems.length : 0;

    const dropdownElementRef = useRef<HTMLElement | null>(null);
    const closingTimerRef = useRef<number | null>(null);
    const isOpeningTimerRef = useRef<number | null>(null);
    const currentInputMethodRef = useRef<'mouse' | 'keyboard'>('mouse');
    const clearEnteredCharactersTimerRef = useRef<number | null>(null);
    const mouseDownPositionRef = useRef<{ clientX: number; clientY: number } | null>(
        null,
    );
    const enteredCharactersRef = useRef<string>('');

    const ensureFocus = useCallback(() => {
        const dropdownElement = dropdownElementRef.current;
        if (!dropdownElement) return;

        const { activeElement } = dropdownElement.ownerDocument;
        if (
            dropdownElement === activeElement ||
            dropdownElement.contains(activeElement)
        ) {
            return;
        }

        dropdownElement.focus();
    }, []);

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
        ensureFocus();
    }, [ensureFocus]);

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
                nextActiveItem.dataset.uktActive = '';
                // If dropdown body element has at least 15px of overflow,
                // verify that next active item is visible and scroll to it if it isn’t
                const dropdownBody = dropdownBodyItems[0].closest('.' + BODY_CLASS_NAME);
                if (
                    dropdownBody &&
                    dropdownBody.scrollHeight >= dropdownBody.clientHeight + 15
                ) {
                    const dropdownBodyRect = dropdownBody.getBoundingClientRect();
                    const itemRect = nextActiveItem.getBoundingClientRect();
                    const isAboveTop = itemRect.top < dropdownBodyRect.top;
                    const isBelowBottom = itemRect.bottom > dropdownBodyRect.bottom;
                    if (isAboveTop || isBelowBottom) {
                        let { scrollTop } = dropdownBody;
                        // Item isn’t fully visible; adjust scrollTop to put item within closest edge
                        if (isAboveTop) {
                            scrollTop -= dropdownBodyRect.top - itemRect.top;
                        } else {
                            scrollTop += itemRect.bottom - dropdownBodyRect.bottom;
                        }
                        dropdownBody.scrollTop = scrollTop;
                    }
                }
            }
        },
        [dropdownBodyItems, dropdownBodyItemsCount, getCurrentActiveIndex],
    );

    const handleChangeItem = useCallback(() => {
        if (isOpen) closeDropdown();
        if (!dropdownBodyItems) return;

        const index = getCurrentActiveIndex();
        const element = dropdownBodyItems[index];
        if (!element) return;

        const label = element.innerText;
        const value = element.dataset.uktValue || label;
        if (currentItem?.value === value) return;

        setCurrentItem({ label, value });
        if (!onChangeItem) return;

        onChangeItem({ element, index, value });
    }, [currentItem, dropdownBodyItems, getCurrentActiveIndex, isOpen, onChangeItem]);

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLElement>) => {
            const { altKey, key, metaKey } = event;

            const onEventHandled = () => {
                event.stopPropagation();
                event.preventDefault();
                currentInputMethodRef.current = 'keyboard';
            };

            let isEditingCharacters = /^[A-Za-z0-9]$/.test(key);
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
                    if (isOpen) {
                        onEventHandled();
                        closeDropdown();
                    }
                    return;
                case ' ':
                case 'Enter':
                    onEventHandled();
                    if (isOpen) {
                        handleChangeItem();
                    } else {
                        openDropdown();
                    }
                    return;
                case 'ArrowUp':
                    onEventHandled();
                    if (altKey || metaKey) {
                        setActiveItem({ index: 0 });
                    } else {
                        setActiveItem({ indexAddend: -1 });
                    }
                    return;
                case 'ArrowDown':
                    onEventHandled();
                    if (altKey || metaKey) {
                        setActiveItem({ index: dropdownBodyItemsCount - 1 });
                    } else {
                        setActiveItem({ indexAddend: 1 });
                    }
                    return;
            }
        },
        [closeDropdown, dropdownBodyItemsCount, handleChangeItem, isOpen, setActiveItem],
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

    const handleMouseUp = useCallback(() => {
        if (!isOpen || closingTimerRef.current) return;
        // If still isOpening (gets set false 1s after open triggers), set it to false onMouseUp
        if (isOpening) {
            setIsOpening(false);
            if (isOpeningTimerRef.current) {
                clearTimeout(isOpeningTimerRef.current);
                isOpeningTimerRef.current = null;
            }
            ensureFocus();
            return;
        }
        // A short timeout before closing is better UX when user selects an item so that dropdown
        // doesn’t close before expected. It also enables using <Link />s in the dropdown body.
        closingTimerRef.current = setTimeout(handleChangeItem, 90);
    }, [ensureFocus, handleChangeItem, isOpen, isOpening]);

    const handleBlur = useCallback(() => {
        if (!isOpen || isOpening) return;
        closeDropdown();
    }, [closeDropdown, isOpen, isOpening]);

    const handleRef = useCallback((ref: HTMLElement | null) => {
        dropdownElementRef.current = ref;
        setOwnerDocument(ref?.ownerDocument || null);
        // If dropdown should be open on mount, focus it
        if (ref && isOpenOnMount) {
            ref.focus();
        }
    }, []);

    const handleBodyRef = useCallback((ref: HTMLElement | null) => {
        if (!ref) {
            setDropdownBodyItems(null);
            return;
        }
        // If mounting the dropdown body, find the list items
        let items: NodeListOf<Element> | HTMLCollection = ref.querySelectorAll(
            '[data-ukt-item], [data-ukt-value]:not([data-ukt-value=""])',
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
    }, []);

    const styleElement = ownerDocument ? (
        <Style ownerDocument={ownerDocument}>{BASE_STYLES}</Style>
    ) : null;

    const trigger = useMemo(() => {
        // If firstChild isn’t a primitive value, don’t wrap it
        if (firstChild && typeof firstChild === 'object') return firstChild;
        // If firstChild is a primitive value, wrap it in a button
        return <button className={TRIGGER_CLASS_NAME}>{firstChild}</button>;
    }, [firstChild]);

    return (
        <Fragment>
            {styleElement}
            <div
                className={classnames(ROOT_CLASS_NAME, className, { 'is-open': isOpen })}
                // In react, onBlur and onFocus bubble like focusin and focusout
                // Reference: https://github.com/facebook/react/issues/6410
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseOver={handleMouseOver}
                onMouseUp={handleMouseUp}
                ref={handleRef}
                tabIndex={0}
            >
                {trigger}
                {isOpen ? (
                    <div className={BODY_CLASS_NAME} ref={handleBodyRef}>
                        {children[1]}
                    </div>
                ) : null}
            </div>
        </Fragment>
    );
};

export default Dropdown;

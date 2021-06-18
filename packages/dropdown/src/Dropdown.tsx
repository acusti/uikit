import { getBestMatch } from '@acusti/matchmaking';
import { Style, SYSTEM_UI_FONT } from '@acusti/styling';
import classnames from 'classnames';
import * as React from 'react';

export type Props = {
    children: [React.ReactNode, React.ReactNode];
    className?: string;
    isOpenOnMount?: boolean;
    styles?: string;
};

const { Children, Fragment, useCallback, useRef, useState } = React;

const ROOT_CLASS_NAME = 'uktdropdown';
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
.${ROOT_CLASS_NAME} {
    position: relative;
    cursor: default;
    font-family: var(--uktdropdown-font-family);
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
.${BODY_CLASS_NAME} [data-uktdropdown-active] {
    background-color: var(--uktdropdown-body-bg-color-hover);
    color: var(--uktdropdown-body-color-hover);
}
`;

const CHILDREN_ERROR =
    '@acusti/dropdown requires props.children to contain exactly two elements: the dropdown trigger and the dropdown body. Received %s children.';

const Dropdown: React.FC<Props> = ({ children, className, isOpenOnMount, styles }) => {
    const childrenCount = Children.count(children);
    if (childrenCount !== 2) {
        if (childrenCount < 2) {
            throw new Error(CHILDREN_ERROR.replace('%s', childrenCount.toString()));
        }
        console.error(CHILDREN_ERROR, childrenCount);
    }

    const [isOpen, setIsOpen] = useState<boolean>(isOpenOnMount || false);
    const [isOpening, setIsOpening] = useState<boolean>(!isOpenOnMount);
    const [ownerDocument, setOwnerDocument] = useState<Document | null>(null);
    const [dropdownBodyItems, setDropdownBodyItems] = useState<Array<HTMLElement> | null>(
        null,
    );

    const dropdownElementRef = useRef<HTMLElement | null>(null);
    const closingTimerRef = useRef<number | null>(null);
    const isOpeningTimerRef = useRef<number | null>(null);
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
        if (dropdownElementRef.current) {
            dropdownElementRef.current.focus();
        }
    }, []);

    const setActiveItem = useCallback(
        ({
            element,
            indexAddend,
            text,
        }:
            | { element: HTMLElement; indexAddend?: null; text?: null }
            | { element?: null; indexAddend: number; text?: null }
            | { element?: null; indexAddend?: null; text: string }) => {
            if (!element && !indexAddend && typeof text !== 'string') return;
            if (!dropdownBodyItems || !dropdownBodyItems.length) return;

            const itemsCount = dropdownBodyItems.length;
            const lastIndex = itemsCount - 1;
            const currentActiveIndex = dropdownBodyItems.findIndex(
                (item) => item.dataset.uktdropdownActive,
            );

            let nextActiveIndex = currentActiveIndex;
            if (element) {
                nextActiveIndex = dropdownBodyItems.findIndex((item) => item === element);
            } else if (indexAddend) {
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
                const itemTexts = dropdownBodyItems.map((item) => item.innerText);
                const bestMatch = getBestMatch({ items: itemTexts, text });
                nextActiveIndex = itemTexts.findIndex((text) => text === bestMatch);
            }

            if (nextActiveIndex === -1 || nextActiveIndex === currentActiveIndex) return;

            const currentActiveItem = dropdownBodyItems[currentActiveIndex];
            if (currentActiveItem) {
                delete currentActiveItem.dataset.uktdropdownActive;
            }
            const nextActiveItem = dropdownBodyItems[nextActiveIndex];
            if (nextActiveItem) {
                nextActiveItem.dataset.uktdropdownActive = '1';
            }
        },
        [dropdownBodyItems],
    );

    const handleKeyDown = useCallback(
        ({ key }: React.KeyboardEvent<HTMLElement>) => {
            let isEditingCharacters = /^[A-Za-z0-9]$/.test(key);
            // User could also be editing characters if there are already characters entered
            // and they are hitting delete or spacebar
            if (!isEditingCharacters && enteredCharactersRef.current) {
                isEditingCharacters = key === ' ' || key === 'Backspace';
            }

            if (isEditingCharacters) {
                if (key === 'Backspace') {
                    enteredCharactersRef.current = enteredCharactersRef.current.slice(-1);
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
                }, 2000);

                return;
            }

            switch (key) {
                case 'Escape':
                    if (isOpen) {
                        closeDropdown();
                    }
                    return;
                case ' ':
                case 'Enter':
                    if (isOpen) {
                        closeDropdown();
                    } else {
                        openDropdown();
                    }
                    return;
                case 'ArrowUp':
                    setActiveItem({ indexAddend: -1 });
                    return;
                case 'ArrowDown':
                    setActiveItem({ indexAddend: 1 });
                    return;
            }
        },
        [closeDropdown, isOpen, setActiveItem],
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
            dropdownElementRef.current?.focus();
            return;
        }
        // A short timeout before closing is better UX when user selects an item so that dropdown
        // doesn’t close before expected. It also enables using <Link />s in the dropdown body.
        closingTimerRef.current = setTimeout(closeDropdown, 90);
    }, [isOpen, isOpening]);

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
        let { children } = ref;
        while (children.length === 1) {
            if (!children[0].children) break;
            children = children[0].children;
        }
        // If unable to find an element with more than one child, treat direct child as children
        if (children.length === 1) {
            children = ref.children;
        }
        setDropdownBodyItems(Array.from(children) as Array<HTMLElement>);
    }, []);

    const styleElement = ownerDocument ? (
        <Fragment>
            <Style ownerDocument={ownerDocument}>{BASE_STYLES}</Style>
            {styles ? <Style ownerDocument={ownerDocument}>{styles}</Style> : null}
        </Fragment>
    ) : null;

    return (
        <Fragment>
            {styleElement}
            <button
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
                {children[0]}
                {isOpen ? (
                    <div className={BODY_CLASS_NAME} ref={handleBodyRef}>
                        {children[1]}
                    </div>
                ) : null}
            </button>
        </Fragment>
    );
};

export default Dropdown;

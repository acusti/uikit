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
.${ROOT_CLASS_NAME}-body {
    position: absolute;
    left: 0px;
    top: 100%;
    box-sizing: border-box;
    padding-bottom: var(--uktdropdown-body-pad-bottom);
    padding-left: var(--uktdropdown-body-pad-left);
    padding-right: var(--uktdropdown-body-pad-right);
    padding-top: var(--uktdropdown-body-pad-top);
    background-color: var(--uktdropdown-body-bg-color);
    box-shadow: 0px 8px 18px rgba(0, 0, 0, 0.25);
}
.${ROOT_CLASS_NAME}-body > * > *:hover {
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

    const dropdownElementRef = useRef<HTMLElement | null>(null);
    const closingTimerRef = useRef<number | null>(null);
    const isOpeningTimerRef = useRef<number | null>(null);
    const mouseDownPositionRef = useRef<{ clientX: number; clientY: number } | null>(
        null,
    );

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

    const handleKeyDown = useCallback(
        ({ key }: React.KeyboardEvent<HTMLElement>) => {
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
            }
        },
        [closeDropdown, isOpen],
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

    const handleMouseUp = useCallback(() => {
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
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                ref={handleRef}
                tabIndex={0}
            >
                {children[0]}
                {isOpen ? (
                    <div className={`${ROOT_CLASS_NAME}-body`}>{children[1]}</div>
                ) : null}
            </button>
        </Fragment>
    );
};

export default Dropdown;

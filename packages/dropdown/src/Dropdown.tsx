import { Style, SYSTEM_UI_FONT } from '@acusti/styling';
import classnames from 'classnames';
import * as React from 'react';

export type Props = {
    children: [React.ReactNode, React.ReactNode];
    className?: string;
    isOpenOnMount?: boolean;
    styles?: string;
};

const { Children, Fragment, useCallback, useState } = React;

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
    const [ownerDocument, setOwnerDocument] = useState<Document | null>(null);

    const handleMouseDown = useCallback(() => {
        if (isOpen) return;
        setIsOpen(true);
    }, [isOpen]);

    const handleMouseUp = useCallback(() => {
        if (!isOpen) return;
        setIsOpen(false);
    }, [isOpen]);

    const handleRef = useCallback((ref: HTMLElement | null) => {
        setOwnerDocument(ref?.ownerDocument || null);
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
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                ref={handleRef}
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

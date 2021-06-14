import classnames from 'classnames';
import * as React from 'react';

export type Props = {
    className?: string;
    isOpenOnMount?: boolean;
};

const { useCallback, useState } = React;

const ROOT_CLASS_NAME = 'uktdropdown';

const Dropdown: React.FC<Props> = ({ className, isOpenOnMount }) => {
    const [isOpen, setIsOpen] = useState<boolean>(isOpenOnMount || false);

    const handleClick = useCallback(() => {
        setIsOpen(!isOpen);
    }, [isOpen]);

    return (
        <button
            className={classnames(ROOT_CLASS_NAME, className, { 'is-open': isOpen })}
            onClick={handleClick}
        >
            A dropdown
            {isOpen ? <div className={`${ROOT_CLASS_NAME}-body`}></div> : null}
        </button>
    );
};

export default Dropdown;

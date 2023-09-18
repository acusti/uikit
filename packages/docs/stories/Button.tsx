import React from 'react';

import './button.css';

/**
 * Primary UI component for user interaction
 */

type Props = {
    /**
     * Is this the principal call to action on the page?
     */
    primary?: boolean;
    /**
     * What background color to use
     */
    backgroundColor?: string;
    /**
     * How large should the button be?
     */
    size: 'small' | 'medium' | 'large';
    /**
     * Button contents
     */
    label: string;
    /**
     * Optional click handler
     */
    onClick: () => unknown;
};

export const Button = ({ primary, backgroundColor, size, label, ...props }: Props) => {
    const mode = primary ? 'storybook-button--primary' : 'storybook-button--secondary';
    return (
        <button
            type="button"
            className={['storybook-button', `storybook-button--${size}`, mode].join(' ')}
            style={backgroundColor ? { backgroundColor } : undefined}
            {...props}
        >
            {label}
        </button>
    );
};

Button.defaultProps = {
    backgroundColor: null,
    onClick: undefined,
    primary: false,
    size: 'medium',
};

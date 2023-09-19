import useKeyboardEvents from '@acusti/use-keyboard-events';
import { Fragment, useState } from 'react';

import './useKeyboardEvents.css';

import type { Meta, StoryObj } from '@storybook/react';

function Demo() {
    const [type, setType] = useState(null);
    const [key, setKey] = useState(null);
    const [altKey, setAltKey] = useState(null);
    const [ctrlKey, setCtrlKey] = useState(null);
    const [metaKey, setMetaKey] = useState(null);
    const [shiftKey, setShiftKey] = useState(null);

    const handleKeyEvent = (event) => {
        setType(event.type);
        setKey(event.key);
        setAltKey(event.altKey);
        setCtrlKey(event.ctrlKey);
        setMetaKey(event.metaKey);
        setShiftKey(event.shiftKey);
    };

    useKeyboardEvents({ onKeyDown: handleKeyEvent, onKeyUp: handleKeyEvent });

    return (
        <Fragment>
            <p>
                <span className="label">Event:</span> <code>{type}</code>
            </p>
            <p>
                <span className="label">Key:</span> <code>{key}</code>
            </p>
            <p>
                <span className="label">Modifiers:</span> {shiftKey ? '⇧ ' : ''}
                {ctrlKey ? <code>ctrl</code> : ''}
                {altKey ? '⌥ ' : ''}
                {metaKey ? '⌘ ' : ''}
            </p>
        </Fragment>
    );
}

const meta: Meta<typeof Demo> = {
    component: Demo,
    parameters: {
        docs: {
            description: {
                component:
                    '`useKeyboardEvents` is a React hook that uses keyboard event listeners on the document to trigger the onKey(Down|Press|Up) functions in order to ensure that all key events are captured regardless of whether there is currently a focused element in the DOM (i.e. `document.activeElement` is set). This solves the problem where keyboard event handlers attached via React’s `onKey(Down|Press|Up)` props miss any keyboard events that occur when the target element and its descendants aren’t focused.',
            },
        },
    },
    //https://storybook.js.org/docs/react/writing-docs/autodocs#setup-automated-documentation
    tags: ['autodocs'],
    title: 'UIKit/Controls/useKeyboardEvents',
};

export default meta;

type Story = StoryObj<typeof Demo>;

export const UseKeyboardEvents: Story = {
    args: {},
};

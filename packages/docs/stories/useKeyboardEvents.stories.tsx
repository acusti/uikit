import { Fragment, useState } from 'react';

import useKeyboardEvents from '../../use-keyboard-events/src/useKeyboardEvents.js';

import './useKeyboardEvents.css';

import type { Meta, StoryObj } from '@storybook/react';

function Demo() {
    const [event, setEvent] = useState(null);

    useKeyboardEvents({ onKeyDown: setEvent, onKeyUp: setEvent });

    const modifiers = [
        event?.shiftKey ? '⇧ ' : '',
        event?.ctrlKey ? '⌃ ' : '',
        event?.altKey ? '⌥ ' : '',
        event?.metaKey ? '⌘ ' : '',
    ].join('');

    return (
        <Fragment>
            <p className="keyboard-event-row">
                <span className="label">Event:</span>
                <input className="code" disabled value={event?.type} />
            </p>
            <p className="keyboard-event-row">
                <span className="label">Key:</span>
                <input className="code" disabled value={event?.key} />
            </p>
            <p className="keyboard-event-row">
                <span className="label">Modifiers:</span>
                <input disabled value={modifiers} />
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
